from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.schemas.user import UserOut

class AuditLogOut(BaseModel):
    id: int
    booking_id: Optional[int] = None
    action: str
    performed_by_id: Optional[int] = None
    timestamp: datetime
    details: Optional[str] = None
    performed_by: Optional[UserOut] = None

    class Config:
        orm_mode = True

class AuditLogPaginated(BaseModel):
    items: list[AuditLogOut]
    total: int
