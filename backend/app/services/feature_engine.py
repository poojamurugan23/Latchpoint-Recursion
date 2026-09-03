"""Builds the CommitmentContext feature vector for a pending transaction
(spec §5 — the 10-transaction personal pattern window — and §8.1's feature
list). Runs fresh on every /api/risk/evaluate call; nothing here is cached
beyond the request, since the window shifts with every completed
transaction.

Structured as staged methods (baseline / sequence / network / context /
behavioral) so the SSE endpoint (Phase 3 §4) can emit real progress as each
block is actually computed, rather than faking a progress bar over one big
call. `build_commitment_context` below just runs all five stages in order
for callers that want the whole thing at once (the original sync endpoint,
and the synthetic data / retraining consistency checks)."""

import math
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
NEW_LOCATION_THRESHOLD_KM = 50.0

# Neutral human-like defaults used when telemetry wasn't captured for this
# session (e.g. a direct API call, or a browser that never fired behavioral
# events) — matches the "clean" distribution used in training so missing
# telemetry never reads as automation/coercion on its own.
DEFAULT_CONFIRM_HOVER_MS = 800.0
DEFAULT_MOUSE_DIRECTION_CHANGES = 8
DEFAULT_IDLE_MS_BEFORE_CONFIRM = 1200.0
DEFAULT_KEYSTROKE_INTERVAL_STD = 60.0

_population_baseline_cache: dict | None = None


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * radius_km * math.asin(math.sqrt(a))


