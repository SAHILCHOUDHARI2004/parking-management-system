import { useMemo, useState } from 'react';
import {
  FaArrowRight,
  FaCarAlt,
  FaCarSide,
  FaDoorOpen,
  FaLayerGroup,
  FaParking,
  FaRegCalendarCheck,
  FaRoute,
  FaSearch,
  FaSignInAlt,
  FaSignOutAlt,
  FaTools,
  FaUserTie,
  FaUsers,
  FaWarehouse,
} from 'react-icons/fa';
import {
  createBooking,
  markVehicleEntered,
  markVehicleExited,
  useParkingStore,
} from '../utils/parkingStorage.js';

import ParkingSlotCard from '../components/parking/ParkingSlotCard.jsx';
import MetricCard from '../components/ui/MetricCard.jsx';
import Modal from '../components/Modal.jsx';
import { getEmployeeValue, useEmployees } from '../utils/employeeStorage.js';
import { getParkingStats } from '../utils/parkingStats.js';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const quickActions = [
  {
    title: 'Reserved Parking',
    description: 'Reserve a slot for employee or visitor parking.',
    icon: FaRegCalendarCheck,
    accent: 'bg-teal-700 text-white',
  },
  {
    title: 'Vehicle Entry',
    description: 'Capture incoming vehicle movement at the gate.',
    icon: FaSignInAlt,
    accent: 'bg-indigo-700 text-white',
  },
  {
    title: 'Vehicle Exit',
    description: 'Mark a slot free after vehicle checkout.',
    icon: FaSignOutAlt,
    accent: 'bg-slate-900 text-white',
  },
];

const heatmapTimes = Array.from({ length: 24 }, (_, hour) => {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
});

const heatmapDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const recentActivity = [
  { time: '09:15 AM', vehicle: 'KA01AB1234', action: 'Vehicle Entry', zone: 'Ground', icon: FaSignInAlt },
  { time: '09:40 AM', vehicle: 'KA02CD5678', action: 'Vehicle Exit', zone: 'Puzzle', icon: FaSignOutAlt },
  { time: '10:05 AM', vehicle: 'KA03EF9012', action: 'Vehicle Entry', zone: 'Stack', icon: FaSignInAlt },
  { time: '10:28 AM', vehicle: 'KA04GH3456', action: 'Slot Reserved', zone: 'Ground', icon: FaRegCalendarCheck },
];

const basementFilters = ['All', 'B1', 'B2', 'B3'];
const SLOTS_PER_PAGE = 32;

function getHeatmapTone(value, isCurrentDay) {
  if (!isCurrentDay) {
    return 'bg-slate-200 text-slate-600';
  }

  if (value > 80) return 'bg-rose-600 text-white';
  if (value > 50) return 'bg-amber-500 text-white';

  return 'bg-emerald-600 text-white';
}

function getZoneSlots(zone, slots) {
  const basementMap = {
    Ground: 'B1',
    Puzzle: 'B2',
    Stack: 'B3',
  };

  return slots.filter((slot) => slot.basement === basementMap[zone]);
}

function getBookingStatusTone(status) {
  const tones = {
    Booked: 'bg-amber-50 text-amber-700',
    Entered: 'bg-emerald-50 text-emerald-700',
    Exited: 'bg-slate-100 text-slate-600',
  };

  return tones[status] ?? 'bg-slate-100 text-slate-600';
}

