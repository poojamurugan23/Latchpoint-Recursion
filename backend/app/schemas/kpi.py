from pydantic import BaseModel


class DecisionsByType(BaseModel):
    ALLOW: int = 0
    VERIFY: int = 0
    HOLD: int = 0
    BLOCK: int = 0


class KpiSummary(BaseModel):
    detection_lead_time_avg_sec: float
    false_challenge_rate: float
    intervention_accuracy: float
    total_prevented_exposure: float
    decisions_by_type: DecisionsByType
