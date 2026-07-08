/**
 * services/course.service.ts
 * Talaba kurslari (guruh + fan + darslar asosida) va o'quv statistikasi.
 *
 * LMS'ga tayyor: "kurs" = mavjud `groups` + `subjects` + `student_groups` (ro'yxat).
 * Alohida `courses` yoki `lesson_progress` jadvali hozircha yo'q — shuning uchun
 * progress darslarning `lesson_date` maydonidan HAQIQIY tarzda hisoblanadi
 * (o'tgan darslar = bajarilgan). Kelajakda `lesson_progress` jadvali qo'shilsa,
 * faqat shu yerdagi hisob-kitob almashtiriladi — UI o'zgarmaydi.
 */

import { supabase } from '@/lib/supabase'

// ─── Types (Supabase'ga tayyor model) ─────────────────────────────────────────

export type LessonStatus = 'completed' | 'in_progress' | 'locked'

export type StudentCourse = {
  id:                string          // groups.id
  title:             string          // groups.name
  description:       string | null   // groups.description ?? subject name
  icon:              string          // subjects.icon (emoji)
  color:             string          // subjects.color
  teacher_name:      string | null   // profiles.full_name
  total_lessons:     number
  completed_lessons: number
  progress:          number          // 0..100
  status:            'active' | 'completed'
}

export type StudentLearningStats = {
  completedLessons: number    // HAQIQIY — darslardan hisoblangan
  weeklyActivity:   number[]  // 7 kun (Du..Ya) — placeholder (kelajakdagi stats jadvali)
  streakDays:       number    // placeholder
  studyHours:       number    // taxminiy (dars soni × ~0.75s)
}

// ─── Tashkent kun / status yordamchilari ──────────────────────────────────────

function tashkentToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

/** Dars holati — `lesson_date` asosida (kelajakda real progress jadvaliga almashtiriladi). */
export function lessonStatus(lessonDate: string | null): LessonStatus {
  if (!lessonDate) return 'locked'
  const d = lessonDate.slice(0, 10)
  const today = tashkentToday()
  if (d < today)  return 'completed'
  if (d === today) return 'in_progress'
  return 'locked'
}

// ─── Raw select rows ──────────────────────────────────────────────────────────

type RawSubject = { name: string; icon: string; color: string } | null
type RawGroup = {
  id: string; name: string; description: string | null
  status: 'active' | 'inactive' | 'completed'; teacher_id: string | null
  subject: RawSubject
}
type RawLesson = { group_id: string | null; lesson_date: string | null }
type RawTeacher = { id: string; full_name: string | null }

// ─── Service ──────────────────────────────────────────────────────────────────

export const courseService = {
  /** Talabaning kurslari (ro'yxatdagi guruhlar) — progress darslardan hisoblanadi. */
  getStudentCourses: async (studentId: string): Promise<StudentCourse[]> => {
    const { data: enr } = await supabase
      .from('student_groups')
      .select('group_id')
      .eq('student_id', studentId)

    const groupIds = (enr ?? []).map(e => e.group_id as string)
    if (!groupIds.length) return []

    const [groupsRes, lessonsRes] = await Promise.all([
      supabase
        .from('groups')
        .select('id,name,description,status,teacher_id,subject:subjects(name,icon,color)')
        .in('id', groupIds),
      supabase
        .from('lessons')
        .select('group_id,lesson_date')
        .in('group_id', groupIds)
        .eq('is_published', true),
    ])

    const groups  = (groupsRes.data  ?? []) as unknown as RawGroup[]
    const lessons = (lessonsRes.data ?? []) as unknown as RawLesson[]

    const teacherIds = [...new Set(groups.map(g => g.teacher_id).filter((id): id is string => Boolean(id)))]
    const { data: teachersData } = teacherIds.length
      ? await supabase.from('profiles').select('id,full_name').in('id', teacherIds)
      : { data: [] }
    const teacherMap = new Map((teachersData as RawTeacher[] ?? []).map(t => [t.id, t.full_name]))

    const today = tashkentToday()

    return groups.map(g => {
      const ls        = lessons.filter(l => l.group_id === g.id)
      const total     = ls.length
      const completed = ls.filter(l => (l.lesson_date ?? '').slice(0, 10) < today && l.lesson_date).length
      const progress  = total > 0 ? Math.round((completed / total) * 100) : 0
      const subj      = g.subject
      return {
        id:                g.id,
        title:             g.name,
        description:       g.description ?? (subj?.name ?? null),
        icon:              subj?.icon  ?? '📘',
        color:             subj?.color ?? '#5B7FFF',
        teacher_name:      g.teacher_id ? (teacherMap.get(g.teacher_id) ?? null) : null,
        total_lessons:     total,
        completed_lessons: completed,
        progress,
        status:            progress >= 100 && total > 0 ? 'completed' : 'active',
      }
    })
  },
}

/**
 * O'quv statistikasi. `completedLessons` — HAQIQIY (kurslardan). Qolganlari
 * placeholder: kelajakda `lesson_progress` / `study_sessions` jadvali qo'shilsa
 * shu funksiya almashtiriladi.
 */
export function buildLearningStats(courses: StudentCourse[]): StudentLearningStats {
  const completedLessons = courses.reduce((a, c) => a + c.completed_lessons, 0)
  const totalLessons     = courses.reduce((a, c) => a + c.total_lessons, 0)
  return {
    completedLessons,
    // TODO(Supabase): kunlik faollikni real jadvaldan oling
    weeklyActivity: [40, 62, 30, 78, 52, 70, 45],
    streakDays:     completedLessons > 0 ? Math.min(7, Math.max(1, Math.round(completedLessons / 3))) : 0,
    studyHours:     Math.round(totalLessons * 0.75),
  }
}
