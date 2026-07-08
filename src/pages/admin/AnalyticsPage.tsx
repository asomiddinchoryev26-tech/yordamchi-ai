import { useState, useEffect } from 'react'
import { AlertCircle, TrendingUp, Users, CheckSquare, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

type MonthData = { key: string; monthKey: keyof Translations; year: number; students: number; teachers: number }
type AttDist   = { present: number; absent: number; late: number; excused: number; total: number }
type TestDist  = { passed: number; failed: number; total: number }
type RoleCount = { students: number; teachers: number; admin: number }

// ─── Yordamchi ────────────────────────────────────────────────────────────────

const MONTH_ABBR_KEYS: (keyof Translations)[] = [
  'mJan','mFeb','mMar','mApr','mMay','mJun','mJul','mAug','mSep','mOct','mNov','mDec',
]

function getLast6Months(): { key: string; monthKey: keyof Translations; year: number }[] {
  const now = new Date()
  const result = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push({
      key:      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      monthKey: MONTH_ABBR_KEYS[d.getMonth()],
      year:     d.getFullYear(),
    })
  }
  return result
}

function HBar({ label, value, max, color, subLabel }: {
  label: string; value: number; max: number; color: string; subLabel?: string
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="text-gray-500">{subLabel ?? value}</span>
      </div>
      <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
        <div
          className={cn('h-full rounded-lg flex items-center justify-end px-2 transition-all', color)}
          style={{ width: `${Math.max(pct, 2)}%` }}
        >
          {pct > 12 && <span className="text-[10px] text-white font-bold">{value}</span>}
        </div>
      </div>
    </div>
  )
}

function DonutSlice({ pct, color, offset }: { pct: number; color: string; offset: number }) {
  const r   = 40
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const gap  = circ - dash
  return (
    <circle
      r={r}
      cx={50}
      cy={50}
      fill="none"
      stroke={color}
      strokeWidth={12}
      strokeDasharray={`${dash} ${gap}`}
      strokeDashoffset={-offset * circ / 100}
      style={{ transition: 'stroke-dasharray 0.5s' }}
    />
  )
}

// ═════════════════════════════════════════════════════════════════════════════

