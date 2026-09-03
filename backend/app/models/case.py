from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship

from app.database import Base


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    status = Column(Enum("open", "resolved", name="case_status"), default="open")
    outcome = Column(
        Enum("confirmed_risk", "false_positive", name="case_outcome"), nullable=True
    )
    analyst_note = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    transaction = relationship("Transaction", back_populates="case")
