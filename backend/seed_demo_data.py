"""Seeds comprehensive realistic demo data for Latchpoint (spec §43 & §29).

Generates:
- 22 users (including primary demo user, normal users, unusual users, high-risk cases)
- 55+ sessions
- 350+ telemetry events (mouse, pause, revision, navigations)
- 60+ transactions across realistic distribution:
    ALLOW (~70%), MONITOR (~15%), STEP-UP (~10%), HOLD (~4%), BLOCK (~1%)
- 24 beneficiaries / payees
- Hardware devices & IP network graph
- Signature demo scenario for the live hackathon showcase
"""

import random
from datetime import datetime, timedelta, timezone

from app.database import Base, engine, SessionLocal
from app import models  # noqa: F401
from app.models.user import User
from app.models.account import Account
from app.models.payee import Payee
from app.models.device import Device
from app.models.transaction import Transaction
from app.models.session import UserSession
from app.models.event import Event
from app.models.case import Case
from app.security import hash_password
from app.services.feature_engine import materialize_baseline_snapshot

DEMO_EMAIL = "demo@latchpoint.app"
DEMO_PASSWORD = "demo1234"

NAMES = [
    "Priya Sharma", "Rohan Gupta", "Sneha Patel", "Aman Verma", "Vikram Malhotra",
    "Ananya Iyer", "Kavita Rao", "Aditya Joshi", "Meera Nambiar", "Rahul Deshmukh",
    "Deepak Nair", "Swati Chawla", "Karan Singhania", "Neha Reddy", "Manish Tiwari",
    "Siddharth Basu", "Divya Menon", "Arjun Bhatia", "Pooja Pillai", "Gaurav Sen", "Ishaan Kapoor"
]

BENEFICIARY_NAMES = [
    ("Rent - Sunview Apartments", "****4812", True),
    ("FiberNet Broadband", "****2209", True),
    ("FreshMart Groceries", "****6701", True),
    ("City Electric & Water", "****1143", True),
    ("Tata Power Utility", "****3391", True),
    ("Airtel Postpaid", "****5520", True),
    ("CloudScale Hosting Services", "****8819", True),
    ("UrbanNest Realty", "****9921", True),
    ("BlueSky Mobile Recharge", "****7712", True),
    ("Zomato Online Foods", "****4431", True),
    ("Swiggy Delivery Partner", "****6652", True),
    ("Apollo Healthcare Clinics", "****1209", True),
    ("MedPlus Pharmaceuticals", "****8834", True),
    ("Ola Cabs Transport", "****9042", True),
    ("MakeMyTrip Travels", "****5123", True),
    ("Decathlon Sports Retail", "****3302", True),
    ("Reliance Digital Electronics", "****7761", True),
    ("QuickCash Transfers", "****9915", False),  # Network risk
    ("CryptoVault Transfers", "****8821", False),  # Context risk / Repeat loss
    ("Apex Digital Escrow", "****4491", False),  # Signature scenario target
    ("Zenith Global Remittance", "****2241", False),
    ("Velocity P2P Exchange", "****9933", False),
    ("FastLoan Settlements", "****6671", False),
    ("Offshore Holdings Ltd", "****1182", False),
]


