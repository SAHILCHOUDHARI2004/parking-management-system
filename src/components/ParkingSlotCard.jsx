import { useState } from 'react'
import { MdDirectionsCar, MdVideocam } from 'react-icons/md'
import { getParkingTypeColor } from '../utils/helpers'

// Tries to find booking details linked to this slot without touching any
// booking logic - just reads existing data so the tooltip has something to
// show. Falls back gracefully if a field isn't present.
function resolveSlotBookingInfo(slot, bookings) {
  if (Array.isArray(bookings) && bookings.length) {
    const activeStatuses = ['Booked', 'Entered']
    const matches = bookings.filter((booking) => {
      if (booking.slotId && slot.id) return booking.slotId === slot.id
      return booking.slotNumber === slot.slotNumber && booking.basement === slot.basement
    })

    const match =
      matches.find((booking) => activeStatuses.includes(booking.status)) ||
      matches[matches.length - 1]

    if (match) {
      return {
        employeeName: match.employeeName,
        employeeId: match.employeeId,
        department: match.department,
        vehicleNumber: match.vehicleNumber,
        vehicleType: match.vehicleType || slot.vehicleSlotType,
        status: match.status,
      }
    }
  }

  // Fall back to fields that may already live directly on the slot record.
  return {
    employeeName: slot.employeeName,
    employeeId: slot.employeeId,
    department: slot.department,
    vehicleNumber: slot.vehicleNumber,
    vehicleType: slot.vehicleSlotType,
    status: undefined,
  }
}

// Explicit two-color scheme: green = available, orange = booked/occupied
// (anything that isn't "Available" - Allocated, Reserved, etc.).
function getSlotVisualStyle(allocation) {
  if (allocation === 'Available') {
    return {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      dot: 'bg-emerald-500',
    }
  }

  return {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  }
}

export default function ParkingSlotCard({ slot, bookings }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const slotStyle = getSlotVisualStyle(slot.allocation)
  const parkingTypeStyle = getParkingTypeColor(slot.parkingType)
  const bookingInfo = resolveSlotBookingInfo(slot, bookings)

  const fullLabel = [slot.basement, slot.slotNumber].filter(Boolean).join('-')
  // Basement is already implied by the filter/section context, so the tiny
  // icon only needs to show the short slot code (e.g. "P01-S1").
  const shortLabel = slot.slotNumber?.startsWith?.(`${slot.basement}-`)
    ? slot.slotNumber.slice(slot.basement.length + 1)
    : slot.slotNumber || fullLabel

  const tooltipRows = [
    { label: 'Employee Name', value: bookingInfo.employeeName },
    { label: 'Employee ID', value: bookingInfo.employeeId },
    { label: 'Department', value: bookingInfo.department },
    { label: 'Vehicle Number', value: bookingInfo.vehicleNumber },
    { label: 'Vehicle Type', value: bookingInfo.vehicleType },
    { label: 'Slot Number', value: slot.slotNumber },
    { label: 'Basement', value: slot.basement },
    { label: 'Booking Status', value: bookingInfo.status || slot.allocation },
    { label: 'Camera', value: slot.cameraNumber },
  ].filter((row) => row.value !== undefined && row.value !== null && row.value !== '')

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      <button
        type="button"
        title={fullLabel}
        className={`flex h-7 w-7 flex-col items-center justify-center rounded border text-center transition-transform duration-150 sm:h-8 sm:w-8 ${slotStyle.bg} ${slotStyle.text} ${showTooltip ? 'z-20 scale-125 shadow-md' : ''}`}
        style={{ borderColor: 'currentColor' }}
      >
        <span className="px-0.5 text-[6.5px] font-bold leading-[1.05] sm:text-[7px]">{shortLabel}</span>
      </button>

      {showTooltip && (
        <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-56 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-lg">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <span className="text-sm font-bold text-slate-950">{fullLabel}</span>
            <span className={`badge ${slotStyle.bg} ${slotStyle.text}`}>{slot.allocation}</span>
          </div>

          <dl className="mt-2 space-y-1">
            {tooltipRows.length ? (
              tooltipRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 text-xs">
                  <dt className="font-semibold text-slate-400">{row.label}</dt>
                  <dd className="truncate font-semibold text-slate-700">{row.value}</dd>
                </div>
              ))
            ) : (
              <p className="text-xs font-semibold text-slate-400">No additional details available.</p>
            )}
          </dl>

          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <MdDirectionsCar className="h-3.5 w-3.5 text-slate-400" />
              <span className={`badge ${parkingTypeStyle}`}>{slot.parkingType}</span>
            </span>
            {slot.cameraNumber && (
              <span className="flex items-center gap-1">
                <MdVideocam className="h-3.5 w-3.5 text-slate-400" />
                {slot.cameraNumber}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
