/**
 * services/promoCode.service.ts
 * Promo kod / kupon tizimi (promo_codes, promo_code_usage — 026). Super Admin
 * yaratadi; foydalanuvchi ishlatadi. free_days → mavjud subscription.setUserPlan
 * orqali premium uzaytiriladi (dublikat premium logika yo'q). Bir kod — bir user.
 */

import { supabase } from '@/lib/supabase'
import { subscriptionService } from './subscription.service'

const sb = supabase as unknown as { from: (t: string) => any }

export type PromoDiscountType = 'percentage' | 'free_days'
export type PromoCodeRow = {
  id: string; code: string; discount_type: PromoDiscountType; discount_value: number
  usage_limit: number | null; used_count: number; expires_at: string | null
  is_active: boolean; created_by: string | null; created_at: string
}

export type CreatePromoPayload = {
  code: string; discount_type: PromoDiscountType; discount_value: number
  usage_limit?: number | null; expires_at?: string | null
}

export type RedeemResult = { ok: boolean; error?: string; appliedDays?: number; discountPct?: number }

export const promoCodeService = {
  list: async (): Promise<PromoCodeRow[]> => {
    try {
      const { data } = await sb.from('promo_codes').select('*').order('created_at', { ascending: false })
      return (data ?? []) as PromoCodeRow[]
    } catch { return [] }
  },

  create: async (p: CreatePromoPayload, createdBy: string): Promise<void> => {
    const { error } = await sb.from('promo_codes').insert({
      code: p.code.trim().toUpperCase(), discount_type: p.discount_type, discount_value: p.discount_value,
      usage_limit: p.usage_limit ?? null, expires_at: p.expires_at ?? null, is_active: true, created_by: createdBy,
    })
    if (error) throw new Error(error.message ?? 'Promo yaratishda xatolik')
  },

  setActive: async (id: string, isActive: boolean): Promise<void> => {
    await sb.from('promo_codes').update({ is_active: isActive }).eq('id', id)
  },

  validate: async (code: string): Promise<PromoCodeRow | null> => {
    try {
      const { data } = await sb.from('promo_codes').select('*').eq('code', code.trim().toUpperCase()).eq('is_active', true).maybeSingle()
      const promo = (data ?? null) as PromoCodeRow | null
      if (!promo) return null
      if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) return null
      if (promo.usage_limit !== null && promo.used_count >= promo.usage_limit) return null
      return promo
    } catch { return null }
  },

  /** Foydalanuvchi promoni ishlatadi. free_days → premium uzaytiriladi. */
  redeem: async (code: string, userId: string): Promise<RedeemResult> => {
    const promo = await promoCodeService.validate(code)
    if (!promo) return { ok: false, error: 'Kod yaroqsiz yoki muddati tugagan' }
    try {
      // Bir foydalanuvchi — bir marta (unique promo_id,user_id)
      const { error: useErr } = await sb.from('promo_code_usage').insert({ promo_id: promo.id, user_id: userId })
      if (useErr) return { ok: false, error: 'Siz bu koddan allaqachon foydalangansiz' }

      await sb.from('promo_codes').update({ used_count: promo.used_count + 1 }).eq('id', promo.id)

      if (promo.discount_type === 'free_days') {
        const end = new Date(Date.now() + promo.discount_value * 86_400_000).toISOString()
        await subscriptionService.setUserPlan(userId, 'premium', { endDate: end })
        return { ok: true, appliedDays: promo.discount_value }
      }
      // percentage — chegirma to'lovda qo'llanadi (integratsiya keyin)
      return { ok: true, discountPct: promo.discount_value }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Xatolik' }
    }
  },
}