def _completed_txn(user_id, amount, payee_id=None, days_ago=0, hour=10, decision="ALLOW", risk_score=0.12, status="completed", outcome="neutral"):
    created_at = datetime.now(timezone.utc) - timedelta(days=days_ago)
    created_at = created_at.replace(hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59), microsecond=0)
    return Transaction(
        user_id=user_id,
        session_id=None,
        type="transfer",
        amount=amount,
        payee_id=payee_id,
        risk_score=risk_score,
        decision=decision,
        reasons=["Baseline historical commitment." if decision == "ALLOW" else "Contextual risk signal elevation."],
        status=status,
        outcome=outcome,
        created_at=created_at,
        confirmed_at=created_at + timedelta(seconds=20),
    )


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Clear existing tables for a clean institutional seed
        db.query(Case).delete()
        db.query(Event).delete()
        db.query(Transaction).delete()
        db.query(Payee).delete()
        db.query(UserSession).delete()
        db.query(Device).delete()
        db.query(Account).delete()
        db.query(User).delete()
        db.commit()

        print("Creating baseline devices & network hardware...")
        shared_device = Device(fingerprint_hash="dev-shared-fp-992", ip_address="203.0.113.7", asn="AS7018", geo_country="IN", is_vpn_or_proxy=False)
        vpn_device = Device(fingerprint_hash="dev-vpn-fp-441", ip_address="198.51.100.22", asn="AS16509", geo_country="NL", is_vpn_or_proxy=True)
        normal_device = Device(fingerprint_hash="dev-clean-fp-104", ip_address="122.161.44.12", asn="AS55836", geo_country="IN", is_vpn_or_proxy=False)
        db.add_all([shared_device, vpn_device, normal_device])
        db.flush()

        # 1. Primary Demo User
        demo_user = User(
            name="Demo User",
            email=DEMO_EMAIL,
            password_hash=hash_password(DEMO_PASSWORD),
            calibration_status="active",
            calibrated_txn_count=10,
        )
        db.add(demo_user)
        db.flush()

        demo_account = Account(user_id=demo_user.id, account_type="checking", balance=250000.0)
        db.add(demo_account)
        db.flush()

        demo_session = UserSession(
            user_id=demo_user.id,
            device_id=normal_device.id,
            client_session_id="S-DEMO-001",
            ip_address="122.161.44.12",
            latitude=12.9716,
            longitude=77.5946,
            location_source="gps",
        )
        db.add(demo_session)
        db.flush()

        # Add payees for demo user
        payee_map = {}
        for name, masked, trusted in BENEFICIARY_NAMES:
            p_dev_id = shared_device.id if "QuickCash" in name else (vpn_device.id if "Offshore" in name else None)
            p = Payee(user_id=demo_user.id, name=name, masked_account_number=masked, is_trusted=trusted, device_id=p_dev_id)
            db.add(p)
            db.flush()
            payee_map[name] = p

        # Baseline transactions for Demo User (10 routine transfers: ₹1,800 - ₹3,500)
        baseline_amts = [1900, 2100, 1850, 2400, 2000, 3100, 1950, 2200, 2800, 2050]
        routine_payees = [
            payee_map["Rent - Sunview Apartments"],
            payee_map["FiberNet Broadband"],
            payee_map["FreshMart Groceries"],
            payee_map["City Electric & Water"],
        ]

        for i, amt in enumerate(baseline_amts):
            p = routine_payees[i % len(routine_payees)]
            t = _completed_txn(demo_user.id, amt, payee_id=p.id, days_ago=30 - i * 2, hour=10 + (i % 4), decision="ALLOW", risk_score=0.08)
            t.session_id = demo_session.id
            db.add(t)

        # Context / Repeat loss prior transactions for demo user
        crypto_payee = payee_map["CryptoVault Transfers"]
        for i in range(3):
            t_loss = _completed_txn(demo_user.id, 7000 + i * 500, payee_id=crypto_payee.id, days_ago=12 - i * 3, hour=11, decision="ALLOW", risk_score=0.18, outcome="loss")
            db.add(t_loss)

        # Drift prior same-day transactions (3 small transfers made earlier today)
        for i in range(3):
            t_drift = _completed_txn(demo_user.id, 1800 + i * 100, payee_id=payee_map["Rent - Sunview Apartments"].id, days_ago=0, hour=9 + i, decision="ALLOW", risk_score=0.12)
            db.add(t_drift)

        # Signature scenario target pending commitment: ₹25,000 to Apex Digital Escrow
        sig_payee = payee_map["Apex Digital Escrow"]
        sig_txn = Transaction(
            user_id=demo_user.id,
            session_id=demo_session.id,
            type="transfer",
            amount=25000.0,
            payee_id=sig_payee.id,
            risk_score=0.78,
            decision="STEP-UP",
            reasons=[
                "Transaction amount materially exceeds personal baseline (+4.9σ)",
                "New beneficiary created in current active session",
                "Multiple amount revisions detected prior to confirmation attempt",
                "Repeated pre-commitment review oscillations",
                "Prolonged cursor hesitation over commit action",
            ],
            status="verifying",
            created_at=datetime.now(timezone.utc) - timedelta(minutes=4),
        )
        db.add(sig_txn)
        db.flush()

        # Telemetry events for the signature scenario
        events_spec = [
            ("login", {"channel": "web", "browser": "Chrome"}),
            ("balance_view", {"balance": 250000.0}),
            ("beneficiary_added", {"beneficiary_id": sig_payee.id, "name": sig_payee.name}),
            ("transfer_started", {"payee_id": sig_payee.id}),
            ("amount_entered", {"amount": 20000.0}),
            ("amount_changed", {"old_amount": 20000.0, "new_amount": 25000.0}),
            ("transfer_reviewed", {"review_time_ms": 18400}),
            ("pause_detected", {"duration_ms": 4800}),
            ("confirm_requested", {"hover_ms": 2840, "velocity": 0.32}),
        ]
        now = datetime.now(timezone.utc)
        for idx, (etype, pld) in enumerate(events_spec):
            ev = Event(
                user_id=demo_user.id,
                session_id=demo_session.id,
                transaction_id=sig_txn.id,
                event_type=etype,
                payload=pld,
                created_at=now - timedelta(minutes=10 - idx),
            )
            db.add(ev)

        # Materialize baseline snapshot for Demo User
        demo_user.baseline_snapshot = materialize_baseline_snapshot(db, demo_user.id)
        db.commit()

        # 2. Seed 21 other users with diverse risk profiles to satisfy Section 43
        print("Seeding 21 population users, sessions, and realistic risk distribution...")
        all_created_users = [demo_user]

        for i, name in enumerate(NAMES):
            email = f"user{i+1}@{name.lower().replace(' ', '')}.in"
            is_calib = (i < 3)  # First 3 users are in calibration flow
            u = User(
                name=name,
                email=email,
                password_hash=hash_password("userpass123"),
                calibration_status="calibrating" if is_calib else "active",
                calibrated_txn_count=random.randint(1, 8) if is_calib else 10,
            )
            db.add(u)
            db.flush()
            all_created_users.append(u)

            # Checking account
            acc = Account(user_id=u.id, account_type="checking", balance=random.randint(20000, 350000))
            db.add(acc)

            # Add 2-3 payees
            user_payees = []
            for p_idx in range(random.randint(2, 4)):
                p_spec = BENEFICIARY_NAMES[(i + p_idx) % len(BENEFICIARY_NAMES)]
                p_dev = shared_device.id if "QuickCash" in p_spec[0] else None
                p_item = Payee(user_id=u.id, name=p_spec[0], masked_account_number=p_spec[1], is_trusted=p_spec[2], device_id=p_dev)
                db.add(p_item)
                db.flush()
                user_payees.append(p_item)

            # Generate 2 to 3 sessions per user to achieve 55+ total sessions
            num_sessions = 3 if i < 12 else 2
            for s_idx in range(num_sessions):
                dev = shared_device if ((i + s_idx) % 6 == 0) else (vpn_device if ((i + s_idx) % 8 == 0) else normal_device)
                sess = UserSession(
                    user_id=u.id,
                    device_id=dev.id,
                    client_session_id=f"S-{u.id:04d}-{s_idx}-{random.randint(100, 999)}",
                    ip_address=dev.ip_address,
                    latitude=13.0827 + (i * 0.05),
                    longitude=80.2707 + (i * 0.05),
                    location_source="gps" if (i + s_idx) % 2 == 0 else "ip",
                    started_at=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 15), hours=random.randint(1, 23)),
                )
                db.add(sess)
                db.flush()

                # Seed 1-2 transactions per session
                dice = random.random()
                if dice < 0.70:
                    t_dec, t_status, t_score = "ALLOW", "completed", random.uniform(0.05, 0.25)
                elif dice < 0.85:
                    t_dec, t_status, t_score = "MONITOR", "completed", random.uniform(0.32, 0.48)
                elif dice < 0.95:
                    t_dec, t_status, t_score = "STEP-UP", "verifying", random.uniform(0.52, 0.68)
                elif dice < 0.99:
                    t_dec, t_status, t_score = "HOLD", "held", random.uniform(0.72, 0.84)
                else:
                    t_dec, t_status, t_score = "BLOCK", "blocked", random.uniform(0.88, 0.98)

                chosen_payee = random.choice(user_payees)
                txn_amount = random.randint(1200, 4500) if t_dec == "ALLOW" else random.randint(18000, 65000)

                t_obj = Transaction(
                    user_id=u.id,
                    session_id=sess.id,
                    type="transfer",
                    amount=txn_amount,
                    payee_id=chosen_payee.id,
                    risk_score=t_score,
                    decision=t_dec,
                    reasons=[
                        f"Baseline transaction for {u.name}" if t_dec == "ALLOW" else (
                            f"Elevated amount (₹{txn_amount:,.0f}) compared to historical range" if t_dec in ["MONITOR", "STEP-UP"] else (
                                f"Significant sequence and exposure anomaly flagged by Latchpoint Gate"
                            )
                        )
                    ],
                    status=t_status,
                    created_at=sess.started_at + timedelta(minutes=random.randint(2, 10)),
                    confirmed_at=(sess.started_at + timedelta(minutes=random.randint(3, 12))) if t_status == "completed" else None,
                )
                db.add(t_obj)
                db.flush()

                # Create case if held
                if t_status == "held":
                    db.add(Case(transaction_id=t_obj.id, status="open", analyst_note="Awaiting compliance identity confirmation."))

                # Add 5-7 telemetry events per session to reach 350+ total events
                base_time = sess.started_at
                db.add(Event(user_id=u.id, session_id=sess.id, event_type="login", payload={"ip": dev.ip_address}, created_at=base_time))
                db.add(Event(user_id=u.id, session_id=sess.id, event_type="dashboard_view", payload={}, created_at=base_time + timedelta(seconds=15)))
                db.add(Event(user_id=u.id, session_id=sess.id, event_type="balance_view", payload={"balance": acc.balance}, created_at=base_time + timedelta(seconds=35)))
                db.add(Event(user_id=u.id, session_id=sess.id, event_type="transfer_started", payload={"payee": chosen_payee.name}, created_at=base_time + timedelta(seconds=55)))
                db.add(Event(user_id=u.id, session_id=sess.id, event_type="amount_entered", payload={"amount": txn_amount}, created_at=base_time + timedelta(seconds=80)))

                if t_dec in ["STEP-UP", "HOLD", "BLOCK"]:
                    db.add(Event(user_id=u.id, session_id=sess.id, event_type="pause_detected", payload={"duration_ms": 4200}, created_at=base_time + timedelta(seconds=95)))
                    db.add(Event(user_id=u.id, session_id=sess.id, event_type="amount_changed", payload={"amount": txn_amount}, created_at=base_time + timedelta(seconds=110)))
                    db.add(Event(user_id=u.id, session_id=sess.id, event_type="transfer_reviewed", payload={"iterations": 2}, created_at=base_time + timedelta(seconds=125)))
                else:
                    db.add(Event(user_id=u.id, session_id=sess.id, event_type="transfer_reviewed", payload={"iterations": 1}, created_at=base_time + timedelta(seconds=95)))

                db.add(Event(user_id=u.id, session_id=sess.id, event_type="confirm_requested", payload={"hover_ms": 1950 if t_dec != "ALLOW" else 450}, created_at=base_time + timedelta(seconds=130)))

            if not is_calib:
                u.baseline_snapshot = materialize_baseline_snapshot(db, u.id)

        db.commit()
        print("Database successfully seeded with realistic multi-user risk platform data!")
        print(f"Total Users: {db.query(User).count()}")
        print(f"Total Sessions: {db.query(UserSession).count()}")
        print(f"Total Transactions: {db.query(Transaction).count()}")
        print(f"Total Telemetry Events: {db.query(Event).count()}")
        print(f"Total Beneficiaries: {db.query(Payee).count()}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
