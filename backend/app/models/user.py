from sqlalchemy import CheckConstraint, Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String(20), default="Employee", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=func.now())

    # Relationships
    employee = relationship("Employee", back_populates="user", uselist=False)

    __table_args__ = (
        CheckConstraint("role IN ('Admin', 'Security', 'Employee')", name="ck_users_role"),
    )
