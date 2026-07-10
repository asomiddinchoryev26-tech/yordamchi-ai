/**
 * services/subscription.service.ts
 * Foydalanuvchi rejasi (Freemium) va reja bo'yicha AI limitlari.
 *
 * `subscriptions` jadvali 022 migratsiyasida yaratiladi. Jadval bo'lmasa yoki
 * yozuv yo'q bo'lsa — 'free' reja qaytadi (xato bermaydi).
 */

import { supabase } from '@/lib/supabase'
import type { PlanType, AIFeature, UsageWindow, SubscriptionRow } from '@/types/lms.types'

// Yangi LMS jadvallari hali generatsiya qilingan Database tiplarida yo'q —
// ular uchun loose (typiz) handle. Natijalar qo'lda tiplarga cast qilinadi.
const sb = supabase as unknown as { from: (t: string) => any }

export type FeatureLimit = { limit: number; window: UsageWindow }

// Spec bo'yicha reja limitlari (bir joyda — UI hardcode qilmaydi)
export const PLAN_LIMITS: Record<PlanType, Record<AIFeature, FeatureLimit>> = {
  free: {
    ai_chat:          { limit: 20, window: 'day'  },
    image_solving:    { limit: 3,  window: 'day'  },
    pdf_analysis:     { limit: 3,  window: 'week' },
    voice:            { limit: 5,  window: 'day'  },
    assignment_check: { limit: 3,  window: 'day'  },
  },
  premium: {
    ai_chat:          { limit: 300, window: 'day'  },
    image_solving:    { limit: 50,  window: 'day'  },
    pdf_analysis:     { limit: 30,  window: 'week' },
    voice:            { limit: 100, window: 'day'  },
    assignment_check: { limit: 50,  window: 'day'  },
  },
  // Pro rejasi — eng yuqori limitlar (plans katalogiga mos, 027).
  pro: {
    ai_chat:          { limit: 1000, window: 'day'  },
    image_solving:    { limit: 200,  window: 'day'  },
    pdf_analysis:     { limit: 100,  window: 'week' },
    voice:            { limit: 300,  window: 'day'  },
    assignment_check: { limit: 150,  window: 'day'  },
  },
  // Muassasa rejasi — admin boshqaradi (organization_ai_limits). Baza sifatida premium.
  education: {
    ai_chat:          { limit: 300, window: 'day'  },
    image_solving:    { limit: 50,  window: 'day'  },
    pdf_analysis:     { limit: 30,  window: 'week' },
    voice:            { limit: 100, window: 'day'  },
    assignment_check: { limit: 50,  window: 'day'  },
  },
}

export const FEATURE_LABELS: Record<AIFeature, string> = {
  ai_chat:          'AI suhbat',
  image_solving:    'Rasm orqali yechim',
  pdf_analysis:     'PDF tahlil',
  voice:            'Ovozli yordam',
  assignment_check: 'AI tekshiruv',
}

export const PLAN_LABELS: Record<PlanType, string> = {
  free:      'Bepul',
  premium:   'Premium',
  pro:       'Pro',
  education: "Ta'lim muassasasi",
}

export const subscriptionService = {
  /**
   * Foydalanuvchining faol rejasi. Endi TASHKILOT rejasidan keladi (per-org billing):
   * bir tashkilotning barcha a'zolari org rejasini meros oladi. Org rejasi 'free'
   * bo'lsa — eski per-user obunaga qaytiladi (org'siz / eski foydalanuvchilar uchun).
   */
  getPlan: async (userId: string): Promise<PlanType> => {
    try {
      // 1) Organization plan (source of truth for billing)
      const { data: orgPlan } = await (supabase as unknown as {
        rpc: (fn: string) => Promise<{ data: string | null }>
      }).rpc('my_org_plan')
      if (orgPlan && orgPlan !== 'free') return orgPlan as PlanType

      // 2) Fallback — legacy per-user subscription
      const { data, error } = await sb
        .from('subscriptions')
        .select('plan_type, status, expires_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()
      if (error || !data) return 'free'
      const row = data as unknown as Pick<SubscriptionRow, 'plan_type' | 'expires_at'>
      if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return 'free'
      return row.plan_type
    } catch {
      return 'free'
    }
  },

  limitsFor: (plan: PlanType): Record<AIFeature, FeatureLimit> => PLAN_LIMITS[plan],

  /**
   * isPremium — foydalanuvchi faol premium/education rejasidami?
   * Premium foydalanuvchilar AI limitlari oshadi, AI Vision + premium xususiyatlar
   * ochiladi. Free foydalanuvchilar ishlashda davom etadi (false qaytadi).
   */
  isPremium: async (userId: string): Promise<boolean> => {
    const plan = await subscriptionService.getPlan(userId)
    return plan !== 'free'
  },

  /**
   * Admin: foydalanuvchi rejasini o'zgartirish (FREE/PREMIUM/EDUCATION) —
   * mavjud `subscriptions` jadvaliga yozadi (dublikat premium logika yaratilmaydi).
   * Eski faol obuna 'expired' qilinadi, yangisi qo'shiladi.
   */
  setUserPlan: async (
    userId: string,
    plan: PlanType,
    opts?: { startDate?: string | null; endDate?: string | null; status?: 'active' | 'expired' | 'cancelled' },
  ): Promise<void> => {
    await sb.from('subscriptions').update({ status: 'expired' }).eq('user_id', userId).eq('status', 'active')
    const { error } = await sb.from('subscriptions').insert({
      user_id:    userId,
      plan_type:  plan,
      status:     opts?.status ?? 'active',
      started_at: opts?.startDate ?? new Date().toISOString(),
      expires_at: opts?.endDate ?? null,
    })
    if (error) throw new Error(error.message ?? "Reja o'zgartirishda xatolik")
  },

  /** Admin analitika: faol premium/education foydalanuvchilar soni. */
  activePremiumCount: async (): Promise<number> => {
    try {
      const { count } = await sb.from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .in('plan_type', ['premium', 'education'])
        .eq('status', 'active')
      return count ?? 0
    } catch { return 0 }
  },
}
