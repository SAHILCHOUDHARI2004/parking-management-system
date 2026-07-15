import logging
import json
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.booking import Booking, BookingStatus
from app.models.parking_slot import ParkingSlot, SlotStatus
from app.models.employee import Employee
from app.models.audit_log import AuditLog

class BookingService:
    @staticmethod
    def create_booking(db: Session, employee_id: int, parking_slot_id: int, performed_by_id: int) -> Booking:
        # 1. Verify employee exists
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee with ID {employee_id} not found"
            )

        # 2. Check if employee already has an active booking (status 'Booked' or 'Entered')
        active_booking = db.query(Booking).filter(
            Booking.employee_id == employee_id,
            Booking.status.in_([BookingStatus.BOOKED, BookingStatus.ENTERED])
        ).first()
        if active_booking:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee already has an active booking"
            )

        # 3. Lock and retrieve the parking slot (concurrency safe)
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == parking_slot_id).with_for_update().first()
        if not slot:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Parking slot with ID {parking_slot_id} not found"
            )

        if slot.status != SlotStatus.AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Parking slot {slot.slot_number} is not available (current status: {slot.status.value})"
            )

        # 4. Create booking and update slot status
        new_booking = Booking(
            employee_id=employee_id,
            parking_slot_id=parking_slot_id,
            status=BookingStatus.BOOKED
        )
        slot.status = SlotStatus.RESERVED

        try:
            db.add(new_booking)
            db.flush()  # Flush to get the booking ID for the audit log

            # Create audit log
            audit_details = json.dumps({
                "employee_id": employee.employee_id,
                "employee_name": employee.name,
                "vehicle_number": employee.vehicle_number,
                "slot_number": slot.slot_number,
                "basement": slot.basement
            })
            audit = AuditLog(
                booking_id=new_booking.id,
                action="Create",
                performed_by_id=performed_by_id,
                details=audit_details
            )
            db.add(audit)
            db.commit()
            db.refresh(new_booking)
            return new_booking
        except Exception as e:
            db.rollback()
            logging.exception("Database error during booking creation")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="A database error occurred while creating the booking."
            )

    @staticmethod
    def register_entry(db: Session, booking_id: int, performed_by_id: int) -> Booking:
        # Lock booking and associated slot
        booking = db.query(Booking).filter(Booking.id == booking_id).with_for_update().first()
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

        if booking.status != BookingStatus.BOOKED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot check in. Booking status is {booking.status.value}")

        slot = db.query(ParkingSlot).filter(ParkingSlot.id == booking.parking_slot_id).with_for_update().first()
        if not slot:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated slot not found")

        booking.status = BookingStatus.ENTERED
        booking.check_in_time = datetime.now(timezone.utc)
        slot.status = SlotStatus.ALLOCATED

        try:
            # Create audit log
            employee = booking.employee
            audit_details = json.dumps({
                "employee_id": employee.employee_id,
                "employee_name": employee.name,
                "vehicle_number": employee.vehicle_number,
                "slot_number": slot.slot_number,
                "basement": slot.basement
            })
            audit = AuditLog(
                booking_id=booking.id,
                action="Entry",
                performed_by_id=performed_by_id,
                details=audit_details
            )
            db.add(audit)
            db.commit()
            db.refresh(booking)
            return booking
        except Exception as e:
            db.rollback()
            logging.exception("Database error during register entry")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="A database error occurred while recording vehicle entry."
            )

    @staticmethod
    def register_exit(db: Session, booking_id: int, performed_by_id: int) -> Booking:
        # Lock booking and associated slot
        booking = db.query(Booking).filter(Booking.id == booking_id).with_for_update().first()
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

        if booking.status != BookingStatus.ENTERED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot check out. Booking status is {booking.status.value}")

        slot = db.query(ParkingSlot).filter(ParkingSlot.id == booking.parking_slot_id).with_for_update().first()
        if not slot:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated slot not found")

        booking.status = BookingStatus.EXITED
        booking.check_out_time = datetime.now(timezone.utc)
        slot.status = SlotStatus.AVAILABLE

        try:
            # Create audit log
            employee = booking.employee
            audit_details = json.dumps({
                "employee_id": employee.employee_id,
                "employee_name": employee.name,
                "vehicle_number": employee.vehicle_number,
                "slot_number": slot.slot_number,
                "basement": slot.basement
            })
            audit = AuditLog(
                booking_id=booking.id,
                action="Exit",
                performed_by_id=performed_by_id,
                details=audit_details
            )
            db.add(audit)
            db.commit()
            db.refresh(booking)
            return booking
        except Exception as e:
            db.rollback()
            logging.exception("Database error during register exit")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="A database error occurred while recording vehicle exit."
            )

    @staticmethod
    def cancel_booking(db: Session, booking_id: int, performed_by_id: int) -> Booking:
        booking = db.query(Booking).filter(Booking.id == booking_id).with_for_update().first()
        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

        if booking.status != BookingStatus.BOOKED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only bookings in 'Booked' status can be cancelled")

        slot = db.query(ParkingSlot).filter(ParkingSlot.id == booking.parking_slot_id).with_for_update().first()
        if not slot:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated slot not found")

        booking.status = BookingStatus.CANCELLED
        slot.status = SlotStatus.AVAILABLE

        try:
            # Create audit log
            employee = booking.employee
            audit_details = json.dumps({
                "employee_id": employee.employee_id,
                "employee_name": employee.name,
                "vehicle_number": employee.vehicle_number,
                "slot_number": slot.slot_number,
                "basement": slot.basement
            })
            audit = AuditLog(
                booking_id=booking.id,
                action="Cancel",
                performed_by_id=performed_by_id,
                details=audit_details
            )
            db.add(audit)
            db.commit()
            db.refresh(booking)
            return booking
        except Exception as e:
            db.rollback()
            logging.exception("Database error during cancel booking")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="A database error occurred while cancelling the booking."
            )
