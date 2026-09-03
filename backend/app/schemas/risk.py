from typing import Optional

from pydantic import BaseModel


class TopFeature(BaseModel):
    feature: str
    shap_value: float


class CalibrationProgress(BaseModel):
    current: int
    total: int


class RiskEvaluationResponse(BaseModel):
    transaction_id: int
    calibrating: bool = False
    calibration_progress: Optional[CalibrationProgress] = None
    will_complete_calibration: bool = False
    risk_score: Optional[float] = None
    decision: Optional[str] = None
    reasons: list[str] = []
    top_features: list[TopFeature] = []
    baseline_confidence: Optional[str] = None
