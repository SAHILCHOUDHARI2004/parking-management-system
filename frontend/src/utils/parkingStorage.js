import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const mapSlot = (slot) => ({
  id: slot.id,
  basement: slot.basement,
  slotNumber: slot.slot_number,
  vehicleSlotType: slot.vehicle_type,
  parkingType: slot.parking_type,
  allocationType: slot.allocation_type,
  height: slot.height || '-',
  cameraNumber: slot.camera_number || '-',
  puzzleNumber: slot.puzzle_number || '-',
  allocation: slot.status
});

const mapBooking = (booking) => ({
  id: booking.id,
  employeeId: booking.employee?.employee_id,
  employeeName: booking.employee?.name,
  vehicleNumber: booking.employee?.vehicle_number,
  department: booking.employee?.department,
  slotId: booking.parking_slot?.id,
  slotNumber: booking.parking_slot?.slot_number,
  basement: booking.parking_slot?.basement,
  status: booking.status,
  bookedAt: booking.created_at,
  entryTime: booking.check_in_time,
  exitTime: booking.check_out_time
});

export async function createBooking({ employee, slotId }) {
  return api('/api/bookings', {
    method: 'POST',
    body: JSON.stringify({ employee_id: employee.id, parking_slot_id: Number(slotId) })
  });
}

export async function markVehicleEntered(id) {
  return api(`/api/bookings/${id}/enter`, { method: 'PATCH' });
}

export async function markVehicleExited(id) {
  return api(`/api/bookings/${id}/exit`, { method: 'PATCH' });
}

export async function createParkingSlot(slot) {
  return api('/api/parking-slots', {
    method: 'POST',
    body: JSON.stringify({
      basement: slot.basement,
      slot_number: slot.slotNumber,
      vehicle_type: slot.vehicleSlotType,
      parking_type: slot.parkingType,
      camera_number: slot.cameraNumber || null,
      puzzle_number: slot.puzzleNumber || null,
      height: slot.height || null,
      status: slot.allocation === 'Maintenance' ? 'Maintenance' : 'Available'
    })
  });
}

export function useParkingStore() {
  const [snapshot, setSnapshot] = useState({ slots: [], bookings: [] });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [slotsData, bookingsData] = await Promise.all([
        api('/api/parking-slots'),
        api('/api/bookings')
      ]);
      setSnapshot({
        slots: (slotsData.items || []).map(mapSlot),
        bookings: (bookingsData.items || []).map(mapBooking)
      });
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load parking details');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...snapshot, refresh, error, isLoading };
}
