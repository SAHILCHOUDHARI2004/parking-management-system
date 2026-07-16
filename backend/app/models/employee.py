from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    department = Column(String, nullable=True)
    vehicle_number = Column(String, nullable=False)
    vehicle_type = Column(String(30), nullable=False)
    contact_details = Column(String, nullable=True)
    aadhaar_number = Column(String, unique=True, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True)

    # Relationships
    user = relationship("User", back_populates="employee")
    bookings = relationship("Booking", back_populates="employee")
