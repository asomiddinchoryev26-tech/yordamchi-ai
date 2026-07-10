import { useState, useEffect } from 'react'
import { AlertCircle, TrendingUp, CheckSquare, FileText, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

type AttStats   = { present: number; absent: number; late: number; excused: number; total: number }
type TestResult = { title: string; score: number; total: number; submitted_at: string | null }
type GroupProgress = {
  id:           string
  name:         string
  subject:      { name: string; color: string; icon: string } | null
  lesson_count: number
  att_present:  number
  att_total:    number
}

const MONTHS = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']
function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

// ─── Yordamchi komponent ──────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, color, bg,
}: { icon: React.ElementType; label: string; value: string | number; color: string; bg: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <div>
        <p className={cn('text-2xl font-bold', color)}>{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════

export default function MyProgressPage() {
  const auth = useAuth()
  const { t } = useLanguage()

  const [attStats,       setAttStats]       = useState<AttStats | null>(null)
  const [testResults,    setTestResults]    = useState<TestResult[]>([])
  const [groupProgress,  setGroupProgress]  = useState<GroupProgress[]>([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState<string | null>(null)

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
      const [attRes, testRes, enrollRes] = await Promise.all([
        // Davomat
        supabase
          .from('attendance')
          .select('status')
          .eq('student_id', auth.user.id),

        // Test natijalari + test nomi — xavfsiz RPC (talaba `tests` jadvalini o'qimaydi)
        supabase.rpc('get_my_test_results'),

        // Guruhlar + darslar soni
        supabase
          .from('student_groups')
          .select('group_id, group:groups(id, name, subject:subjects(name, color, icon), lessons(id))')
          .eq('student_id', auth.user.id),
      ])

      // Davomat statistikasi
      const att: AttStats = { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
      for (const a of attRes.data ?? []) {
        att.total++
        att[a.status as keyof Pick<AttStats, 'present'|'absent'|'late'|'excused'>]++
      }
      setAttStats(att)

      // Test natijalari
      setTestResults(
        (testRes.data ?? []).map((r: any) => ({
          title:        r.test?.title ?? 'Test',
          score:        r.score,
          total:        r.total_questions,
          submitted_at: r.submitted_at,
        }))
      )

      // Guruh bo'yicha progress
      // Davomat guruh bo'yicha
      const groupIds = (enrollRes.data ?? []).map((e: any) => e.group?.id).filter(Boolean)
      const { data: groupAtt } = groupIds.length
        ? await supabase
            .from('attendance')
            .select('group_id, status')
            .eq('student_id', auth.user.id)
            .in('group_id', groupIds)
        : { data: [] }

      const gAttMap = new Map<string, { present: number; total: number }>()
      for (const a of groupAtt ?? []) {
        if (!gAttMap.has(a.group_id)) gAttMap.set(a.group_id, { present: 0, total: 0 })
        const e = gAttMap.get(a.group_id)!
        e.total++
        if (a.status === 'present') e.present++
      }

      setGroupProgress(
        (enrollRes.data ?? [])
          .map((e: any) => {
            const g = e.group
            if (!g) return null
            const att = gAttMap.get(g.id) ?? { present: 0, total: 0 }
            return {
              id:           g.id,
              name:         g.name,
              subject:      g.subject ?? null,
              lesson_count: (g.lessons ?? []).length,
              att_present:  att.present,
              att_total:    att.total,
            }
          })
          .filter(Boolean) as GroupProgress[]
      )
    } catch {
      setError(t.mpLoadErr)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="space-y-4 pb-8">
      <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  )

  // Hisoblar
  const totalTests  = testResults.length
  const passedTests = testResults.filter(r => r.total > 0 && (r.score / r.total) >= 0.6).length
  const avgScore    = totalTests > 0
    ? Math.round(testResults.reduce((a, r) => a + (r.total > 0 ? (r.score / r.total) * 100 : 0), 0) / totalTests)
    : 0
  const attPct = attStats && attStats.total > 0
    ? Math.round((attStats.present / attStats.total) * 100)
    : null

  return (
    <div className="space-y-5 pb-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.mpTitle}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t.mpSubtitle}</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Umumiy statistika */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={CheckSquare}
          label={t.achAttendance}
          value={attPct !== null ? `${attPct}%` : '—'}
          color={attPct === null ? 'text-gray-400' : attPct >= 80 ? 'text-emerald-600' : attPct >= 60 ? 'text-amber-600' : 'text-red-600'}
          bg={attPct === null ? 'bg-gray-50' : attPct >= 80 ? 'bg-emerald-50' : attPct >= 60 ? 'bg-amber-50' : 'bg-red-50'}
        />
        <StatCard
          icon={FileText}
          label={t.mpTestAvg}
          value={totalTests > 0 ? `${avgScore}%` : '—'}
          color={avgScore >= 80 ? 'text-emerald-600' : avgScore >= 60 ? 'text-amber-600' : 'text-gray-400'}
          bg={avgScore >= 80 ? 'bg-emerald-50' : avgScore >= 60 ? 'bg-amber-50' : 'bg-gray-50'}
        />
        <StatCard
          icon={TrendingUp}
          label={t.mpPassedTests}
          value={totalTests > 0 ? `${passedTests}/${totalTests}` : '—'}
          color="text-indigo-600"
          bg="bg-indigo-50"
        />
        <StatCard
          icon={BookOpen}
          label={t.tdLessons}
          value={groupProgress.reduce((a, g) => a + g.lesson_count, 0)}
          color="text-blue-600"
          bg="bg-blue-50"
        />
      </div>

      {/* Davomat tafsiloti */}
      {attStats && attStats.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            {t.mpAttDetail}
          </h2>
          <div className="space-y-2.5">
            {([
              { key: 'present', label: t.sdPresent, color: 'bg-emerald-500' },
              { key: 'late',    label: t.sdLate,    color: 'bg-amber-500'   },
              { key: 'excused', label: t.sdExcused, color: 'bg-blue-500'   },
              { key: 'absent',  label: t.sdAbsent,  color: 'bg-red-400'    },
            ] as const).map(({ key, label, color }) => {
              const val = attStats[key]
              const pct = Math.round((val / attStats.total) * 100)
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={cn('h-full rounded-lg flex items-center justify-end px-2', color)}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    >
                      {pct > 10 && <span className="text-[10px] text-white font-bold">{val}</span>}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-10 text-right">
                    {pct}%
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-right">{t.adTotal} {attStats.total} {t.tdParticipations}</p>
        </div>
      )}

      {/* Guruh bo'yicha progress */}
      {groupProgress.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            {t.mpByGroup}
          </h2>
          <div className="space-y-4">
            {groupProgress.map(g => {
              const gPct = g.att_total > 0 ? Math.round((g.att_present / g.att_total) * 100) : null
              return (
                <div key={g.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {g.subject && (
                        <span className="text-base" title={g.subject.name}>{g.subject.icon}</span>
                      )}
                      <span className="text-sm font-semibold text-gray-800">{g.name}</span>
                      {g.subject && (
                        <span className="text-xs" style={{ color: g.subject.color }}>{g.subject.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{g.lesson_count} {t.tdLessonWord}</span>
                      {gPct !== null && (
                        <span className={cn(
                          'font-bold',
                          gPct >= 80 ? 'text-emerald-600' : gPct >= 60 ? 'text-amber-600' : 'text-red-600'
                        )}>
                          {gPct}% {t.achAttendance.toLowerCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  {gPct !== null && (
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          gPct >= 80 ? 'bg-emerald-500' : gPct >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        )}
                        style={{ width: `${gPct}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Test natijalari */}
      {testResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />
            {t.tdTestResults}
          </h2>
          <div className="space-y-2">
            {testResults.map((r, i) => {
              const pct    = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0
              const passed = pct >= 60
              return (
                <div key={i} className={cn(
                  'flex items-center gap-4 p-3 rounded-xl border',
                  passed ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/30 border-red-100',
                )}>
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0',
                    passed ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white',
                  )}>
                    {pct}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{r.title}</p>
                    {r.submitted_at && (
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(r.submitted_at)}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{r.score}/{r.total}</p>
                    <p className={cn(
                      'text-[11px] font-semibold',
                      passed ? 'text-emerald-600' : 'text-red-600'
                    )}>
                      {passed ? t.mpPassed : t.mpFailed}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Hali ma'lumot yo'q */}
      {(!attStats || attStats.total === 0) && testResults.length === 0 && groupProgress.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <TrendingUp className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">{t.mpNoResults}</p>
          <p className="text-xs text-gray-400 mt-1">
            {t.mpNoResultsHint}
          </p>
        </div>
      )}
    </div>
  )
}
