/**
 * services/activityLog.service.ts
 * Audit / faoliyat jurnali (activity_logs, 026). Adminlar harakatini yozadi;
 * ko'rish/filtrlash/qidirish faqat Super Admin (RLS). Normal admin o'chira olmaydi.
 */

import { supabase } from '@/lib/supabase'

const sb = supabase as unknown as { from: (t: string) => any }

export type ActivityLogRow = {
  id: string; actor_id: string | null; action: string
  target_type: string | null; target_id: string | null
  metadata: Record<string, unknown>; created_at: string
}
export type ActivityLogView = ActivityLogRow & { actorName: string }

export const activityLogService = {
  /** Harakatni yozish (masalan: 'premium_upgrade', 'lesson_delete'). */
  log: async (actorId: string, action: string, opts?: { targetType?: string; targetId?: string; metadata?: Record<string, unknown> }): Promise<void> => {
    try {
      await sb.from('activity_logs').insert({
        actor_id: actorId, action,
        target_type: opts?.targetType ?? null, target_id: opts?.targetId ?? null,
        metadata: opts?.metadata ?? {},
      })
    } catch { /* jadval hali yo'q / RLS */ }
  },

  /** Super Admin: jurnalni ko'rish + filtr/qidiruv. */
  list: async (opts?: { search?: string; action?: string; limit?: number }): Promise<ActivityLogView[]> => {
    try {
      let q = sb.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(opts?.limit ?? 100)
      if (opts?.action) q = q.eq('action', opts.action)
      if (opts?.search) q = q.ilike('action', `%${opts.search}%`)
      const { data } = await q
      const rows = (data ?? []) as ActivityLogRow[]
      const actorIds = [...new Set(rows.map(r => r.actor_id).filter(Boolean))] as string[]
      const { data: profs } = actorIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', actorIds)
        : { data: [] as { id: string; full_name: string | null }[] }
      const nameById = new Map((profs ?? []).map(p => [p.id, p.full_name ?? 'Admin']))
      return rows.map(r => ({ ...r, actorName: r.actor_id ? (nameById.get(r.actor_id) ?? 'Admin') : 'Tizim' }))
    } catch { return [] }
  },
}
