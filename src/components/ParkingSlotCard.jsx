const statusStyles = {
  Available: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400',
  Booked: 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400',
  Occupied: 'border-rose-200 bg-rose-50 text-rose-800 hover:border-rose-400',
  Reserved: 'border-sky-200 bg-sky-50 text-sky-800 hover:border-sky-400',
  Default: 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400',
};

function getSlotStatus(slot, booking) {
  if (booking?.status === 'Booked') return 'Booked';
  if (booking?.status === 'Entered') return 'Occupied';
  if (slot.allocation === 'Available') return 'Available';
  if (slot.allocation === 'Allocated') return 'Occupied';
  if (slot.allocation === 'Reserved') return 'Reserved';
  return slot.allocation || 'Default';
}

export default function ParkingSlotCard({ slot, booking }) {
  const status = getSlotStatus(slot, booking);
  const style = statusStyles[status] || statusStyles.Default;
  const details = [
    ['Employee Name', booking?.employeeName],
    ['Employee ID', booking?.employeeId],
    ['Vehicle Number', booking?.vehicleNumber],
    ['Vehicle Type', slot.vehicleSlotType || slot.vehicleType],
    ['Department', booking?.department],
    ['Slot Number', slot.slotNumber],
    ['Camera', slot.cameraNumber],
    ['Parking Status', status],
    ['Basement', slot.basement],
  ].filter(([, value]) => value);

  return (
    <article className="group relative">
      <div
        className={`flex min-h-12 items-center justify-center rounded-md border px-2 py-2 text-center text-xs font-bold shadow-sm transition ${style}`}
        tabIndex={0}
      >
        {slot.slotNumber}
      </div>

      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-slate-950 p-3 text-left text-xs text-slate-100 shadow-xl group-hover:block group-focus-within:block">
        <div className="space-y-1.5">
          {details.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <span className="text-slate-400">{label}</span>
              <span className="max-w-[145px] text-right font-semibold text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
