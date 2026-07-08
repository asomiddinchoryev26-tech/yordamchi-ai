import { useState, useEffect } from 'react'
import { Users, AlertCircle, BookOpen, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

type GroupDetail = {
  id:          string
  name:        string
  status:      'active' | 'inactive' | 'completed'
  capacity:    number
  start_date:  string | null
  end_date:    string | null
  description: string | null
  subject:     { id: string; name: string; color: string; icon: string } | null
  student_count: number
  lesson_count:  number
  students: {
    id:        string
    full_name: string | null
    email:     string | null
    status:    'active' | 'inactive'
  }[]
}

// Holat teglari — matn tarjimadan (rang/fon saqlanadi)
const STATUS_LABELS: Record<string, { label: keyof Translations; bg: string; color: string }> = {
  active:    { label: 'admActive',   bg: 'bg-emerald-100', color: 'text-emerald-700' },
  inactive:  { label: 'tdInactive',  bg: 'bg-gray-100',    color: 'text-gray-600'    },
  completed: { label: 'tdCompleted', bg: 'bg-blue-100',    color: 'text-blue-700'    },
}

const MONTHS = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']
function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

// ═════════════════════════════════════════════════════════════════════════════

export default function TeacherGroupsPage() {
  const auth = useAuth()
  const { t } = useLanguage()

  const [groups,     setGroups]     = useState<GroupDetail[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!auth.user?.id) return
    void load()
  }, [auth.user?.id])

  async function load() {
    if (!auth.user?.id) return
    setLoading(true)
    setError(null)

    try {
      const { data, error: err } = await supabase
        .from('groups')
        .select(`
          id, name, status, capacity, start_date, end_date, description,
          subject:subjects(id, name, color, icon),
          student_groups(student:profiles(id, full_name, email, status)),
          lessons(id)
        `)
        .eq('teacher_id', auth.user.id)
        .order('status')
        .order('name')

      if (err) throw err

      setGroups((data ?? []).map((g: any) => ({
        id:           g.id,
        name:         g.name,
        status:       g.status,
        capacity:     g.capacity,
        start_date:   g.start_date,
        end_date:     g.end_date,
        description:  g.description,
        subject:      g.subject ?? null,
        student_count: (g.student_groups ?? []).length,
        lesson_count:  (g.lessons ?? []).length,
        students: (g.student_groups ?? [])
          .map((sg: any) => sg.student)
          .filter(Boolean)
          .sort((a: any, b: any) => (a.full_name ?? '').localeCompare(b.full_name ?? '')),
      })))
    } catch {
      setError(t.mpLoadErr)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="space-y-4 pb-8">
      <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
      <div className="space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.tdTabCourses}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {groups.length} {t.tdGroupWord}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {groups.length === 0 && !error && (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">{t.tcNoGroup}</p>
          <p className="text-xs text-gray-400 mt-1">{t.tcNoGroupHint}</p>
        </div>
      )}

      {/* Statistika */}
      {groups.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 font-medium">{t.tgTotalGroups}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{groups.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 font-medium">{t.tgTotalStudents}</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {groups.reduce((a, g) => a + g.student_count, 0)}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 font-medium">{t.ccTotalLessons}</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {groups.reduce((a, g) => a + g.lesson_count, 0)}
            </p>
          </div>
        </div>
      )}

      {/* Guruhlar ro'yxati */}
      <div className="space-y-3">
        {groups.map(group => {
          const st      = STATUS_LABELS[group.status] ?? STATUS_LABELS.inactive
          const isOpen  = expandedId === group.id
          const fillPct = group.capacity > 0
            ? Math.round((group.student_count / group.capacity) * 100)
            : 0

          return (
            <div key={group.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Guruh sarlavhasi */}
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : group.id)}
                className="w-full text-left flex items-start gap-4 p-5"
              >
                {/* Fan ikonkasi */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={group.subject
                    ? { backgroundColor: group.subject.color + '18', border: `2px solid ${group.subject.color}30` }
                    : { backgroundColor: '#f3f4f6', border: '2px solid #e5e7eb' }
                  }
                >
                  {group.subject?.icon ?? <Users className="w-5 h-5 text-gray-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900">{group.name}</span>
                    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', st.bg, st.color)}>
                      {t[st.label]}
                    </span>
                  </div>
                  {group.subject && (
                    <p className="text-xs mt-0.5" style={{ color: group.subject.color }}>
                      {group.subject.name}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {group.student_count}/{group.capacity}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {group.lesson_count} {t.tdLessonWord}
                    </span>
                    {group.start_date && <span>{fmtDate(group.start_date)}</span>}
                    {group.end_date && <span>→ {fmtDate(group.end_date)}</span>}
                  </div>

                  {/* To'lganlik darajasi */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          fillPct >= 90 ? 'bg-red-400' : fillPct >= 70 ? 'bg-amber-400' : 'bg-blue-400'
                        )}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-gray-400 w-8 text-right">{fillPct}%</span>
                  </div>
                </div>

                {isOpen
                  ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                }
              </button>

              {/* Kengaytirish: talabalar ro'yxati */}
              {isOpen && (
                <div className="border-t border-gray-100 px-5 pb-4 pt-3">
                  {group.description && (
                    <p className="text-sm text-gray-500 mb-3 italic">{group.description}</p>
                  )}
                  {group.students.length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-2">{t.tfNoStudents}</p>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        {group.students.length} {t.tdStudentWord}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.students.map(st => (
                          <div key={st.id} className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg bg-gray-50">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {(st.full_name ?? st.email ?? '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {st.full_name ?? t.taNoName}
                              </p>
                              <p className="text-[11px] text-gray-400 truncate">{st.email}</p>
                            </div>
                            <span className={cn(
                              'ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0',
                              st.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                            )}>
                              {st.status === 'active' ? t.admActive : t.tdInactive}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
