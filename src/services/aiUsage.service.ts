/**
 * services/aiUsage.service.ts
 * Freemium AI ishlatilishini hisoblash: har bir AI amaldan oldin limitni tekshirish
 * va ishlatilishni yangilash.
 *
 * `ai_usage` jadvali 022 migratsiyasida yaratiladi. Jadval bo'lmasa — bloklamaydi
 * (allowed=true), ya'ni migratsiyadan oldin ham ilova ishlayveradi.
 *
 * Har bir AI so'rovdan oldin:
 *   1. reja (subscription.service.getPlan)
 *   2. qolgan limit (check)
 *   3. ruxsat/blok
 *   4. ishlatilishni yangilash (consume)
 */

import { supabase } from '@/lib/supabase'
import type { AIFeature, PlanType, AiUsageRow, UsageWindow } from '@/types/lms.types'
import { PLAN_LIMITS } from './subscription.service'

const sb = supabase as unknown as { from: (t: string) => any }

const WINDOW_MS: Record<UsageWindow, number> = { day: 86_400_000, week: 7 * 86_400_000 }

export type UsageInfo = {
  feature:   AIFeature
  used:      number
  limit:     number
  remaining: number
  window:    UsageWindow
}

export type CheckResult = { allowed: boolean; used: number; limit: number; remaining: number }

// Period tugagan bo'lsa ishlatilish 0 sifatida hisoblanadi
function effectiveUsed(row: AiUsageRow | null): number {
  if (!row) return 0
  if (new Date(row.reset_date).getTime() <= Date.now()) return 0
  return row.used_count
}

async function fetchRow(userId: string, feature: AIFeature): Promise<AiUsageRow | null> {
  try {
    const { data } = await sb.from('ai_usage').select('*').eq('user_id', userId).eq('feature_type', feature).maybeSingle()
    return (data ?? null) as AiUsageRow | null
  } catch {
    return null
  }
}

export const aiUsageService = {
  /** Bitta funksiya bo'yicha ruxsat + qolgan limit. */
  check: async (userId: string, feature: AIFeature, plan: PlanType): Promise<CheckResult> => {
    const { limit } = PLAN_LIMITS[plan][feature]
    const row  = await fetchRow(userId, feature)
    const used = effectiveUsed(row)
    return { allowed: used < limit, used, limit, remaining: Math.max(0, limit - used) }
  },

  /** Ishlatilishni +1 qiladi (limitdan oshsa ham yozadi — chaqiruvchi oldindan tekshiradi). */
  consume: async (userId: string, feature: AIFeature, plan: PlanType): Promise<void> => {
    const { limit, window } = PLAN_LIMITS[plan][feature]
    try {
      const row = await fetchRow(userId, feature)
      const expired = !row || new Date(row.reset_date).getTime() <= Date.now()
      const used_count = expired ? 1 : row!.used_count + 1
      const reset_date = expired ? new Date(Date.now() + WINDOW_MS[window]).toISOString() : row!.reset_date
      await sb.from('ai_usage').upsert(
        { user_id: userId, feature_type: feature, used_count, limit_count: limit, reset_date, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,feature_type' },
      )
    } catch {
      // ai_usage jadvali hali yo'q — jimgina o'tkazib yuboramiz
    }
  },

  /** Barcha funksiyalar bo'yicha ishlatilish xulosasi (widget uchun). */
  getSummary: async (userId: string, plan: PlanType): Promise<Record<AIFeature, UsageInfo>> => {
    let rows: AiUsageRow[] = []
    try {
      const { data } = await sb.from('ai_usage').select('*').eq('user_id', userId)
      rows = (data ?? []) as AiUsageRow[]
    } catch {
      rows = []
    }
    const byFeature = new Map(rows.map(r => [r.feature_type, r]))
    const features: AIFeature[] = ['ai_chat', 'image_solving', 'pdf_analysis', 'voice', 'assignment_check']
    const out = {} as Record<AIFeature, UsageInfo>
    for (const f of features) {
      const { limit, window } = PLAN_LIMITS[plan][f]
      const used = effectiveUsed(byFeature.get(f) ?? null)
      out[f] = { feature: f, used, limit, remaining: Math.max(0, limit - used), window }
    }
    return out
  },
}
