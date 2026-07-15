import { useMemo, useState } from 'react';
import { FaPlus, FaSearch, FaFilter } from 'react-icons/fa';
import ParkingSlotCard from '../components/parking/ParkingSlotCard.jsx';
import ParkingSlotTable from '../components/parking/ParkingSlotTable.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SlotFormModal from '../components/SlotFormModal.jsx';
import { createParkingSlot, useParkingStore } from '../utils/parkingStorage.js';
import { useAuth } from '../hooks/useAuth.js';

export default function ParkingSlotMaster() {
  const { user } = useAuth();
  const { slots: parkingData, refresh, error: storeError, isLoading } = useParkingStore();
  const [query, setQuery] = useState('');
  const [parkingType, setParkingType] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const filteredSlots = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return parkingData.filter((slot) => {
      const matchesType = parkingType === 'All' || slot.allocationType === parkingType;
      const searchable = [
        slot.basement,
        slot.cameraNumber,
        slot.puzzleNumber,
        slot.slotNumber,
        slot.vehicleSlotType,
        slot.parkingType,
        slot.height,
        slot.allocation,
      ].join(' ').toLowerCase();

      return matchesType && searchable.includes(normalizedQuery);
    });
  }, [parkingData, parkingType, query]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
        <p className="text-sm font-semibold text-slate-500">Loading parking slots...</p>
      </div>
    );
  }

  if (storeError) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center shadow-sm">
        <h3 className="text-base font-bold text-rose-950">Unable to load slots</h3>
        <p className="mt-1 text-sm text-rose-700">{storeError}</p>
        <button
          onClick={refresh}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-rose-800"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Master Data"
        title="Parking Slot Master"
        description="Maintain a clear operational list of basement slots, puzzle numbers, camera mappings, allocation status, height limits, and parking categories."
        actions={
          user?.role === 'Admin' && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-teal-800"
            >
              <FaPlus /> Add Slot
            </button>
          )
        }
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 focus-within:border-teal-600 focus-within:bg-white">
            <FaSearch className="shrink-0 text-slate-400" />
            <input
              className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none"
              placeholder="Search basement, camera, puzzle, slot, type, allocation..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <FaFilter className="shrink-0 text-slate-400" />
            <select
              className="w-full border-0 bg-transparent text-sm font-semibold text-slate-700 outline-none"
              value={parkingType}
              onChange={(event) => setParkingType(event.target.value)}
            >
              <option>All</option>
              <option>Employee</option>
              <option>Visitor</option>
            </select>
          </label>
        </div>
      </section>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <section className="hidden lg:block">
        <ParkingSlotTable slots={filteredSlots} />
      </section>

      <section className="lg:hidden">
        <h2 className="mb-3 text-base font-bold text-slate-950">Mobile Slot Cards</h2>
        <div className="grid gap-4">
          {filteredSlots.map((slot) => (
            <ParkingSlotCard key={slot.id} slot={slot} />
          ))}
        </div>
      </section>

      {user?.role === 'Admin' && (
        <SlotFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={async (slot) => {
            try {
              await createParkingSlot(slot);
              await refresh();
              setIsModalOpen(false);
            } catch (err) {
              setError(err.message);
            }
          }}
        />
      )}
    </div>
  );
}
