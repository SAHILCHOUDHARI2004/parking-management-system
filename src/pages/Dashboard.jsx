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
  FaSignInAlt,
  FaSignOutAlt,
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
import PageHeader from '../components/ui/PageHeader.jsx';
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
    title: 'Book Parking',
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
const SLOTS_PER_PAGE = 10;

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

export default function Dashboard() {
  const { slots: parkingData, bookings } = useParkingStore();
  const stats = getParkingStats(parkingData);
  const employees = useEmployees();
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [operation, setOperation] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [operationError, setOperationError] = useState('');
  const [basementFilter, setBasementFilter] = useState('All');
  const [slotPage, setSlotPage] = useState(1);
  const occupiedPercentage = Math.round((stats.occupiedSlots / stats.totalSlots) * 100);
  const availablePercentage = Math.round((stats.availableSlots / stats.totalSlots) * 100);

  const metrics = [
    { title: 'Total Slots', value: stats.totalSlots, icon: FaParking, accent: 'bg-teal-50 text-teal-700', note: 'Complete parking inventory' },
    { title: 'Available Slots', value: stats.availableSlots, icon: FaDoorOpen, accent: 'bg-emerald-50 text-emerald-700', note: `${availablePercentage}% currently open` },
    { title: 'Occupied Slots', value: stats.occupiedSlots, icon: FaCarAlt, accent: 'bg-rose-50 text-rose-700', note: `${occupiedPercentage}% in use or reserved` },
    { title: 'Employee Slots', value: stats.employeeSlots, icon: FaUserTie, accent: 'bg-indigo-50 text-indigo-700', note: 'Assigned for employees' },
    { title: 'Visitor Slots', value: stats.visitorSlots, icon: FaUsers, accent: 'bg-sky-50 text-sky-700', note: 'Reserved for visitors' },
    { title: 'Puzzle Slots', value: stats.puzzleSlots, icon: FaLayerGroup, accent: 'bg-violet-50 text-violet-700', note: 'Mapped to B2 zone' },
    { title: 'Stack Slots', value: stats.stackSlots, icon: FaWarehouse, accent: 'bg-amber-50 text-amber-700', note: 'Mapped to B3 zone' },
    { title: 'Ground Slots', value: stats.groundSlots, icon: FaRoute, accent: 'bg-slate-100 text-slate-700', note: 'Mapped to B1 zone' },
    { title: 'Employees', value: employees.length, icon: FaUserTie, accent: 'bg-teal-50 text-teal-700', note: 'Stored in browser localStorage' },
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

  const availableSlots = parkingData.filter((slot) => slot.allocation === 'Available');
  const selectedEmployee = employees.find((employee) => getEmployeeValue(employee, 'employeeId') === selectedEmployeeId);
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

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Dashboard"
        title="Smart Parking Management System"
        description="Monitor live capacity, quick gate operations, zone availability, vehicle movement, and traffic intensity from one enterprise dashboard."
      />

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-sm">
        <div className="grid gap-4 p-4 text-white lg:grid-cols-[1fr_320px] lg:p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Live Facility Status</p>
            <h2 className="mt-2 text-xl font-bold tracking-normal sm:text-2xl">Tower A Parking Operations</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Current slot visibility across ground, puzzle, and stack parking zones with demo command actions for front-desk operations.
            </p>
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

      {/* Quick Action Tiles */}
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

      {/* Parking Overview */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-bold text-slate-950">Parking Overview</h2>
          <p className="text-sm text-slate-500">Zone availability, allocation mix, and recent gate activity.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
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

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-950">Recent Vehicle Activity</h3>
            <div className="mt-3 space-y-2.5">
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
          </div>
        </div>
      </section>

      {/* Vehicle Type Occupancy */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-950">Vehicle Type Occupancy</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Live occupied and available slot counts by vehicle type.
          </p>
        </div>

        <div className="mt-3 h-44">
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
      </section>

      {/* Live Parking Slots */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Live Parking Slots</h2>
            <p className="text-sm text-slate-500">Generated dynamically from local JSON data. Hover a slot for details.</p>
          </div>

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

      <Modal
        isOpen={Boolean(operation)}
        onClose={() => setOperation(null)}
        title={operation || ''}
        size="lg"
      >
        {operation === 'Book Parking' && (
          <form
            className="space-y-5"
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
            <div>
              <label className="text-sm font-bold text-slate-700">Employee</label>
              <select
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-teal-600"
                value={selectedEmployeeId}
                onChange={(event) => setSelectedEmployeeId(event.target.value)}
              >
                <option value="">Select an employee</option>

                {employees.map((employee) => {
                  const id = getEmployeeValue(employee, 'employeeId');

                  return (
                    <option key={id} value={id}>
                      {id} - {getEmployeeValue(employee, 'employeeName')} (
                      {getEmployeeValue(employee, 'vehicleNumber') || 'No vehicle'})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700">
                Available parking slot
              </label>

              <select
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-teal-600"
                value={selectedSlotId}
                onChange={(event) => setSelectedSlotId(event.target.value)}
              >
                <option value="">Select an available slot</option>

                {availableSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.slotNumber} - {slot.basement} / {slot.parkingType}
                  </option>
                ))}
              </select>
            </div>

            {operationError && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                {operationError}
              </p>
            )}

            <button
              className="w-full rounded-lg bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800"
              type="submit"
            >
              Confirm Booking
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
