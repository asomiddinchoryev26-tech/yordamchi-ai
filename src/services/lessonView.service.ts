/**
 * services/lessonView.service.ts
 * Dars analitikasi: kim ochgan, ko'rish vaqti, tugatganlar. (`lesson_views`, 023)
 * Talaba tomoni ko'rishni yozadi; o'qituvchi guruh bo'yicha analitika oladi.
 */

import { supabase } from '@/lib/supabase'
import type { LessonViewRow } from '@/types/teacher.types'

const sb = supabase as unknown as { from: (t: string) => any }

export type LessonViewStat = {
  studentId:    string
  name:         string
  viewed:       boolean
  watchMinutes: number
  completed:    boolean
}

export type LessonAnalytics = {
  total:          number
  viewedCount:    number
  completedCount: number
  completedPct:   number
  students:       LessonViewStat[]   // viewed + not-viewed
}

export const lessonViewService = {
  /** Talaba dars ko'rishini yozadi (upsert — watch vaqtini qo'shadi). */
  recordView: async (lessonId: string, studentId: string, watchSeconds = 0, completed = false): Promise<void> => {
    try {
      await sb.from('lesson_views').upsert(
        { lesson_id: lessonId, student_id: studentId, watch_seconds: watchSeconds, completed, last_viewed_at: new Date().toISOString() },
        { onConflict: 'lesson_id,student_id' },
      )
    } catch { /* jadval hali yo'q */ }
  },

  /** O'qituvchi: dars bo'yicha kim ko'rgan / ko'rmagan + progress. */
  getLessonAnalytics: async (lessonId: string, groupId: string): Promise<LessonAnalytics> => {
    // Guruhdagi barcha talabalar
    const { data: enr } = await supabase.from('student_groups').select('student_id').eq('group_id', groupId)
    const studentIds = (enr ?? []).map(e => e.student_id as string)
    const { data: profs } = studentIds.length
      ? await supabase.from('profiles').select('id, full_name').in('id', studentIds)
      : { data: [] as { id: string; full_name: string | null }[] }
    const nameById = new Map((profs ?? []).map(p => [p.id, p.full_name ?? 'Talaba']))

    // Ko'rishlar
    let views: LessonViewRow[] = []
    try {
      const { data } = await sb.from('lesson_views').select('*').eq('lesson_id', lessonId)
      views = (data ?? []) as LessonViewRow[]
    } catch { views = [] }
    const viewByStudent = new Map(views.map(v => [v.student_id, v]))

    const students: LessonViewStat[] = studentIds.map(id => {
      const v = viewByStudent.get(id)
      return {
        studentId: id, name: nameById.get(id) ?? 'Talaba',
        viewed: Boolean(v), watchMinutes: v ? Math.round(v.watch_seconds / 60) : 0, completed: Boolean(v?.completed),
      }
    }).sort((a, b) => Number(b.viewed) - Number(a.viewed))

    const viewedCount    = students.filter(s => s.viewed).length
    const completedCount = students.filter(s => s.completed).length
    const total = studentIds.length
    return { total, viewedCount, completedCount, completedPct: total ? Math.round((completedCount / total) * 100) : 0, students }
  },
}
