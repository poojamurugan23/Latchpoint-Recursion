from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime, func
from sqlalchemy.orm import relationship

from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    event_type = Column(String, nullable=False)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="events")
    session = relationship("UserSession")
    transaction = relationship("Transaction", back_populates="events")
