from pydantic import BaseModel
from typing import Optional
from app.models.parking_slot import SlotStatus

class ParkingSlotBase(BaseModel):
    basement: str
    slot_number: str
    vehicle_type: Optional[str] = "Car"
    parking_type: Optional[str] = "Employee"
    allocation_type: Optional[str] = "Employee"
    camera_number: Optional[str] = None
    puzzle_number: Optional[str] = None
    height: Optional[str] = None
    status: Optional[SlotStatus] = SlotStatus.AVAILABLE

class ParkingSlotCreate(ParkingSlotBase):
    pass

class ParkingSlotUpdate(BaseModel):
    basement: Optional[str] = None
    slot_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    parking_type: Optional[str] = None
    allocation_type: Optional[str] = None
    camera_number: Optional[str] = None
    puzzle_number: Optional[str] = None
    height: Optional[str] = None
    status: Optional[SlotStatus] = None


class ParkingSlotOut(ParkingSlotBase):
    id: int

    class Config:
        orm_mode = True

class ParkingSlotPaginated(BaseModel):
    items: list[ParkingSlotOut]
    total: int

