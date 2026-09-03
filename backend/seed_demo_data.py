"""Seeds the Latchpoint demo user and the 3 required demo scenarios (spec §11).

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

DEMO_EMAIL = "demo@latchpoint.app"
DEMO_PASSWORD = "demo1234"


def _completed_txn(user_id, type_, amount, payee_id=None, symbol=None, days_ago=0, hour=10, outcome=None):
    created_at = datetime.now(timezone.utc) - timedelta(days=days_ago)
    created_at = created_at.replace(hour=hour, minute=0, second=0, microsecond=0)
    return Transaction(
        user_id=user_id,
        type=type_,
        amount=amount,
        payee_id=payee_id,
        symbol=symbol,
        status="completed",
        outcome=outcome,
        created_at=created_at,
        confirmed_at=created_at,
    )


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if existing:
            print(f"Demo user {DEMO_EMAIL} already exists (id={existing.id}) — skipping seed.")
            return

        user = User(name="Demo User", email=DEMO_EMAIL, password_hash=hash_password(DEMO_PASSWORD))
        db.add(user)
        db.flush()

        db.add(Account(user_id=user.id, balance=250000.0, account_type="checking"))
        db.add(Account(user_id=user.id, balance=100000.0, account_type="trading"))

        # --- regular payees (form the clean personal baseline) ---
        payee_rent = Payee(user_id=user.id, name="Rent - Sunview Apartments", masked_account_number="****4471", is_trusted=True)
        payee_utilities = Payee(user_id=user.id, name="City Power & Utilities", masked_account_number="****2290", is_trusted=True)
        payee_groceries = Payee(user_id=user.id, name="FreshMart Groceries", masked_account_number="****8823", is_trusted=True)
        payee_internet = Payee(user_id=user.id, name="FiberNet Broadband", masked_account_number="****3360", is_trusted=True)
        db.add_all([payee_rent, payee_utilities, payee_groceries, payee_internet])
        db.flush()

        # --- 10 clean historical transactions -> baseline_confidence: high ---
        regulars = [payee_rent, payee_utilities, payee_groceries]
        for i in range(10):
            payee = regulars[i % len(regulars)]
            amount = 1800 + (i % 3) * 250
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

        # --- REPEAT-LOSS scenario: 3 prior trades on the same symbol, all losses ---
        loss_symbol = "ZYX"
        for i in range(3):
            db.add(
                _completed_txn(
                    user.id, "trade", 8000 + i * 500, symbol=loss_symbol,
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

        print(f"Seeded demo user: {DEMO_EMAIL} / {DEMO_PASSWORD}")
        print()
        print("Live demo scenarios to run through the UI:")
        print(f"  CLEAN:       transfer ~₹1,900 to '{payee_rent.name}' -> expect ALLOW")
        print(f"  DRIFT:       transfer ~₹2,700 to '{payee_rent.name}' (4th transfer today) -> expect HOLD")
        print(f"  NETWORK:     transfer ~₹3,500 to '{payee_network_target.name}' -> expect VERIFY/HOLD/BLOCK")
        print(f"  REPEAT-LOSS: trade ~₹12,000 on symbol '{loss_symbol}' -> expect BLOCK")
    finally:
        db.close()


if __name__ == "__main__":
    main()
