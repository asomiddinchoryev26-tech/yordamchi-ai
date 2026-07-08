/**
 * services/roleTemplate.service.ts
 * Admin rol shablonlari (admin_role_templates, 026). Super Admin preset yaratadi
 * va adminga biriktiradi — mavjud adminPermission.service orqali (dublikat yo'q).
 */

import { supabase } from '@/lib/supabase'
import { adminPermissionService } from './adminPermission.service'
import type { AdminPermission } from '@/types/admin.types'

const sb = supabase as unknown as { from: (t: string) => any }

export type RoleTemplateRow = {
  id: string; name: string; permissions: AdminPermission[]
  created_by: string | null; created_at: string
}

export const roleTemplateService = {
  list: async (): Promise<RoleTemplateRow[]> => {
    try {
      const { data } = await sb.from('admin_role_templates').select('*').order('created_at', { ascending: false })
      return (data ?? []) as RoleTemplateRow[]
    } catch { return [] }
  },

  create: async (name: string, permissions: AdminPermission[], createdBy: string): Promise<void> => {
    await sb.from('admin_role_templates').insert({ name, permissions, created_by: createdBy })
  },

  update: async (id: string, patch: { name?: string; permissions?: AdminPermission[] }): Promise<void> => {
    await sb.from('admin_role_templates').update(patch).eq('id', id)
  },

  remove: async (id: string): Promise<void> => {
    await sb.from('admin_role_templates').delete().eq('id', id)
  },

  /** Shablonni adminga biriktirish → mavjud ruxsat tizimiga yozadi. */
  assign: async (adminId: string, template: RoleTemplateRow, byUserId: string): Promise<void> => {
    await adminPermissionService.setPermissions(adminId, template.permissions, byUserId)
  },
}