def get_recent_completed_transactions(
    db: Session, user_id: int, txn_type: str | None = None, limit: int = WINDOW_SIZE
):
    # Scoped to the same transaction type as the pending one — a transfer's
    # amount baseline shouldn't be diluted by unrelated trade amounts (or
    # vice versa).
    query = db.query(Transaction).filter(
        Transaction.user_id == user_id, Transaction.status == "completed"
    )
    if txn_type is not None:
        query = query.filter(Transaction.type == txn_type)
    return query.order_by(Transaction.created_at.desc()).limit(limit).all()


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

    def _to_utc(dt):
        if dt is None:
            return datetime.min.replace(tzinfo=timezone.utc)
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt

    sorted_txns = sorted(txns, key=lambda t: _to_utc(t.created_at))
    gaps = [
        (_to_utc(sorted_txns[i].created_at) - _to_utc(sorted_txns[i - 1].created_at)).total_seconds() / 86400
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


class CommitmentContextBuilder:
    """Holds the shared query results a single evaluation needs, and exposes
    one method per stage. Each stage returns (features: dict, summary: str)."""

    def __init__(self, db: Session, user_id: int, pending_txn: Transaction, user_session: UserSession | None):
        self.db = db
        self.user_id = user_id
        self.txn = pending_txn
        self.user_session = user_session
        self.entity = pending_txn.payee_id if pending_txn.type == "transfer" else pending_txn.symbol
        self.session_events = (
            db.query(Event).filter(Event.session_id == user_session.id).all()
            if user_session is not None
            else []
        )
        self.mean_amount = None  # set by stage_baseline
        self.payee_id = pending_txn.payee_id

    def stage_baseline(self) -> tuple[dict, str]:
        db, user_id, txn = self.db, self.user_id, self.txn
        recent_txns = get_recent_completed_transactions(db, user_id, txn_type=txn.type)
        n = len(recent_txns)
        population = get_population_baseline(db)

        personal = compute_personal_baseline(recent_txns) if recent_txns else None
        blended, baseline_confidence, confidence_score = _blend_baseline(personal, population, n)
        mean_amount, std_amount = blended["mean_amount"], blended["std_amount"]
        self.mean_amount = mean_amount
        self.baseline_confidence = baseline_confidence

        typical_entities = personal["typical_entities"] if personal else set()
        is_new_payee = int(self.entity is not None and self.entity not in typical_entities)

        current_hour = txn.created_at.hour if txn.created_at else datetime.now(timezone.utc).hour
        if personal:
            low, high = personal["typical_hour_range"]
            is_odd_hour = int(not (low - ODD_HOUR_BUFFER <= current_hour <= high + ODD_HOUR_BUFFER))
        else:
            is_odd_hour = 0

        deviation_ratio = (txn.amount - mean_amount) / max(std_amount, mean_amount * 0.1)

        today = datetime.now(timezone.utc).date()
        todays_completed = [
            t
            for t in db.query(Transaction)
            .filter(Transaction.user_id == user_id, Transaction.status == "completed")
            .all()
            if t.created_at.date() == today
        ]
        exposure_today = sum(t.amount for t in todays_completed) + txn.amount
        txn_count_today = len(todays_completed) + 1
        exposure_vs_baseline_ratio = exposure_today / max(mean_amount, 1.0)

        features = {
            "deviation_ratio": deviation_ratio,
            "is_new_payee": is_new_payee,
            "is_odd_hour": is_odd_hour,
            "baseline_confidence_score": confidence_score,
            "exposure_today": exposure_today,
            "exposure_vs_baseline_ratio": exposure_vs_baseline_ratio,
            "txn_count_today": txn_count_today,
        }
        summary = (
            f"{'New' if is_new_payee else 'Familiar'} recipient, "
            f"{deviation_ratio:.1f}x deviation from your typical ₹{mean_amount:,.0f}, "
            f"{exposure_vs_baseline_ratio:.1f}x today's baseline exposure."
        )
        return features, summary

    def stage_sequence(self) -> tuple[dict, str]:
        events = self.session_events
        pause_count = sum(1 for e in events if e.event_type == "pause_detected")
        edit_count = sum(1 for e in events if e.event_type == "field_edit")
        back_navigation_count = sum(1 for e in events if e.event_type == "back_navigation")
        if events:
            times = [e.created_at for e in events]
            time_in_flow_sec = (max(times) - min(times)).total_seconds() or 20.0
        else:
            # No tracked events (e.g. a direct API call) — neutral mid-range
            # default rather than 0, which sits outside the training
            # distribution and would otherwise dominate the SHAP explanation.
            time_in_flow_sec = 20.0

        features = {
            "pause_count": pause_count,
            "edit_count": edit_count,
            "back_navigation_count": back_navigation_count,
            "time_in_flow_sec": time_in_flow_sec,
        }
        summary = (
            f"{pause_count} pause(s), {edit_count} edit(s), {back_navigation_count} "
            f"back-navigation(s) over {time_in_flow_sec:.0f}s in this session."
        )
        return features, summary

    def stage_network(self) -> tuple[dict, str]:
        db, user_id, txn = self.db, self.user_id, self.txn
        device_shared_with_other_payees_count = 0
        recipient_is_new_device_pairing = 0
        if txn.type == "transfer" and txn.payee_id is not None:
            payee = db.get(Payee, txn.payee_id)
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
            current_device = _resolve_device_for_session(db, self.user_session)
            if current_device is not None:
                prior_same_device_payment = (
                    db.query(Transaction)
                    .join(UserSession, Transaction.session_id == UserSession.id)
                    .filter(
                        Transaction.user_id == user_id,
                        Transaction.payee_id == txn.payee_id,
                        Transaction.status == "completed",
                        UserSession.device_id == current_device.id,
                    )
                    .first()
                )
                recipient_is_new_device_pairing = int(prior_same_device_payment is None)

        current_device = _resolve_device_for_session(db, self.user_session)
        ip_is_vpn_or_proxy = int(current_device.is_vpn_or_proxy) if current_device else 0

        features = {
            "device_shared_with_other_payees_count": device_shared_with_other_payees_count,
            "recipient_is_new_device_pairing": recipient_is_new_device_pairing,
            "ip_is_vpn_or_proxy": ip_is_vpn_or_proxy,
        }
        summary = (
            f"Shares a device with {device_shared_with_other_payees_count} other recipient(s); "
            f"{'VPN/proxy detected' if ip_is_vpn_or_proxy else 'no VPN/proxy detected'}."
        )
        return features, summary

    def stage_context(self) -> tuple[dict, str]:
        db, user_id = self.db, self.user_id
        entity_history = [
            t
            for t in db.query(Transaction)
            .filter(Transaction.user_id == user_id, Transaction.status == "completed")
            .order_by(Transaction.created_at.desc())
            .all()
            if (t.payee_id if t.type == "transfer" else t.symbol) == self.entity
        ]
        prior_negative_outcome_streak = 0
        for t in entity_history:
            if t.outcome == "loss":
                prior_negative_outcome_streak += 1
            else:
                break
        repeat_pattern_negative_outcome = int(prior_negative_outcome_streak >= 3)

        features = {
            "repeat_pattern_negative_outcome": repeat_pattern_negative_outcome,
            "prior_negative_outcome_streak": prior_negative_outcome_streak,
        }
        summary = (
            f"{prior_negative_outcome_streak} consecutive prior loss(es) to this recipient/symbol."
            if prior_negative_outcome_streak
            else "No history of repeated losses to this recipient/symbol."
        )
        return features, summary

    def stage_behavioral(self) -> tuple[dict, str]:
        db, user_id = self.db, self.user_id
        user_session = self.user_session
        events = self.session_events

        confirm_hover_events = [e for e in events if e.event_type == "confirm_hover"]
        confirm_hover_ms = (
            float(confirm_hover_events[-1].payload.get("hover_ms_before_click", DEFAULT_CONFIRM_HOVER_MS))
            if confirm_hover_events
            else DEFAULT_CONFIRM_HOVER_MS
        )

        mouse_summary_events = [e for e in events if e.event_type == "mouse_summary"]
        if mouse_summary_events:
            mouse_direction_changes = sum(
                int(e.payload.get("direction_change_count", 0)) for e in mouse_summary_events
            )
            idle_ms_before_confirm = float(
                mouse_summary_events[-1].payload.get("idle_ms_before_action", DEFAULT_IDLE_MS_BEFORE_CONFIRM)
            )
        else:
            mouse_direction_changes = DEFAULT_MOUSE_DIRECTION_CHANGES
            idle_ms_before_confirm = DEFAULT_IDLE_MS_BEFORE_CONFIRM

        keystroke_events = [
            e for e in events if e.event_type == "keystroke_timing" and e.payload.get("field") == "amount"
        ]
        keystroke_interval_std = (
            float(keystroke_events[-1].payload.get("std_interval_ms", DEFAULT_KEYSTROKE_INTERVAL_STD))
            if keystroke_events
            else DEFAULT_KEYSTROKE_INTERVAL_STD
        )

        location_deviation_km = 0.0
        is_new_location = 0
        if user_session is not None and user_session.latitude is not None and user_session.longitude is not None:
            prior_points = (
                db.query(UserSession.latitude, UserSession.longitude)
                .join(Transaction, Transaction.session_id == UserSession.id)
                .filter(
                    Transaction.user_id == user_id,
                    Transaction.status == "completed",
                    UserSession.latitude.isnot(None),
                    UserSession.longitude.isnot(None),
                    UserSession.id != user_session.id,
                )
                .all()
            )
            if prior_points:
                location_deviation_km = min(
                    _haversine_km(user_session.latitude, user_session.longitude, lat, lon)
                    for lat, lon in prior_points
                )
                is_new_location = int(location_deviation_km > NEW_LOCATION_THRESHOLD_KM)

        is_new_device_session = 0
        if user_session is not None and user_session.device_id is not None:
            prior_device_txn = (
                db.query(Transaction)
                .join(UserSession, Transaction.session_id == UserSession.id)
                .filter(
                    Transaction.user_id == user_id,
                    Transaction.status == "completed",
                    UserSession.device_id == user_session.device_id,
                )
                .first()
            )
            is_new_device_session = int(prior_device_txn is None)
        device_and_location_mismatch = int(bool(is_new_device_session) and bool(is_new_location))

        features = {
            "confirm_hover_ms": confirm_hover_ms,
            "mouse_direction_changes": mouse_direction_changes,
            "idle_ms_before_confirm": idle_ms_before_confirm,
            "keystroke_interval_std": keystroke_interval_std,
            "location_deviation_km": location_deviation_km,
            "is_new_location": is_new_location,
            "device_and_location_mismatch": device_and_location_mismatch,
        }
        summary = (
            f"{confirm_hover_ms:.0f}ms hover before confirm, "
            f"{'new' if is_new_location else 'familiar'} location"
            + (f" ({location_deviation_km:.0f}km away)" if is_new_location else "")
            + "."
        )
        return features, summary

    def build(self) -> dict:
        features = {}
        for stage_fn in (
            self.stage_baseline,
            self.stage_sequence,
            self.stage_network,
            self.stage_context,
            self.stage_behavioral,
        ):
            stage_features, _ = stage_fn()
            features.update(stage_features)

        return {
            "features": features,
            "baseline_confidence": self.baseline_confidence,
            "mean_amount": self.mean_amount,
            "payee_id": self.payee_id,
        }


def materialize_baseline_snapshot(db: Session, user_id: int) -> dict:
    """Called once when calibration completes (Phase 3 §1.4). A JSON-safe
    snapshot of "what we learned about you" — a reference artifact for
    display, not the live scoring input (which keeps using the rolling
    window)."""
    recent = get_recent_completed_transactions(db, user_id, txn_type=None, limit=WINDOW_SIZE)
    if not recent:
        return {}
    baseline = compute_personal_baseline(recent)
    return {
        "mean_amount": round(baseline["mean_amount"], 2),
        "std_amount": round(baseline["std_amount"], 2),
        "typical_entities": sorted(str(e) for e in baseline["typical_entities"]),
        "typical_hour_range": list(baseline["typical_hour_range"]),
        "typical_gap_days": round(baseline["typical_gap_days"], 2),
    }


def build_commitment_context(
    db: Session,
    user_id: int,
    pending_txn: Transaction,
    user_session: UserSession | None,
) -> dict:
    return CommitmentContextBuilder(db, user_id, pending_txn, user_session).build()
