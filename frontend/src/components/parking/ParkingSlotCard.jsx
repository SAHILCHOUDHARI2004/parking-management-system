import { useState } from 'react'
import { MdDirectionsCar, MdVideocam } from 'react-icons/md'
import { getParkingTypeColor } from '../../utils/helpers'

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

  return {
    employeeName: slot.employeeName,
    employeeId: slot.employeeId,
    department: slot.department,
    vehicleNumber: slot.vehicleNumber,
    vehicleType: slot.vehicleSlotType,
    status: undefined,
  }
}

// green = available, orange = booked/occupied (anything not "Available")
function getSlotColors(allocation) {
  if (allocation === 'Available') {
    return { background: '#d1fae5', color: '#047857', border: '#34d399' }
  }
  return { background: '#fef3c7', color: '#b45309', border: '#fbbf24' }
}

// Inline styles are used for the square's own size/shape so this can never
// be affected by a project's Tailwind config, purge settings, or missing
// arbitrary-value support.
const squareStyle = {
  width: 60,
  height: 60,
  minWidth: 60,
  minHeight: 60,
  maxWidth: 60,
  maxHeight: 60,
  borderRadius: 6,
  borderWidth: 1,
  borderStyle: 'solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  cursor: 'default',
  fontSize: 15,
  fontWeight: 700,
  lineHeight: 1,
  textAlign: 'center',
  overflow: 'hidden',
}

export default function ParkingSlotCard({ slot, bookings }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const colors = getSlotColors(slot.allocation)
  const parkingTypeStyle = getParkingTypeColor(slot.parkingType)
  const bookingInfo = resolveSlotBookingInfo(slot, bookings)

  const fullLabel = [slot.basement, slot.slotNumber].filter(Boolean).join('-')
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
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        title={fullLabel}
        style={{
          ...squareStyle,
          backgroundColor: colors.background,
          color: colors.color,
          borderColor: colors.border,
        }}
      >
        {shortLabel}
      </div>

      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 8,
            width: 224,
            zIndex: 50,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: 12,
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            textAlign: 'left',
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <span className="text-sm font-bold text-slate-950">{fullLabel}</span>
            <span
              className="badge"
              style={{ backgroundColor: colors.background, color: colors.color }}
            >
              {slot.allocation}
            </span>
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
