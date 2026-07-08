import { useState, useEffect } from 'react'
import { AlertCircle, BarChart2, Users, BookOpen, CheckSquare, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

type Summary = {
  students:  number
  teachers:  number
  groups:    number
  lessons:   number
  tests:     number
  attendance: number
}

type GroupReport = {
  id:      string
  name:    string
  present: number
  absent:  number
  late:    number
  excused: number
  total:   number
}

type TestReport = {
  id:           string
  title:        string
  total:        number
  passed:       number
  avgScore:     number
  avgTotal:     number
}

// ─── Bar ──────────────────────────────────────────────────────────────────────

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-24 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded-lg overflow-hidden">
        <div
          className={cn('h-full rounded-lg flex items-center justify-end px-2 transition-all', color)}
          style={{ width: `${Math.max(pct, 4)}%` }}
        >
          {pct > 15 && <span className="text-[10px] text-white font-bold">{value}</span>}
        </div>
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{pct}%</span>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════

export default function AdminReportsPage() {
  const { t } = useLanguage()
  const [summary,      setSummary]      = useState<Summary | null>(null)
  const [groupReports, setGroupReports] = useState<GroupReport[]>([])
  const [testReports,  setTestReports]  = useState<TestReport[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [
        studentsRes, teachersRes, groupsRes, lessonsRes, testsRes, attendanceRes,
        attGroupRes, testResultsRes, testsListRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('groups').select('id', { count: 'exact', head: true }),
        supabase.from('lessons').select('id', { count: 'exact', head: true }),
        supabase.from('tests').select('id', { count: 'exact', head: true }),
        supabase.from('attendance').select('id', { count: 'exact', head: true }),

        // Guruh bo'yicha davomat
        supabase
          .from('attendance')
          .select('group_id, status, group:groups(id, name)'),

        // Test natijalari
        supabase
          .from('test_results')
          .select('test_id, score, total_questions')
          .not('submitted_at', 'is', null),

        // Testlar ro'yxati
        supabase.from('tests').select('id, title'),
      ])

      setSummary({
        students:   studentsRes.count  ?? 0,
        teachers:   teachersRes.count  ?? 0,
        groups:     groupsRes.count    ?? 0,
        lessons:    lessonsRes.count   ?? 0,
        tests:      testsRes.count     ?? 0,
        attendance: attendanceRes.count ?? 0,
      })

      // Guruh hisoboti
      const groupMap = new Map<string, GroupReport>()
      for (const a of attGroupRes.data ?? []) {
        const grp = (a.group as any)
        if (!grp) continue
        if (!groupMap.has(grp.id)) {
          groupMap.set(grp.id, { id: grp.id, name: grp.name, present: 0, absent: 0, late: 0, excused: 0, total: 0 })
        }
        const entry = groupMap.get(grp.id)!
        entry.total++
        entry[a.status as keyof Pick<GroupReport, 'present'|'absent'|'late'|'excused'>]++
      }
      setGroupReports(
        Array.from(groupMap.values())
          .sort((a, b) => b.total - a.total)
          .slice(0, 10)
      )

      // Test hisoboti
      const testTitleMap = new Map((testsListRes.data ?? []).map(t => [t.id, t.title]))
      const testMap = new Map<string, { total: number; passed: number; scoreSum: number; totalQ: number }>()
      for (const r of testResultsRes.data ?? []) {
        if (!testMap.has(r.test_id)) testMap.set(r.test_id, { total: 0, passed: 0, scoreSum: 0, totalQ: 0 })
        const e = testMap.get(r.test_id)!
        e.total++
        e.scoreSum += r.score
        e.totalQ   += r.total_questions
        if (r.total_questions > 0 && (r.score / r.total_questions) >= 0.6) e.passed++
      }
      setTestReports(
        Array.from(testMap.entries())
          .filter(([, v]) => v.total > 0)
          .map(([id, v]) => ({
            id,
            title:    testTitleMap.get(id) ?? 'Test',
            total:    v.total,
            passed:   v.passed,
            avgScore: v.total > 0 ? Math.round(v.scoreSum / v.total) : 0,
            avgTotal: v.total > 0 ? Math.round(v.totalQ  / v.total) : 0,
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 8)
      )
    } catch {
      setError(t.mpLoadErr)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="space-y-4 pb-8">
      <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.tdTabReports}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t.arpSubtitle}</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Umumiy statistika */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: t.tdStudents,  value: summary.students,   icon: Users,       color: 'text-blue-600',   bg: 'bg-blue-50'   },
            { label: t.adTeachers,  value: summary.teachers,   icon: Users,       color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: t.tdGroups,    value: summary.groups,     icon: BarChart2,   color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: t.tdLessons,   value: summary.lessons,    icon: BookOpen,    color: 'text-emerald-600',bg: 'bg-emerald-50'},
            { label: t.adTests,     value: summary.tests,      icon: FileText,    color: 'text-amber-600',  bg: 'bg-amber-50'  },
            { label: t.achAttendance, value: summary.attendance, icon: CheckSquare, color: 'text-teal-600',   bg: 'bg-teal-50'   },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', s.bg)}>
                  <Icon className={cn('w-5 h-5', s.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Guruh davomat hisoboti */}
      {groupReports.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-5">{t.arpGroupAtt}</h2>
          <div className="space-y-4">
            {groupReports.map(g => {
              const presentPct = g.total > 0 ? Math.round((g.present / g.total) * 100) : 0
              return (
                <div key={g.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">{g.name}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{g.total} {t.tdLessonWord}</span>
                      <span className={cn(
                        'font-bold',
                        presentPct >= 80 ? 'text-emerald-600' : presentPct >= 60 ? 'text-amber-600' : 'text-red-600'
                      )}>
                        {presentPct}% {t.tdPresentPct}
                      </span>
                    </div>
                  </div>
                  <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                    {g.present  > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${(g.present /g.total)*100}%` }} title={`${t.sdPresent}: ${g.present}`} />}
                    {g.late     > 0 && <div className="bg-amber-400  h-full" style={{ width: `${(g.late    /g.total)*100}%` }} title={`${t.sdLate}: ${g.late}`} />}
                    {g.excused  > 0 && <div className="bg-blue-400   h-full" style={{ width: `${(g.excused /g.total)*100}%` }} title={`${t.sdExcused}: ${g.excused}`} />}
                    {g.absent   > 0 && <div className="bg-red-400    h-full" style={{ width: `${(g.absent  /g.total)*100}%` }} title={`${t.sdAbsent}: ${g.absent}`} />}
                  </div>
                  <div className="flex gap-4 text-[11px] text-gray-400">
                    <span className="text-emerald-600">✓ {g.present} {t.sdPresent}</span>
                    <span className="text-red-500">✗ {g.absent} {t.sdAbsent}</span>
                    {g.late   > 0 && <span className="text-amber-500">⏱ {g.late} {t.sdLate}</span>}
                    {g.excused > 0 && <span className="text-blue-500">📋 {g.excused} {t.sdExcused}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Test natijalari hisoboti */}
      {testReports.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-5">{t.tdTestResults}</h2>
          <div className="space-y-3">
            {testReports.map(tr => {
              const passPct = tr.total > 0 ? Math.round((tr.passed / tr.total) * 100) : 0
              const avgPct  = tr.avgTotal > 0 ? Math.round((tr.avgScore / tr.avgTotal) * 100) : 0
              return (
                <div key={tr.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800 truncate flex-1 mr-4">{tr.title}</span>
                    <div className="flex items-center gap-3 text-xs flex-shrink-0">
                      <span className="text-gray-500">{tr.total} {t.tdStudentWord}</span>
                      <span className={cn(
                        'font-bold',
                        passPct >= 70 ? 'text-emerald-600' : passPct >= 50 ? 'text-amber-600' : 'text-red-600'
                      )}>
                        {passPct}% {t.mpPassed}
                      </span>
                      <span className="text-gray-500">{t.arpAvg} {avgPct}%</span>
                    </div>
                  </div>
                  <StatBar
                    label={`${tr.passed}/${tr.total}`}
                    value={tr.passed}
                    max={tr.total}
                    color="bg-emerald-500"
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Ma'lumot yo'q */}
      {groupReports.length === 0 && testReports.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <BarChart2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">{t.arpEmpty}</p>
          <p className="text-xs text-gray-400 mt-1">
            {t.arpEmptyHint}
          </p>
        </div>
      )}
    </div>
  )
}
