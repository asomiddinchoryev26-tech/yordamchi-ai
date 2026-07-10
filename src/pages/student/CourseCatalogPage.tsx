import { useState, useEffect } from 'react'
import { BookOpen, AlertCircle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PATHS } from '@/routes/paths'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

type EnrolledCourse = {
  group_id:      string
  group_name:    string
  group_status:  'active' | 'inactive' | 'completed'
  subject:       { id: string; name: string; color: string; icon: string } | null
  teacher:       { full_name: string | null; email: string | null } | null
  lesson_count:  number
  enrolled_at:   string
  att_present:   number
  att_total:     number
}

const MONTH_KEYS: (keyof Translations)[] = [
  'mJan','mFeb','mMar','mApr','mMay','mJun',
  'mJul','mAug','mSep','mOct','mNov','mDec',
]
function fmtDate(d: string, t: Translations) {
  const dt = new Date(d)
  return `${dt.getDate()} ${t[MONTH_KEYS[dt.getMonth()]]} ${dt.getFullYear()}`
}

// ═════════════════════════════════════════════════════════════════════════════

export default function CourseCatalogPage() {
  const auth     = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!auth.user?.id) return
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load() unmemoized by design; re-run only on user id change
  }, [auth.user?.id])

  async function load() {
    if (!auth.user?.id) return
    setLoading(true)
    setError(null)

    try {
      // 1. Faqat enrollment IDlarini olish
      const { data: enrollments, error: eErr } = await supabase
        .from('student_groups')
        .select('group_id, enrolled_at')
        .eq('student_id', auth.user.id)
        .order('enrolled_at', { ascending: false })

      if (eErr) throw eErr
      if (!enrollments?.length) { setCourses([]); return }

      const groupIds = enrollments.map(e => e.group_id)

      // 2. Guruh detallari, davomat, darslar — parallel
      const [groupsRes, attRes, lessonsRes] = await Promise.all([
        supabase
          .from('groups')
          .select('id, name, status, teacher_id, subject:subjects(id, name, color, icon)')
          .in('id', groupIds),

        supabase
          .from('attendance')
          .select('group_id, status')
          .eq('student_id', auth.user.id)
          .in('group_id', groupIds),

        supabase
          .from('lessons')
          .select('group_id')
          .in('group_id', groupIds)
          .eq('is_published', true),
      ])

      // 3. O'qituvchi ismlarini alohida olish
      const teacherIds = [...new Set(
        (groupsRes.data ?? []).map((g: any) => g.teacher_id).filter(Boolean)
      )]
      const { data: teachersData } = teacherIds.length
        ? await supabase.from('profiles').select('id, full_name, email').in('id', teacherIds)
        : { data: [] }

      // Lookup map lar
      const groupMap   = new Map((groupsRes.data ?? []).map((g: any) => [g.id, g]))
      const teacherMap = new Map((teachersData ?? []).map((t: any) => [t.id, t]))

      const lessonCountMap = new Map<string, number>()
      for (const l of lessonsRes.data ?? []) {
        const gid = (l as any).group_id
        lessonCountMap.set(gid, (lessonCountMap.get(gid) ?? 0) + 1)
      }

      const attMap = new Map<string, { present: number; total: number }>()
      for (const a of attRes.data ?? []) {
        const gid = (a as any).group_id
        if (!attMap.has(gid)) attMap.set(gid, { present: 0, total: 0 })
        const e = attMap.get(gid)!
        e.total++
        if ((a as any).status === 'present') e.present++
      }

      const rows: EnrolledCourse[] = enrollments
        .map(e => {
          const g = groupMap.get(e.group_id)
          if (!g) return null
          const teacher = g.teacher_id ? teacherMap.get(g.teacher_id) : null
          const att     = attMap.get(g.id) ?? { present: 0, total: 0 }
          return {
            group_id:     g.id,
            group_name:   g.name,
            group_status: g.status,
            subject:      (g as any).subject ?? null,
            teacher:      teacher ? { full_name: teacher.full_name, email: teacher.email } : null,
            lesson_count: lessonCountMap.get(g.id) ?? 0,
            enrolled_at:  e.enrolled_at,
            att_present:  att.present,
            att_total:    att.total,
          }
        })
        .filter(Boolean) as EnrolledCourse[]

      setCourses(rows)
    } catch {
      setError(t.mpLoadErr)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="space-y-4 pb-8">
      <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-40" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.ccTitle}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {courses.length} {t.ccJoinedGroups}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Bo'sh holat */}
      {courses.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">{t.ccEmpty}</p>
          <p className="text-xs text-gray-400 mt-1">{t.ccEmptyHint}</p>
        </div>
      )}

      {/* Kurs kartochkalari */}
      {courses.length > 0 && (
        <>
          {/* Umumiy statistika */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium">{t.adCourses}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{courses.length}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium">{t.ccTotalLessons}</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {courses.reduce((a, c) => a + c.lesson_count, 0)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 font-medium">{t.ccActiveCourses}</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {courses.filter(c => c.group_status === 'active').length}
              </p>
            </div>
          </div>

          {/* Kurs kartochkalari */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courses.map(c => {
              const attPct = c.att_total > 0
                ? Math.round((c.att_present / c.att_total) * 100)
                : null

              return (
                <div
                  key={c.group_id}
                  className={cn(
                    'bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all cursor-pointer group',
                    c.group_status === 'active' ? 'border-gray-100' : 'border-gray-100 opacity-80',
                  )}
                  onClick={() => navigate(PATHS.STUDENT.LESSONS)}
                >
                  {/* Rang chizig'i */}
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: c.subject?.color ?? '#6366f1' }}
                  />

                  <div className="p-5">
                    {/* Sarlavha */}
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={c.subject
                          ? { backgroundColor: c.subject.color + '18', border: `2px solid ${c.subject.color}30` }
                          : { backgroundColor: '#f3f4f6', border: '2px solid #e5e7eb' }
                        }
                      >
                        {c.subject?.icon ?? <BookOpen className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 truncate">{c.group_name}</h3>
                          {c.group_status !== 'active' && (
                            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
                              {c.group_status === 'completed' ? t.tdCompleted : t.tdInactive}
                            </span>
                          )}
                        </div>
                        {c.subject && (
                          <p className="text-sm mt-0.5 font-medium" style={{ color: c.subject.color }}>
                            {c.subject.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* O'qituvchi */}
                    {c.teacher && (
                      <p className="text-xs text-gray-500 mb-3">
                        O'qituvchi: <span className="font-medium text-gray-700">
                          {c.teacher.full_name ?? c.teacher.email ?? '—'}
                        </span>
                      </p>
                    )}

                    {/* Statistika */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{c.lesson_count}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{t.ccLesson}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className={cn(
                          'text-lg font-bold',
                          attPct === null ? 'text-gray-400' :
                          attPct >= 80 ? 'text-emerald-600' :
                          attPct >= 60 ? 'text-amber-600' : 'text-red-600'
                        )}>
                          {attPct !== null ? `${attPct}%` : '—'}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{t.achAttendance}</p>
                      </div>
                    </div>

                    {/* Davomat progress bar */}
                    {attPct !== null && (
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            attPct >= 80 ? 'bg-emerald-500' : attPct >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          )}
                          style={{ width: `${attPct}%` }}
                        />
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        {t.adJoined}: {fmtDate(c.enrolled_at, t)}
                      </span>
                      <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                        Darslarga o'tish
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
