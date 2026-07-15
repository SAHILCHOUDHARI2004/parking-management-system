import { useState } from 'react';
import { FaUserCircle, FaBuilding, FaKey, FaDatabase, FaCog } from 'react-icons/fa';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { api } from '../api/client.js';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Change Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Database tool state
  const [dbSuccess, setDbSuccess] = useState('');
  const [dbError, setDbError] = useState('');
  const [dbLoading, setDbLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setPasswordLoading(true);
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
      });
      setPasswordSuccess('Password successfully updated!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    setDbSuccess('');
    setDbError('');
    setDbLoading(true);

    try {
      // Mock seed call or call bulk import with structured slots
      const response = await api('/api/parking-slots/bulk-import', {
        method: 'POST',
        body: JSON.stringify({
          slots: [
            { basement: 'B1', slot_number: 'B1-101', vehicle_type: 'Sedan', parking_type: 'Ground', allocation_type: 'Employee', status: 'Available' },
            { basement: 'B1', slot_number: 'B1-102', vehicle_type: 'Sedan', parking_type: 'Ground', allocation_type: 'Employee', status: 'Available' },
            { basement: 'B2', slot_number: 'B2-201', vehicle_type: 'Sedan', parking_type: 'Puzzle', allocation_type: 'Employee', status: 'Available' },
            { basement: 'B2', slot_number: 'B2-202', vehicle_type: 'CSUV', parking_type: 'Puzzle', allocation_type: 'Employee', status: 'Available' },
            { basement: 'B3', slot_number: 'B3-301', vehicle_type: 'CSUV', parking_type: 'Stack', allocation_type: 'Employee', status: 'Available' }
          ]
        })
      });
      setDbSuccess(`Database seeded successfully! Created: ${response.created}, Updated: ${response.updated}`);
    } catch (err) {
      setDbError(err.message || 'Failed to seed database');
    } finally {
      setDbLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'User Profile', icon: FaUserCircle },
    { id: 'facility', label: 'Facility Configuration', icon: FaBuilding },
    { id: 'security', label: 'Security & Password', icon: FaKey },
    ...(user?.role === 'Admin' ? [{ id: 'database', label: 'Database Tools', icon: FaDatabase }] : [])
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Console Settings"
        title="Settings"
        description="Configure your personal preferences, update passwords, and manage enterprise facility parameters."
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="flex flex-row lg:flex-col overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition shrink-0 lg:w-full ${
                  activeTab === tab.id
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                <tab.icon className="text-base shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Tab content panel */}
        <main className="flex-1 rounded-lg border border-slate-200 bg-white p-6 shadow-sm min-h-[300px]">
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-950 border-b border-slate-100 pb-2">User Profile Summary</h3>
                <p className="mt-1 text-sm text-slate-500">Your account identity info and system permission role.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Username</span>
                  <span className="mt-1 block text-sm font-bold text-slate-900">{user?.username || '-'}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Assigned Role</span>
                  <span className="mt-1 inline-flex items-center rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
                    {user?.role || '-'}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</span>
                  <span className="mt-1 block text-sm font-bold text-slate-900">{user?.email || '-'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'facility' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-950 border-b border-slate-100 pb-2">Facility Parameters</h3>
                <p className="mt-1 text-sm text-slate-500">Parameters of the parking space layout monitored by the console.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-teal-700 font-bold">A</div>
                  <div>
                    <p className="text-sm font-bold text-slate-950">Tower A Facility</p>
                    <p className="text-xs text-slate-500">Main commercial workspace building</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 pt-2">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Basements</p>
                    <p className="mt-1.5 text-lg font-bold text-slate-900">3 levels</p>
                    <p className="text-[10px] text-slate-400">B1, B2, B3</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase">System Sync</p>
                    <p className="mt-1.5 text-lg font-bold text-emerald-600">Online</p>
                    <p className="text-[10px] text-slate-400">PostgreSQL backend</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Sensors Mapped</p>
                    <p className="mt-1.5 text-lg font-bold text-slate-900">12 Cameras</p>
                    <p className="text-[10px] text-slate-400">ANPR OCR enabled</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-950 border-b border-slate-100 pb-2">Change Password</h3>
                <p className="mt-1 text-sm text-slate-500">Update your security password credentials.</p>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Current Password</span>
                  <input
                    type="password"
                    required
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:bg-white"
                    placeholder="Enter current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">New Password</span>
                  <input
                    type="password"
                    required
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:bg-white"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Confirm New Password</span>
                  <input
                    type="password"
                    required
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:bg-white"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </label>

                {passwordError && <p className="text-xs font-semibold text-rose-600">{passwordError}</p>}
                {passwordSuccess && <p className="text-xs font-semibold text-emerald-600">{passwordSuccess}</p>}

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 shadow-sm disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'database' && user?.role === 'Admin' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-950 border-b border-slate-100 pb-2">Administrative Database Tools</h3>
                <p className="mt-1 text-sm text-slate-500">Seed the PostgreSQL database with default slot values for test simulations.</p>
              </div>

              <div className="space-y-4 max-w-md">
                <p className="text-sm text-slate-600">
                  Clicking seed will import a default set of slots (B1-101, B1-102, B2-201, etc.) into the database for rapid staging environments.
                </p>

                {dbError && <p className="text-xs font-semibold text-rose-600">{dbError}</p>}
                {dbSuccess && <p className="text-xs font-semibold text-emerald-600">{dbSuccess}</p>}

                <button
                  onClick={handleSeedDatabase}
                  disabled={dbLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 shadow-sm disabled:opacity-50"
                >
                  <FaDatabase />
                  {dbLoading ? 'Importing...' : 'Seed Default Slots'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
