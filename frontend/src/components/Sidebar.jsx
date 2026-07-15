import { NavLink } from 'react-router-dom'
import {
  MdSpaceDashboard,
  MdOutlineLocalParking,
  MdOutlineAssessment,
  MdOutlineSettings,
  MdClose,
} from 'react-icons/md'
import { FaParking } from 'react-icons/fa'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: MdSpaceDashboard },
  { to: '/parking-slot-master', label: 'Parking Slot Master', icon: MdOutlineLocalParking },
  { to: '/reports', label: 'Reports', icon: MdOutlineAssessment },
  { to: '/settings', label: 'Settings', icon: MdOutlineSettings },
]

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-navy-950/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-navy-900 transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg">
              <FaParking className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-white">Smart Parking</p>
              <p className="text-xs text-navy-300">Management System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon text-navy-300 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <MdClose className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-navy-400">
            Main Menu
          </p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/30'
                    : 'text-navy-200 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4">
          <p className="text-xs text-navy-400">© 2026 Smart Parking Systems</p>
          <p className="text-xs text-navy-500">v1.0.0 · Enterprise Edition</p>
        </div>
      </aside>
    </>
  )
}
