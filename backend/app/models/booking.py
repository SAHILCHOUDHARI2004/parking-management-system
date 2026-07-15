import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, Enum, Index, text
from sqlalchemy.orm import relationship
from app.database import Base

class BookingStatus(str, enum.Enum):
    BOOKED = "Booked"
    ENTERED = "Entered"
    EXITED = "Exited"
    CANCELLED = "Cancelled"

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    parking_slot_id = Column(Integer, ForeignKey("parking_slots.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(BookingStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]), default=BookingStatus.BOOKED, nullable=False)

    check_in_time = Column(DateTime(timezone=True), nullable=True)
    check_out_time = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())

    # Relationships
    employee = relationship("Employee", back_populates="bookings")
    parking_slot = relationship("ParkingSlot", back_populates="bookings")

    # Partial unique index to enforce at most one active booking per employee
    __table_args__ = (
        Index(
            "ix_bookings_active_employee",
            "employee_id",
            unique=True,
            postgresql_where=text("status IN ('Booked', 'Entered')")
        ),
    )

