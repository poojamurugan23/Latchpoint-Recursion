from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.case import Case
from app.schemas.kpi import KpiSummary, DecisionsByType
from app.security import get_current_user

router = APIRouter(prefix="/api/kpi", tags=["kpi"])


@router.get("/summary", response_model=KpiSummary)
def summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    txns = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    evaluated = [t for t in txns if t.decision is not None]

    now = datetime.now(timezone.utc)
    lead_times = []
    for t in evaluated:
        end = t.confirmed_at or now
        created = t.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        lead_times.append((end - created).total_seconds())
    detection_lead_time_avg_sec = sum(lead_times) / len(lead_times) if lead_times else 0.0

    challenged = [t for t in evaluated if t.decision in ("VERIFY", "HOLD", "BLOCK")]
    case_ids = [t.id for t in challenged]
    cases = (
        db.query(Case).filter(Case.transaction_id.in_(case_ids)).all() if case_ids else []
    )
    resolved_cases = [c for c in cases if c.status == "resolved"]
    false_positives = [c for c in resolved_cases if c.outcome == "false_positive"]
    confirmed_risks = [c for c in resolved_cases if c.outcome == "confirmed_risk"]

    false_challenge_rate = len(false_positives) / len(challenged) if challenged else 0.0
    intervention_accuracy = (
        len(confirmed_risks) / len(resolved_cases) if resolved_cases else 0.0
    )

    total_prevented_exposure = sum(
        t.amount
        for t in evaluated
        if t.decision in ("HOLD", "BLOCK") and t.status != "completed"
    )

    decisions_by_type = DecisionsByType(
        ALLOW=sum(1 for t in evaluated if t.decision == "ALLOW"),
        VERIFY=sum(1 for t in evaluated if t.decision == "VERIFY"),
        HOLD=sum(1 for t in evaluated if t.decision == "HOLD"),
        BLOCK=sum(1 for t in evaluated if t.decision == "BLOCK"),
    )

    return KpiSummary(
        detection_lead_time_avg_sec=detection_lead_time_avg_sec,
        false_challenge_rate=false_challenge_rate,
        intervention_accuracy=intervention_accuracy,
        total_prevented_exposure=total_prevented_exposure,
        decisions_by_type=decisions_by_type,
    )
