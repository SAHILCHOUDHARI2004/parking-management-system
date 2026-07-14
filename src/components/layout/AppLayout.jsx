import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  FaChartPie,
  FaChevronDown,
  FaParking,
  FaSignOutAlt,
  FaUserCircle,
  FaUserTie,
  FaBuilding,
} from 'react-icons/fa';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: FaChartPie },
  { label: 'Parking Slot Master', path: '/parking-slot-master', icon: FaParking },
  { label: 'Employee Master', path: '/employee-master', icon: FaUserTie },
];

export default function AppLayout() {
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const navigate = useNavigate();

  // Close the Admin User dropdown when clicking anywhere outside of it.
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
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-900/20">
              <FaParking className="text-xl" />
            </div>
            <div>
              <p className="text-base font-extrabold leading-tight text-slate-950">
                Smart<span className="text-blue-600">Park</span>
              </p>
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

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-900/20">
                <FaParking />
              </div>
              <div>
                <p className="font-extrabold text-slate-950">
                  Smart<span className="text-blue-600">Park</span>
                </p>
                <p className="text-xs text-slate-500">Enterprise Console</p>
              </div>
            </div>

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
              {/* Admin User — click to reveal a Logout dropdown */}
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
                    <p className="text-sm font-bold text-slate-950">Admin User</p>
                    <p className="text-xs text-slate-500">Facility Manager</p>
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
