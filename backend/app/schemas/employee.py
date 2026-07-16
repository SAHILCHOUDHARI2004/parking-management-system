from pydantic import BaseModel, Field
from typing import Optional

class EmployeeBase(BaseModel):
    employee_id: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=120)
    department: Optional[str] = None
    vehicle_number: str = Field(..., min_length=1, max_length=30)
    vehicle_type: str = Field(..., min_length=1, max_length=30)
    contact_details: Optional[str] = None
    aadhaar_number: Optional[str] = None
    user_id: Optional[int] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    employee_id: Optional[str] = None
    name: Optional[str] = None
    department: Optional[str] = None
    vehicle_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    contact_details: Optional[str] = None
    aadhaar_number: Optional[str] = None
    user_id: Optional[int] = None

class EmployeeOut(EmployeeBase):
    id: int

    class Config:
        orm_mode = True
