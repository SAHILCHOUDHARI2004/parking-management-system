import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EmployeeMaster from './pages/EmployeeMaster.jsx';
import Login from './pages/Login.jsx';
import ParkingSlotMaster from './pages/ParkingSlotMaster.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './hooks/useAuth.js';

export default function App() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Login onLogin={login} isAuthenticated={isAuthenticated} />} />
      <Route element={
        <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
          <AppLayout user={user} onLogout={logout} />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/parking-slot-master" element={<ParkingSlotMaster />} />
        <Route path="/employee-master" element={<EmployeeMaster />} />
        {/* <Route path="/reports" element={<Reports />} /> */}
        {/* <Route path="/settings" element={<Settings />} /> */}

      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
