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
import ParkingSlotCard from '../components/parking/ParkingSlotCard.jsx';
import MetricCard from '../components/ui/MetricCard.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Modal from '../components/Modal.jsx';
import { getEmployeeValue, useEmployees } from '../utils/employeeStorage.js';
import { getParkingStats } from '../utils/parkingStats.js';
import {
  createBooking,
  markVehicleEntered,
  markVehicleExited,
  useParkingStore,
} from '../utils/parkingStorage.js';

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

const heatmapDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const heatmapTimes = ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'];
const heatmapData = [
  [24, 42, 67, 71, 76, 84, 91, 72, 48],
  [28, 46, 69, 74, 79, 87, 93, 76, 52],
  [31, 49, 72, 78, 83, 89, 95, 79, 55],
  [27, 44, 66, 73, 81, 88, 92, 75, 51],
  [34, 52, 75, 82, 86, 94, 97, 84, 62],
  [18, 26, 39, 47, 53, 61, 69, 58, 36],
  [12, 19, 28, 34, 41, 48, 56, 43, 25],
];

const recentActivity = [
  { time: '09:15 AM', vehicle: 'KA01AB1234', action: 'Vehicle Entry', zone: 'Ground', icon: FaSignInAlt },
  { time: '09:40 AM', vehicle: 'KA02CD5678', action: 'Vehicle Exit', zone: 'Puzzle', icon: FaSignOutAlt },
  { time: '10:05 AM', vehicle: 'KA03EF9012', action: 'Vehicle Entry', zone: 'Stack', icon: FaSignInAlt },
  { time: '10:28 AM', vehicle: 'KA04GH3456', action: 'Slot Reserved', zone: 'Ground', icon: FaRegCalendarCheck },
];

function getHeatmapTone(value) {
  if (value >= 85) return 'bg-rose-600 text-white';
  if (value >= 70) return 'bg-amber-500 text-white';
  if (value >= 50) return 'bg-teal-600 text-white';
  if (value >= 30) return 'bg-sky-500 text-white';
  return 'bg-slate-200 text-slate-600';
}

function getZoneSlots(zone, slots) {
  const basementMap = {
    Ground: 'B1',
    Puzzle: 'B2',
    Stack: 'B3',
  };

  return slots.filter((slot) => slot.basement === basementMap[zone]);
}

