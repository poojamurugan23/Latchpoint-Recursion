from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    created_at: datetime
    balance: float = 0.0
    calibration_status: str = "calibrating"
    calibrated_txn_count: int = 0
    baseline_snapshot: Optional[dict] = None
