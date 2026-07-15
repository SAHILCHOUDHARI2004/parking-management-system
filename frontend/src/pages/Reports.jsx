import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaHistory, FaRegCalendarCheck, FaSignInAlt, FaSignOutAlt, FaBan } from 'react-icons/fa';
import PageHeader from '../components/ui/PageHeader.jsx';
import Pagination from '../components/Pagination.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { api } from '../api/client.js';

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const pageSize = 10;

  // Load Dashboard statistics
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await api('/api/dashboard/stats');
      setStats(data);
      setStatsError('');
    } catch (err) {
      setStatsError(err.message || 'Failed to load stats summary');
    } finally {
      setStatsLoading(false);
    }
  };

  // Load Audit logs
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const url = `/api/audit-logs?page=${page}&page_size=${pageSize}` +
        (search ? `&search=${encodeURIComponent(search)}` : '') +
        (actionFilter ? `&action=${encodeURIComponent(actionFilter)}` : '');
      const data = await api(url);
      setLogs(data.items || []);
      setTotalItems(data.total || 0);
      setLogsError('');
    } catch (err) {
      setLogsError(err.message || 'Failed to load audit logs');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, search, actionFilter]);

  const totalPages = Math.ceil(totalItems / pageSize);

  const getActionBadge = (action) => {
    switch (action) {
      case 'Create':
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700"><FaRegCalendarCheck className="text-[10px]" /> Reserved</span>;
      case 'Entry':
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700"><FaSignInAlt className="text-[10px]" /> Entered</span>;
      case 'Exit':
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700"><FaSignOutAlt className="text-[10px]" /> Exited</span>;
      case 'Cancel':
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700"><FaBan className="text-[10px]" /> Cancelled</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">{action}</span>;
    }
  };

  const parseDetails = (detailsStr) => {
    try {
      const details = JSON.parse(detailsStr || '{}');
      return (
        <div className="text-xs space-y-0.5 text-slate-600">
          <p><span className="font-semibold text-slate-900">Vehicle:</span> {details.vehicle_number || '-'}</p>
          <p><span className="font-semibold text-slate-900">Slot:</span> {details.slot_number ? `${details.basement} - ${details.slot_number}` : '-'}</p>
          <p><span className="font-semibold text-slate-900">Employee:</span> {details.employee_name ? `${details.employee_name} (${details.employee_id})` : '-'}</p>
        </div>
      );
    } catch {
      return <span className="text-xs text-slate-600">{detailsStr || '-'}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Console Analytics"
        title="Reports & Logs"
        description="Monitor full-scale facility occupancy stats, booking volumes, and searchable/filterable security logs."
      />

      {/* Summary Cards */}
      {statsLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4 shadow-sm h-28" />
          ))}
        </div>
      ) : statsError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-700">
          {statsError}
        </div>
      ) : stats && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Bookings</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{stats.bookings?.total || 0}</p>
            <p className="mt-1 text-xs text-slate-500">All-time bookings logged</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Bookings</p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-600">{stats.bookings?.active || 0}</p>
            <p className="mt-1 text-xs text-slate-500">Vehicles reserved or inside</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed Sessions</p>
            <p className="mt-2 text-3xl font-extrabold text-teal-600">{stats.bookings?.completed || 0}</p>
            <p className="mt-1 text-xs text-slate-500">Checked out vehicles</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Cancelled Bookings</p>
            <p className="mt-2 text-3xl font-extrabold text-rose-600">{stats.bookings?.cancelled || 0}</p>
            <p className="mt-1 text-xs text-slate-500">Unused reserved allocations</p>
          </div>
        </section>
      )}

      {/* Audit Logs Table Card */}
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <FaHistory className="text-slate-400" />
            <h2 className="text-base font-bold text-slate-900">System Activity Audit Log</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-within:border-teal-600 focus-within:bg-white">
              <FaSearch className="text-slate-400 shrink-0" />
              <input
                className="w-full border-0 bg-transparent outline-none text-slate-900 placeholder-slate-400"
                placeholder="Search action, vehicle, employee..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </label>

            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <FaFilter className="text-slate-400 shrink-0" />
              <select
                className="border-0 bg-transparent outline-none text-slate-700 font-semibold"
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Actions</option>
                <option value="Create">Create (Reserve)</option>
                <option value="Entry">Entry (Check-in)</option>
                <option value="Exit">Exit (Check-out)</option>
                <option value="Cancel">Cancel</option>
              </select>
            </label>
          </div>
        </div>

        {logsError ? (
          <div className="p-8 text-center text-sm font-semibold text-rose-700">
            {logsError}
          </div>
        ) : logsLoading ? (
          <div className="flex py-20 justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-teal-700" />
          </div>
        ) : logs.length > 0 ? (
          <div>
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-bold">Log ID</th>
                    <th className="px-4 py-3 font-bold">Action</th>
                    <th className="px-4 py-3 font-bold">Performed By</th>
                    <th className="px-4 py-3 font-bold">Activity Details</th>
                    <th className="px-4 py-3 font-bold">Timestamp (UTC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 font-semibold text-slate-700">#{log.id}</td>
                      <td className="px-4 py-4">{getActionBadge(log.action)}</td>
                      <td className="px-4 py-4 font-medium text-slate-900">{log.performed_by?.username || 'System'}</td>
                      <td className="px-4 py-4">{parseDetails(log.details)}</td>
                      <td className="px-4 py-4 text-xs font-mono text-slate-600">
                        {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalItems}
              pageSize={pageSize}
            />
          </div>
        ) : (
          <p className="py-20 text-center font-semibold text-slate-500">No activity logs found matching the query.</p>
        )}
      </section>
    </div>
  );
}
