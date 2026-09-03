"""Seeds demo user and scenario data (spec §11).

Idempotent: skips seeding if the demo user already exists.
Run from backend/: python seed_demo_data.py
"""

from datetime import datetime, timedelta, timezone

from app.database import Base, engine, SessionLocal
from app import models  # noqa: F401
from app.models.user import User
from app.models.account import Account
from app.models.payee import Payee
from app.models.device import Device
from app.models.transaction import Transaction
from app.security import hash_password
from app.services.feature_engine import materialize_baseline_snapshot

DEMO_EMAIL = "demo@latchpoint.app"
DEMO_PASSWORD = "demo1234"


def _completed_txn(user_id, type_, amount, payee_id=None, symbol=None, days_ago=0, hour=10, outcome=None):
    created_at = datetime.now(timezone.utc) - timedelta(days=days_ago)
    created_at = created_at.replace(hour=hour, minute=0, second=0, microsecond=0)
    return Transaction(
        user_id=user_id,
        session_id=None,
        type=type_,
        amount=amount,
        payee_id=payee_id,
        symbol=symbol,
        risk_score=0.08,
        decision="ALLOW",
        reasons=["Baseline historical transaction."],
        status="completed",
        outcome=outcome,
        created_at=created_at,
        confirmed_at=created_at + timedelta(seconds=15),
    )


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        existing = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if existing:
            print(f"Demo user {DEMO_EMAIL} already exists — skipping seed.")
            return

        # 1. Create demo user
        user = User(
            name="Demo User",
            email=DEMO_EMAIL,
            password_hash=hash_password(DEMO_PASSWORD),
        )
        db.add(user)
        db.flush()

        # 2. Checking account with starting balance
        account = Account(
            user_id=user.id,
            account_type="checking",
            balance=250000.0,
        )
        db.add(account)
        db.flush()

        # 3. Known payees
        payee_rent = Payee(
            user_id=user.id, name="Rent - Sunview Apartments", masked_account_number="****4812", is_trusted=True
        )
        payee_internet = Payee(
            user_id=user.id, name="FiberNet Broadband", masked_account_number="****2209", is_trusted=True
        )
        payee_groceries = Payee(
            user_id=user.id, name="FreshMart Groceries", masked_account_number="****6701", is_trusted=True
        )
        payee_utilities = Payee(
            user_id=user.id, name="City Electric & Water", masked_account_number="****1143", is_trusted=True
        )
        for p in [payee_rent, payee_internet, payee_groceries, payee_utilities]:
            db.add(p)
        db.flush()

        # --- BASELINE: 10 clean transactions over the past 30 days (10:00 - 14:00, ₹1,800 - ₹3,500) ---
        amounts = [1900, 2100, 1850, 2400, 2000, 3100, 1950, 2200, 2800, 2050]
        payees = [payee_rent, payee_groceries, payee_internet, payee_utilities, payee_groceries,
                  payee_rent, payee_groceries, payee_internet, payee_utilities, payee_rent]

        for i, (amount, payee) in enumerate(zip(amounts, payees)):
            db.add(
                _completed_txn(
                    user.id, "transfer", amount, payee_id=payee.id,
                    days_ago=30 - i * 3, hour=10 + (i % 4),
                )
            )

        # --- NETWORK scenario: a payee shares a device with 2 other payees ---
        shared_device = Device(fingerprint_hash="demo-shared-device-fp", ip_address="203.0.113.7", asn="AS7018", geo_country="IN", is_vpn_or_proxy=False)
        db.add(shared_device)
        db.flush()

        payee_utilities.device_id = shared_device.id
        payee_groceries.device_id = shared_device.id
        payee_network_target = Payee(
            user_id=user.id, name="QuickCash Transfers", masked_account_number="****9915",
            is_trusted=False, device_id=shared_device.id,
        )
        db.add(payee_network_target)
        db.flush()

        # --- CONTEXT / REPEAT-LOSS scenario: 3 prior transfers to an entity resulting in loss/dispute ---
        payee_context_target = Payee(
            user_id=user.id, name="CryptoVault Transfers", masked_account_number="****8821",
            is_trusted=False,
        )
        db.add(payee_context_target)
        db.flush()

        for i in range(3):
            db.add(
                _completed_txn(
                    user.id, "transfer", 7000 + i * 500, payee_id=payee_context_target.id,
                    days_ago=12 - i * 3, hour=11, outcome="loss",
                )
            )

        # --- clean/trusted-payee transactions for the ALLOW denominator ---
        db.add(_completed_txn(user.id, "transfer", 2000, payee_id=payee_rent.id, days_ago=2, hour=9, outcome="neutral"))
        db.add(_completed_txn(user.id, "transfer", 1950, payee_id=payee_rent.id, days_ago=1, hour=10, outcome="neutral"))
        db.add(_completed_txn(user.id, "transfer", 900, payee_id=payee_internet.id, days_ago=3, hour=11, outcome="neutral"))

        # --- DRIFT scenario setup: 3 same-day small transfers already made today ---
        for i in range(3):
            db.add(
                _completed_txn(
                    user.id, "transfer", 1800 + i * 100, payee_id=payee_rent.id,
                    days_ago=0, hour=9 + i, outcome="neutral",
                )
            )

        db.commit()

        # The demo user starts with a full transaction history already on
        # record, so they should never see the calibration flow (Phase 3
        # §1) — skip straight to "active" with a materialized baseline.
        user.calibration_status = "active"
        user.calibrated_txn_count = 10
        user.baseline_snapshot = materialize_baseline_snapshot(db, user.id)
        db.commit()

        print(f"Seeded demo user: {DEMO_EMAIL} / {DEMO_PASSWORD}")
        print()
        print("Live demo scenarios to run through the UI:")
        print(f"  CLEAN 1:     transfer ~₹1,900 to '{payee_rent.name}' -> expect ALLOW")
        print(f"  CLEAN 2:     transfer ~₹900 to '{payee_internet.name}' -> expect ALLOW")
        print(f"  DRIFT:       transfer ~₹2,700 to '{payee_rent.name}' (4th transfer today) -> expect HOLD")
        print(f"  NETWORK:     transfer ~₹3,500 to '{payee_network_target.name}' -> expect VERIFY")
        print(f"  CONTEXT:     transfer ~₹12,000 to '{payee_context_target.name}' -> expect BLOCK")
    finally:
        db.close()


if __name__ == "__main__":
    main()
