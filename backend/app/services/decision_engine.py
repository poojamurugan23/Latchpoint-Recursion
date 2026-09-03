"""Pure threshold function + domain policy overrides (spec §9)."""

DENYLIST: set[int] = set()  # static, empty by default

STATUS_FOR_DECISION = {
    "ALLOW": "allowed",
    "VERIFY": "verifying",
    "HOLD": "held",
    "BLOCK": "blocked",
}


def decide(risk_score: float, context: dict) -> str:
    decision, _ = evaluate_decision(risk_score, context)
    return decision


def evaluate_decision(risk_score: float, context: dict) -> tuple[str, float]:
    """Evaluates the risk score combined with domain context signals.
    Returns (decision, calibrated_risk_score).
    """
    features = context.get("features", {})

    # 1. Static denylist
    if context.get("payee_id") in DENYLIST:
        return "BLOCK", max(risk_score, 0.95)

    # 2. Context anomaly: repeat negative outcome / loss streak with this entity
    if features.get("repeat_pattern_negative_outcome") == 1 or features.get("prior_negative_outcome_streak", 0) >= 3:
        return "BLOCK", max(risk_score, 0.92)

    # 3. Network anomaly: recipient device fingerprint shared across 2+ distinct payees
    if features.get("device_shared_with_other_payees_count", 0) >= 2:
        return "VERIFY", max(risk_score, 0.55)

    # 4. Drift anomaly: cumulative daily exposure exceeding baseline combined with elevated transaction amount
    if features.get("exposure_vs_baseline_ratio", 0) >= 3.2 and features.get("deviation_ratio", 0) > 0:
        return "HOLD", max(risk_score, 0.76)

    # 5. Severe amount anomaly: extreme statistical deviation
    if features.get("deviation_ratio", 0) >= 8.0:
        return "BLOCK", max(risk_score, 0.88)

    # 6. ML model thresholds
    if risk_score < 0.30:
        return "ALLOW", risk_score
    elif risk_score < 0.60:
        return "VERIFY", risk_score
    elif risk_score < 0.85:
        return "HOLD", risk_score
    else:
        return "BLOCK", risk_score
