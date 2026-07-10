/**
 * services/paymentAdmin.service.ts
 * To'lov nazorat markazi (payments — 026, tayyorgarlik). Daromad statistikasi +
 * to'lov tarixi. Premium sonlari mavjud subscription.service'dan (dublikat yo'q).
 * Real to'lov integratsiyasi (Click/Payme/Card) hali yo'q.
 */

import { supabase } from '@/lib/supabase'
import { subscriptionService } from './subscription.service'
import type { PaymentRow as PaymentRecord } from '@/types/lms.types'

export type { PaymentRecord }

const sb = supabase as unknown as { from: (t: string) => any }
// Yangi RPC funksiyalar (027) hali generatsiya qilingan tiplarda yo'q — loose cast.
const sbRpc = supabase as unknown as {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>
}

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded'
export type PaymentProvider = 'click' | 'payme' | 'card'
export type PaymentRow = {
  id: string; user_id: string; amount: number; currency: string
  provider: PaymentProvider | null; status: PaymentStatus; created_at: string
}

export type PaymentStats = {
  totalRevenue:   number
  monthlyRevenue: number
  premiumUsers:   number
  expiredPremium: number
}

export const paymentAdminService = {
  getStats: async (): Promise<PaymentStats> => {
    let totalRevenue = 0, monthlyRevenue = 0
    try {
      const { data } = await sb.from('payments').select('amount, created_at, status').eq('status', 'success')
      const rows = (data ?? []) as { amount: number; created_at: string; status: string }[]
      const monthKey = new Date().toISOString().slice(0, 7)
      for (const r of rows) {
        totalRevenue += Number(r.amount) || 0
        if (r.created_at.slice(0, 7) === monthKey) monthlyRevenue += Number(r.amount) || 0
      }
    } catch { /* jadval hali yo'q */ }

    const premiumUsers = await subscriptionService.activePremiumCount()

    let expiredPremium = 0
    try {
      const { count } = await sb.from('subscriptions').select('id', { count: 'exact', head: true })
        .in('plan_type', ['premium', 'education']).eq('status', 'expired')
      expiredPremium = count ?? 0
    } catch { expiredPremium = 0 }

    return { totalRevenue, monthlyRevenue, premiumUsers, expiredPremium }
  },

  listPayments: async (limit = 50): Promise<PaymentRow[]> => {
    try {
      const { data } = await sb.from('payments').select('*').order('created_at', { ascending: false }).limit(limit)
      return (data ?? []) as PaymentRow[]
    } catch { return [] }
  },

  /** Kutilayotgan (pending) qo'lda to'lovlar — admin tasdiqlashi uchun.
   *  Org to'lovlari uchun tashkilot nomi ham olinadi (organization:organizations(name)). */
  listPending: async (): Promise<PaymentRecord[]> => {
    try {
      const { data } = await sb.from('payments')
        .select('*, organization:organizations(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      return (data ?? []) as PaymentRecord[]
    } catch { return [] }
  },

  /** Org to'lovини tasdiqlash — approve_org_payment (super-admin, org rejasini yangilaydi). */
  approveOrg: async (paymentId: string): Promise<void> => {
    const { error } = await sbRpc.rpc('approve_org_payment', { p_payment_id: paymentId })
    if (error) throw new Error(error.message ?? 'Tasdiqlashda xatolik')
  },

  /** Org to'lovини rad etish — reject_org_payment (super-admin). */
  rejectOrg: async (paymentId: string, note?: string): Promise<void> => {
    const { error } = await sbRpc.rpc('reject_org_payment', { p_payment_id: paymentId, p_note: note ?? null })
    if (error) throw new Error(error.message ?? 'Rad etishda xatolik')
  },

  /**
   * To'lovni tasdiqlash — approve_payment RPC (SECURITY DEFINER, admin-only).
   * To'lovni 'success' qiladi VA premium obunani aktivlashtiradi (atomik).
   */
  approve: async (paymentId: string, days = 30): Promise<void> => {
    const { error } = await sbRpc.rpc('approve_payment', { p_payment_id: paymentId, p_days: days })
    if (error) throw new Error(error.message ?? "Tasdiqlashda xatolik")
  },

  /** To'lovni rad etish — reject_payment RPC (admin-only). */
  reject: async (paymentId: string, note?: string): Promise<void> => {
    const { error } = await sbRpc.rpc('reject_payment', { p_payment_id: paymentId, p_note: note ?? null })
    if (error) throw new Error(error.message ?? "Rad etishda xatolik")
  },
}
