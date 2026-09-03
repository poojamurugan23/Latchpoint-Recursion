from sqlalchemy import Column, Integer, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.database import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    balance = Column(Float, nullable=False, default=0.0)
    account_type = Column(
        Enum("checking", "trading", name="account_type"),
        nullable=False,
        default="checking",
    )

    user = relationship("User", back_populates="accounts")
