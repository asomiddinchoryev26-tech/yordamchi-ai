/**
 * types/admin.types.ts
 * Super Admin + cheklangan admin ruxsatlari (025 migratsiya).
 */

export const ADMIN_PERMISSIONS = [
  'users_manage', 'teachers_manage', 'students_manage', 'courses_manage',
  'payments_manage', 'premium_manage', 'analytics_view', 'settings_manage',
] as const

export type AdminPermission = typeof ADMIN_PERMISSIONS[number]

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  users_manage:    'Foydalanuvchilar',
  teachers_manage: "O'qituvchilar",
  students_manage: "O'quvchilar",
  courses_manage:  'Kurslar',
  payments_manage: "To'lovlar",
  premium_manage:  'Premium boshqaruvi',
  analytics_view:  'Analitika',
  settings_manage: 'Sozlamalar',
}

export type AdminPermissionRow = {
  id:          string
  admin_id:    string
  permissions: AdminPermission[]
  status:      'active' | 'disabled'
  created_by:  string | null
  created_at:  string
}

export type AdminListItem = {
  adminId:     string
  name:        string
  email:       string
  isSuper:     boolean
  status:      'active' | 'disabled'
  permissions: AdminPermission[]
}
