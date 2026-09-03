"""Resolves the current browser session (and its device) from request
headers. The frontend attaches these on every call (see api/client.js):
X-Session-Id (client-generated UUID, in-memory only) and
X-Device-Fingerprint (hash of userAgent+screen+timezone)."""

from fastapi import Depends, Header, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.session import UserSession
from app.security import get_current_user
from app.services.identity_device import upsert_device


def resolve_session(
    request: Request,
    x_session_id: str | None = Header(default=None),
    x_device_fingerprint: str | None = Header(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserSession:
    if not x_session_id:
        x_session_id = f"anon-{current_user.id}"

    client_host = request.client.host if request.client else "127.0.0.1"

    device_id = None
    if x_device_fingerprint:
        device = upsert_device(
            db, x_device_fingerprint, client_host, user_id=current_user.id
        )
        device_id = device.id

    user_session = (
        db.query(UserSession)
        .filter(UserSession.client_session_id == x_session_id)
        .first()
    )
    if user_session is None:
        user_session = UserSession(
            user_id=current_user.id,
            device_id=device_id,
            client_session_id=x_session_id,
        )
        db.add(user_session)
        db.flush()
    elif device_id is not None:
        user_session.device_id = device_id

    db.commit()
    db.refresh(user_session)
    return user_session
