import json
import time

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import resolve_session
from app.models.user import User, CALIBRATION_WINDOW
from app.models.session import UserSession
from app.models.transaction import Transaction
from app.models.case import Case
from app.schemas.risk import RiskEvaluationResponse
from app.security import get_current_user
from app.services import feature_engine, risk_model, explanation, decision_engine
from app.routers.transactions import _get_owned_txn
from app.logging_config import get_logger

router = APIRouter(prefix="/api/risk", tags=["risk"])
logger = get_logger(__name__)


def _load_draft_txn(db: Session, transaction_id: int, current_user: User) -> Transaction:
    txn = _get_owned_txn(db, transaction_id, current_user)
    if txn.status != "draft":
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, f"Transaction with status '{txn.status}' cannot be evaluated"
        )
    return txn


def _calibration_response(db: Session, current_user: User, txn: Transaction) -> RiskEvaluationResponse:
    """During calibration there is no personal pattern to evaluate against yet
    — the transaction is allowed through as genuine usage (Phase 3 §1.2), and
    the UI shows a calibration banner instead of a risk verdict."""
    txn.status = "allowed"
    db.commit()

    progress_current = current_user.calibrated_txn_count + 1
    return RiskEvaluationResponse(
        transaction_id=txn.id,
        calibrating=True,
        calibration_progress={"current": progress_current, "total": CALIBRATION_WINDOW},
        will_complete_calibration=progress_current >= CALIBRATION_WINDOW,
    )


def _evaluate_and_persist(db: Session, current_user: User, user_session: UserSession, txn: Transaction) -> dict:
    start = time.monotonic()
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

    logger.info(
        "risk_evaluated",
        transaction_id=txn.id,
        decision=decision,
        risk_score=round(risk_score, 4),
        latency_ms=round((time.monotonic() - start) * 1000, 1),
    )

    return {
        "transaction_id": txn.id,
        "risk_score": risk_score,
        "decision": decision,
        "reasons": reasons,
        "top_features": top_features,
        "baseline_confidence": context["baseline_confidence"],
    }


@router.post("/evaluate/{transaction_id}", response_model=RiskEvaluationResponse)
def evaluate(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    user_session: UserSession = Depends(resolve_session),
    db: Session = Depends(get_db),
):
    txn = _load_draft_txn(db, transaction_id, current_user)

    if current_user.calibration_status == "calibrating":
        return _calibration_response(db, current_user, txn)

    result = _evaluate_and_persist(db, current_user, user_session, txn)
    return RiskEvaluationResponse(**result)


@router.get("/evaluate-stream/{transaction_id}")
def evaluate_stream(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    user_session: UserSession = Depends(resolve_session),
    db: Session = Depends(get_db),
):
    """SSE version of /evaluate — emits one `stage` event per CommitmentContext
    block as it's actually computed (Phase 3 §4), then a final `verdict`
    event. Real summaries pulled from the real sub-computation; no artificial
    delay is added between them."""
    txn = _load_draft_txn(db, transaction_id, current_user)

    def sse(event: str, data: dict) -> str:
        return f"event: {event}\ndata: {json.dumps(data)}\n\n"

    def stream():
        if current_user.calibration_status == "calibrating":
            result = _calibration_response(db, current_user, txn)
            yield sse("verdict", result.model_dump())
            return

        builder = feature_engine.CommitmentContextBuilder(db, current_user.id, txn, user_session)
        stages = [
            ("baseline", builder.stage_baseline),
            ("sequence", builder.stage_sequence),
            ("network", builder.stage_network),
            ("context", builder.stage_context),
            ("behavioral", builder.stage_behavioral),
        ]
        features: dict = {}
        for name, stage_fn in stages:
            stage_features, summary = stage_fn()
            features.update(stage_features)
            yield sse("stage", {"stage": name, "status": "done", "summary": summary})

        context = {
            "features": features,
            "baseline_confidence": builder.baseline_confidence,
            "mean_amount": builder.mean_amount,
            "payee_id": builder.payee_id,
        }
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

        logger.info("risk_evaluated_stream", transaction_id=txn.id, decision=decision, risk_score=round(risk_score, 4))

        verdict = RiskEvaluationResponse(
            transaction_id=txn.id,
            risk_score=risk_score,
            decision=decision,
            reasons=reasons,
            top_features=top_features,
            baseline_confidence=context["baseline_confidence"],
        )
        yield sse("verdict", verdict.model_dump())

    return StreamingResponse(stream(), media_type="text/event-stream")
