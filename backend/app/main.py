from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app import models  # noqa: F401 - ensures all models are registered on Base
from app.routers import auth, users, payees, transactions, events, risk, cases, kpi

app = FastAPI(title="Latchpoint")

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
    return {"status": "ok"}
