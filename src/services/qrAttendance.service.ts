/**
 * services/qrAttendance.service.ts
 * QR davomat (Premium): o'qituvchi sessiya + QR kod yaratadi, talaba skan qiladi,
 * tizim `attendance` ga 'present' yozadi. (`qr_attendance_sessions`, 023)
 */

import { supabase } from '@/lib/supabase'
import type { QrAttendanceSessionRow } from '@/types/teacher.types'

const sb = supabase as unknown as { from: (t: string) => any }

function genCode(): string { return Math.random().toString(36).slice(2, 8).toUpperCase() }
function tashkentDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export const qrAttendanceService = {
  /** O'qituvchi: yangi QR sessiya (kod + amal muddati). */
  createSession: async (teacherId: string, groupId: string, lessonId: string | null, minutes = 15): Promise<QrAttendanceSessionRow | null> => {
    try {
      const { data } = await sb.from('qr_attendance_sessions').insert({
        teacher_id: teacherId, group_id: groupId, lesson_id: lessonId,
        code: genCode(), status: 'active', expires_at: new Date(Date.now() + minutes * 60_000).toISOString(),
      }).select().single()
      return (data ?? null) as QrAttendanceSessionRow | null
    } catch { return null }
  },

  closeSession: async (id: string): Promise<void> => {
    try { await sb.from('qr_attendance_sessions').update({ status: 'closed' }).eq('id', id) } catch { /* noop */ }
  },

  getActiveForGroup: async (groupId: string): Promise<QrAttendanceSessionRow | null> => {
    try {
      const { data } = await sb.from('qr_attendance_sessions').select('*').eq('group_id', groupId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle()
      return (data ?? null) as QrAttendanceSessionRow | null
    } catch { return null }
  },

  /** Talaba: QR kodni skan qiladi → attendance 'present'. */
  recordScan: async (code: string, studentId: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data: s } = await sb.from('qr_attendance_sessions').select('*').eq('code', code.toUpperCase()).eq('status', 'active').maybeSingle()
      const session = (s ?? null) as QrAttendanceSessionRow | null
      if (!session) return { ok: false, error: 'Sessiya topilmadi yoki yopilgan' }
      if (new Date(session.expires_at).getTime() < Date.now()) return { ok: false, error: 'QR muddati tugagan' }

      const today = tashkentDate()
      const { data: existing } = await supabase
        .from('attendance').select('id')
        .eq('student_id', studentId).eq('group_id', session.group_id).eq('attended_date', today)
        .maybeSingle()

      if (existing) {
        await supabase.from('attendance').update({ status: 'present' }).eq('id', existing.id)
      } else {
        await supabase.from('attendance').insert({
          student_id: studentId, group_id: session.group_id, teacher_id: session.teacher_id,
          attended_date: today, status: 'present',
        })
      }
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Xatolik' }
    }
  },
}
