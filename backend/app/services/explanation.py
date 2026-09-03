"""Maps top SHAP features to plain-English reasons (spec §8.5). Deterministic
templates are the primary (and, for this MVP, only) path — fast, reliable,
zero network calls during a live demo.

Each template returns None when the underlying context value wouldn't make a
sensible sentence (e.g. a feature with a small positive SHAP baseline offset
even though its real-world value is 0) — explain() then falls through to the
next-ranked feature instead of surfacing a vacuous reason."""

TEMPLATES = {
    "exposure_vs_baseline_ratio": lambda v, ctx: (
        f"You've committed ₹{ctx['exposure_today']:,.0f} today — "
        f"about {ctx['exposure_vs_baseline_ratio']:.1f}x your typical daily total."
    ) if ctx["exposure_vs_baseline_ratio"] >= 1.5 else None,
    "deviation_ratio": lambda v, ctx: (
        f"This amount is unusually large compared to your typical transaction "
        f"of about ₹{ctx.get('mean_amount', 2500):,.0f}."
    ) if ctx.get("deviation_ratio", 0) > 0 else None,
    "is_new_payee": lambda v, ctx: (
        "This is a new recipient you haven't paid before." if ctx["is_new_payee"] else None
    ),
    "is_odd_hour": lambda v, ctx: (
        "You don't usually transact at this time of day." if ctx["is_odd_hour"] else None
    ),
    "baseline_confidence_score": lambda v, ctx: (
        "We don't have much transaction history for you yet, so this is being "
        "compared against typical behavior across all users."
        if ctx["baseline_confidence_score"] < 1.0
        else None
    ),
    "exposure_today": lambda v, ctx: (
        f"You've already committed ₹{ctx['exposure_today']:,.0f} today across "
        f"{int(ctx['txn_count_today'])} transaction(s)."
        if ctx["txn_count_today"] >= 2
        else None
    ),
    "txn_count_today": lambda v, ctx: (
        f"This is your {int(ctx['txn_count_today'])}th transaction today, more than usual."
        if ctx["txn_count_today"] >= 3
        else None
    ),
    "pause_count": lambda v, ctx: (
        "There were unusual pauses while you filled this out." if ctx["pause_count"] >= 2 else None
    ),
    "edit_count": lambda v, ctx: (
        "This form was edited more times than usual before submitting."
        if ctx["edit_count"] >= 3
        else None
    ),
    "back_navigation_count": lambda v, ctx: (
        "You navigated back and forth before reaching this step."
        if ctx["back_navigation_count"] >= 1
        else None
    ),
    "time_in_flow_sec": lambda v, ctx: (
        "This transaction was completed unusually quickly." if ctx["time_in_flow_sec"] < 8 else None
    ),
    "device_shared_with_other_payees_count": lambda v, ctx: (
        f"This recipient shares a device fingerprint with "
        f"{int(ctx['device_shared_with_other_payees_count'])} other recipients you've paid recently."
        if ctx["device_shared_with_other_payees_count"] > 0
        else None
    ),
    "recipient_is_new_device_pairing": lambda v, ctx: (
        "You haven't paid this recipient from this device before."
        if ctx["recipient_is_new_device_pairing"]
        else None
    ),
    "ip_is_vpn_or_proxy": lambda v, ctx: (
        "This session is coming through a VPN or proxy." if ctx["ip_is_vpn_or_proxy"] else None
    ),
    "repeat_pattern_negative_outcome": lambda v, ctx: (
        f"You've made {int(ctx['prior_negative_outcome_streak'])} similar transactions "
        f"recently that resulted in a loss."
        if ctx["prior_negative_outcome_streak"] >= 1
        else None
    ),
    "prior_negative_outcome_streak": lambda v, ctx: (
        f"Your last {int(ctx['prior_negative_outcome_streak'])} transactions to this "
        f"recipient/symbol resulted in a loss."
        if ctx["prior_negative_outcome_streak"] >= 1
        else None
    ),
    "confirm_hover_ms": lambda v, ctx: (
        "This was confirmed almost instantly, without the pause we'd typically expect."
        if ctx["confirm_hover_ms"] < 150
        else None
    ),
    "mouse_direction_changes": lambda v, ctx: (
        "The on-screen movement before this was confirmed looked more scripted than natural."
        if ctx["mouse_direction_changes"] <= 1
        else None
    ),
    "idle_ms_before_confirm": lambda v, ctx: (
        "There was almost no pause before this was confirmed."
        if ctx["idle_ms_before_confirm"] < 200
        else None
    ),
    "keystroke_interval_std": lambda v, ctx: (
        "The typing pattern for this amount was unusually uniform for manual entry."
        if ctx["keystroke_interval_std"] < 15
        else None
    ),
    "location_deviation_km": lambda v, ctx: (
        f"This session is coming from about {ctx['location_deviation_km']:,.0f} km away from "
        f"where you usually transact."
        if ctx["location_deviation_km"] > 50
        else None
    ),
    "is_new_location": lambda v, ctx: (
        "You're transacting from a location we haven't seen before." if ctx["is_new_location"] else None
    ),
    "device_and_location_mismatch": lambda v, ctx: (
        "This is both a new device and a new location — a combination we haven't seen for you before."
        if ctx["device_and_location_mismatch"]
        else None
    ),
}


MEANINGFUL_SHAP_THRESHOLD = 0.05


def explain(shap_by_feature: dict, ctx: dict, top_n: int = 3) -> tuple[list[str], list[dict]]:
    # Ensure active anomalous signals are prominently surfaced in explanations
    active_boosts = {
        "repeat_pattern_negative_outcome": 0.95 if ctx.get("repeat_pattern_negative_outcome") else 0.0,
        "prior_negative_outcome_streak": 0.90 if ctx.get("prior_negative_outcome_streak", 0) >= 2 else 0.0,
        "device_shared_with_other_payees_count": 0.85 if ctx.get("device_shared_with_other_payees_count", 0) >= 2 else 0.0,
        "exposure_vs_baseline_ratio": 0.75 if (ctx.get("exposure_vs_baseline_ratio", 0) >= 2.0 and ctx.get("txn_count_today", 0) >= 3) else 0.0,
    }
    boosted_shap = {
        k: max(v, active_boosts.get(k, 0.0)) for k, v in shap_by_feature.items()
    }
    ranked = sorted(boosted_shap.items(), key=lambda kv: abs(kv[1]), reverse=True)
    candidates = [
        (feature, value)
        for feature, value in ranked
        if value > MEANINGFUL_SHAP_THRESHOLD
    ]

    reasons = []
    top_features = []
    for feature, value in candidates:
        if len(reasons) >= top_n:
            break
        template = TEMPLATES.get(feature)
        reason = template(value, ctx) if template else f"Unusual value for {feature}."
        if reason is None:
            continue
        reasons.append(reason)
        top_features.append({"feature": feature, "shap_value": float(value)})

    if not reasons:
        reasons = ["This transaction closely matches your typical patterns."]
        top_features = [
            {"feature": feature, "shap_value": float(value)} for feature, value in ranked[:top_n]
        ]

    return reasons, top_features
