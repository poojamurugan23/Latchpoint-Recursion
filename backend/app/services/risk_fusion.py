"""Multi-Signal Risk Fusion & Decision Policy Engine (spec §17 & §18).

Synthesizes 6 distinct risk dimensions:
1. Behavior Risk (20%): Isolation Forest anomaly score on passive biometrics & hover
2. Sequence Risk (20%): Transition sequence analysis, hesitation, and acceleration
3. Transaction Risk (20%): Baseline sigma deviation, velocity, time-of-day
4. Historical Risk (15%): Recipient outcome history, dispute/loss streaks
5. Context Risk (15%): Newly added beneficiary, revisions, session deviation
6. Network Risk (10%): Cross-entity shared devices, IPs, and proxy linkages

Combines via configurable weights -> pre_commitment_risk_score (0-100).
Applies policy thresholds -> ALLOW | MONITOR | STEP-UP | HOLD | BLOCK.
"""

from typing import Any

DEFAULT_WEIGHTS = {
    "behavior": 0.20,
    "sequence": 0.20,
    "transaction": 0.20,
    "historical": 0.15,
    "context": 0.15,
    "network": 0.10,
}

DECISION_THRESHOLDS = [
    (30.0, "ALLOW", "LOW"),
    (50.0, "MONITOR", "MILD"),
    (70.0, "STEP-UP", "MODERATE"),
    (85.0, "HOLD", "HIGH"),
    (100.0, "BLOCK", "CRITICAL"),
]


def fuse_risk_signals(
    behavior_score: float,
    sequence_score: float,
    transaction_score: float,
    historical_score: float,
    context_score: float,
    network_score: float,
    weights: dict[str, float] | None = None,
    domain_overrides: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Combines individual dimension scores into a fused pre-commitment risk score.
    Returns:
    {
        "pre_commitment_risk_score": float (0-100),
        "risk_level": str ("LOW" | "MILD" | "MODERATE" | "HIGH" | "CRITICAL"),
        "decision": str ("ALLOW" | "MONITOR" | "STEP-UP" | "HOLD" | "BLOCK"),
        "contributions": {
            "behavior": {"score": ..., "weight": ..., "weighted_points": ...},
            ...
        },
        "overrides_applied": list[str]
    }
    """
    w = {**DEFAULT_WEIGHTS, **(weights or {})}
    total_w = sum(w.values())
    norm_w = {k: v / total_w for k, v in w.items()}

    scores = {
        "behavior": float(np_clip(behavior_score)),
        "sequence": float(np_clip(sequence_score)),
        "transaction": float(np_clip(transaction_score)),
        "historical": float(np_clip(historical_score)),
        "context": float(np_clip(context_score)),
        "network": float(np_clip(network_score)),
    }

    contributions = {}
    weighted_sum = 0.0
    for dim, score in scores.items():
        weight = norm_w[dim]
        points = score * weight
        weighted_sum += points
        contributions[dim] = {
            "score": round(score, 1),
            "weight": round(weight, 2),
            "weighted_points": round(points, 1),
        }

    raw_fused = round(weighted_sum, 1)
    overrides_applied = []

    # Policy overrides for critical risks
    final_score = raw_fused
    decision_override = None

    if domain_overrides:
        # 1. Denylist
        if domain_overrides.get("in_denylist"):
            final_score = max(final_score, 95.0)
            decision_override = "BLOCK"
            overrides_applied.append("Recipient is on the institutional denylist")

        # 2. Repeat Loss / Dispute Streak >= 3
        if domain_overrides.get("loss_streak", 0) >= 3:
            final_score = max(final_score, 92.0)
            decision_override = "BLOCK"
            overrides_applied.append("3 consecutive prior outcomes with this entity resulted in disputes/loss")

        # 3. High Network Collisions: 2+ payees share hardware
        if domain_overrides.get("shared_device_count", 0) >= 2 and final_score < 55.0:
            final_score = max(final_score, 55.0)
            decision_override = "STEP-UP"
            overrides_applied.append("Recipient device fingerprint is shared across 2+ distinct payees")

        # 4. Severe Cumulative Daily Exposure (>3.2x daily baseline with elevated amount)
        if domain_overrides.get("daily_exposure_ratio", 0) >= 3.2 and scores["transaction"] >= 50.0:
            final_score = max(final_score, 76.0)
            decision_override = "HOLD"
            overrides_applied.append("Cumulative daily committed volume exceeds 3.2x personal baseline")

    # Map to policy decision
    decision = decision_override
    risk_level = "LOW"

    for threshold, dec, level in DECISION_THRESHOLDS:
        if final_score <= threshold:
            if not decision:
                decision = dec
            risk_level = level
            break

    if not decision:
        decision = "BLOCK"
        risk_level = "CRITICAL"

    return {
        "pre_commitment_risk_score": round(final_score, 1),
        "risk_level": risk_level,
        "decision": decision,
        "contributions": contributions,
        "overrides_applied": overrides_applied,
    }


def np_clip(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, float(v)))

