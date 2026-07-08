/**
 * services/teacherInsights.service.ts
 * AI o'quvchi zaifligini aniqlash + sinf xulosasi. O'qituvchining guruhlari
 * bo'yicha HAQIQIY ma'lumot (test_results, attendance) asosida past o'zlashtiruvchi
 * o'quvchilarni aniqlaydi va tavsiya beradi. Rule-based (kelajakda LLM bilan
 * kengaytirilishi mumkin). RLS bloklasa — bo'sh natija, xatosiz.
 */

import { supabase } from '@/lib/supabase'

export type WeakStudent = {
  studentId:     string
  name:          string
  groupName:     string
  avgScore:      number      // %
  attendancePct: number
  problems:      string[]
  recommendation: string
}

export type ClassInsight = {
  summary:      string
  weakStudents: WeakStudent[]
  totals:       { students: number; groups: number; avgProgress: number }
}

export const teacherInsightsService = {
  getInsights: async (teacherId: string): Promise<ClassInsight> => {
    // O'qituvchi guruhlari
    const { data: groupsData } = await supabase
      .from('groups').select('id, name').eq('teacher_id', teacherId)
    const groups = (groupsData ?? []) as { id: string; name: string }[]
    const groupIds = groups.map(g => g.id)
    if (!groupIds.length) {
      return { summary: "Hozircha guruhlaringiz yo'q. Guruh yaratib, o'quvchi qo'shing.", weakStudents: [], totals: { students: 0, groups: 0, avgProgress: 0 } }
    }
    const groupNameById = new Map(groups.map(g => [g.id, g.name]))

    // Ro'yxatdagi o'quvchilar
    const { data: enr } = await supabase.from('student_groups').select('student_id, group_id').in('group_id', groupIds)
    const enrollments = (enr ?? []) as { student_id: string; group_id: string }[]
    const studentIds = [...new Set(enrollments.map(e => e.student_id))]
    const groupOfStudent = new Map(enrollments.map(e => [e.student_id, e.group_id]))
    if (!studentIds.length) {
      return { summary: `Sizda ${groups.length} ta guruh bor, lekin hali o'quvchilar qo'shilmagan.`, weakStudents: [], totals: { students: 0, groups: groups.length, avgProgress: 0 } }
    }

    // Ismlar
    const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', studentIds)
    const nameById = new Map((profs ?? []).map(p => [p.id, p.full_name ?? 'Talaba']))

    // Test natijalari + davomat (RLS ruxsat bergancha)
    const [testRes, attRes] = await Promise.all([
      supabase.from('test_results').select('student_id, score, total_questions').in('student_id', studentIds),
      supabase.from('attendance').select('student_id, status').in('student_id', studentIds).in('group_id', groupIds),
    ])
    const tests = (testRes.data ?? []) as { student_id: string; score: number; total_questions: number }[]
    const atts  = (attRes.data  ?? []) as { student_id: string; status: string }[]

    const scoreByStudent = new Map<string, number[]>()
    for (const t of tests) {
      const pct = t.total_questions > 0 ? (t.score / t.total_questions) * 100 : 0
      const arr = scoreByStudent.get(t.student_id) ?? []; arr.push(pct); scoreByStudent.set(t.student_id, arr)
    }
    const attByStudent = new Map<string, { present: number; total: number }>()
    for (const a of atts) {
      const e = attByStudent.get(a.student_id) ?? { present: 0, total: 0 }
      e.total++; if (a.status === 'present') e.present++
      attByStudent.set(a.student_id, e)
    }

    const weakStudents: WeakStudent[] = []
    let progressSum = 0
    for (const id of studentIds) {
      const scores = scoreByStudent.get(id) ?? []
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      const att = attByStudent.get(id) ?? { present: 0, total: 0 }
      const attendancePct = att.total ? Math.round((att.present / att.total) * 100) : 0
      progressSum += avgScore

      const problems: string[] = []
      if (scores.length && avgScore < 60) problems.push('Past test natijalari')
      if (att.total && attendancePct < 75) problems.push('Davomat past')
      if (!scores.length)                 problems.push('Test topshirmagan')

      if (problems.length) {
        weakStudents.push({
          studentId: id, name: nameById.get(id) ?? 'Talaba',
          groupName: groupNameById.get(groupOfStudent.get(id) ?? '') ?? '—',
          avgScore, attendancePct, problems,
          recommendation: avgScore < 60
            ? "Qo'shimcha mashqlar bering va zaif mavzularni qayta tushuntiring"
            : attendancePct < 75
              ? 'Davomatni yaxshilash uchun ota-ona bilan bog\'laning'
              : 'Test topshirishga rag\'batlantiring',
        })
      }
    }
    weakStudents.sort((a, b) => a.avgScore - b.avgScore)

    const avgProgress = studentIds.length ? Math.round(progressSum / studentIds.length) : 0
    const worst = weakStudents[0]
    const summary = worst
      ? `${worst.groupName} guruhida ${weakStudents.length} ta o'quvchi qiynalmoqda. Eng past: ${worst.name} (${worst.avgScore}%).`
      : `Barcha o'quvchilaringiz yaxshi o'zlashtirmoqda. O'rtacha o'zlashtirish: ${avgProgress}%.`

    return { summary, weakStudents: weakStudents.slice(0, 10), totals: { students: studentIds.length, groups: groups.length, avgProgress } }
  },
}
