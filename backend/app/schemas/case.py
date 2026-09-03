from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, ConfigDict


class CaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transaction_id: int
    status: str
    outcome: Optional[str] = None
    analyst_note: Optional[str] = None
    resolved_at: Optional[datetime] = None


class CaseResolveRequest(BaseModel):
    outcome: Literal["confirmed_risk", "false_positive"]
    note: Optional[str] = None
