import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/routes/paths'
import Loader from '@/components/common/Loader'

export default function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    // Login'dan keyin foydalanuvchi so'ragan sahifaga qaytadi
    return <Navigate to={PATHS.LOGIN} state={{ from: location }} replace />
  }

  return <Outlet />
}
