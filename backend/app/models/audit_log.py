from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False) # e.g. "Create", "Cancel", "Entry", "Exit"
    performed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    details = Column(String, nullable=True)

    # Relationships
    booking = relationship("Booking")
    performed_by = relationship("User")
