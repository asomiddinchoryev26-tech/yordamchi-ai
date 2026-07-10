/**
 * services/platform.service.ts
 * Platform egasi (Super Admin) uchun butun tizim boshqaruvi.
 * Barcha RPC'lar DB tomonda is_super_admin() bilan himoyalangan (035).
 *   platform_stats()      → platforma bo'yicha umumiy raqamlar
 *   list_organizations()  → har bir tashkilot (a'zolar, reja, holat)
 *   set_org_status()      → tashkilotni bloklash / faollashtirish
 *   set_org_plan()        → tashkilot rejasini o'zgartirish (override)
 */

import { supabase } from '@/lib/supabase'

// RPC'lar generatsiya qilingan tiplarda yo'q — loose cast.
const sbRpc = supabase as unknown as {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>
}

export type PlatformStats = {
  organizations:    number
  total_users:      number
  students:         number
  teachers:         number
  admins:           number
  paid_orgs:        number
  total_revenue:    number
  pending_payments: number
}

export type OrgRow = {
  id:              string
  name:            string
  plan_type:       'free' | 'premium' | 'pro'
  plan_expires_at: string | null
  status:          'active' | 'suspended'
  join_code:       string
  members:         number
  students:        number
  teachers:        number
  created_at:      string
}

export type OrgPlan = 'free' | 'premium' | 'pro'

export const platformService = {
  stats: async (): Promise<PlatformStats | null> => {
    const { data, error } = await sbRpc.rpc('platform_stats')
    if (error || !data) return null
    return data as PlatformStats
  },

  listOrganizations: async (): Promise<OrgRow[]> => {
    const { data, error } = await sbRpc.rpc('list_organizations')
    if (error || !Array.isArray(data)) return []
    return data as OrgRow[]
  },

  /** Tashkilotni bloklash ('suspended') yoki faollashtirish ('active'). */
  setOrgStatus: async (orgId: string, status: 'active' | 'suspended'): Promise<void> => {
    const { error } = await sbRpc.rpc('set_org_status', { p_org: orgId, p_status: status })
    if (error) throw new Error(error.message ?? 'Holatni o‘zgartirishda xatolik')
  },

  /** Tashkilot rejasini to'g'ridan-to'g'ri o'rnatish (comp / override). */
  setOrgPlan: async (orgId: string, plan: OrgPlan, months = 1): Promise<void> => {
    const { error } = await sbRpc.rpc('set_org_plan', { p_org: orgId, p_plan: plan, p_months: months })
    if (error) throw new Error(error.message ?? 'Rejani o‘zgartirishda xatolik')
  },
}
