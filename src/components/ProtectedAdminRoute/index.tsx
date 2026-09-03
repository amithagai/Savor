import { Navigate, Outlet } from 'react-router-dom'

import { useAdminAuth } from '../../context/useAdminAuth'

export default function ProtectedAdminRoute() {
  const { isAuthenticated, isLoading } = useAdminAuth()

  if (isLoading) return null

  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />
}
