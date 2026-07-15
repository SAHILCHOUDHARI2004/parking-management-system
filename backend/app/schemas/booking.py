from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.schemas.employee import EmployeeOut
from app.schemas.parking_slot import ParkingSlotOut
from app.models.booking import BookingStatus

class BookingBase(BaseModel):
    employee_id: int
    parking_slot_id: int
    status: Optional[BookingStatus] = BookingStatus.BOOKED

class BookingCreate(BaseModel):
    employee_id: int
    parking_slot_id: int

class BookingUpdate(BaseModel):
    status: Optional[BookingStatus] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None

class BookingOut(BookingBase):
    id: int
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    created_at: datetime

    class Config:
        orm_mode = True

class BookingDetailOut(BaseModel):
    id: int
    status: BookingStatus
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    created_at: datetime
    employee: EmployeeOut
    parking_slot: ParkingSlotOut

    class Config:
        orm_mode = True

class BookingPaginated(BaseModel):
    items: list[BookingDetailOut]
    total: int


