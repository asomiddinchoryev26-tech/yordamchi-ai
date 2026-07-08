import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/routes/paths'
import type { UserRole } from '@/types/auth.types'

interface RoleRouteProps {
  allowedRoles: UserRole[]
}

// Har bir rol uchun "uy" dashboard — noto'g'ri rol boshqa bo'limga kirsa shu yerga qaytariladi
const ROLE_HOME: Record<UserRole, string> = {
  student: PATHS.STUDENT.ROOT,
  teacher: PATHS.TEACHER.ROOT,
  admin:   PATHS.ADMIN.ROOT,
}

export default function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth()

  // Autentifikatsiyadan o'tmagan (odatda PrivateRoute ushlaydi) → login
  if (!user) return <Navigate to={PATHS.LOGIN} replace />

  // Boshqa rolning marshrutiga kirishga urinish → o'z dashboard'iga qaytariladi
  // (masalan: student /admin ni ocholmaydi)
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role]} replace />
  }

  return <Outlet />
}
