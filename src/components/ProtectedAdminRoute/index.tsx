import { Navigate, Outlet } from 'react-router-dom'

import { useAdminAuth } from '../../context/useAdminAuth'

export default function ProtectedAdminRoute() {
  const { isAuthenticated } = useAdminAuth()

  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />
}