export default function AdminAnalyticsPage() {
  const { t } = useLanguage()
  const [months,    setMonths]    = useState<MonthData[]>([])
  const [attDist,   setAttDist]   = useState<AttDist | null>(null)
  const [testDist,  setTestDist]  = useState<TestDist | null>(null)
  const [roleCounts, setRoleCounts] = useState<RoleCount | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [profilesRes, attRes, testRes] = await Promise.all([
        supabase.from('profiles').select('role, created_at'),
        supabase.from('attendance').select('status'),
        supabase.from('test_results').select('score, total_questions').not('submitted_at', 'is', null),
      ])

      // Oylik ro'yxatdan o'tish
      const monthKeys = getLast6Months()
      const monthMap  = new Map(monthKeys.map(m => [m.key, { ...m, students: 0, teachers: 0 }]))

      const roles: RoleCount = { students: 0, teachers: 0, admin: 0 }
      for (const p of profilesRes.data ?? []) {
        const key = p.created_at.slice(0, 7)
        const m   = monthMap.get(key)
        if (m) {
          if (p.role === 'student')  { m.students++; roles.students++ }
          if (p.role === 'teacher')  { m.teachers++; roles.teachers++ }
        }
        if (p.role === 'student') roles.students++
        if (p.role === 'teacher') roles.teachers++
        if (p.role === 'admin')   roles.admin++
      }
      // Dedupe counts (above counted twice due to loop logic fix):
      const finalRoles: RoleCount = { students: 0, teachers: 0, admin: 0 }
      for (const p of profilesRes.data ?? []) {
        if (p.role === 'student') finalRoles.students++
        if (p.role === 'teacher') finalRoles.teachers++
        if (p.role === 'admin')   finalRoles.admin++
      }

      setMonths(Array.from(monthMap.values()))
      setRoleCounts(finalRoles)

      // Davomat taqsimoti
      const att: AttDist = { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
      for (const a of attRes.data ?? []) {
        att.total++
        att[a.status as keyof Pick<AttDist, 'present'|'absent'|'late'|'excused'>]++
      }
      setAttDist(att)

      // Test natijalari taqsimoti
      let passed = 0
      for (const r of testRes.data ?? []) {
        if (r.total_questions > 0 && (r.score / r.total_questions) >= 0.6) passed++
      }
      setTestDist({ passed, failed: (testRes.data?.length ?? 0) - passed, total: testRes.data?.length ?? 0 })
    } catch {
      setError(t.mpLoadErr)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="space-y-4 pb-8">
      <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
      <div className="grid grid-cols-2 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  )

  const maxMonthStudents = Math.max(...months.map(m => m.students), 1)
  const maxMonthTeachers = Math.max(...months.map(m => m.teachers), 1)

  const attColors = { present: '#10b981', late: '#f59e0b', excused: '#3b82f6', absent: '#ef4444' }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.anTitle}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t.anSubtitle}</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Foydalanuvchilar taqsimoti */}
      {roleCounts && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t.tdStudents,   value: roleCounts.students, color: 'bg-blue-600',   icon: Users   },
            { label: t.adTeachers,   value: roleCounts.teachers, color: 'bg-indigo-600', icon: Users   },
            { label: t.anAdmins,     value: roleCounts.admin,    color: 'bg-emerald-600',icon: TrendingUp },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.color)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Oylik talabalar ro'yxatdan o'tishi */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">{t.anMonthlyStudents}</h2>
          </div>
          {months.every(m => m.students === 0) ? (
            <p className="text-sm text-gray-400 italic text-center py-6">{t.anNoData}</p>
          ) : (
            <div className="space-y-3">
              {months.map(m => (
                <HBar
                  key={m.key}
                  label={`${t[m.monthKey]} ${m.year}`}
                  value={m.students}
                  max={maxMonthStudents}
                  color="bg-blue-500"
                  subLabel={`${m.students} ${t.anCount}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Oylik o'qituvchilar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">{t.anMonthlyTeachers}</h2>
          </div>
          {months.every(m => m.teachers === 0) ? (
            <p className="text-sm text-gray-400 italic text-center py-6">{t.anNoData}</p>
          ) : (
            <div className="space-y-3">
              {months.map(m => (
                <HBar
                  key={m.key}
                  label={`${t[m.monthKey]} ${m.year}`}
                  value={m.teachers}
                  max={maxMonthTeachers}
                  color="bg-indigo-500"
                  subLabel={`${m.teachers} ${t.anCount}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Davomat taqsimoti */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-gray-900">{t.anAttStates}</h2>
          </div>
          {!attDist || attDist.total === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-6">{t.sdNoAttendance}</p>
          ) : (
            <div className="flex items-center gap-6">
              {/* Donut SVG */}
              <svg width={100} height={100} viewBox="0 0 100 100" className="flex-shrink-0">
                {attDist.present > 0 && (
                  <DonutSlice
                    pct={Math.round((attDist.present / attDist.total) * 100)}
                    color={attColors.present}
                    offset={0}
                  />
                )}
                {attDist.late > 0 && (
                  <DonutSlice
                    pct={Math.round((attDist.late / attDist.total) * 100)}
                    color={attColors.late}
                    offset={Math.round((attDist.present / attDist.total) * 100)}
                  />
                )}
                {attDist.excused > 0 && (
                  <DonutSlice
                    pct={Math.round((attDist.excused / attDist.total) * 100)}
                    color={attColors.excused}
                    offset={Math.round(((attDist.present + attDist.late) / attDist.total) * 100)}
                  />
                )}
                {attDist.absent > 0 && (
                  <DonutSlice
                    pct={Math.round((attDist.absent / attDist.total) * 100)}
                    color={attColors.absent}
                    offset={Math.round(((attDist.present + attDist.late + attDist.excused) / attDist.total) * 100)}
                  />
                )}
                <text x={50} y={50} textAnchor="middle" dy="0.35em" fontSize={14} fontWeight="bold" fill="#111827">
                  {Math.round((attDist.present / attDist.total) * 100)}%
                </text>
              </svg>
              <div className="flex-1 space-y-2">
                {([
                  { key: 'present', label: t.sdPresent, color: attColors.present },
                  { key: 'late',    label: t.sdLate,    color: attColors.late    },
                  { key: 'excused', label: t.sdExcused, color: attColors.excused },
                  { key: 'absent',  label: t.sdAbsent,  color: attColors.absent  },
                ] as const).map(s => (
                  <div key={s.key} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-gray-600 flex-1">{s.label}</span>
                    <span className="font-semibold text-gray-900">{attDist[s.key]}</span>
                    <span className="text-gray-400 w-10 text-right">
                      {Math.round((attDist[s.key] / attDist.total) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Test natijalari */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <FileText className="w-4 h-4 text-amber-600" />
            <h2 className="text-base font-bold text-gray-900">{t.tdTestResults}</h2>
          </div>
          {!testDist || testDist.total === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-6">{t.anNoTestResults}</p>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-3">
                <p className={cn(
                  'text-4xl font-bold',
                  testDist.total > 0 && Math.round((testDist.passed / testDist.total) * 100) >= 70
                    ? 'text-emerald-600' : 'text-amber-600'
                )}>
                  {testDist.total > 0 ? Math.round((testDist.passed / testDist.total) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-500 mt-1">{t.anPassRate}</p>
              </div>
              <div className="space-y-2">
                <HBar label={t.anPassed} value={testDist.passed} max={testDist.total} color="bg-emerald-500"
                  subLabel={`${testDist.passed} ${t.anCount}`} />
                <HBar label={t.anFailed} value={testDist.failed} max={testDist.total} color="bg-red-400"
                  subLabel={`${testDist.failed} ${t.anCount}`} />
              </div>
              <p className="text-center text-xs text-gray-400">
                {t.adTotal} {testDist.total} {t.anCount} {t.anTotalSubmitted}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
