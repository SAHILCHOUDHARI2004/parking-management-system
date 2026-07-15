import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ isAuthenticated, isLoading, children }) {
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-navy-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy-200 border-t-teal-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
