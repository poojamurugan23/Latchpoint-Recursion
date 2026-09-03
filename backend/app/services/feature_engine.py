"""Builds the CommitmentContext feature vector for a pending transaction
(spec §5 — the 10-transaction personal pattern window — and §8.1's feature
list). Runs fresh on every /api/risk/evaluate call; nothing here is cached
beyond the request, since the window shifts with every completed
transaction."""

from datetime import datetime, timezone

import numpy as np
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.models.payee import Payee
from app.models.event import Event
from app.models.session import UserSession
from app.models.device import Device

WINDOW_SIZE = 10
ODD_HOUR_BUFFER = 2

_population_baseline_cache: dict | None = None


def get_recent_completed_transactions(db: Session, user_id: int, limit: int = WINDOW_SIZE):
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id, Transaction.status == "completed")
        .order_by(Transaction.created_at.desc())
        .limit(limit)
        .all()
    )


def compute_personal_baseline(txns: list[Transaction]) -> dict:
    amounts = [t.amount for t in txns]
    mean_amount = float(np.mean(amounts))
    std_amount = float(np.std(amounts))
    if std_amount == 0:
        std_amount = max(mean_amount * 0.1, 1.0)

    entities = {t.payee_id if t.type == "transfer" else t.symbol for t in txns}
    entities.discard(None)

    hours = [t.created_at.hour for t in txns]
    typical_hour_range = (min(hours), max(hours))

    sorted_txns = sorted(txns, key=lambda t: t.created_at)
    gaps = [
        (sorted_txns[i].created_at - sorted_txns[i - 1].created_at).total_seconds() / 86400
        for i in range(1, len(sorted_txns))
    ]
    typical_gap_days = float(np.mean(gaps)) if gaps else 1.0

    return {
        "mean_amount": mean_amount,
        "std_amount": std_amount,
        "typical_entities": entities,
        "typical_hour_range": typical_hour_range,
        "typical_gap_days": typical_gap_days,
    }


def get_population_baseline(db: Session) -> dict:
    """Lazily computed and cached at module level (recomputed if the cache is
    empty and no completed transactions exist yet — e.g. before seeding)."""
    global _population_baseline_cache
    if _population_baseline_cache is not None:
        return _population_baseline_cache

    all_completed = db.query(Transaction).filter(Transaction.status == "completed").all()
    if not all_completed:
        baseline = {"mean_amount": 5000.0, "std_amount": 2000.0}
    else:
        amounts = [t.amount for t in all_completed]
        baseline = {
            "mean_amount": float(np.mean(amounts)),
            "std_amount": max(float(np.std(amounts)), 1.0),
        }
    _population_baseline_cache = baseline
    return baseline


def _blend_baseline(personal: dict | None, population: dict, n: int) -> tuple[dict, str, float]:
    if n <= 2:
        confidence, score = "low", 0.3
        mean_amount = population["mean_amount"]
        std_amount = population["std_amount"]
    elif n <= 9:
        confidence, score = "medium", 0.6
        w = min(n / WINDOW_SIZE, 1.0)
        mean_amount = w * personal["mean_amount"] + (1 - w) * population["mean_amount"]
        std_amount = w * personal["std_amount"] + (1 - w) * population["std_amount"]
    else:
        confidence, score = "high", 1.0
        mean_amount = personal["mean_amount"]
        std_amount = personal["std_amount"]

    return {"mean_amount": mean_amount, "std_amount": std_amount}, confidence, score


def _resolve_device_for_session(db: Session, user_session: UserSession | None) -> Device | None:
    if user_session is None or user_session.device_id is None:
        return None
    return db.get(Device, user_session.device_id)


