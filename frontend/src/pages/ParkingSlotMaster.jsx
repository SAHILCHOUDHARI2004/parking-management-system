import { useMemo, useState } from 'react';
import { FaPlus, FaSearch, FaFilter, FaDownload } from 'react-icons/fa';
import ParkingSlotCard from '../components/parking/ParkingSlotCard.jsx';
import ParkingSlotTable from '../components/parking/ParkingSlotTable.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import SlotFormModal from '../components/SlotFormModal.jsx';
import { createParkingSlot, updateParkingSlot, useParkingStore } from '../utils/parkingStorage.js';
import { useAuth } from '../hooks/useAuth.js';

const tableColumns = [
  { label: 'Slot Number', key: 'slotNumber' },
  { label: 'Basement', key: 'basement' },
  { label: 'Parking Type', key: 'parkingType' },
  { label: 'Vehicle Type', key: 'vehicleSlotType' },
  { label: 'Allocation', key: 'allocation' },
];

function downloadCsv(rows) {
  const header = tableColumns.map((column) => column.label);
  const csvRows = rows.map((slot) =>
    tableColumns.map((column) => {
      const value = String(slot[column.key] ?? '');
      return `"${value.replaceAll('"', '""')}"`;
    }).join(','),
  );
  const csvContent = [header.join(','), ...csvRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'parking-slot-master.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export default function ParkingSlotMaster() {
  const { user } = useAuth();
  const { slots: parkingData, refresh, error: storeError, isLoading } = useParkingStore();
  const [query, setQuery] = useState('');
  const [parkingType, setParkingType] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [error, setError] = useState('');

  const filteredSlots = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return (parkingData || []).filter((slot) => {
      const matchesType = parkingType === 'All' || slot.allocationType === parkingType;
      
      const searchable = [
        slot.slotNumber,
        slot.basement,
        slot.parkingType,
        slot.vehicleSlotType,
        slot.allocation,
      ].join(' ').toLowerCase();

      return matchesType && searchable.includes(normalizedQuery);
    });
  }, [parkingData, query, parkingType]);

  const hasSlotData = (parkingData || []).length > 0;
  const hasFilteredData = filteredSlots.length > 0;

  const openAddModal = () => {
    setEditingSlot(null);
    setIsModalOpen(true);
  };

  const openEditModal = (slot) => {
    setEditingSlot(slot);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSlot(null);
    setError('');
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingSlot) {
        await updateParkingSlot(editingSlot.id, formData);
      } else {
        await createParkingSlot(formData);
      }
      await refresh();
      closeModal();
    } catch (err) {
      setError(err.message || 'An error occurred while saving the slot.');
    }
  };

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
        description="Manage the complete parking slot inventory, including basement mapping, vehicle type compatibility, and slot allocation status."
        actions={
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!hasSlotData}
              onClick={() => downloadCsv(filteredSlots)}
              title={hasSlotData ? 'Export parking slot records' : 'No data available'}
              type="button"
            >
              <FaDownload />
              Export
            </button>
            {user?.role === 'Admin' && (
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
                onClick={openAddModal}
                type="button"
              >
                <FaPlus />
                Add Parking Slot
              </button>
            )}
          </div>
        }
      />

      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <label className="flex flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-teal-600 focus-within:bg-white">
          <FaSearch className="shrink-0 text-slate-400" />
          <input
            className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none"
            placeholder="Search slot number, basement, parking type, vehicle type, allocation..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        
        <div className="flex items-center gap-2">
          <FaFilter className="text-slate-400" />
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-600"
            value={parkingType}
            onChange={(e) => setParkingType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Employee">Employee</option>
            <option value="Visitor">Visitor</option>
          </select>
        </div>
      </section>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <section className="hidden lg:block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Parking Slot Records</h2>
              <p className="text-sm text-slate-500">
                {hasSlotData ? `${filteredSlots.length} records found` : 'No data available'}
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
              Database Integrated
            </span>
          </div>
        </div>

        <ParkingSlotTable
          slots={filteredSlots}
          onEdit={user?.role === 'Admin' ? openEditModal : undefined}
        />
      </section>

      <section className="lg:hidden space-y-3">
        <h2 className="text-base font-bold text-slate-950">Mobile Slot Cards</h2>
        <div className="grid gap-4">
          {hasFilteredData ? (
            filteredSlots.map((slot) => (
              <ParkingSlotCard key={slot.id} slot={slot} />
            ))
          ) : (
            <p className="text-sm text-slate-500">No slots available</p>
          )}
        </div>
      </section>

      {user?.role === 'Admin' && (
        <SlotFormModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSubmit={handleSubmit}
          initialData={editingSlot}
          mode={editingSlot ? 'edit' : 'add'}
        />
      )}
    </div>
  );
}
