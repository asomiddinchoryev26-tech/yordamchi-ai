import { useAuth } from './useAuth'
import type { UserRole } from '@/types/auth.types'

export function usePermissions() {
  const { user } = useAuth()

  function hasRole(role: UserRole): boolean {
    return user?.role === role
  }

  function hasAnyRole(roles: UserRole[]): boolean {
    return roles.some(role => user?.role === role)
  }

  return {
    isAdmin: hasRole('admin'),
    isTeacher: hasRole('teacher'),
    isStudent: hasRole('student'),
    hasRole,
    hasAnyRole,
  }
}
