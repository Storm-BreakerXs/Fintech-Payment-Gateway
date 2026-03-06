import { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getStoredUser, isAuthenticated } from '../utils/auth'

interface ProtectedRouteProps {
  children: ReactElement
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const location = useLocation()
  const user = getStoredUser()

  if (!isAuthenticated()) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/auth?mode=login&redirect=${redirect}`} replace />
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
