"""Stub for the retraining loop described in spec §8.6. Not automated for
this MVP — `export_case_labels` shows how resolved Case outcomes would be
turned into additional labeled rows for `generate_synthetic_data.py`'s CSV,
to be periodically appended and fed back into `train_model.py`."""

from sqlalchemy.orm import Session

from app.models.case import Case
from app.models.transaction import Transaction
from app.services import feature_engine


def export_case_labels(db: Session) -> list[dict]:
    resolved = db.query(Case).filter(Case.status == "resolved").all()
    rows = []
    for case in resolved:
        txn = db.get(Transaction, case.transaction_id)
        if txn is None:
            continue
        context = feature_engine.build_commitment_context(db, txn.user_id, txn, None)
        row = dict(context["features"])
        row["label"] = 1 if case.outcome == "confirmed_risk" else 0
        rows.append(row)
    return rows
