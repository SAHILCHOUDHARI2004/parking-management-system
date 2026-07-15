from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.dependencies import get_db, require_security, require_employee
from app.schemas.booking import BookingCreate, BookingOut, BookingDetailOut, BookingPaginated
from app.services.booking_service import BookingService
from app.models.booking import Booking, BookingStatus
from app.models.employee import Employee
from app.models.parking_slot import ParkingSlot

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])

@router.get("", response_model=BookingPaginated)
def read_bookings(
    page: Optional[int] = None,
    page_size: Optional[int] = 10,
    status_filter: Optional[str] = None,
    employee_id: Optional[int] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
    current_user = Depends(require_employee)  # Allow employees to view their own bookings
):
    query = db.query(Booking)
    
    # If the user is an Employee, restrict them to their own bookings
    if current_user.role == "Employee":
        employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not employee:
            return {"items": [], "total": 0}
        query = query.filter(Booking.employee_id == employee.id)
    else:
        # Security/Admin can filter by employee_id
        if employee_id:
            query = query.filter(Booking.employee_id == employee_id)
            
    if status_filter:
        query = query.filter(Booking.status == status_filter)
        
    if search:
        search_val = f"%{search}%"
        # Join Employee and ParkingSlot to search through details
        query = query.join(Employee).join(ParkingSlot).filter(
            (Employee.name.ilike(search_val)) |
            (Employee.employee_id.ilike(search_val)) |
            (Employee.vehicle_number.ilike(search_val)) |
            (ParkingSlot.slot_number.ilike(search_val)) |
            (ParkingSlot.basement.ilike(search_val))
        )
        
    # Stable sorting
    sort_attr = getattr(Booking, sort_by, Booking.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_attr.desc(), Booking.id.desc())
    else:
        query = query.order_by(sort_attr.asc(), Booking.id.asc())
        
    total = query.count()
    
    if page is not None:
        query = query.offset((page - 1) * page_size).limit(page_size)
        
    return {"items": query.all(), "total": total}

@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_employee)
):
    # Enforce ownership rules for Employees
    if current_user.role == "Employee":
        employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No employee profile associated with this user account."
            )
        if employee.id != booking_in.employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employees can only book parking for themselves."
            )
            
    # Perform transaction safe booking
    return BookingService.create_booking(
        db=db,
        employee_id=booking_in.employee_id,
        parking_slot_id=booking_in.parking_slot_id,
        performed_by_id=current_user.id
    )

@router.patch("/{booking_id}/enter", response_model=BookingOut)
def record_entry(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_security)
):
    return BookingService.register_entry(db=db, booking_id=booking_id, performed_by_id=current_user.id)

@router.patch("/{booking_id}/exit", response_model=BookingOut)
def record_exit(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_security)
):
    return BookingService.register_exit(db=db, booking_id=booking_id, performed_by_id=current_user.id)

@router.patch("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_employee)
):
    # Enforce ownership rules for Employees
    if current_user.role == "Employee":
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found."
            )
        employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if not employee or booking.employee_id != employee.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employees can only cancel their own bookings."
            )
            
    return BookingService.cancel_booking(db=db, booking_id=booking_id, performed_by_id=current_user.id)
