from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, ConfigDict


class PrepareRequest(BaseModel):
    type: Literal["transfer", "trade"]
    amount: float
    payee_id: Optional[int] = None
    symbol: Optional[str] = None


class PrepareResponse(BaseModel):
    transaction_id: int
    status: str


class StepUpVerifyRequest(BaseModel):
    otp_code: str


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    amount: float
    payee_id: Optional[int] = None
    symbol: Optional[str] = None
    status: str
    decision: Optional[str] = None
    risk_score: Optional[float] = None
    reasons: Optional[list[str]] = None
    top_features: Optional[list[dict]] = None
    outcome: Optional[str] = None
    created_at: datetime
    confirmed_at: Optional[datetime] = None
