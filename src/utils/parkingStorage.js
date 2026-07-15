import { useEffect, useState } from 'react';
import parkingDataSeed from '../data/parkingData.json';

export const PARKING_STORAGE_KEY = 'pms_parking_data';
export const PARKING_BOOKINGS_KEY = 'pms_parking_bookings';
export const PARKING_UPDATED_EVENT = 'pms-parking-updated';

function readJson(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export function readParkingSlots() {
  const slots = readJson(PARKING_STORAGE_KEY, parkingDataSeed);
  const source = Array.isArray(slots) ? slots : parkingDataSeed;
  // The supplied master data uses Employee/Transport as allocation categories.
  // Treat those unoccupied seed records as available until an operational action reserves them.
  return source.map((slot) => {
    const withAllocation = ['Available', 'Reserved', 'Allocated', 'Maintenance'].includes(slot.allocation)
      ? slot
      : { ...slot, allocation: 'Available' };

    // Working / Not Working is a separate maintenance flag from allocation.
    // Older seed records don't have it - default them to 'Working' so nothing
    // is unexpectedly hidden from booking once this field is introduced.
    return withAllocation.status ? withAllocation : { ...withAllocation, status: 'Working' };
  });
}

export function readParkingBookings() {
  const bookings = readJson(PARKING_BOOKINGS_KEY, []);
  return Array.isArray(bookings) ? bookings : [];
}

function notify() {
  window.dispatchEvent(new CustomEvent(PARKING_UPDATED_EVENT));
}

function save(slots, bookings) {
  window.localStorage.setItem(PARKING_STORAGE_KEY, JSON.stringify(slots));
  window.localStorage.setItem(PARKING_BOOKINGS_KEY, JSON.stringify(bookings));
  notify();
}

export function createBooking({ employee, slotId }) {
  const slots = readParkingSlots();
  const bookings = readParkingBookings();
  const slot = slots.find((item) => String(item.id) === String(slotId));

  if (!slot || slot.allocation !== 'Available' || slot.status === 'Not Working') {
    throw new Error('This parking slot is no longer available.');
  }

  const booking = {
    id: `${Date.now()}-${slot.id}`,
    employeeId: employee.employeeId,
    employeeName: employee.employeeName,
    vehicleNumber: employee.vehicleNumber,
    vehicleType: employee.vehicleType || '',
    department: employee.department,
    slotId: slot.id,
    slotNumber: slot.slotNumber,
    basement: slot.basement,
    status: 'Booked',
    bookedAt: new Date().toISOString(),
    entryTime: null,
    exitTime: null,
  };

  save(slots.map((item) => (item.id === slot.id ? { ...item, allocation: 'Reserved' } : item)), [...bookings, booking]);
  return booking;
}

export function markVehicleEntered(bookingId) {
  const bookings = readParkingBookings();
  const booking = bookings.find((item) => item.id === bookingId && item.status === 'Booked');
  if (!booking) throw new Error('Booking was not found.');

  const updated = { ...booking, status: 'Entered', entryTime: new Date().toISOString() };
  save(readParkingSlots().map((slot) => (slot.id === booking.slotId ? { ...slot, allocation: 'Allocated' } : slot)), bookings.map((item) => (item.id === bookingId ? updated : item)));
  return updated;
}

export function markVehicleExited(bookingId) {
  const bookings = readParkingBookings();
  const booking = bookings.find((item) => item.id === bookingId && item.status === 'Entered');
  if (!booking) throw new Error('Vehicle entry was not found.');

  const updated = { ...booking, status: 'Exited', exitTime: new Date().toISOString() };
  save(readParkingSlots().map((slot) => (slot.id === booking.slotId ? { ...slot, allocation: 'Available' } : slot)), bookings.map((item) => (item.id === bookingId ? updated : item)));
  return updated;
}

// Adds a brand-new slot record to the master data. Generates the next
// sequential numeric id and defaults allocation/status so partially-filled
// forms still produce a usable record.
export function addParkingSlot(slotData) {
  const slots = readParkingSlots();
  const bookings = readParkingBookings();
  const nextId = slots.reduce((max, slot) => Math.max(max, Number(slot.id) || 0), 0) + 1;

  const newSlot = {
    allocation: 'Available',
    status: 'Working',
    ...slotData,
    id: nextId,
  };

  save([...slots, newSlot], bookings);
  return newSlot;
}

// Updates an existing slot record in place (used by Parking Slot Master's
// Update action, including flipping Working / Not Working status).
export function updateParkingSlot(slotId, updates) {
  const slots = readParkingSlots();
  const bookings = readParkingBookings();

  const updatedSlots = slots.map((slot) =>
    String(slot.id) === String(slotId) ? { ...slot, ...updates, id: slot.id } : slot,
  );

  save(updatedSlots, bookings);
  return updatedSlots.find((slot) => String(slot.id) === String(slotId));
}

export function useParkingStore() {
  const [snapshot, setSnapshot] = useState(() => ({ slots: readParkingSlots(), bookings: readParkingBookings() }));

  useEffect(() => {
    const sync = () => setSnapshot({ slots: readParkingSlots(), bookings: readParkingBookings() });
    window.addEventListener(PARKING_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(PARKING_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return snapshot;
}
