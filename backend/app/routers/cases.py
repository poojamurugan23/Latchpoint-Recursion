from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.case import Case
from app.models.transaction import Transaction
from app.schemas.case import CaseOut, CaseResolveRequest
from app.security import get_current_user

router = APIRouter(prefix="/api/cases", tags=["cases"])


@router.get("", response_model=list[CaseOut])
def list_open_cases(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return (
        db.query(Case)
        .join(Transaction, Case.transaction_id == Transaction.id)
        .filter(Transaction.user_id == current_user.id, Case.status == "open")
        .all()
    )


@router.post("/{case_id}/resolve", response_model=CaseOut)
def resolve_case(
    case_id: int,
    body: CaseResolveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    case = (
        db.query(Case)
        .join(Transaction, Case.transaction_id == Transaction.id)
        .filter(Case.id == case_id, Transaction.user_id == current_user.id)
        .first()
    )
    if case is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Case not found")

    case.status = "resolved"
    case.outcome = body.outcome
    case.analyst_note = body.note
    case.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(case)
    return case
