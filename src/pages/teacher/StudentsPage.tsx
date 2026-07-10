import { useState, useEffect } from 'react'
import {
  Users, Search, AlertCircle, ChevronDown,
  GraduationCap, Phone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

type GroupOption = { id: string; name: string; subject_color?: string; subject_icon?: string }

type StudentRow = {
  student_id:  string
  full_name:   string | null
  email:       string | null
  phone:       string | null
  status:      'active' | 'inactive'
  group_id:    string
  group_name:  string
  subject:     { name: string; color: string; icon: string } | null
  enrolled_at: string
  att_present: number
  att_total:   number
}

const MONTHS = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']
function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

// ═════════════════════════════════════════════════════════════════════════════

export default function TeacherStudentsPage() {
  const auth = useAuth()
  const { t } = useLanguage()

  const [students,    setStudents]    = useState<StudentRow[]>([])
  const [groups,      setGroups]      = useState<GroupOption[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [search,      setSearch]      = useState('')
  const [groupFilter, setGroupFilter] = useState('all')

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
      // 1. O'qituvchining guruhlari
      const { data: groupsData, error: gErr } = await supabase
        .from('groups')
        .select('id, name, subject:subjects(name, color, icon)')
        .eq('teacher_id', auth.user.id)
        .order('name')

      if (gErr) throw gErr

      const grpList = (groupsData ?? []).map((g: any) => ({
        id:            g.id,
        name:          g.name,
        subject_color: g.subject?.color,
        subject_icon:  g.subject?.icon,
      }))
      setGroups(grpList)

      if (!grpList.length) { setLoading(false); return }

      const groupIds = grpList.map(g => g.id)

      // 2. Guruh a'zolari + davomat parallel
      const [enrollRes, attRes] = await Promise.all([
        supabase
          .from('student_groups')
          .select('group_id, enrolled_at, student:profiles(id, full_name, email, phone, status), group:groups(id, name, subject:subjects(name, color, icon))')
          .in('group_id', groupIds),

        supabase
          .from('attendance')
          .select('student_id, status')
          .in('group_id', groupIds),
      ])

      if (enrollRes.error) throw enrollRes.error

      // Davomat xaritasi: student_id → {present, total}
      const attMap = new Map<string, { present: number; total: number }>()
      for (const a of attRes.data ?? []) {
        if (!attMap.has(a.student_id)) attMap.set(a.student_id, { present: 0, total: 0 })
        const e = attMap.get(a.student_id)!
        e.total++
        if (a.status === 'present') e.present++
      }

      const rows: StudentRow[] = (enrollRes.data ?? []).map((e: any) => {
        const s   = e.student
        const g   = e.group
        const att = attMap.get(s.id) ?? { present: 0, total: 0 }
        return {
          student_id:  s.id,
          full_name:   s.full_name,
          email:       s.email,
          phone:       s.phone,
          status:      s.status ?? 'active',
          group_id:    e.group_id,
          group_name:  g.name,
          subject:     g.subject ?? null,
          enrolled_at: e.enrolled_at,
          att_present: att.present,
          att_total:   att.total,
        }
      })

      setStudents(rows)
    } catch {
      setError(t.mpLoadErr)
    } finally {
      setLoading(false)
    }
  }

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || (s.full_name ?? '').toLowerCase().includes(q)
      || (s.email    ?? '').toLowerCase().includes(q)
      || (s.phone    ?? '').includes(q)
    const matchGroup = groupFilter === 'all' || s.group_id === groupFilter
    return matchSearch && matchGroup
  })

  if (loading) return (
    <div className="space-y-4 pb-8">
      <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
      <div className="space-y-2">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 animate-pulse flex gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.tdTabStudents}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {students.length} {t.tdStudentWord}, {groups.length} {t.tdGroupWord}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {groups.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <GraduationCap className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">{t.tcNoGroup}</p>
        </div>
      )}

      {groups.length > 0 && (
        <>
          {/* Statistika */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-400 font-medium">{t.tgTotalStudents}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{students.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-400 font-medium">{t.admActive}</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {students.filter(s => s.status === 'active').length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
              <p className="text-xs text-gray-400 font-medium">{t.tdGroups}</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{groups.length}</p>
            </div>
          </div>

          {/* Qidiruv + filtr */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.tstSearchPh}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="relative">
              <select
                value={groupFilter}
                onChange={e => setGroupFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="all">{t.tstAllGroups}</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.subject_icon} {g.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Bo'sh */}
          {students.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">{t.tdNoStudents}</p>
            </div>
          )}

          {students.length > 0 && filtered.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.tstNotFound}</p>
            </div>
          )}

          {/* Talabalar ro'yxati */}
          {filtered.length > 0 && (
            <div className="space-y-2">
              {filtered.map(s => {
                const attPct = s.att_total > 0 ? Math.round((s.att_present / s.att_total) * 100) : null
                return (
                  <div key={`${s.student_id}-${s.group_id}`}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
                  >
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600"
                    >
                      {(s.full_name ?? s.email ?? '?').charAt(0).toUpperCase()}
                    </div>

                    {/* Asosiy ma'lumot */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                          {s.full_name ?? t.taNoName}
                        </p>
                        <span className={cn(
                          'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                          s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        )}>
                          {s.status === 'active' ? t.admActive : t.tdInactive}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{s.email}</p>
                      {s.phone && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />{s.phone}
                        </p>
                      )}
                    </div>

                    {/* Guruh */}
                    <div className="hidden sm:block text-center flex-shrink-0">
                      {s.subject && (
                        <p className="text-xs font-semibold" style={{ color: s.subject.color }}>
                          {s.subject.icon} {s.subject.name}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.group_name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{fmtDate(s.enrolled_at)}</p>
                    </div>

                    {/* Davomat */}
                    {attPct !== null && (
                      <div className="flex-shrink-0 text-center w-16">
                        <p className={cn(
                          'text-lg font-bold',
                          attPct >= 80 ? 'text-emerald-600' : attPct >= 60 ? 'text-amber-600' : 'text-red-600'
                        )}>
                          {attPct}%
                        </p>
                        <p className="text-[11px] text-gray-400">{t.achAttendance.toLowerCase()}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
