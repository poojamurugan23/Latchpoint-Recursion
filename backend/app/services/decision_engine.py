"""Pure threshold function, no ML inside it (spec §9)."""

DENYLIST: set[int] = set()  # static, empty by default


def decide(risk_score: float, context: dict) -> str:
    if context.get("payee_id") in DENYLIST:
        return "BLOCK"
    if risk_score < 0.30:
        return "ALLOW"
    elif risk_score < 0.60:
        return "VERIFY"
    elif risk_score < 0.85:
        return "HOLD"
    else:
        return "BLOCK"


STATUS_FOR_DECISION = {
    "ALLOW": "allowed",
    "VERIFY": "verifying",
    "HOLD": "held",
    "BLOCK": "blocked",
}
