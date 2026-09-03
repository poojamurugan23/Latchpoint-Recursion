"""Behavioral Anomaly Detection using Isolation Forest (spec §10).

Detects per-user behavioral anomalies from passive telemetry features:
- mouse distance, velocity, direction changes
- confirm button dwell / hover hesitation
- idle pauses before actions
- keystroke timing interval mean and standard deviation
- session duration and edit/revision frequencies

Outputs a normalized behavior_anomaly_score (0-100) and interpretable reasons.
"""

import numpy as np
from sklearn.ensemble import IsolationForest

FEATURE_NAMES = [
    "mouse_distance",
    "avg_velocity",
    "direction_changes",
    "confirm_hover_ms",
    "idle_ms_before_confirm",
    "keystroke_interval_std",
    "session_duration_s",
    "amount_edit_count",
    "review_count",
]

# Baseline synthetic reference distribution representing normal user behavior
_REFERENCE_MEANS = np.array([350.0, 0.45, 8.0, 750.0, 1100.0, 55.0, 120.0, 0.2, 1.1])
_REFERENCE_STDS = np.array([120.0, 0.15, 3.5, 250.0, 400.0, 20.0, 60.0, 0.5, 0.4])

# Initialize and fit reference Isolation Forest
np.random.seed(42)
_normal_samples = np.random.normal(
    loc=_REFERENCE_MEANS,
    scale=_REFERENCE_STDS,
    size=(500, len(FEATURE_NAMES)),
)
# Ensure non-negative bounds
_normal_samples = np.clip(_normal_samples, a_min=0, a_max=None)

_iso_forest = IsolationForest(
    n_estimators=100,
    contamination=0.05,
    random_state=42,
)
_iso_forest.fit(_normal_samples)


def extract_behavioral_vector(telemetry_or_features: dict) -> np.ndarray:
    """Extracts numeric feature vector for Isolation Forest inference."""
    f = telemetry_or_features
    vec = [
        float(f.get("mouse_distance", f.get("total_distance_px", 350.0))),
        float(f.get("avg_velocity", f.get("avg_velocity_px_per_s", 0.45))),
        float(f.get("direction_changes", f.get("direction_change_count", 8.0))),
        float(f.get("confirm_hover_ms", 750.0)),
        float(f.get("idle_ms_before_confirm", f.get("idle_ms_before_action", 1100.0))),
        float(f.get("keystroke_interval_std", 55.0)),
        float(f.get("session_duration_s", 120.0)),
        float(f.get("amount_edit_count", f.get("amount_revisions", 0))),
        float(f.get("review_count", f.get("review_page_visits", 1))),
    ]
    return np.array(vec)


def score_behavior(telemetry_or_features: dict) -> tuple[float, list[str]]:
    """Calculates behavior_anomaly_score (0-100) and plain-English reasons.
    Higher score indicates higher anomaly / deviation from normal interaction dynamics.
    """
    vec = extract_behavioral_vector(telemetry_or_features)
    # raw score_samples returns negative anomaly score: more negative = more anomalous
    raw_score = float(_iso_forest.score_samples([vec])[0])
    # Normal inliers typically score between -0.45 and -0.35. Anomalies score < -0.55.
    # Map to 0 - 100 range:
    # raw >= -0.38 -> score < 30 (normal)
    # raw around -0.50 -> score ~ 60 (moderate)
    # raw <= -0.65 -> score > 85 (high anomaly)
    normalized = np.clip(((-raw_score - 0.35) / 0.35) * 100.0, 0.0, 100.0)

    # Contextual adjustments for known critical micro-hesitation patterns:
    reasons = []
    hover = vec[3]
    idle = vec[4]
    edits = vec[7]
    reviews = vec[8]
    keystroke_std = vec[5]

    if hover > 2500.0:
        normalized = max(normalized, 65.0)
        reasons.append(f"Extended hesitation over confirm button ({hover/1000:.1f}s dwell time)")
    elif hover < 120.0 and vec[0] > 100.0:
        normalized = max(normalized, 55.0)
        reasons.append("Abnormally rapid confirm click without cursor deceleration")

    if idle > 4000.0:
        normalized = max(normalized, 60.0)
        reasons.append(f"Protracted idle hesitation ({idle/1000:.1f}s) immediately prior to action")

    if edits >= 2:
        normalized = max(normalized, 58.0)
        reasons.append(f"Repeated amount revisions ({int(edits)} modifications in current session)")

    if reviews >= 2:
        normalized = max(normalized, 62.0)
        reasons.append(f"Repeated review-stage back navigations ({int(reviews)} iterations)")

    if keystroke_std > 120.0:
        normalized = max(normalized, 50.0)
        reasons.append("Irregular, fragmented typing cadence during amount entry")

    if not reasons:
        if normalized > 50:
            reasons.append("Kinematic interaction profile deviates moderately from baseline")
        else:
            reasons.append("Interaction biometrics match typical human baseline")

    return round(float(normalized), 1), reasons
