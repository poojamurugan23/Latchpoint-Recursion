from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    ForeignKey,
    Enum,
    JSON,
    DateTime,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum("transfer", "trade", name="transaction_type"), nullable=False)

    amount = Column(Float, nullable=False)
    payee_id = Column(Integer, ForeignKey("payees.id"), nullable=True)
    symbol = Column(String, nullable=True)

    status = Column(
        Enum(
            "draft",
            "allowed",
            "verifying",
            "verified",
            "held",
            "blocked",
            "completed",
            "cancelled",
            name="transaction_status",
        ),
        nullable=False,
        default="draft",
    )
    decision = Column(
        Enum("ALLOW", "MONITOR", "STEP-UP", "VERIFY", "HOLD", "BLOCK", name="transaction_decision"),
        nullable=True,
    )
    risk_score = Column(Float, nullable=True)
    reasons = Column(JSON, nullable=True)  # list[str]
    top_features = Column(JSON, nullable=True)  # list[{feature, shap_value}]

    outcome = Column(
        Enum("profit", "loss", "neutral", name="transaction_outcome"), nullable=True
    )

    # Links a live evaluation back to the browser session that produced the
    # sequence-of-events signals (pause/edit/back-navigation counts) for it.
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    confirmed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="transactions")
    payee = relationship("Payee", back_populates="transactions")
    events = relationship("Event", back_populates="transaction")
    case = relationship("Case", back_populates="transaction", uselist=False)
