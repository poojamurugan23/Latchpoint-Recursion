from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.account import Account
from app.rate_limit import limiter
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_out(user: User, db: Session) -> dict:
    account = db.query(Account).filter(Account.user_id == user.id).first()
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "created_at": user.created_at,
        "balance": account.balance if account else 0.0,
        "calibration_status": user.calibration_status,
        "calibrated_txn_count": user.calibrated_txn_count,
        "baseline_snapshot": user.baseline_snapshot,
    }


@router.post("/register", response_model=TokenResponse)
@limiter.limit("10/minute")
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")

    user = User(
        name=body.name, email=body.email, password_hash=hash_password(body.password)
    )
    db.add(user)
    db.flush()

    account = Account(user_id=user.id, balance=250000.0, account_type="checking")
    db.add(account)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(token=token, user=_user_out(user, db))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    token = create_access_token(user.id)
    return TokenResponse(token=token, user=_user_out(user, db))
