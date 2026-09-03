"""Single source of truth for the CommitmentContext feature vector (spec §8.1).
Shared by the synthetic data generator, training script, and the live
feature_engine so column order never drifts between train and inference."""

FEATURE_COLUMNS = [
    "deviation_ratio",
    "is_new_payee",
    "is_odd_hour",
    "baseline_confidence_score",
    "exposure_today",
    "exposure_vs_baseline_ratio",
    "txn_count_today",
    "pause_count",
    "edit_count",
    "back_navigation_count",
    "time_in_flow_sec",
    "device_shared_with_other_payees_count",
    "recipient_is_new_device_pairing",
    "ip_is_vpn_or_proxy",
    "repeat_pattern_negative_outcome",
    "prior_negative_outcome_streak",
]
