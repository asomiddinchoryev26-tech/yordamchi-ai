import { useState, useEffect } from 'react'
import type { ComponentType } from 'react'
import {
  Users, BookOpen, CheckSquare, BarChart2,
  Search, TrendingUp, GraduationCap, ChevronRight,
  Award, Trophy, Star, Medal, Clock, CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/routes/paths'
import { AIWeakStudents } from '@/components/teacher/TeacherFeatures'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

type TeacherTab = 'students' | 'courses' | 'attendance' | 'reports' | 'achievements'
interface TabDef { key: TeacherTab; label: string; icon: ComponentType<{className?:string}> }

type TDStudent = {
  id:          string
  full_name:   string | null
  email:       string | null
  status:      'active' | 'inactive'
  group_name:  string
  att_present: number
  att_total:   number
}

type TDGroup = {
  id:            string
  name:          string
  status:        'active' | 'inactive' | 'completed'
  subject:       { name: string; icon: string; color: string } | null
  student_count: number
  lesson_count:  number
}

type TDTopStudent = {
  id:        string
  full_name: string | null
  group:     string
  score:     number
  total:     number
}

type TDAtt = {
  group_name: string
  present:    number
  absent:     number
  total:      number
}

type EarnedAchievement = {
  id:           string
  total_score:  number | null
  period_year:  number
  period_month: number | null
  period_type:  'monthly' | 'yearly'
  earned_at:    string
  group_id:     string | null
  group_name:   string | null
  def: {
    code:        string
    name:        { uz: string; ru: string; en: string }
    description: { uz: string; ru: string; en: string }
    tier:        'gold' | 'silver' | 'bronze' | 'special'
    icon_emoji:  string
  } | null
}

type TDScoreSnapshot = {
  id:                string
  total_score:       number
  attendance_score:  number
  test_score:        number
  consistency_score: number
  activity_score:    number
  period_year:       number
  period_month:      number
  group_name:        string | null
}

// ─── Konstantalar ─────────────────────────────────────────────────────────────

const TABS: { key: TeacherTab; label: keyof Translations; icon: TabDef['icon'] }[] = [
  { key:'students',     label:'tdTabStudents',     icon: Users       },
  { key:'courses',      label:'tdTabCourses',      icon: BookOpen    },
  { key:'attendance',   label:'achAttendance',     icon: CheckSquare },
  { key:'reports',      label:'tdTabReports',      icon: BarChart2   },
  { key:'achievements', label:'tdTabAchievements', icon: Award       },
]

const MONTHS = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']

function avgColor(n: number) {
  if (n >= 80) return 'text-emerald-700 bg-emerald-50'
  if (n >= 60) return 'text-amber-700 bg-amber-50'
  return 'text-red-700 bg-red-50'
}

function scoreBarColor(n: number) {
  if (n >= 90) return 'bg-emerald-500'
  if (n >= 75) return 'bg-blue-500'
  if (n >= 60) return 'bg-amber-500'
  return 'bg-red-400'
}

function tierStyle(tier: string) {
  switch (tier) {
    case 'gold':
      return { bg:'bg-amber-50 dark:bg-amber-900/20', border:'border-amber-200 dark:border-amber-700', iconBg:'bg-amber-100 dark:bg-amber-900/40', text:'text-amber-700 dark:text-amber-300', badge:'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', bar:'bg-amber-400', label:'tdGold' as keyof Translations }
    case 'silver':
      return { bg:'bg-slate-50 dark:bg-slate-800/40', border:'border-slate-200 dark:border-slate-600', iconBg:'bg-slate-100 dark:bg-slate-700', text:'text-slate-600 dark:text-slate-300', badge:'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', bar:'bg-slate-400', label:'tdSilver' as keyof Translations }
    case 'bronze':
      return { bg:'bg-orange-50 dark:bg-orange-900/20', border:'border-orange-200 dark:border-orange-700', iconBg:'bg-orange-100 dark:bg-orange-900/40', text:'text-orange-700 dark:text-orange-300', badge:'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', bar:'bg-orange-400', label:'tdBronze' as keyof Translations }
    default:
      return { bg:'bg-violet-50 dark:bg-violet-900/20', border:'border-violet-200 dark:border-violet-700', iconBg:'bg-violet-100 dark:bg-violet-900/40', text:'text-violet-700 dark:text-violet-300', badge:'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', bar:'bg-violet-400', label:'tdSpecial' as keyof Translations }
  }
}

function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

function periodLabel(year: number, month: number | null) {
  if (month === null) return `${year} yil`
  return `${MONTHS[month - 1]} ${year}`
}

function achName(def: EarnedAchievement['def']): string {
  if (!def) return 'Yutuq'
  return def.name?.uz || def.name?.en || def.code
}

function achDesc(def: EarnedAchievement['def']): string {
  if (!def) return ''
  return def.description?.uz || def.description?.en || ''
}

// ═════════════════════════════════════════════════════════════════════════════

export default function TeacherDashboardPage() {
  const auth     = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [tab,     setTab]     = useState<TeacherTab>('students')
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  const [students,     setStudents]     = useState<TDStudent[]>([])
  const [groups,       setGroups]       = useState<TDGroup[]>([])
  const [topStudents,  setTopStudents]  = useState<TDTopStudent[]>([])
  const [attSummary,   setAttSummary]   = useState<TDAtt[]>([])
  const [achievements, setAchievements] = useState<EarnedAchievement[]>([])
  const [snapshots,    setSnapshots]    = useState<TDScoreSnapshot[]>([])

  useEffect(() => {
    if (!auth.user?.id) return
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load() unmemoized by design; re-run only on user id change
  }, [auth.user?.id])

  async function load() {
    if (!auth.user?.id) return
    setLoading(true)

    try {
      // Teacher's own achievements — independent of student groups
      const [achieveRes, snapshotRes] = await Promise.all([
        supabase
          .from('user_achievements')
          .select(`
            id,
            total_score,
            period_year,
            period_month,
            period_type,
            earned_at,
            group_id,
            achievement_definitions ( code, name, description, tier, icon_emoji ),
            groups ( name )
          `)
          .eq('user_id', auth.user.id)
          .order('earned_at', { ascending: false })
          .limit(20),

        supabase
          .from('user_score_snapshots')
          .select(`
            id,
            total_score,
            attendance_score,
            test_score,
            consistency_score,
            activity_score,
            period_year,
            period_month,
            group_id,
            groups ( name )
          `)
          .eq('user_id', auth.user.id)
          .eq('role', 'teacher')
          .eq('period_type', 'monthly')
          .order('period_year', { ascending: false })
          .order('period_month', { ascending: false })
          .limit(6),
      ])

      setAchievements(
        (achieveRes.data ?? []).map((r: any) => ({
          id:           r.id,
          total_score:  r.total_score,
          period_year:  r.period_year,
          period_month: r.period_month,
          period_type:  r.period_type,
          earned_at:    r.earned_at,
          group_id:     r.group_id,
          group_name:   r.groups?.name ?? null,
          def:          r.achievement_definitions ?? null,
        }))
      )

      setSnapshots(
        (snapshotRes.data ?? []).map((r: any) => ({
          id:                r.id,
          total_score:       r.total_score,
          attendance_score:  r.attendance_score,
          test_score:        r.test_score,
          consistency_score: r.consistency_score,
          activity_score:    r.activity_score,
          period_year:       r.period_year,
          period_month:      r.period_month,
          group_name:        r.groups?.name ?? null,
        }))
      )

      // 1. Guruhlar
      const { data: groupsData } = await supabase
        .from('groups')
        .select('id, name, status, subject:subjects(name, icon, color), student_groups(id), lessons(id)')
        .eq('teacher_id', auth.user.id)

      const grpList: TDGroup[] = (groupsData ?? []).map((g:any) => ({
        id:            g.id,
        name:          g.name,
        status:        g.status,
        subject:       g.subject ?? null,
        student_count: (g.student_groups ?? []).length,
        lesson_count:  (g.lessons ?? []).length,
      }))
      setGroups(grpList)

      const groupIds = grpList.map(g => g.id)
      if (!groupIds.length) { setLoading(false); return }

      // 2. Talabalar + davomat parallel
      const [enrollRes, attRes, testIdsRes] = await Promise.all([
        supabase
          .from('student_groups')
          .select('group_id, student:profiles(id, full_name, email, status), group:groups(name)')
          .in('group_id', groupIds),

        supabase
          .from('attendance')
          .select('student_id, group_id, status')
          .in('group_id', groupIds),

        supabase
          .from('tests')
          .select('id')
          .in('group_id', groupIds),
      ])

      const testIds = (testIdsRes.data ?? []).map((t: any) => t.id)
      const { data: testResultsData } = testIds.length
        ? await supabase
            .from('test_results')
            .select('student_id, score, total_questions')
            .not('submitted_at', 'is', null)
            .in('test_id', testIds)
            .limit(200)
        : { data: [] }

      const testRes = { data: testResultsData }

      const attMap    = new Map<string, {present:number; total:number}>()
      const grpAttMap = new Map<string, {present:number; absent:number; total:number}>()

      for (const a of attRes.data ?? []) {
        if (!attMap.has(a.student_id)) attMap.set(a.student_id, {present:0, total:0})
        const e = attMap.get(a.student_id)!
        e.total++
        if (a.status==='present') e.present++

        if (!grpAttMap.has(a.group_id)) grpAttMap.set(a.group_id, {present:0, absent:0, total:0})
        const ge = grpAttMap.get(a.group_id)!
        ge.total++
        if (a.status==='present') ge.present++
        else if (a.status==='absent') ge.absent++
      }

      const rows: TDStudent[] = (enrollRes.data ?? []).map((e:any) => {
        const s   = e.student
        const att = attMap.get(s.id) ?? {present:0, total:0}
        return {
          id:          s.id,
          full_name:   s.full_name,
          email:       s.email,
          status:      s.status ?? 'active',
          group_name:  (e.group as any)?.name ?? '—',
          att_present: att.present,
          att_total:   att.total,
        }
      })
      setStudents(rows)

      setAttSummary(
        grpList.map(g => {
          const ga = grpAttMap.get(g.id) ?? {present:0, absent:0, total:0}
          return { group_name: g.name, present: ga.present, absent: ga.absent, total: ga.total }
        })
      )

      const studentScoreMap = new Map<string, {score:number; total:number}>()
      for (const r of (testRes.data ?? []) as any[]) {
        if (!studentScoreMap.has(r.student_id)) studentScoreMap.set(r.student_id, {score:0, total:0})
        const e = studentScoreMap.get(r.student_id)!
        e.score += r.score
        e.total += r.total_questions
      }

      const top: TDTopStudent[] = rows
        .map(s => {
          const sc = studentScoreMap.get(s.id)
          return { id: s.id, full_name: s.full_name, group: s.group_name, score: sc?.score??0, total: sc?.total??0 }
        })
        .filter(s => s.total > 0)
        .sort((a, b) => (b.score/b.total) - (a.score/a.total))
        .slice(0, 5)
      setTopStudents(top)
    } catch (e) {
      logger.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    return !search || (s.full_name??'').toLowerCase().includes(q) || s.group_name.toLowerCase().includes(q)
  })

  const totalStudents = students.length
  const totalGroups   = groups.length
  const totalLessons  = groups.reduce((a, g) => a + g.lesson_count, 0)

  const goldCount    = achievements.filter(a => a.def?.tier === 'gold').length
  const silverCount  = achievements.filter(a => a.def?.tier === 'silver').length
  const bronzeCount  = achievements.filter(a => a.def?.tier === 'bronze').length
  const specialCount = achievements.filter(a => a.def?.tier === 'special').length
  const latestSnap   = snapshots[0] ?? null

  return (
    <div className="space-y-6 pb-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.tdDashboardTitle}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {auth.user?.name ?? t.tdTeacher} • {t.tdRealData}
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { l: t.tdStudents, v: loading ? '...' : String(totalStudents) },
            { l: t.tdGroups,   v: loading ? '...' : String(totalGroups)   },
            { l: t.tdLessons,  v: loading ? '...' : String(totalLessons)  },
          ].map(s => (
            <div key={s.l} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-2.5 text-center min-w-[72px]">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-none">{s.v}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI o'quvchi tahlili (Premium) — additiv, mavjud dizaynga tegmasdan */}
      {auth.user?.id && <AIWeakStudents teacherId={auth.user.id} />}

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-x-auto">
        {TABS.map(ti => {
          const Icon = ti.icon
          const active = tab === ti.key
          return (
            <button key={ti.key} type="button" onClick={() => setTab(ti.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0',
                active ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-700/60',
              )}
            >
              <Icon className="w-4 h-4" />
              {t[ti.label]}
              {ti.key === 'achievements' && achievements.length > 0 && (
                <span className="ml-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {achievements.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ══ TALABALARIM ══ */}
      {tab === 'students' && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                placeholder={t.tdSearchStudent}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <span className="text-sm text-gray-500">{filtered.length} {t.tdCount}</span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">{[1,2,3,4].map(i=><div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-400">
                {students.length === 0 ? t.tdNoStudents : t.tdStudentNotFound}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[440px]">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                      {['#', t.tdColStudent, t.tdColGroup, t.achAttendance, t.tdColStatus].map(h=>(
                        <th key={h} className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide py-3 px-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filtered.map((s, i) => {
                      const attPct = s.att_total > 0 ? Math.round((s.att_present/s.att_total)*100) : null
                      return (
                        <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                          <td className="py-3 px-4 text-gray-400 text-xs font-medium">{i+1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white bg-gradient-to-br from-blue-500 to-indigo-600">
                                {(s.full_name??s.email??'T').charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[100px]">{s.full_name ?? '—'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit">
                              <GraduationCap className="w-3 h-3" />{s.group_name}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {attPct !== null
                              ? <span className={cn('text-sm font-bold px-2 py-0.5 rounded-lg', avgColor(attPct))}>{attPct}%</span>
                              : <span className="text-xs text-gray-400">—</span>
                            }
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                              s.status==='active'?'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400':'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            )}>
                              {s.status==='active'?t.admActive:t.tdInactive}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="text-center">
            <button onClick={() => navigate(PATHS.TEACHER.STUDENTS)} className="text-sm text-indigo-600 font-medium hover:underline inline-flex items-center gap-1">
              {t.tdFullStudents} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ══ GURUHLARIM ══ */}
      {tab === 'courses' && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500">{loading ? '...' : `${groups.length} ${t.tdGroupWord}`}</p>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i=><div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse"/>)}
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-sm text-gray-400">
              {t.tdNoGroups}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {groups.map(g => (
                <div key={g.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-3xl">{g.subject?.icon ?? '📚'}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">{g.name}</h3>
                      {g.subject && <p className="text-xs mt-0.5 font-medium" style={{color:g.subject.color}}>{g.subject.name}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {g.student_count} {t.tdStudentWord} • {g.lesson_count} {t.tdLessonWord}
                      </p>
                    </div>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                      g.status==='active'?'bg-emerald-100 text-emerald-700':g.status==='completed'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-500'
                    )}>
                      {g.status==='active'?t.admActive:g.status==='completed'?t.tdCompleted:t.tdInactive}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{g.student_count} / {g.student_count} {t.tdStudentWord}</span>
                    <button onClick={()=>navigate(PATHS.TEACHER.GROUPS)} className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                      {t.tdView} <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ DAVOMAT ══ */}
      {tab === 'attendance' && (
        <div className="space-y-5">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"/>)}</div>
          ) : attSummary.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-sm text-gray-400">
              {t.sdNoAttendance}
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-5">{t.tdAttSummary}</h2>
                <div className="space-y-4">
                  {attSummary.map(a => {
                    const pct = a.total > 0 ? Math.round((a.present/a.total)*100) : 0
                    return (
                      <div key={a.group_name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-800 dark:text-gray-200">{a.group_name}</span>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{a.total} {t.tdParticipations}</span>
                            <span className={cn('font-bold', pct>=80?'text-emerald-600':pct>=60?'text-amber-600':'text-red-600')}>
                              {pct}% {t.tdPresentPct}
                            </span>
                          </div>
                        </div>
                        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                          {a.present > 0 && <div className="bg-emerald-500 h-full" style={{width:`${(a.present/a.total)*100}%`}} />}
                          {(a.total - a.present - a.absent) > 0 && (
                            <div className="bg-amber-400 h-full" style={{width:`${((a.total-a.present-a.absent)/a.total)*100}%`}} />
                          )}
                          {a.absent > 0 && <div className="bg-red-400 h-full" style={{width:`${(a.absent/a.total)*100}%`}} />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="text-center">
                <button onClick={()=>navigate(PATHS.TEACHER.ATTENDANCE)} className="text-sm text-indigo-600 font-medium hover:underline inline-flex items-center gap-1">
                  {t.tdGoToAttendance} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ HISOBOTLAR ══ */}
      {tab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {loading ? (
              [1,2,3,4].map(i=><div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse"/>)
            ) : [
              { l: t.tdStudents,    v: totalStudents,              e:'👥', bg:'bg-indigo-50'  },
              { l: t.tdGroups,      v: totalGroups,                e:'🏫', bg:'bg-blue-50'    },
              { l: t.tdLessons,     v: totalLessons,               e:'📖', bg:'bg-emerald-50' },
              { l: t.tdTestResults, v: topStudents.length>0?'✓':'—',e:'📝', bg:'bg-amber-50'  },
            ].map(s=>(
              <div key={s.l} className={cn('rounded-2xl border border-gray-100 dark:border-gray-700 p-5',s.bg)}>
                <span className="text-2xl">{s.e}</span>
                <p className="text-xl font-bold text-gray-900 mt-2">{s.v}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>

          {topStudents.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                {t.tdTopStudents}
              </h2>
              <div className="space-y-3">
                {topStudents.map((s, i) => {
                  const pct = s.total > 0 ? Math.round((s.score/s.total)*100) : 0
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <span className={cn('w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0',
                        i===0?'bg-yellow-400 text-white':i===1?'bg-gray-400 text-white':i===2?'bg-amber-600 text-white':'bg-gray-200 text-gray-600'
                      )}>
                        {i+1}
                      </span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white bg-gradient-to-br from-blue-500 to-indigo-600">
                        {(s.full_name??'T').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{s.full_name??'—'}</p>
                        <p className="text-xs text-gray-400">{s.group}</p>
                      </div>
                      <span className={cn('text-sm font-bold px-2 py-0.5 rounded-lg', avgColor(pct))}>{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {topStudents.length === 0 && !loading && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-sm text-gray-400">
              {t.tdNoTestResults}
            </div>
          )}
        </div>
      )}

      {/* ══ YUTUQLAR ══ */}
      {tab === 'achievements' && (
        <div className="space-y-6">

          {loading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {[1,2,3,4].map(i=><div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"/>)}
              </div>
              <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"/>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1,2].map(i=><div key={i} className="h-36 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"/>)}
              </div>
            </div>
          )}

          {!loading && (
            <>
              {/* ── 1. Tier statistikasi ── */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {[
                  { tier:'gold',    label:t.tdGold,    emoji:'🥇', count: goldCount,    bg:'bg-amber-50 dark:bg-amber-900/20',   border:'border-amber-200 dark:border-amber-700',  text:'text-amber-600 dark:text-amber-400'  },
                  { tier:'silver',  label:t.tdSilver,  emoji:'🥈', count: silverCount,  bg:'bg-slate-50 dark:bg-slate-800/40',   border:'border-slate-200 dark:border-slate-600',  text:'text-slate-500 dark:text-slate-400'  },
                  { tier:'bronze',  label:t.tdBronze,  emoji:'🥉', count: bronzeCount,  bg:'bg-orange-50 dark:bg-orange-900/20', border:'border-orange-200 dark:border-orange-700', text:'text-orange-600 dark:text-orange-400' },
                  { tier:'special', label:t.tdSpecial, emoji:'⭐', count: specialCount, bg:'bg-violet-50 dark:bg-violet-900/20', border:'border-violet-200 dark:border-violet-700', text:'text-violet-600 dark:text-violet-400' },
                ].map(s => (
                  <div key={s.tier} className={cn('rounded-2xl border p-4 flex flex-col items-center text-center', s.bg, s.border)}>
                    <span className="text-2xl mb-1">{s.emoji}</span>
                    <p className={cn('text-2xl font-bold', s.text)}>{s.count}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label} {t.tdAchWord}</p>
                    {s.count > 0 && (
                      <span className="mt-1.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> {t.tdAchieved}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* ── 2. Ballar taqsimoti ── */}
              {latestSnap && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      {t.tdScoreDistribution}
                    </h2>
                    <div className="flex items-center gap-2">
                      {latestSnap.group_name && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">{latestSnap.group_name} ·</span>
                      )}
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {periodLabel(latestSnap.period_year, latestSnap.period_month)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <div className={cn(
                      'w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0',
                      latestSnap.total_score >= 90 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                      latestSnap.total_score >= 75 ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                      latestSnap.total_score >= 60 ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' :
                      'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    )}>
                      {latestSnap.total_score}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{t.tdTotalScore}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {latestSnap.total_score >= 90 ? t.tdGoldMsg :
                         latestSnap.total_score >= 75 ? t.tdSilverMsg :
                         latestSnap.total_score >= 60 ? t.tdBronzeMsg :
                         t.tdNoCertYet}
                      </p>
                    </div>
                    <div className="ml-auto text-right flex-shrink-0">
                      <div className={cn('text-xs font-bold px-2.5 py-1 rounded-lg',
                        latestSnap.total_score >= 90 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                        latestSnap.total_score >= 75 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                        latestSnap.total_score >= 60 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                        'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      )}>
                        {latestSnap.total_score >= 90 ? t.tdGold :
                         latestSnap.total_score >= 75 ? t.tdSilver :
                         latestSnap.total_score >= 60 ? t.tdBronze : t.tdBelowBronze}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label:t.achAttendance,     value: latestSnap.attendance_score,  weight:'×40%', icon:'📅' },
                      { label:t.tdScoreTest,        value: latestSnap.test_score,        weight:'×40%', icon:'📝' },
                      { label:t.tdScoreConsistency, value: latestSnap.consistency_score, weight:'×20%', icon:'🔁' },
                      { label:t.tdScoreActivity,    value: latestSnap.activity_score,    weight:'—',    icon:'⚡' },
                    ].map(({ label, value, weight, icon }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                            <span>{icon}</span> {label}
                            <span className="text-gray-300 dark:text-gray-600">{weight}</span>
                          </span>
                          <span className={cn('text-xs font-bold',
                            value >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                            value >= 75 ? 'text-blue-600 dark:text-blue-400' :
                            value >= 60 ? 'text-amber-600 dark:text-amber-400' :
                            'text-red-500 dark:text-red-400'
                          )}>
                            {value}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all', scoreBarColor(value))} style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {latestSnap.total_score < 90 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {latestSnap.total_score < 60
                          ? `${t.tdForBronze} ${60 - latestSnap.total_score} ${t.tdScoreNeeded}`
                          : latestSnap.total_score < 75
                          ? `${t.tdForSilver} ${75 - latestSnap.total_score} ${t.tdScoreNeeded}`
                          : `${t.tdForGold} ${90 - latestSnap.total_score} ${t.tdScoreNeeded}`}
                      </p>
                      <div className="mt-1.5 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', scoreBarColor(latestSnap.total_score))} style={{ width: `${latestSnap.total_score}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── 3. Erishilgan yutuqlar ── */}
              {achievements.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    {t.tdAchievedTitle}
                    <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({achievements.length} {t.tdCount})</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {achievements.map(a => {
                      const st = tierStyle(a.def?.tier ?? 'special')
                      return (
                        <div key={a.id} className={cn('rounded-2xl border p-5 flex gap-4', st.bg, st.border)}>
                          <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0', st.iconBg)}>
                            {a.def?.icon_emoji ?? '🏆'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', st.badge)}>{t[st.label]}</span>
                              {a.total_score !== null && (
                                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{a.total_score} {t.tdBall}</span>
                              )}
                            </div>
                            <h3 className={cn('text-sm font-bold truncate', st.text)}>{achName(a.def)}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{achDesc(a.def)}</p>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />{periodLabel(a.period_year, a.period_month)}
                              </span>
                              {a.group_name && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">📚 {a.group_name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── 4. Bo'sh holat ── */}
              {achievements.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-3xl mx-auto mb-4">
                    🏆
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">{t.tdNoAchYet}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-sm mx-auto">
                    {t.tdAchEmptyDesc}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
                    {[
                      { emoji:'🥉', title:t.tdBronze, desc:t.tdBronzeGoal, bg:'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
                      { emoji:'🥈', title:t.tdSilver, desc:t.tdSilverGoal, bg:'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-600'    },
                      { emoji:'🥇', title:t.tdGold,   desc:t.tdGoldGoal,   bg:'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'     },
                    ].map(g => (
                      <div key={g.title} className={cn('rounded-xl border p-3', g.bg)}>
                        <span className="text-xl">{g.emoji}</span>
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-1">{g.title}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{g.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 5. So'nggi faollik timeline ── */}
              {achievements.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-5">
                    <Medal className="w-4 h-4 text-blue-500" /> {t.tdRecentActivity}
                  </h2>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-700" />
                    <div className="space-y-4">
                      {achievements.slice(0, 5).map((a, idx) => {
                        const st = tierStyle(a.def?.tier ?? 'special')
                        return (
                          <div key={a.id} className="flex gap-4 relative">
                            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 relative z-10 border-2 border-white dark:border-gray-800', st.iconBg)}>
                              {a.def?.icon_emoji ?? '🏆'}
                            </div>
                            <div className={cn(
                              'flex-1 rounded-xl border p-3',
                              idx === 0 ? cn(st.bg, st.border) : 'bg-gray-50 dark:bg-gray-700/40 border-gray-100 dark:border-gray-700'
                            )}>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className={cn('text-sm font-semibold', idx === 0 ? st.text : 'text-gray-800 dark:text-gray-200')}>
                                    {achName(a.def)}
                                  </p>
                                  {a.group_name && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{a.group_name}</p>
                                  )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{fmtDate(a.earned_at)}</p>
                                  <p className={cn('text-[10px] font-bold mt-0.5', st.text)}>{periodLabel(a.period_year, a.period_month)}</p>
                                </div>
                              </div>
                              {a.total_score !== null && (
                                <div className="mt-2 flex items-center gap-2">
                                  <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                    <div className={cn('h-full rounded-full', st.bar)} style={{ width: `${a.total_score}%` }} />
                                  </div>
                                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{a.total_score}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  {achievements.length > 5 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
                      + {achievements.length - 5} {t.tdMoreAchievements}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
