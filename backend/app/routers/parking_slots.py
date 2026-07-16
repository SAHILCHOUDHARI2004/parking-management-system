from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.dependencies import get_db, require_admin, require_employee, require_security
from app.models.parking_slot import ParkingSlot
from app.models.booking import Booking, BookingStatus
from app.schemas.parking_slot import ParkingSlotCreate, ParkingSlotOut, ParkingSlotUpdate, ParkingSlotPaginated

router = APIRouter(prefix="/api/parking-slots", tags=["Parking Slots"])

class ParkingSlotBulkImport(BaseModel):
    slots: list[ParkingSlotCreate]

@router.get("", response_model=ParkingSlotPaginated)
def read_parking_slots(
    page: Optional[int] = Query(None, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    basement: Optional[str] = None,
    status_filter: Optional[str] = None,
    vehicle_type: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("slot_number", regex="^(id|slot_number|basement|vehicle_type|status)$"),
    sort_order: str = Query("asc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user = Depends(require_employee)
):
    query = db.query(ParkingSlot)
    if basement:
        query = query.filter(ParkingSlot.basement == basement)
    if status_filter:
        query = query.filter(ParkingSlot.status == status_filter)
    if vehicle_type:
        query = query.filter(ParkingSlot.vehicle_type == vehicle_type)
        
    if search:
        search_val = f"%{search}%"
        query = query.filter(
            (ParkingSlot.slot_number.ilike(search_val)) |
            (ParkingSlot.basement.ilike(search_val)) |
            (ParkingSlot.camera_number.ilike(search_val)) |
            (ParkingSlot.puzzle_number.ilike(search_val)) |
            (ParkingSlot.height.ilike(search_val)) |
            (ParkingSlot.parking_type.ilike(search_val)) |
            (ParkingSlot.allocation_type.ilike(search_val))
        )
        
    # Stable sorting
    sort_attr = {"id": ParkingSlot.id, "slot_number": ParkingSlot.slot_number, "basement": ParkingSlot.basement, "vehicle_type": ParkingSlot.vehicle_type, "status": ParkingSlot.status}[sort_by]
    if sort_order == "desc":
        query = query.order_by(sort_attr.desc(), ParkingSlot.id.desc())
    else:
        query = query.order_by(sort_attr.asc(), ParkingSlot.id.asc())
        
    total = query.count()
    
    if page is not None:
        query = query.offset((page - 1) * page_size).limit(page_size)
        
    return {"items": query.all(), "total": total}


@router.post("", response_model=ParkingSlotOut, status_code=status.HTTP_201_CREATED)
def create_parking_slot(
    slot_in: ParkingSlotCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    # Check if slot_number already exists
    existing = db.query(ParkingSlot).filter(ParkingSlot.slot_number == slot_in.slot_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Slot number {slot_in.slot_number} already exists"
        )
    
    new_slot = ParkingSlot(**slot_in.dict())
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    return new_slot

@router.post("/bulk-import", status_code=status.HTTP_201_CREATED)
def bulk_import_parking_slots(payload: ParkingSlotBulkImport, db: Session = Depends(get_db), current_user = Depends(require_admin)):
    created = updated = 0
    try:
        for slot_in in payload.slots:
            slot = db.query(ParkingSlot).filter(ParkingSlot.slot_number == slot_in.slot_number).first()
            if slot:
                for field, value in slot_in.dict(exclude={"status"}).items():
                    setattr(slot, field, value)
                updated += 1
            else:
                db.add(ParkingSlot(**slot_in.dict()))
                created += 1
        db.commit()
    except Exception:
        db.rollback()
        raise
    return {"created": created, "updated": updated, "total": len(payload.slots)}

@router.get("/{slot_id}", response_model=ParkingSlotOut)
def read_parking_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_employee)
):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Parking slot not found")
    return slot

@router.put("/{slot_id}", response_model=ParkingSlotOut)
def update_parking_slot(
    slot_id: int,
    slot_in: ParkingSlotUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_security)
):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Parking slot not found")
        
    update_data = slot_in.dict(exclude_unset=True)
    if "status" in update_data and update_data["status"] != slot.status:
        if current_user.role != "Admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can change a slot's availability status.")
        active_booking = db.query(Booking).filter(Booking.parking_slot_id == slot.id, Booking.status.in_([BookingStatus.BOOKED, BookingStatus.ENTERED])).first()
        if active_booking:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A slot with an active booking cannot be moved to maintenance or made available manually.")
    for field, value in update_data.items():
        setattr(slot, field, value)
        
    db.commit()
    db.refresh(slot)
    return slot

@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_parking_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Parking slot not found")
    if db.query(Booking).filter(Booking.parking_slot_id == slot.id).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Parking slots with booking history cannot be deleted. Mark the slot as Maintenance instead.")
    db.delete(slot)
    db.commit()
    return None
