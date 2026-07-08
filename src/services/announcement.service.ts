/**
 * services/announcement.service.ts
 * Global e'lonlar (announcements, 026). Super Admin e'lon yuboradi — DB trigger
 * (026) maqsadli foydalanuvchilarga MAVJUD notifications tizimi orqali xabar
 * tarqatadi (dublikat notification tizimi yaratilmaydi).
 */

import { supabase } from '@/lib/supabase'

const sb = supabase as unknown as { from: (t: string) => any }

export type AnnouncementTarget = 'all' | 'students' | 'teachers' | 'admins'
export type AnnouncementRow = {
  id: string; title: string; body: string | null; target: AnnouncementTarget
  created_by: string | null; created_at: string
}

export const ANNOUNCEMENT_TARGETS: { key: AnnouncementTarget; label: string }[] = [
  { key: 'all',      label: 'Hammaga'       },
  { key: 'students', label: "O'quvchilarga" },
  { key: 'teachers', label: "O'qituvchilarga" },
  { key: 'admins',   label: 'Adminlarga'    },
]

export const announcementService = {
  /** E'lon yaratish → trigger notifications'ga tarqatadi. */
  create: async (title: string, body: string | null, target: AnnouncementTarget, createdBy: string): Promise<void> => {
    const { error } = await sb.from('announcements').insert({ title, body, target, created_by: createdBy })
    if (error) throw new Error(error.message ?? 'E\'lon yuborishda xatolik')
  },

  list: async (limit = 30): Promise<AnnouncementRow[]> => {
    try {
      const { data } = await sb.from('announcements').select('*').order('created_at', { ascending: false }).limit(limit)
      return (data ?? []) as AnnouncementRow[]
    } catch { return [] }
  },
}
