import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function ProtectedRoute({ children, publicRoute = false, roles, loginPath = '/login' }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (publicRoute) {
    return children
  }
  if (loading) {
    return <p className="auth-loading" role="status">Checking your account…</p>
  }
  if (!user) {
    return <Navigate to={loginPath} replace state={{ from: location }} />
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return children
}
