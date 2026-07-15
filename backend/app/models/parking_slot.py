import enum
from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.orm import relationship
from app.database import Base

class SlotStatus(str, enum.Enum):
    AVAILABLE = "Available"
    RESERVED = "Reserved"
    ALLOCATED = "Allocated"
    MAINTENANCE = "Maintenance"

class ParkingSlot(Base):
    __tablename__ = "parking_slots"

    id = Column(Integer, primary_key=True, index=True)
    basement = Column(String, nullable=False)
    slot_number = Column(String, unique=True, index=True, nullable=False)
    vehicle_type = Column(String, default="Car")  # Car, Bike, EV, etc.
    parking_type = Column(String, default="Employee")
    allocation_type = Column(String, default="Employee")
    camera_number = Column(String, nullable=True)
    puzzle_number = Column(String, nullable=True)
    height = Column(String, nullable=True)
    status = Column(Enum(SlotStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]), default=SlotStatus.AVAILABLE, nullable=False)


    # Relationships
    bookings = relationship("Booking", back_populates="parking_slot", cascade="all, delete-orphan")

