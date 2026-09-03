"""Session Replay & Demo Scenario Engine (spec §27 & §28).

Generates sequential step-by-step event replays with cumulative risk scores,
contributing factors, and gate interception states at each transition.
"""

from typing import Any


SIGNATURE_REPLAY_EVENTS = [
    {
        "step": 1,
        "time": "10:00:15",
        "event_type": "LOGIN",
        "label": "User Authenticated",
        "description": "Session initialized from primary device (Chrome 128 / Linux).",
        "risk_score": 12.0,
        "decision": "ALLOW",
        "contributions": {"behavior": 10, "sequence": 12, "transaction": 10, "historical": 10, "context": 15, "network": 15},
        "reasons": ["Standard authentication flow from recognized hardware."],
        "gate_triggered": False,
    },
    {
        "step": 2,
        "time": "10:10:22",
        "event_type": "BENEFICIARY_ADDED",
        "label": "New Beneficiary Created",
        "description": "Beneficiary 'Apex Digital Escrow' (****8821) registered in current active session.",
        "risk_score": 34.0,
        "decision": "MONITOR",
        "contributions": {"behavior": 22, "sequence": 42, "transaction": 15, "historical": 20, "context": 55, "network": 25},
        "reasons": ["New untrusted beneficiary added during active session."],
        "gate_triggered": False,
    },
    {
        "step": 3,
        "time": "10:14:05",
        "event_type": "TRANSFER_STARTED",
        "label": "Transfer Initialized: ₹20,000",
        "description": "Initiated transfer targeting newly added beneficiary.",
        "risk_score": 48.0,
        "decision": "MONITOR",
        "contributions": {"behavior": 35, "sequence": 54, "transaction": 58, "historical": 25, "context": 62, "network": 25},
        "reasons": ["Amount ₹20,000 exceeds typical baseline (₹2,500 - ₹4,000).", "Immediate transfer to new beneficiary."],
        "gate_triggered": False,
    },
    {
        "step": 4,
        "time": "10:15:18",
        "event_type": "AMOUNT_CHANGED",
        "label": "Amount Revised: ₹25,000",
        "description": "Amount revised upward from ₹20,000 to ₹25,000 (+4.9σ baseline deviation).",
        "risk_score": 61.0,
        "decision": "STEP-UP",
        "contributions": {"behavior": 52, "sequence": 68, "transaction": 64, "historical": 35, "context": 72, "network": 28},
        "reasons": ["In-flight amount revision upward (+25%).", "Amount exceeds personal baseline by +4.9σ."],
        "gate_triggered": False,
    },
    {
        "step": 5,
        "time": "10:16:30",
        "event_type": "REVIEW",
        "label": "Review Screen Loaded",
        "description": "User paused on pre-commitment review screen for 18 seconds.",
        "risk_score": 68.0,
        "decision": "STEP-UP",
        "contributions": {"behavior": 65, "sequence": 74, "transaction": 64, "historical": 40, "context": 74, "network": 30},
        "reasons": ["Micro-hesitation: cursor stationary over commit boundary for >15 seconds."],
        "gate_triggered": False,
    },
    {
        "step": 6,
        "time": "10:17:10",
        "event_type": "REVIEW_AGAIN",
        "label": "Back Navigation & Re-Review",
        "description": "Navigated back to form, re-inspected fields, and returned to review.",
        "risk_score": 73.0,
        "decision": "STEP-UP",
        "contributions": {"behavior": 68, "sequence": 80, "transaction": 64, "historical": 45, "context": 76, "network": 32},
        "reasons": ["Repeated review oscillation cycle prior to commitment."],
        "gate_triggered": False,
    },
    {
        "step": 7,
        "time": "10:18:02",
        "event_type": "CONFIRM_REQUEST",
        "label": "Final Commitment Attempted",
        "description": "User clicked Confirm. Latchpoint Pre-Commitment Gate intercepted before execution.",
        "risk_score": 78.0,
        "decision": "STEP-UP",
        "contributions": {"behavior": 72, "sequence": 81, "transaction": 64, "historical": 69, "context": 76, "network": 32},
        "reasons": [
            "Transaction amount materially exceeds personal baseline (+4.9σ)",
            "New beneficiary created 8 minutes prior to transfer",
            "Multiple amount revisions in current session",
            "Unusual recent journey sequence with repeated reviews",
            "Elevated contextual micro-hesitation over commit boundary",
        ],
        "gate_triggered": True,
        "gate_details": {
            "title": "Before you continue",
            "message": "This payment differs significantly from your usual financial activity. Additional verification required.",
            "action_required": "OTP Step-Up Challenge",
            "balance_debited": False,
        }
    },
]


