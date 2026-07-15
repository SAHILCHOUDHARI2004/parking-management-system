import { getAllocationTone } from '../../utils/parkingStats.js';

export default function StatusBadge({ value }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getAllocationTone(value)}`}>
      {value}
    </span>
  );
}
