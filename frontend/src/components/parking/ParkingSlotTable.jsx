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
];

export default function ParkingSlotTable({ slots }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left text-sm">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
