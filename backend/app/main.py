from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import Base, engine, SessionLocal
from app import models  # noqa: F401 - ensures all models are registered on Base
from app.rate_limit import limiter
from app.routers import auth, users, payees, transactions, events, risk, cases, kpi
from app.error_handling import register_exception_handlers

app = FastAPI(title="Latchpoint")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    from app.services.risk_model import load_model

    load_model()


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(payees.router)
app.include_router(transactions.router)
app.include_router(events.router)
app.include_router(risk.router)
app.include_router(cases.router)
app.include_router(kpi.router)


@app.get("/api/health")
def health():
    model_loaded = True
    try:
        from app.services import risk_model

        model_loaded = risk_model._model is not None
        if not model_loaded:
            risk_model.load_model()
            model_loaded = True
    except Exception:
        model_loaded = False

    db_connected = True
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception:
        db_connected = False

    healthy = model_loaded and db_connected
    return {
        "status": "ok" if healthy else "degraded",
        "model_loaded": model_loaded,
        "db_connected": db_connected,
    }
