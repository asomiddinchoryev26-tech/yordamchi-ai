/**
 * services/adminPermission.service.ts
 * Super Admin + cheklangan admin ruxsatlarini boshqarish. Mavjud 'admin' roliga
 * qo'shimcha (additiv). Super admin — to'liq huquq; cheklangan admin — faqat
 * ruxsat berilgan bo'limlar. RLS: faqat super admin boshqaradi (025).
 */

import { supabase } from '@/lib/supabase'
import { ADMIN_PERMISSIONS, type AdminPermission, type AdminListItem, type AdminPermissionRow } from '@/types/admin.types'

const sb = supabase as unknown as { from: (t: string) => any }

export const adminPermissionService = {
  /** Joriy foydalanuvchi super adminmi. */
  isSuperAdmin: async (userId: string): Promise<boolean> => {
    try {
      const { data } = await sb.from('profiles').select('is_super_admin').eq('id', userId).maybeSingle()
      return Boolean(data?.is_super_admin)
    } catch { return false }
  },

  /** Foydalanuvchining ruxsatlari (super admin → barchasi). */
  getPermissions: async (userId: string): Promise<AdminPermission[]> => {
    if (await adminPermissionService.isSuperAdmin(userId)) return [...ADMIN_PERMISSIONS]
    try {
      const { data } = await sb.from('admin_permissions').select('permissions, status').eq('admin_id', userId).maybeSingle()
      if (!data || data.status === 'disabled') return []
      return (data.permissions ?? []) as AdminPermission[]
    } catch { return [] }
  },

  hasPermission: async (userId: string, perm: AdminPermission): Promise<boolean> => {
    const perms = await adminPermissionService.getPermissions(userId)
    return perms.includes(perm)
  },

  /** Barcha adminlar + ruxsatlari (faqat super admin ko'radi — RLS). */
  listAdmins: async (): Promise<AdminListItem[]> => {
    try {
      const [adminsRes, permsRes] = await Promise.all([
        sb.from('profiles').select('id, full_name, email, is_super_admin').eq('role', 'admin'),
        sb.from('admin_permissions').select('*'),
      ])
      const admins = (adminsRes.data ?? []) as { id: string; full_name: string | null; email: string | null; is_super_admin: boolean }[]
      const perms  = (permsRes.data  ?? []) as AdminPermissionRow[]
      const byId = new Map(perms.map(p => [p.admin_id, p]))
      return admins.map(a => {
        const p = byId.get(a.id)
        return {
          adminId: a.id, name: a.full_name ?? 'Admin', email: a.email ?? '',
          isSuper: a.is_super_admin,
          status: p?.status ?? 'active',
          permissions: a.is_super_admin ? [...ADMIN_PERMISSIONS] : ((p?.permissions ?? []) as AdminPermission[]),
        }
      })
    } catch { return [] }
  },

  /** Admin ruxsatlarini o'rnatish (super admin). */
  setPermissions: async (adminId: string, permissions: AdminPermission[], createdBy: string): Promise<void> => {
    await sb.from('admin_permissions').upsert(
      { admin_id: adminId, permissions, created_by: createdBy, updated_at: new Date().toISOString() },
      { onConflict: 'admin_id' },
    )
  },

  /** Adminni yoqish/o'chirish. */
  setStatus: async (adminId: string, status: 'active' | 'disabled'): Promise<void> => {
    await sb.from('admin_permissions').upsert(
      { admin_id: adminId, status, updated_at: new Date().toISOString() },
      { onConflict: 'admin_id' },
    )
  },
}
