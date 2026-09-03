from pydantic import BaseModel


class TopFeature(BaseModel):
    feature: str
    shap_value: float


class RiskEvaluationResponse(BaseModel):
    transaction_id: int
    risk_score: float
    decision: str
    reasons: list[str]
    top_features: list[TopFeature]
    baseline_confidence: str
