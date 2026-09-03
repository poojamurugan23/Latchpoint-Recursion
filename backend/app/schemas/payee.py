from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PayeeCreate(BaseModel):
    name: str
    masked_account_number: str


class PayeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    masked_account_number: str
    is_trusted: bool
    first_seen_at: datetime


class PayeeTrustUpdate(BaseModel):
    is_trusted: bool