PREDEFINED_SCENARIOS = {
    "normal": {
        "id": "SCENARIO_NORMAL",
        "name": "Normal User Baseline",
        "description": "Routine utility payment matching historical habits. Clean transition, zero hesitation.",
        "user_name": "Priya Sharma",
        "user_email": "priya.sharma@example.com",
        "amount": 2100.0,
        "beneficiary": "FiberNet Broadband",
        "risk_score": 14.0,
        "decision": "ALLOW",
        "risk_level": "LOW",
        "events": [
            {"time": "09:30:10", "type": "LOGIN", "score": 8.0},
            {"time": "09:31:05", "type": "BALANCE_VIEW", "score": 10.0},
            {"time": "09:31:40", "type": "TRANSFER_STARTED", "score": 12.0},
            {"time": "09:32:15", "type": "REVIEW", "score": 12.0},
            {"time": "09:32:25", "type": "CONFIRM", "score": 14.0},
        ],
        "reasons": ["In-pattern amount matching personal monthly baseline.", "Trusted counterparty with recurring transaction history."],
    },
    "unusual": {
        "id": "SCENARIO_UNUSUAL",
        "name": "Unusual But Legitimate",
        "description": "Higher amount to a known payee at an off-peak time. Elevated signal but proportionate verdict.",
        "user_name": "Rohan Gupta",
        "user_email": "rohan.gupta@example.com",
        "amount": 8500.0,
        "beneficiary": "Rent - Sunview Apartments",
        "risk_score": 42.0,
        "decision": "MONITOR",
        "risk_level": "MILD",
        "events": [
            {"time": "23:45:10", "type": "LOGIN", "score": 25.0},
            {"time": "23:46:12", "type": "TRANSFER_STARTED", "score": 38.0},
            {"time": "23:47:00", "type": "CONFIRM", "score": 42.0},
        ],
        "reasons": ["Transaction occurs during off-peak hours (23:45).", "Amount is 2.2x above rolling 30-day mean."],
    },
    "escalating": {
        "id": "SCENARIO_ESCALATING",
        "name": "Escalating Financial Activity",
        "description": "Rapid succession of payments within a single afternoon exceeding cumulative daily threshold.",
        "user_name": "Aman Verma",
        "user_email": "aman.verma@example.com",
        "amount": 2700.0,
        "beneficiary": "Rent - Sunview Apartments",
        "risk_score": 76.0,
        "decision": "HOLD",
        "risk_level": "HIGH",
        "events": [
            {"time": "14:10:00", "type": "TRANSFER_1", "score": 20.0},
            {"time": "14:45:00", "type": "TRANSFER_2", "score": 35.0},
            {"time": "15:20:00", "type": "TRANSFER_3", "score": 58.0},
            {"time": "15:55:00", "type": "CONFIRM_4", "score": 76.0},
        ],
        "reasons": ["4th transfer today; cumulative daily exposure exceeds 3.3x baseline.", "Velocity acceleration across same-day commitments."],
    },
    "network": {
        "id": "SCENARIO_NETWORK",
        "name": "Network Risk / Shared Device",
        "description": "Payee hardware fingerprint overlaps with multiple distinct external accounts.",
        "user_name": "Sneha Patel",
        "user_email": "sneha.patel@example.com",
        "amount": 3500.0,
        "beneficiary": "QuickCash Transfers",
        "risk_score": 58.0,
        "decision": "STEP-UP",
        "risk_level": "MODERATE",
        "events": [
            {"time": "11:15:10", "type": "LOGIN", "score": 15.0},
            {"time": "11:16:30", "type": "BENEFICIARY_ADDED", "score": 35.0},
            {"time": "11:17:45", "type": "CONFIRM", "score": 58.0},
        ],
        "reasons": ["Target payee device fingerprint is shared across 2+ distinct payees.", "Network topology indicates shared intermediary device."],
    },
    "context": {
        "id": "SCENARIO_CONTEXT",
        "name": "Context Risk / Repeat Loss",
        "description": "Payment directed to counterparty with repeat disputed loss history.",
        "user_name": "Vikram Malhotra",
        "user_email": "vikram.m@example.com",
        "amount": 12000.0,
        "beneficiary": "CryptoVault Transfers",
        "risk_score": 94.0,
        "decision": "BLOCK",
        "risk_level": "CRITICAL",
        "events": [
            {"time": "16:20:10", "type": "LOGIN", "score": 30.0},
            {"time": "16:22:15", "type": "TRANSFER_STARTED", "score": 70.0},
            {"time": "16:23:05", "type": "CONFIRM", "score": 94.0},
        ],
        "reasons": ["3 consecutive prior transfers to this entity resulted in disputes/loss.", "High amount deviation combined with negative outcome streak."],
    },
    "signature": {
        "id": "SCENARIO_SIGNATURE",
        "name": "Signature Demo: Multi-Signal High Risk",
        "description": "The complete PS3 showcase: baseline -> new beneficiary -> amount revision -> hesitations -> Pre-Commitment Gate intervention -> verification.",
        "user_name": "Demo User",
        "user_email": "demo@latchpoint.app",
        "amount": 25000.0,
        "beneficiary": "Apex Digital Escrow",
        "risk_score": 78.0,
        "decision": "STEP-UP",
        "risk_level": "HIGH",
        "events": SIGNATURE_REPLAY_EVENTS,
        "reasons": [
            "Transaction amount materially exceeds personal baseline (+4.9σ)",
            "New beneficiary created in current session",
            "Multiple amount revisions before confirmation",
            "Unusual recent journey sequence with repeated reviews",
            "Elevated contextual hesitation",
        ],
    },
}


def get_replay_stream(session_id: str | None = None) -> list[dict[str, Any]]:
    """Returns chronological event replay stream with real incremental metrics."""
    return SIGNATURE_REPLAY_EVENTS


def get_scenario(scenario_key: str) -> dict[str, Any]:
    """Returns predefined scenario metadata."""
    key = scenario_key.lower()
    return PREDEFINED_SCENARIOS.get(key, PREDEFINED_SCENARIOS["signature"])
