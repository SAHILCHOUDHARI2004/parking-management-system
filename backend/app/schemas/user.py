from pydantic import BaseModel, EmailStr, validator
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

    @validator("password")
    def validate_password(cls, value: str) -> str:
        if len(value) < 12 or not any(char.islower() for char in value) or not any(char.isupper() for char in value) or not any(char.isdigit() for char in value):
            raise ValueError("Password must be at least 12 characters and include upper-case, lower-case, and a number.")
        return value

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

    _validate_new_password = validator("new_password", allow_reuse=True)(UserCreate.validate_password)


