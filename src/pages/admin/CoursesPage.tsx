import { useState, useEffect } from 'react'
import { BookOpen, AlertCircle, Search, Users, ChevronDown, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

type CourseOverview = {
  id:            string
  name:          string
  status:        'active' | 'inactive' | 'completed'
  capacity:      number
  start_date:    string | null
  end_date:      string | null
  subject:       { id: string; name: string; color: string; icon: string } | null
  teacher:       { id: string; full_name: string | null; email: string | null } | null
  student_count: number
  lesson_count:  number
  test_count:    number
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'completed'

const STATUS_META: Record<string, { label: keyof Translations; bg: string; color: string }> = {
  active:    { label: 'admActive',   bg: 'bg-emerald-100', color: 'text-emerald-700' },
  inactive:  { label: 'tdInactive',  bg: 'bg-gray-100 dark:bg-gray-700',    color: 'text-gray-600 dark:text-gray-300'    },
  completed: { label: 'tdCompleted', bg: 'bg-blue-100',    color: 'text-blue-700'    },
}

const MONTH_KEYS: (keyof Translations)[] = [
  'mJan','mFeb','mMar','mApr','mMay','mJun','mJul','mAug','mSep','mOct','mNov','mDec',
]
function fmtDate(d: string, t: Translations) {
  const dt = new Date(d)
  return `${dt.getDate()} ${t[MONTH_KEYS[dt.getMonth()]].slice(0,3)} ${dt.getFullYear()}`
}

// ═════════════════════════════════════════════════════════════════════════════

export default function AdminCoursesPage() {
  const { t } = useLanguage()
  const [courses,      setCourses]      = useState<CourseOverview[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [subjectFilter, setSubjectFilter] = useState('all')

  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only load; load() is intentionally unmemoized
  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    setError(null)

    try {
      const { data, error: err } = await supabase
        .from('groups')
        .select(`
          id, name, status, capacity, start_date, end_date,
          subject:subjects(id, name, color, icon),
          teacher:profiles!groups_teacher_id_fkey(id, full_name, email),
          student_groups(id),
          lessons(id)
        `)
        .order('status')
        .order('name')

      if (err) throw err

      // Test soni guruh bo'yicha
      const groupIds = (data ?? []).map((g: any) => g.id)
      const { data: testsData } = groupIds.length
        ? await supabase
            .from('tests')
            .select('group_id')
            .in('group_id', groupIds)
        : { data: [] }

      const testCountMap = new Map<string, number>()
      for (const t of testsData ?? []) {
        if (t.group_id) testCountMap.set(t.group_id, (testCountMap.get(t.group_id) ?? 0) + 1)
      }

      setCourses((data ?? []).map((g: any) => ({
        id:            g.id,
        name:          g.name,
        status:        g.status,
        capacity:      g.capacity,
        start_date:    g.start_date,
        end_date:      g.end_date,
        subject:       g.subject ?? null,
        teacher:       g.teacher ?? null,
        student_count: (g.student_groups ?? []).length,
        lesson_count:  (g.lessons ?? []).length,
        test_count:    testCountMap.get(g.id) ?? 0,
      })))
    } catch {
      setError(t.mpLoadErr)
    } finally {
      setLoading(false)
    }
  }

  // Noyob fanlar (filtr uchun)
  const uniqueSubjects = Array.from(
    new Map(
      courses
        .filter(c => c.subject)
        .map(c => [c.subject!.id as string, c.subject!] as const)
    ).values()
  )

  const filtered = courses.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || c.name.toLowerCase().includes(q)
      || (c.teacher?.full_name ?? '').toLowerCase().includes(q)
      || (c.subject?.name ?? '').toLowerCase().includes(q)
    const matchStatus  = statusFilter  === 'all' || c.status      === statusFilter
    const matchSubject = subjectFilter === 'all' || c.subject?.id === subjectFilter
    return matchSearch && matchStatus && matchSubject
  })

  const counts = {
    active:    courses.filter(c => c.status === 'active').length,
    completed: courses.filter(c => c.status === 'completed').length,
    students:  courses.reduce((a, c) => a + c.student_count, 0),
    lessons:   courses.reduce((a, c) => a + c.lesson_count, 0),
  }

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.adCourses}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {loading ? t.tcUploading : `${courses.length} ${t.adCoursesCount}`}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Statistika */}
      {!loading && courses.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t.ccActiveCourses, value: counts.active,    color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: t.tdCompleted,     value: counts.completed,  color: 'text-blue-600',    bg: 'bg-blue-50'    },
            { label: t.tdStudents,      value: counts.students,   color: 'text-indigo-600',  bg: 'bg-indigo-50'  },
            { label: t.tdLessons,       value: counts.lessons,    color: 'text-amber-600',   bg: 'bg-amber-50'   },
          ].map(s => (
            <div key={s.label} className={cn('rounded-2xl border border-gray-100 dark:border-gray-700 p-4', s.bg)}>
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtrlar */}
      {!loading && courses.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.acSearchPh}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'inactive', 'completed'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-2 text-xs font-semibold rounded-xl border transition-colors',
                  statusFilter === s
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-emerald-300',
                )}
              >
                {s === 'all' ? t.adAll : STATUS_META[s] ? t[STATUS_META[s].label] : s}
              </button>
            ))}
            {uniqueSubjects.length > 1 && (
              <div className="relative">
                <select
                  value={subjectFilter}
                  onChange={e => setSubjectFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="all">{t.asgpAllSubjects}</option>
                  {uniqueSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Yuklanmoqda */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 animate-pulse flex gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bo'sh */}
      {!loading && courses.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-14 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">{t.adNoCourses}</p>
          <p className="text-xs text-gray-400 mt-1">
            {t.acEmptyHint}
          </p>
        </div>
      )}

      {!loading && courses.length > 0 && filtered.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.acFilterNotFound}</p>
        </div>
      )}

      {/* Kurslar ro'yxati */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(c => {
            const st      = STATUS_META[c.status] ?? STATUS_META.inactive
            const fillPct = c.capacity > 0 ? Math.round((c.student_count / c.capacity) * 100) : 0

            return (
              <div key={c.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Fan ikonkasi */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={c.subject
                      ? { backgroundColor: c.subject.color + '18', border: `2px solid ${c.subject.color}30` }
                      : { backgroundColor: '#f3f4f6', border: '2px solid #e5e7eb' }
                    }
                  >
                    {c.subject?.icon ?? <BookOpen className="w-5 h-5 text-gray-400" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">{c.name}</h3>
                      <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', st.bg, st.color)}>
                        {t[st.label]}
                      </span>
                    </div>

                    {c.subject && (
                      <p className="text-xs mt-0.5 font-medium" style={{ color: c.subject.color }}>
                        {c.subject.name}
                      </p>
                    )}

                    {/* O'qituvchi */}
                    {c.teacher && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <GraduationCap className="w-3 h-3" />
                        <span>{c.teacher.full_name ?? c.teacher.email ?? '—'}</span>
                      </div>
                    )}

                    {/* Sanalar */}
                    {(c.start_date || c.end_date) && (
                      <p className="text-xs text-gray-400 mt-1">
                        {c.start_date && fmtDate(c.start_date, t)}
                        {c.start_date && c.end_date && ' → '}
                        {c.end_date && fmtDate(c.end_date, t)}
                      </p>
                    )}

                    {/* Statistika */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {c.student_count}/{c.capacity} {t.tdStudentWord}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {c.lesson_count} {t.tdLessonWord}
                      </span>
                      <span>{c.test_count} {t.acTestWord}</span>
                    </div>

                    {/* To'lganlik */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-32 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            fillPct >= 90 ? 'bg-red-400' : fillPct >= 70 ? 'bg-amber-400' : 'bg-blue-400'
                          )}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-400">{fillPct}% {t.acFilledSuffix}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
