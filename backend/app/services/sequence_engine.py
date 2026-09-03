"""Sequence & Journey Intelligence Engine (spec §12).

Models user journey as an ordered transition sequence. Detects:
- Unusual workflow transitions (e.g. adding beneficiary -> immediate high transfer)
- Repeated actions (amount revisions, multiple review oscillations)
- Activity acceleration (rushed transitions vs protracted pauses)
- Session velocity compared to historical workflow patterns
"""

from typing import Any
from datetime import datetime, timezone


EXPECTED_FLOW_TRANSITIONS = {
    "login": ["balance_view", "dashboard_view", "beneficiary_list"],
    "dashboard_view": ["balance_view", "transfer_started", "beneficiary_list", "activity_view"],
    "balance_view": ["transfer_started", "dashboard_view", "beneficiary_list"],
    "beneficiary_added": ["transfer_started", "beneficiary_list", "dashboard_view"],
    "transfer_started": ["recipient_selected", "amount_entered"],
    "recipient_selected": ["amount_entered", "amount_changed"],
    "amount_entered": ["transfer_reviewed", "amount_changed"],
    "amount_changed": ["transfer_reviewed", "amount_entered"],
    "transfer_reviewed": ["confirm_requested", "amount_changed", "transfer_reviewed"],
    "confirm_requested": ["step_up_prompted", "commitment_approved", "commitment_held", "commitment_blocked"],
}

HIGH_RISK_TRANSITIONS = {
    ("login", "transfer_started"): 25.0,
    ("login", "confirm_requested"): 45.0,
    ("beneficiary_added", "confirm_requested"): 35.0,
    ("amount_changed", "confirm_requested"): 20.0,
}


def analyze_sequence(events: list[dict[str, Any]] | list[Any]) -> tuple[float, list[str], dict[str, Any]]:
    """Analyzes ordered session events and returns:
    (sequence_risk_score (0-100), reasons, sequence_features)
    """
    if not events:
        return 15.0, ["Standard baseline session sequence."], {
            "event_count": 0,
            "repeated_reviews": 0,
            "amount_changes": 0,
            "acceleration_factor": 1.0,
        }

    # Normalize event types and timestamps
    normalized_events = []
    for ev in events:
        if isinstance(ev, dict):
            etype = ev.get("event_type", "").lower()
            ts = ev.get("created_at") or ev.get("timestamp")
        else:
            etype = getattr(ev, "event_type", "").lower()
            ts = getattr(ev, "created_at", None)

        if isinstance(ts, str):
            try:
                ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except Exception:
                ts = datetime.now(timezone.utc)
        elif ts is None:
            ts = datetime.now(timezone.utc)

        normalized_events.append({"type": etype, "ts": ts})

    event_count = len(normalized_events)
    reasons = []
    base_score = 10.0

    # 1. Count specific workflow occurrences
    types = [e["type"] for e in normalized_events]
    amount_changes = types.count("amount_changed") + types.count("amount_modified")
    review_counts = types.count("transfer_reviewed") + types.count("review_page_view")
    beneficiary_adds = types.count("beneficiary_added") + types.count("new_payee_added")
    pauses = types.count("pause_detected") + types.count("idle_detected")

    # 2. Check for suspicious transitions
    transition_penalty = 0.0
    for i in range(len(types) - 1):
        pair = (types[i], types[i + 1])
        if pair in HIGH_RISK_TRANSITIONS:
            penalty = HIGH_RISK_TRANSITIONS[pair]
            transition_penalty = max(transition_penalty, penalty)

    # 3. Inter-event timing and acceleration
    durations = []
    for i in range(len(normalized_events) - 1):
        dt = (normalized_events[i + 1]["ts"] - normalized_events[i]["ts"]).total_seconds()
        if dt > 0:
            durations.append(dt)

    total_duration = sum(durations) if durations else 30.0
    avg_step_duration = total_duration / max(1, len(durations))

    # Rapid burst execution (< 3 seconds between entering amount and confirmation)
    rapid_completion = False
    if "confirm_requested" in types:
        confirm_idx = types.index("confirm_requested")
        if confirm_idx > 0 and len(durations) >= confirm_idx:
            prior_step_duration = durations[confirm_idx - 1]
            if 0 < prior_step_duration < 2.5:
                rapid_completion = True

    # 4. Synthesize risk score
    score = base_score + transition_penalty

    if beneficiary_adds > 0:
        score += 25.0
        reasons.append("New beneficiary created in current session prior to transfer")

    if amount_changes >= 2:
        score += 22.0
        reasons.append(f"Multiple amount revisions before final commitment ({amount_changes} edits)")
    elif amount_changes == 1:
        score += 10.0

    if review_counts >= 2:
        score += 24.0
        reasons.append("Repeated confirmation review and back-navigation cycle")

    if pauses >= 2 or (total_duration > 180 and event_count < 6):
        score += 18.0
        reasons.append("Unusual session hesitations and prolonged intervals detected")

    if rapid_completion:
        score += 20.0
        reasons.append("Compressed execution sequence: confirm triggered within 2.5s of review")

    final_score = round(min(100.0, max(5.0, score)), 1)

    if not reasons:
        reasons.append("Workflow follows normal linear transaction progression")

    features = {
        "event_count": event_count,
        "repeated_reviews": review_counts,
        "amount_changes": amount_changes,
        "beneficiary_adds": beneficiary_adds,
        "total_duration_s": round(total_duration, 1),
        "avg_step_duration_s": round(avg_step_duration, 1),
        "rapid_completion": rapid_completion,
    }

    return final_score, reasons, features

