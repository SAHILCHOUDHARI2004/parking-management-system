import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

const titles = {
  '/dashboard': 'Dashboard',
  '/parking-slot-master': 'Parking Slot Master',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

export default function MainLayout({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const title = titles[location.pathname] || 'Smart Parking Management System'

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen w-full flex-1 flex-col">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
          onLogout={onLogout}
          title={title}
        />
        <main className="flex-1 animate-fade-in px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
