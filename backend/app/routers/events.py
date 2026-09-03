from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import resolve_session
from app.models.user import User
from app.models.session import UserSession
from app.models.event import Event
from app.schemas.event import EventBatch, EventIn
from app.security import get_current_user

router = APIRouter(prefix="/api/events", tags=["events"])


@router.post("", status_code=status.HTTP_202_ACCEPTED)
def post_events(
    body: EventBatch,
    current_user: User = Depends(get_current_user),
    user_session: UserSession = Depends(resolve_session),
    db: Session = Depends(get_db),
):
    items: list[EventIn] = body if isinstance(body, list) else [body]

    for item in items:
        db.add(
            Event(
                user_id=current_user.id,
                session_id=user_session.id,
                transaction_id=item.transaction_id,
                event_type=item.event_type,
                payload=item.payload,
            )
        )
    db.commit()
    return None