def build_commitment_context(
    db: Session,
    user_id: int,
    pending_txn: Transaction,
    user_session: UserSession | None,
) -> dict:
    recent_txns = get_recent_completed_transactions(db, user_id)
    n = len(recent_txns)
    population = get_population_baseline(db)

    personal = compute_personal_baseline(recent_txns) if recent_txns else None
    blended, baseline_confidence, confidence_score = _blend_baseline(personal, population, n)
    mean_amount, std_amount = blended["mean_amount"], blended["std_amount"]

    entity = pending_txn.payee_id if pending_txn.type == "transfer" else pending_txn.symbol
    typical_entities = personal["typical_entities"] if personal else set()
    is_new_payee = int(entity is not None and entity not in typical_entities)

    current_hour = pending_txn.created_at.hour if pending_txn.created_at else datetime.now(timezone.utc).hour
    if personal:
        low, high = personal["typical_hour_range"]
        is_odd_hour = int(not (low - ODD_HOUR_BUFFER <= current_hour <= high + ODD_HOUR_BUFFER))
    else:
        is_odd_hour = 0

    deviation_ratio = (pending_txn.amount - mean_amount) / max(std_amount, mean_amount * 0.1)

    # --- cumulative exposure today (includes the pending transaction itself) ---
    today = datetime.now(timezone.utc).date()
    todays_completed = [
        t
        for t in db.query(Transaction)
        .filter(Transaction.user_id == user_id, Transaction.status == "completed")
        .all()
        if t.created_at.date() == today
    ]
    exposure_today = sum(t.amount for t in todays_completed) + pending_txn.amount
    txn_count_today = len(todays_completed) + 1
    exposure_vs_baseline_ratio = exposure_today / max(mean_amount, 1.0)

    # --- sequence signals, from this browser session's event log ---
    session_events = (
        db.query(Event).filter(Event.session_id == user_session.id).all()
        if user_session is not None
        else []
    )
    pause_count = sum(1 for e in session_events if e.event_type == "pause_detected")
    edit_count = sum(1 for e in session_events if e.event_type == "field_edit")
    back_navigation_count = sum(1 for e in session_events if e.event_type == "back_navigation")
    if session_events:
        times = [e.created_at for e in session_events]
        time_in_flow_sec = (max(times) - min(times)).total_seconds()
    else:
        time_in_flow_sec = 0.0

    # --- network signals ---
    device_shared_with_other_payees_count = 0
    recipient_is_new_device_pairing = 0
    if pending_txn.type == "transfer" and pending_txn.payee_id is not None:
        payee = db.get(Payee, pending_txn.payee_id)
        if payee is not None and payee.device_id is not None:
            device_shared_with_other_payees_count = (
                db.query(Payee)
                .filter(
                    Payee.user_id == user_id,
                    Payee.device_id == payee.device_id,
                    Payee.id != payee.id,
                )
                .count()
            )
        current_device = _resolve_device_for_session(db, user_session)
        if current_device is not None:
            prior_same_device_payment = (
                db.query(Transaction)
                .join(UserSession, Transaction.session_id == UserSession.id)
                .filter(
                    Transaction.user_id == user_id,
                    Transaction.payee_id == pending_txn.payee_id,
                    Transaction.status == "completed",
                    UserSession.device_id == current_device.id,
                )
                .first()
            )
            recipient_is_new_device_pairing = int(prior_same_device_payment is None)

    current_device = _resolve_device_for_session(db, user_session)
    ip_is_vpn_or_proxy = int(current_device.is_vpn_or_proxy) if current_device else 0

    # --- context signals: repeated negative outcomes to the same payee/symbol ---
    entity_history = [
        t
        for t in db.query(Transaction)
        .filter(Transaction.user_id == user_id, Transaction.status == "completed")
        .order_by(Transaction.created_at.desc())
        .all()
        if (t.payee_id if t.type == "transfer" else t.symbol) == entity
    ]
    prior_negative_outcome_streak = 0
    for t in entity_history:
        if t.outcome == "loss":
            prior_negative_outcome_streak += 1
        else:
            break
    repeat_pattern_negative_outcome = int(prior_negative_outcome_streak >= 3)

    features = {
        "deviation_ratio": deviation_ratio,
        "is_new_payee": is_new_payee,
        "is_odd_hour": is_odd_hour,
        "baseline_confidence_score": confidence_score,
        "exposure_today": exposure_today,
        "exposure_vs_baseline_ratio": exposure_vs_baseline_ratio,
        "txn_count_today": txn_count_today,
        "pause_count": pause_count,
        "edit_count": edit_count,
        "back_navigation_count": back_navigation_count,
        "time_in_flow_sec": time_in_flow_sec,
        "device_shared_with_other_payees_count": device_shared_with_other_payees_count,
        "recipient_is_new_device_pairing": recipient_is_new_device_pairing,
        "ip_is_vpn_or_proxy": ip_is_vpn_or_proxy,
        "repeat_pattern_negative_outcome": repeat_pattern_negative_outcome,
        "prior_negative_outcome_streak": prior_negative_outcome_streak,
    }

    return {
        "features": features,
        "baseline_confidence": baseline_confidence,
        "mean_amount": mean_amount,
        "payee_id": pending_txn.payee_id,
    }
