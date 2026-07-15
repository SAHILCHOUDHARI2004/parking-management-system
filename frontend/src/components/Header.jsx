import { useState, useRef, useEffect } from 'react'
import { MdMenu, MdNotificationsNone, MdKeyboardArrowDown, MdLogout, MdPerson } from 'react-icons/md'

export default function Header({ onMenuClick, user, onLogout, title = 'Dashboard' }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-navy-100 bg-white/80 px-4 py-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="btn-icon text-navy-500 hover:bg-navy-50 lg:hidden"
          aria-label="Open sidebar"
        >
          <MdMenu className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-navy-900 sm:text-xl">{title}</h1>
          <p className="hidden text-xs text-navy-400 sm:block">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          className="btn-icon relative text-navy-500 hover:bg-navy-50"
          aria-label="Notifications"
        >
          <MdNotificationsNone className="h-6 w-6" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-teal-500 ring-2 ring-white" />
        </button>

        <div className="hidden h-8 w-px bg-navy-100 sm:block" />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-navy-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-navy-700 to-navy-900 text-sm font-bold text-white">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold leading-tight text-navy-800">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-navy-400">{user?.role || 'Administrator'}</p>
            </div>
            <MdKeyboardArrowDown
              className={`h-4 w-4 text-navy-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 animate-scale-in rounded-xl border border-navy-100 bg-white py-2 shadow-card-hover">
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-navy-600">
                <MdPerson className="h-4 w-4" />
                My Profile
              </div>
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <MdLogout className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
