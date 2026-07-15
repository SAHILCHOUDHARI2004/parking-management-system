export function getParkingStats(parkingSlots, bookings = []) {
  const availableSlots = parkingSlots.filter((slot) => slot.allocation === 'Available').length;

  // Occupied means the vehicle has actually entered (allocation === 'Allocated').
  // A slot that is merely booked but not yet entered is "Reserved", not occupied.
  const occupiedSlots = parkingSlots.filter((slot) => slot.allocation === 'Allocated').length;
  const reservedSlots = parkingSlots.filter((slot) => slot.allocation === 'Reserved').length;

  // Employee Slots = total slots currently held by an employee booking that
  // hasn't exited yet (covers both the Reserved and Entered/Occupied stages).
  // Calculated from live booking data so it updates the moment a booking is
  // created or a vehicle exits.
  const employeeSlots = bookings.filter((booking) => ['Booked', 'Entered'].includes(booking.status)).length;

  return {
    totalSlots: parkingSlots.length,
    availableSlots,
    occupiedSlots,
    reservedSlots,
    employeeSlots,
    sedanSlots: parkingSlots.filter((slot) => slot.vehicleSlotType === 'Sedan').length,
    csuvSlots: parkingSlots.filter((slot) => slot.vehicleSlotType === 'CSUV').length,
    puzzleSlots: parkingSlots.filter((slot) => slot.basement === 'B2').length,
    stackSlots: parkingSlots.filter((slot) => slot.basement === 'B3').length,
    groundSlots: parkingSlots.filter((slot) => slot.basement === 'B1').length,
  };
}

export function getAllocationTone(allocation) {
  const tones = {
    Allocated: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Available: 'bg-sky-50 text-sky-700 ring-sky-200',
    Reserved: 'bg-amber-50 text-amber-700 ring-amber-200',
    Maintenance: 'bg-rose-50 text-rose-700 ring-rose-200',
  };

  return tones[allocation] ?? 'bg-slate-50 text-slate-700 ring-slate-200';
}
