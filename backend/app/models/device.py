from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    fingerprint_hash = Column(String, index=True, nullable=False)
    ip_address = Column(String, nullable=True)
    asn = Column(String, nullable=True)
    geo_country = Column(String, nullable=True)
    is_vpn_or_proxy = Column(Boolean, nullable=False, default=False)
    first_seen_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
