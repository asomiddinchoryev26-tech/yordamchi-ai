import type { UserRole } from '@/types/auth.types'

const roleHierarchy: Record<UserRole, number> = {
  student: 1,
  teacher: 2,
  admin: 3,
}

export function canAccess(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin'
}

export function isTeacherOrAbove(role: UserRole): boolean {
  return roleHierarchy[role] >= roleHierarchy['teacher']
}

export function isStudent(role: UserRole): boolean {
  return role === 'student'
}
