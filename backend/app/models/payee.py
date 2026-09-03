from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.database import Base


class Payee(Base):
    __tablename__ = "payees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    masked_account_number = Column(String, nullable=False)
    is_trusted = Column(Boolean, nullable=False, default=False)
    first_seen_at = Column(DateTime(timezone=True), server_default=func.now())

    # Bridges §11's "payee shares a device fingerprint with other payees" network
    # scenario — a payee is linked to the device it's most commonly paid from.
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)

    user = relationship("User", back_populates="payees")
    device = relationship("Device")
    transactions = relationship("Transaction", back_populates="payee")