function getSlotSequence(slot) {
  return Number(slot.id) || 0;
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
  const [slotRange, setSlotRange] = useState('1-10');
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

  const slotRanges = useMemo(() => {
    const highestSlot = Math.max(0, ...parkingData.map(getSlotSequence));
    const ranges = ['All'];

    for (let start = 1; start <= highestSlot; start += 10) {
      ranges.push(`${start}-${start + 9}`);
    }

    return ranges;
  }, [parkingData]);

  const liveSlots = useMemo(() => parkingData.filter((slot) => {
    const matchesBasement = basementFilter === 'All' || slot.basement === basementFilter;
    if (!matchesBasement || slotRange === 'All') return matchesBasement;

    const [start, end] = slotRange.split('-').map(Number);
    const sequence = getSlotSequence(slot);
    return sequence >= start && sequence <= end;
  }), [basementFilter, parkingData, slotRange]);

  const activeBookingBySlot = useMemo(() => new Map(
    bookings
      .filter((booking) => ['Booked', 'Entered'].includes(booking.status))
      .map((booking) => [String(booking.slotId), booking]),
  ), [bookings]);

  const vehicleTypeOccupancy = useMemo(() => ['All', 'Sedan', 'CSUV'].map((vehicleType) => {
    const slots = vehicleType === 'All'
      ? parkingData
      : parkingData.filter((slot) => slot.vehicleSlotType === vehicleType);

    return {
      label: vehicleType,
      occupied: slots.filter((slot) => ['Reserved', 'Allocated'].includes(slot.allocation)).length,
      available: slots.filter((slot) => slot.allocation === 'Available').length,
    };
  }), [parkingData]);
  const availableSlots = parkingData.filter((slot) => slot.allocation === 'Available');
  const selectedEmployee = employees.find((employee) => getEmployeeValue(employee, 'employeeId') === selectedEmployeeId);
  const bookedVehicles = bookings.filter((booking) => booking.status === 'Booked');
  const enteredVehicles = bookings.filter((booking) => booking.status === 'Entered');
  const heroCards = [
    { label: 'Sedan Capacity', value: stats.sedanSlots, icon: FaCarAlt },
    { label: 'CSUV Capacity', value: stats.csuvSlots, icon: FaCarSide },
    { label: 'Today Occupancy', value: `${occupiedPercentage}%`, icon: FaRoute },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Dashboard"
        title="Smart Parking Management System"
        description="Monitor live capacity, quick gate operations, zone availability, vehicle movement, and traffic intensity from one enterprise dashboard."
      />

      <section className="order-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-950 shadow-sm">
        <div className="grid gap-4 p-4 text-white lg:grid-cols-[1fr_300px]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-300">Live Facility Status</p>
            <h2 className="mt-3 text-2xl font-bold tracking-normal sm:text-3xl">Tower A Parking Operations</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Current slot visibility across ground, puzzle, and stack parking zones with demo command actions for front-desk operations.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {heroCards.map((item) => (
                <div key={item.label} className="rounded-lg border border-white/10 bg-white/10 p-3">
                  <item.icon className="text-xl text-teal-300" />
                  <p className="mt-2 text-xl font-bold">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-300">Available Now</p>
                <p className="mt-1 text-4xl font-bold text-white">{stats.availableSlots}</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-teal-400/20 text-teal-200">
                <FaParking className="text-2xl" />
              </div>
            </div>
            <div className="mt-5 h-3 rounded-full bg-white/10">
              <div className="h-3 rounded-full bg-teal-300" style={{ width: `${availablePercentage}%` }} />
            </div>
            <p className="mt-3 text-sm text-slate-300">{availablePercentage}% of total slots are available for allocation.</p>
          </div>
        </div>
      </section>

      <section className="order-2 grid grid-cols-1 gap-3 md:grid-cols-3">
        {quickActions.map((action) => (
          <button
            key={action.title}
            className="group rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
            type="button"
            onClick={() => {
              setOperation(action.title);
              setOperationError('');
              setSelectedEmployeeId('');
              setSelectedSlotId('');
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.accent}`}>
                <action.icon className="text-base" />
              </div>
              <FaArrowRight className="mt-1 text-slate-300 transition group-hover:translate-x-1 group-hover:text-teal-700" />
            </div>
            <h2 className="mt-3 text-base font-bold text-slate-950">{action.title}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">{action.description}</p>
          </button>
        ))}
      </section>

      <section className="order-1">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Parking Overview</h2>
            <p className="text-sm text-slate-500">Calculated from local parking data.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>
      </section>

      <section className="order-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Employees</h2>
            <p className="text-sm text-slate-500">Search employee parking records saved in browser localStorage.</p>
          </div>
          <label className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 focus-within:border-teal-600 focus-within:bg-white lg:max-w-md">
            <FaUsers className="shrink-0 text-slate-400" />
            <input
              className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none"
              placeholder="Search employee ID, name, mobile number..."
              value={employeeQuery}
              onChange={(event) => setEmployeeQuery(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
          <div className="scrollbar-thin overflow-x-auto">
            <table className="min-w-[760px] w-full border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-bold">Employee ID</th>
                  <th className="px-4 py-4 font-bold">Employee Name</th>
                  <th className="px-4 py-4 font-bold">Department</th>
                  <th className="px-4 py-4 font-bold">Mobile Number</th>
                  <th className="px-4 py-4 font-bold">Vehicle Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee, index) => (
                    <tr key={getEmployeeValue(employee, 'employeeId') || index} className="hover:bg-slate-50">
                      <td className="px-4 py-4 font-semibold text-slate-900">{getEmployeeValue(employee, 'employeeId') || '-'}</td>
                      <td className="px-4 py-4 text-slate-700">{getEmployeeValue(employee, 'employeeName') || '-'}</td>
                      <td className="px-4 py-4 text-slate-700">{getEmployeeValue(employee, 'department') || '-'}</td>
                      <td className="px-4 py-4 text-slate-700">{getEmployeeValue(employee, 'mobileNumber') || '-'}</td>
                      <td className="px-4 py-4 text-slate-700">{getEmployeeValue(employee, 'vehicleNumber') || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                      No employee records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="order-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Vehicle Type Occupancy</h2>
            <p className="text-sm text-slate-500">Live parking capacity by vehicle type.</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />Occupied</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Available</span>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {vehicleTypeOccupancy.map((item) => {
            const total = item.occupied + item.available || 1;
            const occupiedWidth = `${Math.round((item.occupied / total) * 100)}%`;

            return (
              <div key={item.label} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-800">{item.label}</span>
                  <span className="text-xs font-semibold text-slate-500">{item.occupied + item.available} slots</span>
                </div>
                <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-emerald-500">
                  <div className="bg-rose-500" style={{ width: occupiedWidth }} />
                </div>
                <div className="mt-2 flex justify-between text-xs font-semibold">
                  <span className="text-rose-600">{item.occupied} occupied</span>
                  <span className="text-emerald-700">{item.available} available</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="order-7 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Traffic Heatmap</h2>
              <p className="text-sm text-slate-500">Demo occupancy intensity by day and time.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="h-3 w-3 rounded-sm bg-slate-200" />
              Low
              <span className="ml-2 h-3 w-3 rounded-sm bg-rose-600" />
              High
            </div>
          </div>

          <div className="scrollbar-thin mt-3 overflow-x-auto">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[80px_repeat(9,minmax(52px,1fr))] gap-1.5">
                <div />
                {heatmapTimes.map((time) => (
                  <div key={time} className="text-center text-xs font-bold text-slate-400">
                    {time}
                  </div>
                ))}
                {heatmapDays.map((day, dayIndex) => (
                  <div key={day} className="contents">
                    <div className="flex items-center text-xs font-bold text-slate-600">{day}</div>
                    {heatmapData[dayIndex].map((value, valueIndex) => (
                      <div
                        key={`${day}-${heatmapTimes[valueIndex]}`}
                        className={`flex h-8 items-center justify-center rounded-md text-[10px] font-bold shadow-sm ${getHeatmapTone(value)}`}
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
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Parking Zone Availability</h2>
            <p className="mt-1 text-sm text-slate-500">Availability grouped by demo zone mapping.</p>
            <div className="mt-3 space-y-3">
              {zoneAvailability.map((zone) => (
                <div key={zone.zone}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">{zone.zone}</span>
                    <span className="font-bold text-slate-950">{zone.percentage}%</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
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
            <h2 className="text-lg font-bold text-slate-950">Recent Vehicle Activity</h2>
            <div className="mt-3 space-y-3">
              {recentActivity.map((activity) => (
                <div key={`${activity.time}-${activity.vehicle}`} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm">
                    <activity.icon />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-slate-950">{activity.vehicle}</p>
                      <p className="shrink-0 text-xs font-semibold text-slate-400">{activity.time}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{activity.action}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">{activity.zone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="order-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Live Slot Cards</h2>
              <p className="text-sm text-slate-500">Filter slots by basement and slot range. Hover a slot for details.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600" role="radiogroup" aria-label="Filter slots by basement">
                {[
                  ['All', 'All'],
                  ['B1', 'Basement 1'],
                  ['B2', 'Basement 2'],
                  ['B3', 'Basement 3'],
                ].map(([value, label]) => (
                  <label key={value} className="flex cursor-pointer items-center gap-1">
                    <input
                      type="radio"
                      name="basement-filter"
                      value={value}
                      checked={basementFilter === value}
                      onChange={(event) => setBasementFilter(event.target.value)}
                      className="accent-teal-700"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <select
                aria-label="Filter slots by range"
                value={slotRange}
                onChange={(event) => setSlotRange(event.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-teal-600"
              >
                {slotRanges.map((range) => <option key={range} value={range}>{range === 'All' ? 'All slots' : range}</option>)}
              </select>
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">{liveSlots.length} slots</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12">
            {liveSlots.map((slot) => (
              <ParkingSlotCard key={slot.id} slot={slot} booking={activeBookingBySlot.get(String(slot.id))} />
            ))}
          </div>
        </div>

        <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Allocation Summary</h2>
            <div className="mt-3 space-y-3">
              {allocationSummary.map((item) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-600">{item.status}</span>
                    <span className="font-bold text-slate-950">{item.count}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-teal-700" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
            <p className="text-sm font-semibold text-teal-200">System Health</p>
            <p className="mt-3 text-3xl font-bold">98.7%</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">Camera feeds, puzzle controllers, and allocation records are operating within expected range.</p>
          </div>
        </aside>
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
                  return <option key={id} value={id}>{id} - {getEmployeeValue(employee, 'employeeName')} ({getEmployeeValue(employee, 'vehicleNumber') || 'No vehicle'})</option>;
                })}
              </select>
              {employees.length === 0 && <p className="mt-2 text-sm text-amber-700">No employees are available. Add an employee in Employee Master first.</p>}
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700">Available parking slot</label>
              <select
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-teal-600"
                value={selectedSlotId}
                onChange={(event) => setSelectedSlotId(event.target.value)}
              >
                <option value="">Select an available slot</option>
                {availableSlots.map((slot) => <option key={slot.id} value={slot.id}>{slot.slotNumber} - {slot.basement} / {slot.parkingType}</option>)}
              </select>
              {availableSlots.length === 0 && <p className="mt-2 text-sm text-amber-700">There are no available parking slots.</p>}
            </div>
            {operationError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{operationError}</p>}
            <button className="w-full rounded-lg bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800" type="submit">Confirm Booking</button>
          </form>
        )}

        {operation === 'Vehicle Entry' && (
          <VehicleList
            bookings={bookedVehicles}
            emptyMessage="No booked vehicles are waiting for entry."
            actionLabel="Mark Entered"
            onAction={(booking) => {
              try { markVehicleEntered(booking.id); setOperation(null); } catch (error) { setOperationError(error.message); }
            }}
            error={operationError}
          />
        )}

        {operation === 'Vehicle Exit' && (
          <VehicleList
            bookings={enteredVehicles}
            emptyMessage="No entered vehicles are ready for exit."
            actionLabel="Mark Exited"
            onAction={(booking) => {
              try { markVehicleExited(booking.id); setOperation(null); } catch (error) { setOperationError(error.message); }
            }}
            error={operationError}
          />
        )}
      </Modal>
    </div>
  );
}

function VehicleList({ bookings, emptyMessage, actionLabel, onAction, error }) {
  if (!bookings.length) return <p className="py-6 text-center text-sm font-semibold text-slate-500">{emptyMessage}</p>;
  return (
    <div className="space-y-3">
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p>}
      {bookings.map((booking) => (
        <div key={booking.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-slate-950">{booking.vehicleNumber || 'Vehicle not recorded'}</p>
            <p className="mt-1 text-sm text-slate-600">{booking.employeeName} - {booking.slotNumber} ({booking.basement})</p>
          </div>
          <button type="button" onClick={() => onAction(booking)} className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800">{actionLabel}</button>
        </div>
      ))}
    </div>
  );
}