export default function Dashboard() {
  const { slots: parkingData, bookings } = useParkingStore();
  const stats = getParkingStats(parkingData, bookings);
  const employees = useEmployees();
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [operation, setOperation] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [operationError, setOperationError] = useState('');
  const [basementFilter, setBasementFilter] = useState('All');
  const [slotPage, setSlotPage] = useState(1);
  // Employee autocomplete (Reserved Parking dialog only). `employeeSearchText`
  // is the single input's text - while typing it's the search query, and
  // once an employee is picked it displays that employee's label. Kept
  // fully separate from `employeeQuery` (Employee Summary table search).
  const [employeeSearchText, setEmployeeSearchText] = useState('');
  const [isEmployeeResultsOpen, setIsEmployeeResultsOpen] = useState(false);
  // Slot autocomplete (Reserved Parking dialog). Same pattern as the
  // employee search - type to filter, click a result to select immediately.
  const [slotSearchText, setSlotSearchText] = useState('');
  const [isSlotResultsOpen, setIsSlotResultsOpen] = useState(false);
  const occupiedPercentage = Math.round((stats.occupiedSlots / stats.totalSlots) * 100);
  const availablePercentage = Math.round((stats.availableSlots / stats.totalSlots) * 100);

  const metrics = [
    { title: 'Total Slots', value: stats.totalSlots, icon: FaParking, accent: 'bg-teal-50 text-teal-700', note: 'Complete parking inventory' },
    { title: 'Available Slots', value: stats.availableSlots, icon: FaDoorOpen, accent: 'bg-emerald-50 text-emerald-700', note: `${availablePercentage}% currently open` },
    { title: 'Occupied Slots', value: stats.occupiedSlots, icon: FaCarAlt, accent: 'bg-rose-50 text-rose-700', note: `${occupiedPercentage}% in use (vehicle entered)` },
    { title: 'Employee Slots', value: stats.employeeSlots, icon: FaUserTie, accent: 'bg-indigo-50 text-indigo-700', note: 'Currently booked or entered' },
    { title: 'Reserved Slots', value: stats.reservedSlots, icon: FaUsers, accent: 'bg-sky-50 text-sky-700', note: 'Booked, awaiting vehicle entry' },
    { title: 'Maintenance Slots', value: stats.maintenanceSlots, icon: FaTools, accent: 'bg-orange-50 text-orange-700', note: 'Marked Not Working' },
    { title: 'Puzzle Slots', value: stats.puzzleSlots, icon: FaLayerGroup, accent: 'bg-violet-50 text-violet-700', note: 'Mapped to B2 zone' },
    { title: 'Stack Slots', value: stats.stackSlots, icon: FaWarehouse, accent: 'bg-amber-50 text-amber-700', note: 'Mapped to B3 zone' },
    { title: 'Ground Slots', value: stats.groundSlots, icon: FaRoute, accent: 'bg-slate-100 text-slate-700', note: 'Mapped to B1 zone' },
    { title: 'Registered Employees', value: employees.length, icon: FaUserTie, accent: 'bg-teal-50 text-teal-700', note: 'Stored in browser localStorage' },
  ];

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = employeeQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return employees;
    }

    return employees.filter((employee) => {
      const searchable = [
        getEmployeeValue(employee, 'employeeId'),
        getEmployeeValue(employee, 'employeeName'),
        getEmployeeValue(employee, 'mobileNumber'),
      ].join(' ').toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [employeeQuery, employees]);

  // Employees with an active booking (Booked or Entered) should not be
  // offered again in the Reserved Parking form until their vehicle has exited.
  const activeBookingEmployeeIds = useMemo(
    () =>
      new Set(
        bookings
          .filter((booking) => ['Booked', 'Entered'].includes(booking.status))
          .map((booking) => booking.employeeId),
      ),
    [bookings],
  );

  const bookableEmployees = useMemo(
    () => employees.filter((employee) => !activeBookingEmployeeIds.has(getEmployeeValue(employee, 'employeeId'))),
    [employees, activeBookingEmployeeIds],
  );

  // Autocomplete results for the Reserved Parking dialog, filtered from the
  // existing `bookableEmployees` list (which already hides Booked/Entered
  // employees) by Employee Name or Vehicle Number, case-insensitive. This
  // does not change who is eligible to be booked - only what's shown
  // while typing.
  const employeeAutocompleteResults = useMemo(() => {
    const normalizedSearch = employeeSearchText.trim().toLowerCase();

    if (!normalizedSearch) {
      return bookableEmployees;
    }

    return bookableEmployees.filter((employee) => {
      const name = String(getEmployeeValue(employee, 'employeeName') || '').toLowerCase();
      const vehicleNumber = String(getEmployeeValue(employee, 'vehicleNumber') || '').toLowerCase();

      return name.includes(normalizedSearch) || vehicleNumber.includes(normalizedSearch);
    });
  }, [bookableEmployees, employeeSearchText]);

  const zoneAvailability = ['Ground', 'Puzzle', 'Stack'].map((zone) => {
    const zoneSlots = getZoneSlots(zone, parkingData);
    const available = zoneSlots.filter((slot) => slot.allocation === 'Available').length;
    const total = zoneSlots.length;
    const percentage = total ? Math.round((available / total) * 100) : 0;

    return { zone, available, total, percentage };
  });

  const allocationSummary = ['Allocated', 'Available', 'Reserved', 'Maintenance'].map((status) => {
    const count = parkingData.filter((slot) => slot.allocation === status).length;
    const percentage = Math.round((count / parkingData.length) * 100);

    return { status, count, percentage };
  });

  const basementFilteredSlots = parkingData.filter(
    (slot) => basementFilter === 'All' || slot.basement === basementFilter,
  );

  // Booked/occupied slots first, then available ones - order preserved
  // within each group.
  const sortedFilteredSlots = [...basementFilteredSlots].sort((a, b) => {
    const aAvailable = a.allocation === 'Available' ? 1 : 0;
    const bAvailable = b.allocation === 'Available' ? 1 : 0;
    return aAvailable - bAvailable;
  });

  const totalSlotPages = Math.max(1, Math.ceil(sortedFilteredSlots.length / SLOTS_PER_PAGE));
  const currentSlotPage = Math.min(slotPage, totalSlotPages);

  // Only ever render one page (10 slots) at a time instead of the full
  // inventory - Previous / Next below step through the rest.
  const liveParkingSlots = sortedFilteredSlots.slice(
    (currentSlotPage - 1) * SLOTS_PER_PAGE,
    currentSlotPage * SLOTS_PER_PAGE,
  );

  const slotPageRangeStart = sortedFilteredSlots.length
    ? (currentSlotPage - 1) * SLOTS_PER_PAGE + 1
    : 0;
  const slotPageRangeEnd = Math.min(currentSlotPage * SLOTS_PER_PAGE, sortedFilteredSlots.length);

  const occupancyChartData = ['All', 'Sedan', 'CSUV'].map((vehicleType) => {
    const slots =
      vehicleType === 'All'
        ? parkingData
        : parkingData.filter(
            (slot) => (slot.vehicleSlotType || slot.vehicleType) === vehicleType,
          );

    return {
      vehicleType,
      occupied: slots.filter((slot) =>
        ['Reserved', 'Allocated'].includes(slot.allocation),
      ).length,
      available: slots.filter((slot) => slot.allocation === 'Available').length,
    };
  });

  // Tower A summary: available/total slot counts per vehicle type (Sedan,
  // CSUV) broken down by basement (B1, B2, B3). Derived purely from the
  // existing parkingData - no new business logic, no hardcoded numbers.
  const towerBasements = ['B1', 'B2', 'B3'];
  const towerVehicleTypes = ['Sedan', 'CSUV'];

  const towerSummary = towerVehicleTypes.map((vehicleType) => {
    const basementCounts = towerBasements.map((basement) => {
      const slots = parkingData.filter(
        (slot) =>
          slot.basement === basement &&
          (slot.vehicleSlotType || slot.vehicleType) === vehicleType,
      );

      const total = slots.length;
      const available = slots.filter((slot) => slot.allocation === 'Available').length;

      return { basement, available, total };
    });

    return { vehicleType, basementCounts };
  });

  // Operations Overview: a live feed built entirely from existing booking
  // data (no dummy rows), most recent activity first.
  const operationsOverview = [...bookings]
    .sort((a, b) => {
      const aTime = new Date(a.exitTime || a.entryTime || a.bookedAt).getTime();
      const bTime = new Date(b.exitTime || b.entryTime || b.bookedAt).getTime();
      return bTime - aTime;
    })
    .slice(0, 8)
    .map((booking) => {
      const matchedSlot = parkingData.find((slot) => slot.id === booking.slotId);
      const timestamp = booking.exitTime || booking.entryTime || booking.bookedAt;

      return {
        id: booking.id,
        vehicleNumber: booking.vehicleNumber || '-',
        employeeName: booking.employeeName || '-',
        slotNumber: booking.slotNumber || '-',
        vehicleType: booking.vehicleType || matchedSlot?.vehicleSlotType || '-',
        status: booking.status,
        time: timestamp
          ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '-',
      };
    });

  // Available slots eligible for booking must be allocation-Available AND
  // Working - a slot flagged Not Working is excluded from booking entirely.
  const availableSlots = parkingData.filter(
    (slot) => slot.allocation === 'Available' && slot.status !== 'Not Working',
  );
  const selectedEmployee = employees.find((employee) => getEmployeeValue(employee, 'employeeId') === selectedEmployeeId);
  const employeeVehicleType = selectedEmployee ? getEmployeeValue(selectedEmployee, 'vehicleType') : '';

  // Only show slots compatible with the selected employee's registered
  // vehicle type. If the employee record has no vehicle type on file, fall
  // back to showing every available slot rather than hiding everything.
  const vehicleFilteredSlots = availableSlots.filter(
    (slot) => !employeeVehicleType || slot.vehicleSlotType === employeeVehicleType,
  );

  const normalizedSlotSearch = slotSearchText.trim().toLowerCase();
  const slotAutocompleteResults = vehicleFilteredSlots.filter((slot) =>
    String(slot.slotNumber || '').toLowerCase().includes(normalizedSlotSearch),
  );

  const bookedVehicles = bookings.filter((booking) => booking.status === 'Booked');
  const enteredVehicles = bookings.filter((booking) => booking.status === 'Entered');


  const today = new Date();
  const currentWeekdayIndex = (today.getDay() + 6) % 7; // Monday = 0
  const totalParkingSlots = parkingData.length;

  const heatmapData = heatmapDays.map((_, weekdayIndex) => {
    const hourlyOccupancy = Array(24).fill(0);

    // Every weekday except today remains neutral at 0%.
    if (weekdayIndex !== currentWeekdayIndex) {
      return hourlyOccupancy;
    }

    return hourlyOccupancy.map((_, hour) => {
      const hourStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        hour,
        0,
        0,
      );

      const hourEnd = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        hour + 1,
        0,
        0,
      );

      // Future hours have no actual live parking data yet.
      if (hourStart > today) {
        return 0;
      }

      const occupiedSlots = bookings.filter((booking) => {
        const occupiedFrom = new Date(booking.bookedAt || booking.entryTime);

        if (Number.isNaN(occupiedFrom.getTime()) || occupiedFrom >= hourEnd) {
          return false;
        }

        if (!booking.exitTime) {
          return true;
        }

        const occupiedUntil = new Date(booking.exitTime);

        return Number.isNaN(occupiedUntil.getTime()) || occupiedUntil >= hourStart;
      }).length;

      return totalParkingSlots
        ? Math.round((occupiedSlots / totalParkingSlots) * 100)
        : 0;
    });
  });

  const heroCards = [
    { label: 'Sedan Capacity', value: stats.sedanSlots, icon: FaCarAlt },
    { label: 'CSUV Capacity', value: stats.csuvSlots, icon: FaCarSide },
    { label: 'Today Occupancy', value: `${occupiedPercentage}%`, icon: FaRoute },
  ];

  const closeOperationModal = () => {
    setOperation(null);
    setEmployeeSearchText('');
    setIsEmployeeResultsOpen(false);
    setSlotSearchText('');
    setIsSlotResultsOpen(false);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-950">Dashboard</h1>

      {/* Live Parking Slots */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-base font-bold text-slate-950">Live Parking Slots</h2>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className="flex items-center gap-3 text-sm font-semibold text-slate-600"
              role="radiogroup"
              aria-label="Filter parking slots by basement"
            >
              {basementFilters.map((basement) => (
                <label key={basement} className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="radio"
                    name="basementFilter"
                    value={basement}
                    checked={basementFilter === basement}
                    onChange={(event) => {
                      setBasementFilter(event.target.value);
                      setSlotPage(1);
                    }}
                    className="accent-teal-700"
                  />
                  {basement}
                </label>
              ))}
            </div>

            <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-700">
              {basementFilteredSlots.length} slots
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          {liveParkingSlots.map((slot) => (
            <ParkingSlotCard key={slot.id} slot={slot} bookings={bookings} />
          ))}
        </div>

        {basementFilteredSlots.length === 0 && (
          <p className="py-8 text-center text-sm font-semibold text-slate-500">
            No slots match the selected filter.
          </p>
        )}

        {basementFilteredSlots.length > 0 && (
          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-slate-500">
              Showing {slotPageRangeStart}&ndash;{slotPageRangeEnd} of {basementFilteredSlots.length} slots
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentSlotPage === 1}
                onClick={() => setSlotPage((page) => Math.max(1, page - 1))}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-slate-500">
                Page {currentSlotPage} of {totalSlotPages}
              </span>
              <button
                type="button"
                disabled={currentSlotPage === totalSlotPages}
                onClick={() => setSlotPage((page) => Math.min(totalSlotPages, page + 1))}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Live Status Bar */}
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-sm">
        <div className="grid gap-4 p-4 text-white lg:grid-cols-[1fr_320px] lg:p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Live  Status</p>
            <h2 className="mt-2 text-xl font-bold tracking-normal sm:text-2xl">Tower A Parking </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {heroCards.map((item) => (
                <div key={item.label} className="rounded-lg border border-white/10 bg-white/10 p-3">
                  <item.icon className="text-lg text-teal-300" />
                  <p className="mt-2 text-xl font-bold">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-300">Available Now</p>
                <p className="mt-1 text-3xl font-bold text-white">{stats.availableSlots}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-400/20 text-teal-200">
                <FaParking className="text-xl" />
              </div>
            </div>
            <div className="mt-4 h-2.5 rounded-full bg-white/10">
              <div className="h-2.5 rounded-full bg-teal-300" style={{ width: `${availablePercentage}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-300">{availablePercentage}% of total slots are available for allocation.</p>
          </div>
        </div>
      </section>

      {/* Tower A Parking Summary & Vehicle Type Occupancy */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Tower A Summary Table */}
        <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-950">Tower A</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Available / total slot counts per vehicle type across each basement.
            </p>
          </div>

          <div className="mt-3 flex-1 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-bold">Vehicle Type</th>
                  {towerBasements.map((basement) => (
                    <th key={basement} className="px-4 py-3 text-center font-bold">
                      {basement}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {towerSummary.map((row) => (
                  <tr key={row.vehicleType} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.vehicleType}</td>
                    {row.basementCounts.map(({ basement, available, total }) => (
                      <td key={basement} className="px-4 py-3 text-center">
                        <span className="font-bold text-emerald-600">{available}</span>
                        <span className="text-slate-400"> / </span>
                        <span className="font-bold text-slate-950">{total}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Type Occupancy */}
        <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-base font-bold text-slate-950">Vehicle Type Occupancy</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Live occupied and available slot counts by vehicle type.
            </p>
          </div>

          <div className="mt-3 h-44 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={occupancyChartData}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="vehicleType" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={30} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />

                <Bar
                  dataKey="occupied"
                  name="Occupied"
                  fill="#0f766e"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="available"
                  name="Available"
                  fill="#38bdf8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Quick Action Tiles: Reserved Parking / Vehicle Entry / Vehicle Exit */}
      <section className="grid grid-cols-3 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.title}
            className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md sm:p-3.5"
            type="button"
            onClick={() => {
              setOperation(action.title);
              setOperationError('');
              setSelectedEmployeeId('');
              setSelectedSlotId('');
              setEmployeeSearchText('');
              setIsEmployeeResultsOpen(false);
              setSlotSearchText('');
              setIsSlotResultsOpen(false);
            }}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${action.accent}`}>
              <action.icon className="text-sm" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold text-slate-950">{action.title}</h2>
              <p className="hidden truncate text-xs text-slate-500 sm:block">{action.description}</p>
            </div>
            <FaArrowRight className="hidden shrink-0 text-xs text-slate-300 transition group-hover:translate-x-1 group-hover:text-teal-700 sm:block" />
          </button>
        ))}
      </section>

      {/* Statistics Cards */}
      <section>
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Statistics</h2>
            <p className="text-sm text-slate-500">Calculated from local parking data.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>
      </section>

      {/* Operations Overview */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-950">Operations Overview</h2>
          <p className="mt-0.5 text-sm text-slate-500">Live vehicle activity from current bookings.</p>
        </div>

        <div className="mt-3 max-h-64 overflow-hidden rounded-lg border border-slate-200">
          <div className="scrollbar-thin max-h-64 overflow-auto">
            <table className="min-w-[760px] w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-bold">Vehicle No.</th>
                  <th className="px-4 py-3 font-bold">Employee</th>
                  <th className="px-4 py-3 font-bold">Slot</th>
                  <th className="px-4 py-3 font-bold">Type</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {operationsOverview.length > 0 ? (
                  operationsOverview.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.vehicleNumber}</td>
                      <td className="px-4 py-3 text-slate-700">{row.employeeName}</td>
                      <td className="px-4 py-3 text-slate-700">{row.slotNumber}</td>
                      <td className="px-4 py-3 text-slate-700">{row.vehicleType}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${getBookingStatusTone(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{row.time}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                      No booking activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Parking Overview */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-bold text-slate-950">Parking Overview</h2>
          <p className="text-sm text-slate-500">Zone availability and allocation mix.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-950">Parking Zone Availability</h3>
            <div className="mt-4 space-y-4">
              {zoneAvailability.map((zone) => (
                <div key={zone.zone}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">{zone.zone}</span>
                    <span className="font-bold text-slate-950">{zone.percentage}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-teal-700" style={{ width: `${zone.percentage}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {zone.available} available of {zone.total} slots
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-950">Allocation Summary</h3>
            <div className="mt-4 space-y-3">
              {allocationSummary.map((item) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-600">{item.status}</span>
                    <span className="font-bold text-slate-950">{item.count}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-teal-700" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-slate-950 p-3 text-white">
              <p className="text-xs font-semibold text-teal-200">System Health</p>
              <p className="mt-1 text-lg font-bold">98.7%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Vehicle Activity */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-950">Recent Vehicle Activity</h2>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {recentActivity.map((activity) => (
            <div key={`${activity.time}-${activity.vehicle}`} className="flex gap-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-teal-700 shadow-sm">
                <activity.icon className="text-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-xs font-bold text-slate-950">{activity.vehicle}</p>
                  <p className="shrink-0 text-[11px] font-semibold text-slate-400">{activity.time}</p>
                </div>
                <p className="mt-0.5 text-xs text-slate-600">{activity.action} &middot; {activity.zone}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Traffic Heatmap */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Traffic Heatmap</h2>
            <p className="text-sm text-slate-500">Demo occupancy intensity by day and time.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-200" />
            Low
            <span className="ml-2 h-2.5 w-2.5 rounded-sm bg-rose-600" />
            High
          </div>
        </div>

        <div className="scrollbar-thin mt-3 overflow-x-auto">
          <div className="min-w-[1200px]">
            <div className="grid grid-cols-[70px_repeat(24,minmax(42px,1fr))] gap-1">
              <div />
              {heatmapTimes.map((time) => (
                <div key={time} className="text-center text-[10px] font-bold text-slate-400">
                  {time}
                </div>
              ))}

              {heatmapDays.map((day, dayIndex) => (
                <div key={day} className="contents">
                  <div className="flex items-center text-xs font-bold text-slate-600">
                    {day}
                  </div>

                  {heatmapData[dayIndex].map((value, valueIndex) => (
                    <div
                      key={`${day}-${heatmapTimes[valueIndex]}`}
                      className={`flex h-7 items-center justify-center rounded text-[10px] font-bold ${getHeatmapTone(value, dayIndex === currentWeekdayIndex)}`}
                      title={`${day} ${heatmapTimes[valueIndex]}: ${value}% occupied`}
                    >
                      {value}%
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Employee Summary */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Employee Summary</h2>
            <p className="text-sm text-slate-500">Search employee parking records saved in browser localStorage.</p>
          </div>
          <label className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-teal-600 focus-within:bg-white lg:max-w-md">
            <FaUsers className="shrink-0 text-slate-400" />
            <input
              className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none"
              placeholder="Search employee ID, name, mobile number..."
              value={employeeQuery}
              onChange={(event) => setEmployeeQuery(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-4 max-h-64 overflow-hidden rounded-lg border border-slate-200">
          <div className="scrollbar-thin max-h-64 overflow-auto">
            <table className="min-w-[760px] w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-bold">Employee ID</th>
                  <th className="px-4 py-3 font-bold">Employee Name</th>
                  <th className="px-4 py-3 font-bold">Department</th>
                  <th className="px-4 py-3 font-bold">Mobile Number</th>
                  <th className="px-4 py-3 font-bold">Vehicle Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee, index) => (
                    <tr key={getEmployeeValue(employee, 'employeeId') || index} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{getEmployeeValue(employee, 'employeeId') || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{getEmployeeValue(employee, 'employeeName') || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{getEmployeeValue(employee, 'department') || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{getEmployeeValue(employee, 'mobileNumber') || '-'}</td>
                      <td className="px-4 py-3 text-slate-700">{getEmployeeValue(employee, 'vehicleNumber') || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                      No employee records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Modal
        isOpen={Boolean(operation)}
        onClose={closeOperationModal}
        title={operation || ''}
        size={operation === 'Reserved Parking' ? 'sm' : 'lg'}
      >
        {operation === 'Reserved Parking' && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();

              if (!selectedEmployee || !selectedSlotId) {
                setOperationError('Select an employee and an available parking slot.');
                return;
              }

              try {
                createBooking({ employee: selectedEmployee, slotId: selectedSlotId });
                setOperation(null);
              } catch (error) {
                setOperationError(error.message);
              }
            }}
          >
            <div className="relative">
              <label className="text-sm font-bold text-slate-700">Employee</label>

              {/* Single searchable autocomplete input. Typing filters by
                  Employee Name or Vehicle Number in real time; clicking a
                  result selects that employee immediately - no separate
                  dropdown, no "Select Employee" click. Booking validation
                  still reads from `selectedEmployeeId` exactly as before. */}
              <div className="relative mt-2">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                <input
                  type="text"
                  value={employeeSearchText}
                  onChange={(event) => {
                    setEmployeeSearchText(event.target.value);
                    setSelectedEmployeeId('');
                    setIsEmployeeResultsOpen(true);
                  }}
                  onFocus={() => setIsEmployeeResultsOpen(true)}
                  onBlur={() => {
                    // Small delay so a click on a result registers before
                    // the list closes.
                    window.setTimeout(() => setIsEmployeeResultsOpen(false), 120);
                  }}
                  placeholder="Search Employee by Name or Vehicle Number..."
                  autoComplete="off"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-teal-600"
                />
              </div>

              {isEmployeeResultsOpen && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {employeeAutocompleteResults.length > 0 ? (
                    employeeAutocompleteResults.map((employee) => {
                      const id = getEmployeeValue(employee, 'employeeId');
                      const name = getEmployeeValue(employee, 'employeeName');
                      const vehicleNumber = getEmployeeValue(employee, 'vehicleNumber');

                      return (
                        <button
                          key={id}
                          type="button"
                          // onMouseDown fires before the input's onBlur, so
                          // the click registers before the list closes.
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setSelectedEmployeeId(id);
                            setEmployeeSearchText(`${name} - ${id} (${vehicleNumber || 'No vehicle'})`);
                            setIsEmployeeResultsOpen(false);
                            // Vehicle-type filtering depends on which
                            // employee is selected, so any previously
                            // chosen slot is no longer guaranteed valid.
                            setSelectedSlotId('');
                            setSlotSearchText('');
                            setIsSlotResultsOpen(false);
                          }}
                          className="flex w-full flex-col items-start gap-0.5 border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-teal-50"
                        >
                          <span className="text-sm font-bold text-slate-900">{name}</span>
                          <span className="text-xs font-semibold text-slate-500">
                            {id} &middot; {vehicleNumber || 'No vehicle'}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <p className="px-3 py-3 text-sm font-semibold text-slate-500">
                      No matching employees found.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="text-sm font-bold text-slate-700">Available Parking Slot</label>

              {/* Same autocomplete pattern as Employee search above - typing
                  a slot number filters live, clicking a result selects it.
                  The candidate list is already narrowed to the selected
                  employee's registered vehicle type. */}
              <div className="relative mt-2">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                <input
                  type="text"
                  value={slotSearchText}
                  onChange={(event) => {
                    setSlotSearchText(event.target.value);
                    setSelectedSlotId('');
                    setIsSlotResultsOpen(true);
                  }}
                  onFocus={() => setIsSlotResultsOpen(true)}
                  onBlur={() => {
                    window.setTimeout(() => setIsSlotResultsOpen(false), 120);
                  }}
                  placeholder="Search by slot number (e.g. B1-P01-S1)..."
                  autoComplete="off"
                  disabled={!selectedEmployee}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-teal-600 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>

              {isSlotResultsOpen && selectedEmployee && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                  {slotAutocompleteResults.length > 0 ? (
                    slotAutocompleteResults.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setSelectedSlotId(slot.id);
                          setSlotSearchText(`${slot.slotNumber} - ${slot.basement} / ${slot.parkingType}`);
                          setIsSlotResultsOpen(false);
                        }}
                        className="flex w-full items-center justify-between border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-teal-50"
                      >
                        <span className="text-sm font-bold text-slate-900">{slot.slotNumber}</span>
                        <span className="text-xs font-semibold text-slate-500">
                          {slot.basement} &middot; {slot.vehicleSlotType}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-3 text-sm font-semibold text-slate-500">
                      No matching {employeeVehicleType || ''} slots found.
                    </p>
                  )}
                </div>
              )}

              {!selectedEmployee && (
                <p className="mt-1.5 text-xs font-semibold text-slate-400">
                  Select an employee first to see compatible slots.
                </p>
              )}
            </div>

            {operationError && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                {operationError}
              </p>
            )}

            <button
              className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800"
              type="submit"
            >
              Confirm Reservation
            </button>
          </form>
        )}

        {operation === 'Vehicle Entry' && (
          <VehicleList
            bookings={bookedVehicles}
            emptyMessage="No booked vehicles are waiting for entry."
            actionLabel="Mark Entered"
            error={operationError}
            onAction={(booking) => {
              try {
                markVehicleEntered(booking.id);
                setOperation(null);
              } catch (error) {
                setOperationError(error.message);
              }
            }}
          />
        )}

        {operation === 'Vehicle Exit' && (
          <VehicleList
            bookings={enteredVehicles}
            emptyMessage="No entered vehicles are ready for exit."
            actionLabel="Mark Exited"
            error={operationError}
            onAction={(booking) => {
              try {
                markVehicleExited(booking.id);
                setOperation(null);
              } catch (error) {
                setOperationError(error.message);
              }
            }}
          />
        )}
      </Modal>

    </div>
  );
}

function VehicleList({ bookings, emptyMessage, actionLabel, onAction, error }) {
  if (!bookings.length) {
    return (
      <p className="py-6 text-center text-sm font-semibold text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-bold text-slate-950">
              {booking.vehicleNumber || 'Vehicle not recorded'}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {booking.employeeName} - {booking.slotNumber} ({booking.basement})
            </p>
          </div>

          <button
            type="button"
            onClick={() => onAction(booking)}
            className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800"
          >
            {actionLabel}
          </button>
        </div>
      ))}
    </div>
  );
}
