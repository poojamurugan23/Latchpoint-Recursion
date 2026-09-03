from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.payee import Payee
from app.schemas.payee import PayeeCreate, PayeeOut, PayeeTrustUpdate
from app.security import get_current_user

router = APIRouter(prefix="/api/payees", tags=["payees"])


@router.get("", response_model=list[PayeeOut])
def list_payees(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Payee).filter(Payee.user_id == current_user.id).all()


@router.post("", response_model=PayeeOut)
def create_payee(
    body: PayeeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payee = Payee(
        user_id=current_user.id,
        name=body.name,
        masked_account_number=body.masked_account_number,
    )
    db.add(payee)
    db.commit()
    db.refresh(payee)
    return payee


@router.patch("/{payee_id}", response_model=PayeeOut)
def update_payee_trust(
    payee_id: int,
    body: PayeeTrustUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payee = (
        db.query(Payee)
        .filter(Payee.id == payee_id, Payee.user_id == current_user.id)
        .first()
    )
    if not payee:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payee not found")
    payee.is_trusted = body.is_trusted
    db.commit()
    db.refresh(payee)
    return payee
