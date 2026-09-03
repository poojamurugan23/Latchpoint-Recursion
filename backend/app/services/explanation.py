"""Maps top SHAP features to plain-English reasons (spec §8.5). Deterministic
templates are the primary (and, for this MVP, only) path — fast, reliable,
zero network calls during a live demo."""

TEMPLATES = {
    "exposure_vs_baseline_ratio": lambda v, ctx: (
        f"You've committed ₹{ctx['exposure_today']:,.0f} today — "
        f"about {max(ctx['exposure_vs_baseline_ratio'], 1.0):.1f}x your typical daily total."
    ),
    "deviation_ratio": lambda v, ctx: (
        f"This amount is unusually large compared to your typical transaction "
        f"of about ₹{ctx['mean_amount']:,.0f}."
    ),
    "is_new_payee": lambda v, ctx: "This is a new recipient you haven't paid before.",
    "is_odd_hour": lambda v, ctx: "You don't usually transact at this time of day.",
    "baseline_confidence_score": lambda v, ctx: (
        "We don't have much transaction history for you yet, so this is being "
        "compared against typical behavior across all users."
    ),
    "exposure_today": lambda v, ctx: (
        f"You've already committed ₹{ctx['exposure_today']:,.0f} today across "
        f"{int(ctx['txn_count_today'])} transaction(s)."
    ),
    "txn_count_today": lambda v, ctx: (
        f"This is your {int(ctx['txn_count_today'])}th transaction today, more than usual."
    ),
    "pause_count": lambda v, ctx: "There were unusual pauses while you filled this out.",
    "edit_count": lambda v, ctx: "This form was edited more times than usual before submitting.",
    "back_navigation_count": lambda v, ctx: "You navigated back and forth before reaching this step.",
    "time_in_flow_sec": lambda v, ctx: "This transaction was completed unusually quickly.",
    "device_shared_with_other_payees_count": lambda v, ctx: (
        f"This recipient shares a device fingerprint with "
        f"{int(ctx['device_shared_with_other_payees_count'])} other recipients you've paid recently."
    ),
    "recipient_is_new_device_pairing": lambda v, ctx: (
        "You haven't paid this recipient from this device before."
    ),
    "ip_is_vpn_or_proxy": lambda v, ctx: "This session is coming through a VPN or proxy.",
    "repeat_pattern_negative_outcome": lambda v, ctx: (
        f"You've made {int(ctx['prior_negative_outcome_streak'])} similar transactions "
        f"recently that resulted in a loss."
    ),
    "prior_negative_outcome_streak": lambda v, ctx: (
        f"Your last {int(ctx['prior_negative_outcome_streak'])} transactions to this "
        f"recipient/symbol resulted in a loss."
    ),
}


MEANINGFUL_SHAP_THRESHOLD = 0.05


def explain(shap_by_feature: dict, ctx: dict, top_n: int = 3) -> tuple[list[str], list[dict]]:
    ranked = sorted(shap_by_feature.items(), key=lambda kv: abs(kv[1]), reverse=True)
    top = [
        (feature, value)
        for feature, value in ranked
        # only features that meaningfully push risk *up* make useful reasons
        if value > MEANINGFUL_SHAP_THRESHOLD
    ][:top_n]

    reasons = []
    top_features = []
    for feature, value in top:
        template = TEMPLATES.get(feature)
        reason = template(value, ctx) if template else f"Unusual value for {feature}."
        reasons.append(reason)
        top_features.append({"feature": feature, "shap_value": float(value)})

    if not reasons:
        reasons = ["This transaction closely matches your typical patterns."]
        top_features = [
            {"feature": feature, "shap_value": float(value)} for feature, value in ranked[:top_n]
        ]

    return reasons, top_features
