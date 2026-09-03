from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import resolve_session
from app.models.user import User, CALIBRATION_WINDOW
from app.models.account import Account
from app.models.session import UserSession
from app.models.transaction import Transaction
from app.schemas.transaction import (
    PrepareRequest,
    PrepareResponse,
    StepUpVerifyRequest,
    TransactionOut,
)
from app.security import get_current_user
from app.services.feature_engine import materialize_baseline_snapshot

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


def _get_owned_txn(db: Session, txn_id: int, user: User) -> Transaction:
    txn = db.get(Transaction, txn_id)
    if txn is None or txn.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Transaction not found")
    return txn


@router.post("/prepare", response_model=PrepareResponse)
def prepare(
    body: PrepareRequest,
    current_user: User = Depends(get_current_user),
    user_session: UserSession = Depends(resolve_session),
    db: Session = Depends(get_db),
):
    txn = Transaction(
        user_id=current_user.id,
        type=body.type,
        amount=body.amount,
        payee_id=body.payee_id,
        symbol=body.symbol,
        status="draft",
        session_id=user_session.id,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return PrepareResponse(transaction_id=txn.id, status=txn.status)


@router.post("/{transaction_id}/step-up/verify")
def step_up_verify(
    transaction_id: int,
    body: StepUpVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    txn = _get_owned_txn(db, transaction_id, current_user)
    if txn.status != "verifying":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Transaction is not awaiting step-up")

    # Mock OTP: any 6-digit code is accepted for the demo.
    if not (body.otp_code.isdigit() and len(body.otp_code) == 6):
        return {"status": "verifying", "verified": False}

    txn.status = "verified"
    db.commit()
    return _confirm(db, txn)


@router.post("/{transaction_id}/confirm")
def confirm(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    txn = _get_owned_txn(db, transaction_id, current_user)
    if txn.status not in ("allowed", "verified"):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Transaction with status '{txn.status}' cannot be confirmed",
        )
    return _confirm(db, txn)


def _confirm(db: Session, txn: Transaction):
    account = db.query(Account).filter(Account.user_id == txn.user_id).first()
    if account is not None and txn.type == "transfer":
        account.balance -= txn.amount

    txn.status = "completed"
    txn.confirmed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(txn)

    user = db.get(User, txn.user_id)
    completed_calibration = False
    if user is not None and user.calibration_status == "calibrating":
        user.calibrated_txn_count += 1
        if user.calibrated_txn_count >= CALIBRATION_WINDOW:
            user.calibration_status = "active"
            user.baseline_snapshot = materialize_baseline_snapshot(db, user.id)
            completed_calibration = True
        db.commit()

    return {
        "status": txn.status,
        "confirmed_at": txn.confirmed_at,
        "completed_calibration": completed_calibration,
    }


@router.post("/{transaction_id}/cancel")
def cancel(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    txn = _get_owned_txn(db, transaction_id, current_user)
    txn.status = "cancelled"
    db.commit()
    return {"status": txn.status}


@router.get("/{transaction_id}", response_model=TransactionOut)
def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_owned_txn(db, transaction_id, current_user)


@router.get("", response_model=list[TransactionOut])
def list_transactions(
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if status_filter:
        query = query.filter(Transaction.status == status_filter)
    return (
        query.order_by(Transaction.created_at.desc()).offset(offset).limit(limit).all()
    )
