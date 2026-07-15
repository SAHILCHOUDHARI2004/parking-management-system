from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_security
from app.models.parking_slot import ParkingSlot, SlotStatus
from app.models.employee import Employee
from app.models.booking import Booking, BookingStatus

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user = Depends(require_security)
):
    # Slots summary
    total_slots = db.query(ParkingSlot).count()
    available_slots = db.query(ParkingSlot).filter(ParkingSlot.status == SlotStatus.AVAILABLE).count()
    reserved_slots = db.query(ParkingSlot).filter(ParkingSlot.status == SlotStatus.RESERVED).count()
    allocated_slots = db.query(ParkingSlot).filter(ParkingSlot.status == SlotStatus.ALLOCATED).count()

    # Employee summary
    total_employees = db.query(Employee).count()

    # Bookings summary
    total_bookings = db.query(Booking).count()
    active_bookings = db.query(Booking).filter(Booking.status.in_([BookingStatus.BOOKED, BookingStatus.ENTERED])).count()
    completed_bookings = db.query(Booking).filter(Booking.status == BookingStatus.EXITED).count()
    cancelled_bookings = db.query(Booking).filter(Booking.status == BookingStatus.CANCELLED).count()

    # Slot availability by vehicle type
    type_availability = {}
    slots_by_type = db.query(
        ParkingSlot.vehicle_type,
        func.count(ParkingSlot.id)
    ).group_by(ParkingSlot.vehicle_type).all()
    
    for v_type, total in slots_by_type:
        avail = db.query(ParkingSlot).filter(
            ParkingSlot.vehicle_type == v_type,
            ParkingSlot.status == SlotStatus.AVAILABLE
        ).count()
        type_availability[v_type] = {
            "total": total,
            "available": avail,
            "allocated": total - avail
        }

    return {
        "slots": {
            "total": total_slots,
            "available": available_slots,
            "reserved": reserved_slots,
            "allocated": allocated_slots
        },
        "employees": {
            "total": total_employees
        },
        "bookings": {
            "total": total_bookings,
            "active": active_bookings,
            "completed": completed_bookings,
            "cancelled": cancelled_bookings
        },
        "by_vehicle_type": type_availability
    }

