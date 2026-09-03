from typing import Optional, Any, Union

from pydantic import BaseModel


class EventIn(BaseModel):
    session_id: str
    transaction_id: Optional[int] = None
    event_type: str
    payload: dict[str, Any] = {}


EventBatch = Union[EventIn, list[EventIn]]
