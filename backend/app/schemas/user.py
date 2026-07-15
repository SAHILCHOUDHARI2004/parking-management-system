from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from app.schemas.employee import EmployeeOut

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: Optional[str] = "Employee"
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserOut(UserBase):
    id: int
    created_at: datetime
    employee: Optional[EmployeeOut] = None

    class Config:
        orm_mode = True

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


