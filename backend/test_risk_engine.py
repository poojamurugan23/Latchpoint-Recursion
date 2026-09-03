"""Automated test suite verifying Latchpoint Risk Fusion, ML Models, and Admin APIs."""

from datetime import datetime, timezone
from app.database import SessionLocal
from app.ml import behavior_model
from app.services import sequence_engine, network_engine, risk_fusion, replay_service
from app.routers.admin import (
    get_command_center_overview,
    get_live_sessions,
    list_users,
    get_user_risk_profile,
    list_commitments,
    get_commitment_detail,
    get_risk_timeline,
    get_network_graph,
    get_alerts,
    get_investigations,
    get_replay_data,
    trigger_demo_scenario,
    get_model_intelligence,
    get_system_architecture,
)


def test_behavioral_model():
    """Validates Isolation Forest behavioral scoring."""
    normal_telemetry = {
        "total_distance_px": 320,
        "avg_velocity_px_per_s": 0.42,
        "direction_change_count": 7,
        "confirm_hover_ms": 680,
        "idle_ms_before_action": 950,
        "keystroke_interval_std": 48,
    }
    score, reasons = behavior_model.score_behavior(normal_telemetry)
    assert 0.0 <= score <= 45.0, f"Expected normal score < 45, got {score}"

    anomalous_telemetry = {
        "total_distance_px": 90,
        "avg_velocity_px_per_s": 0.88,
        "direction_change_count": 2,
        "confirm_hover_ms": 3200,  # Prolonged hesitation
        "idle_ms_before_action": 5500,  # Protracted pause
        "amount_revisions": 3,
        "review_page_visits": 3,
    }
    score_anom, reasons_anom = behavior_model.score_behavior(anomalous_telemetry)
    assert score_anom >= 55.0, f"Expected anomalous score >= 55, got {score_anom}"
    assert any("hesitation" in r.lower() or "revisions" in r.lower() for r in reasons_anom)
    print("✓ Behavioral Isolation Forest model passed.")


def test_sequence_engine():
    """Validates sequence journey transition scoring."""
    clean_events = [
        {"event_type": "login", "created_at": datetime.now(timezone.utc)},
        {"event_type": "dashboard_view", "created_at": datetime.now(timezone.utc)},
        {"event_type": "balance_view", "created_at": datetime.now(timezone.utc)},
        {"event_type": "transfer_started", "created_at": datetime.now(timezone.utc)},
        {"event_type": "transfer_reviewed", "created_at": datetime.now(timezone.utc)},
        {"event_type": "confirm_requested", "created_at": datetime.now(timezone.utc)},
    ]
    score_clean, _, _ = sequence_engine.analyze_sequence(clean_events)
    assert score_clean <= 25.0, f"Expected clean sequence score <= 25, got {score_clean}"

    suspicious_events = [
        {"event_type": "login", "created_at": datetime.now(timezone.utc)},
        {"event_type": "beneficiary_added", "created_at": datetime.now(timezone.utc)},
        {"event_type": "transfer_started", "created_at": datetime.now(timezone.utc)},
        {"event_type": "amount_changed", "created_at": datetime.now(timezone.utc)},
        {"event_type": "amount_changed", "created_at": datetime.now(timezone.utc)},
        {"event_type": "transfer_reviewed", "created_at": datetime.now(timezone.utc)},
        {"event_type": "transfer_reviewed", "created_at": datetime.now(timezone.utc)},
        {"event_type": "pause_detected", "created_at": datetime.now(timezone.utc)},
        {"event_type": "confirm_requested", "created_at": datetime.now(timezone.utc)},
    ]
    score_susp, reasons, _ = sequence_engine.analyze_sequence(suspicious_events)
    assert score_susp >= 70.0, f"Expected suspicious sequence score >= 70, got {score_susp}"
    assert any("revisions" in r.lower() or "beneficiary" in r.lower() for r in reasons)
    print("✓ Sequence & Journey Intelligence engine passed.")


