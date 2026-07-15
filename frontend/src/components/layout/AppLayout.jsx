import { useEffect, useRef, useState, useMemo } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  FaCarSide,
  FaChartPie,
  FaChevronDown,
  FaParking,
  FaSignOutAlt,
  FaUserCircle,
  FaUserTie,
  FaBuilding,
  FaFileAlt,
  FaCog,
} from 'react-icons/fa';

const allNavItems = [
  { label: 'Dashboard', path: '/dashboard', icon: FaChartPie, roles: ['Admin', 'Security', 'Employee'] },
  { label: 'Parking Slot Master', path: '/parking-slot-master', icon: FaParking, roles: ['Admin', 'Security'] },
  { label: 'Employee Master', path: '/employee-master', icon: FaUserTie, roles: ['Admin', 'Security'] },
  // { label: 'Reports', path: '/reports', icon: FaFileAlt, roles: ['Admin', 'Security', 'Employee'] },
  // { label: 'Settings', path: '/settings', icon: FaCog, roles: ['Admin', 'Security', 'Employee'] },
];


export default function AppLayout({ user, onLogout }) {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const navigate = useNavigate();

  const navItems = useMemo(() => {
    return allNavItems.filter((item) => item.roles.includes(user?.role || 'Employee'));
  }, [user]);

  // Close the user profile dropdown when clicking anywhere outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setIsAccountMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    setIsAccountMenuOpen(false);
    onLogout();
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-700 text-white">
              <FaCarSide className="text-xl" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-950">ParkWise PMS</p>
              <p className="text-xs font-medium text-slate-500">Enterprise Console</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`
                }
              >
                <item.icon className="text-lg" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="m-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <FaBuilding className="text-xl text-teal-700" />
              <div>
                <p className="text-sm font-bold text-slate-900">Tower A</p>
                <p className="text-xs text-slate-500">3 basements monitored</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main viewport */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-700 text-white">
                <FaCarSide />
              </div>
              <div>
                <p className="font-bold text-slate-950">ParkWise PMS</p>
                <p className="text-xs text-slate-500">Enterprise Console</p>
              </div>
            </div>

            {/* Mobile navigation header */}
            <nav className="flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                      isActive ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`
                  }
                >
                  <item.icon />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden lg:block w-64"></div>

            <div className="flex items-center justify-end gap-3">
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen((open) => !open)}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 transition hover:bg-slate-50"
                  aria-haspopup="true"
                  aria-expanded={isAccountMenuOpen}
                >
                  <FaUserCircle className="text-2xl text-slate-400" />
                  <div className="hidden text-left sm:block">
                    <p className="text-sm font-bold text-slate-950">{user?.name || user?.username || 'Admin User'}</p>
                    <p className="text-xs text-slate-500">{user?.role || 'Staff'}</p>
                  </div>
                  <FaChevronDown
                    className={`ml-1 hidden text-xs text-slate-400 transition-transform duration-200 sm:block ${
                      isAccountMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isAccountMenuOpen && (
                  <div className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-rose-600"
                    >
                      <FaSignOutAlt className="text-sm" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
