import StatusBadge from '../ui/StatusBadge.jsx';

const headers = [
  'Sr No',
  'Basement',
  'Camera Number',
  'Puzzle Number',
  'Slot Number',
  'Vehicle Slot Type',
  'Parking Type',
  'Height',
  'Allocation',
  'Status',
  'Actions',
];

function StatusTone({ status }) {
  const isWorking = status !== 'Not Working';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
        isWorking ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
      }`}
    >
      {isWorking ? 'Working' : 'Not Working'}
    </span>
  );
}

export default function ParkingSlotTable({ slots, onEdit }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-[0.12em] text-slate-500">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-4 font-bold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {slots.map((slot, index) => (
              <tr key={slot.id} className="hover:bg-slate-50">
                <td className="px-4 py-4 font-semibold text-slate-700">{index + 1}</td>
                <td className="px-4 py-4 text-slate-700">{slot.basement}</td>
                <td className="px-4 py-4 text-slate-700">{slot.cameraNumber}</td>
                <td className="px-4 py-4 text-slate-700">{slot.puzzleNumber}</td>
                <td className="px-4 py-4 font-bold text-slate-950">{slot.slotNumber}</td>
                <td className="px-4 py-4 text-slate-700">{slot.vehicleSlotType}</td>
                <td className="px-4 py-4 text-slate-700">{slot.parkingType}</td>
                <td className="px-4 py-4 text-slate-700">{slot.height}</td>
                <td className="px-4 py-4">
                  <StatusBadge value={slot.allocation} />
                </td>
                <td className="px-4 py-4">
                  <StatusTone status={slot.status} />
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => onEdit?.(slot)}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-50"
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
