from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.account import Account
from app.schemas.user import UserOut
from app.security import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.user_id == current_user.id).first()
    return UserOut(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        created_at=current_user.created_at,
        balance=account.balance if account else 0.0,
    )
