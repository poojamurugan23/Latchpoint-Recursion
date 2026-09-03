from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    accounts = relationship("Account", back_populates="user")
    payees = relationship("Payee", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    sessions = relationship("UserSession", back_populates="user")
    events = relationship("Event", back_populates="user")
