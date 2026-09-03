from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import resolve_session
from app.models.user import User
from app.models.session import UserSession
from app.models.case import Case
from app.schemas.risk import RiskEvaluationResponse
from app.security import get_current_user
from app.services import feature_engine, risk_model, explanation, decision_engine
from app.routers.transactions import _get_owned_txn

router = APIRouter(prefix="/api/risk", tags=["risk"])


@router.post("/evaluate/{transaction_id}", response_model=RiskEvaluationResponse)
def evaluate(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    user_session: UserSession = Depends(resolve_session),
    db: Session = Depends(get_db),
):
    txn = _get_owned_txn(db, transaction_id, current_user)
    if txn.status != "draft":
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, f"Transaction with status '{txn.status}' cannot be evaluated"
        )

    context = feature_engine.build_commitment_context(db, current_user.id, txn, user_session)
    risk_score, shap_by_feature = risk_model.score(context["features"])

    explain_ctx = {**context["features"], "mean_amount": context["mean_amount"]}
    reasons, top_features = explanation.explain(shap_by_feature, explain_ctx)

    decision = decision_engine.decide(risk_score, context)
    new_status = decision_engine.STATUS_FOR_DECISION[decision]

    txn.risk_score = risk_score
    txn.decision = decision
    txn.reasons = reasons
    txn.top_features = top_features
    txn.status = new_status
    db.commit()

    if decision == "HOLD":
        db.add(Case(transaction_id=txn.id, status="open"))
        db.commit()

    return RiskEvaluationResponse(
        transaction_id=txn.id,
        risk_score=risk_score,
        decision=decision,
        reasons=reasons,
        top_features=top_features,
        baseline_confidence=context["baseline_confidence"],
    )