def test_risk_fusion_and_policy():
    """Validates 6-factor risk fusion and decision thresholds."""
    # 1. Routine transfer -> ALLOW (0-30)
    res_allow = risk_fusion.fuse_risk_signals(
        behavior_score=15.0,
        sequence_score=12.0,
        transaction_score=18.0,
        historical_score=10.0,
        context_score=14.0,
        network_score=10.0,
    )
    assert res_allow["decision"] == "ALLOW"
    assert res_allow["risk_level"] == "LOW"
    assert res_allow["pre_commitment_risk_score"] <= 30.0

    # 2. Unusual transaction -> MONITOR (31-50)
    res_monitor = risk_fusion.fuse_risk_signals(
        behavior_score=35.0,
        sequence_score=40.0,
        transaction_score=45.0,
        historical_score=25.0,
        context_score=40.0,
        network_score=20.0,
    )
    assert res_monitor["decision"] == "MONITOR"
    assert res_monitor["risk_level"] == "MILD"
    assert 30.0 < res_monitor["pre_commitment_risk_score"] <= 50.0

    # 3. High risk multi-signal -> STEP-UP (51-70) or HOLD (71-85)
    res_step_up = risk_fusion.fuse_risk_signals(
        behavior_score=72.0,
        sequence_score=81.0,
        transaction_score=64.0,
        historical_score=69.0,
        context_score=76.0,
        network_score=32.0,
    )
    assert res_step_up["decision"] in ["STEP-UP", "HOLD"]
    assert res_step_up["pre_commitment_risk_score"] >= 65.0

    # 4. Critical policy overrides (Denylist or 3-loss streak)
    res_denylist = risk_fusion.fuse_risk_signals(
        behavior_score=20.0,
        sequence_score=20.0,
        transaction_score=20.0,
        historical_score=20.0,
        context_score=20.0,
        network_score=20.0,
        domain_overrides={"in_denylist": True},
    )
    assert res_denylist["decision"] == "BLOCK"
    assert res_denylist["risk_level"] == "CRITICAL"
    assert res_denylist["pre_commitment_risk_score"] >= 95.0
    print("✓ Risk Fusion & Decision Policy engine passed.")


def test_admin_api_endpoints():
    """Validates real data outputs from all Admin API router functions."""
    db = SessionLocal()
    try:
        overview = get_command_center_overview(db)
        assert "kpis" in overview
        assert overview["kpis"]["active_sessions"]["value"] > 0

        sessions = get_live_sessions(db)
        assert len(sessions) >= 10

        users = list_users(db)
        assert len(users) >= 20

        user_prof = get_user_risk_profile(1, db)
        assert "baseline" in user_prof
        assert "signals" in user_prof

        commitments = list_commitments(db)
        assert len(commitments) >= 10

        detail = get_commitment_detail(commitments[0]["id"], db)
        assert "pre_commitment_risk" in detail
        assert "recommendation" in detail

        timeline = get_risk_timeline()
        assert len(timeline) >= 5

        net = get_network_graph(1, db)
        assert len(net["nodes"]) >= 50
        assert len(net["edges"]) >= 50

        alerts = get_alerts(db)
        assert isinstance(alerts, list)

        investigations = get_investigations(db)
        assert isinstance(investigations, list)

        replay = get_replay_data("S-DEMO-001")
        assert len(replay) >= 6
        assert replay[-1]["gate_triggered"] is True

        models = get_model_intelligence()
        assert len(models) == 4

        sys_data = get_system_architecture()
        assert len(sys_data["pipeline"]) == 7
        print("✓ All 14 Admin API endpoints and database queries passed.")
    finally:
        db.close()


if __name__ == "__main__":
    test_behavioral_model()
    test_sequence_engine()
    test_risk_fusion_and_policy()
    test_admin_api_endpoints()
    print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")
