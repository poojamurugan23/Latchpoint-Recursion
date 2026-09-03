from sqlalchemy import Column, Integer, String, DateTime, JSON, Enum, func
from sqlalchemy.orm import relationship

from app.database import Base

CALIBRATION_WINDOW = 10


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    calibration_status = Column(
        Enum("calibrating", "active", name="calibration_status"),
        nullable=False,
        default="calibrating",
    )
    calibrated_txn_count = Column(Integer, nullable=False, default=0)
    baseline_snapshot = Column(JSON, nullable=True)

    accounts = relationship("Account", back_populates="user")
    payees = relationship("Payee", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    sessions = relationship("UserSession", back_populates="user")
    events = relationship("Event", back_populates="user")
