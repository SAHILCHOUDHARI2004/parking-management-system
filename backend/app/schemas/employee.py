from pydantic import BaseModel
from typing import Optional

class EmployeeBase(BaseModel):
    employee_id: str
    name: str
    department: Optional[str] = None
    vehicle_number: str
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
    contact_details: Optional[str] = None
    aadhaar_number: Optional[str] = None
    user_id: Optional[int] = None

class EmployeeOut(EmployeeBase):
    id: int

    class Config:
        orm_mode = True
