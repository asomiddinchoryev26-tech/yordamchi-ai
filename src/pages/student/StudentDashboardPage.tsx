import { useState, useEffect } from 'react'
import type { ComponentType } from 'react'
import {
  BookOpen, TrendingUp, FileText, Award,
  CheckCircle, Play, Trophy,
  ChevronRight, CheckSquare, Star, Medal, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { PATHS } from '@/routes/paths'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

type StudentTab = 'courses' | 'progress' | 'tests' | 'achievements'
interface TabDef { key: StudentTab; label: string; icon: ComponentType<{className?:string}> }

type SDGroup = {
  id:           string
  name:         string
  status:       'active' | 'inactive' | 'completed'
  subject:      { name: string; icon: string; color: string } | null
  teacher_name: string | null
  lesson_count: number
  enrolled_at:  string
  att_present:  number
  att_total:    number
}

type SDTest = {
  id:           string
  test_id:      string
  title:        string
  group_name:   string
  score:        number
  total:        number
  submitted_at: string
}

type EarnedAchievement = {
  id:          string
  total_score: number | null
  period_year: number
  period_month: number | null
  period_type: 'monthly' | 'yearly'
  earned_at:   string
  group_id:    string | null
  group_name:  string | null
  def: {
    code:        string
    name:        { uz: string; ru: string; en: string }
    description: { uz: string; ru: string; en: string }
    tier:        'gold' | 'silver' | 'bronze' | 'special'
    icon_emoji:  string
  } | null
}

type ScoreSnapshot = {
  id:               string
  total_score:      number
  attendance_score: number
  test_score:       number
  consistency_score:number
  activity_score:   number
  period_year:      number
  period_month:     number
  group_name:       string | null
}

// ─── Konstantalar ─────────────────────────────────────────────────────────────

const TABS: TabDef[] = [
  { key:'courses',      label:'Kurslarim',   icon: BookOpen    },
  { key:'progress',     label:'Taraqqiyot',  icon: TrendingUp  },
  { key:'tests',        label:'Testlarim',   icon: FileText    },
  { key:'achievements', label:'Yutuqlar',    icon: Award       },
]

// ─── Yordamchi funksiyalar ────────────────────────────────────────────────────

function scoreBarColor(n: number) {
  if (n >= 90) return 'bg-emerald-500'
  if (n >= 75) return 'bg-blue-500'
  if (n >= 60) return 'bg-amber-500'
  return 'bg-red-400'
}

function tierStyle(tier: string) {
  switch (tier) {
    case 'gold':
      return {
        bg:        'bg-amber-50 dark:bg-amber-900/20',
        border:    'border-amber-200 dark:border-amber-700',
        iconBg:    'bg-amber-100 dark:bg-amber-900/40',
        text:      'text-amber-700 dark:text-amber-300',
        badge:     'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        bar:       'bg-amber-400',
        dot:       'bg-amber-400',
        label:     'Oltin',
        statBg:    'bg-amber-50 dark:bg-amber-900/20',
        statText:  'text-amber-600 dark:text-amber-400',
      }
    case 'silver':
      return {
        bg:        'bg-slate-50 dark:bg-slate-800/40',
        border:    'border-slate-200 dark:border-slate-600',
        iconBg:    'bg-slate-100 dark:bg-slate-700',
        text:      'text-slate-600 dark:text-slate-300',
        badge:     'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
        bar:       'bg-slate-400',
        dot:       'bg-slate-400',
        label:     'Kumush',
        statBg:    'bg-slate-50 dark:bg-slate-800/40',
        statText:  'text-slate-500 dark:text-slate-400',
      }
    case 'bronze':
      return {
        bg:        'bg-orange-50 dark:bg-orange-900/20',
        border:    'border-orange-200 dark:border-orange-700',
        iconBg:    'bg-orange-100 dark:bg-orange-900/40',
        text:      'text-orange-700 dark:text-orange-300',
        badge:     'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
        bar:       'bg-orange-400',
        dot:       'bg-orange-400',
        label:     'Bronza',
        statBg:    'bg-orange-50 dark:bg-orange-900/20',
        statText:  'text-orange-600 dark:text-orange-400',
      }
    default:
      return {
        bg:        'bg-violet-50 dark:bg-violet-900/20',
        border:    'border-violet-200 dark:border-violet-700',
        iconBg:    'bg-violet-100 dark:bg-violet-900/40',
        text:      'text-violet-700 dark:text-violet-300',
        badge:     'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
        bar:       'bg-violet-400',
        dot:       'bg-violet-500',
        label:     'Maxsus',
        statBg:    'bg-violet-50 dark:bg-violet-900/20',
        statText:  'text-violet-600 dark:text-violet-400',
      }
  }
}

const MONTHS = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']

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

export default function StudentDashboardPage() {
  const auth     = useAuth()
  const navigate = useNavigate()

  const [tab,     setTab]     = useState<StudentTab>('courses')
  const [loading, setLoading] = useState(true)

  const [groups,       setGroups]       = useState<SDGroup[]>([])
  const [tests,        setTests]        = useState<SDTest[]>([])
  const [attStats,     setAttStats]     = useState<{present:number;absent:number;late:number;excused:number;total:number}|null>(null)
  const [achievements, setAchievements] = useState<EarnedAchievement[]>([])
  const [snapshots,    setSnapshots]    = useState<ScoreSnapshot[]>([])

  useEffect(() => {
    if (!auth.user?.id) return
    void load()
  }, [auth.user?.id])

  async function load() {
    if (!auth.user?.id) return
    setLoading(true)

    try {
      // 1. Faqat enrollment IDlarini olish
      const { data: enrollments, error: enrollErr } = await supabase
        .from('student_groups')
        .select('group_id, enrolled_at')
        .eq('student_id', auth.user.id)
        .order('enrolled_at', { ascending: false })

      if (enrollErr) {
        setGroups([])
        setLoading(false)
        return
      }

      if (!enrollments?.length) {
        setGroups([])
        setLoading(false)
        return
      }

      const groupIds = enrollments.map(e => e.group_id)

      // 2. Parallel: guruh detallari, testlar, davomat, darslar, yutuqlar, snapshot
      const [groupsRes, testRes, attRes, lessonsRes, achieveRes, snapshotRes] = await Promise.all([
        supabase
          .from('groups')
          .select('id, name, status, teacher_id, subject:subjects(name,icon,color)')
          .in('id', groupIds),

        supabase
          .from('test_results')
          .select('id, test_id, score, total_questions, submitted_at, test:tests(title, group:groups(name))')
          .eq('student_id', auth.user.id)
          .not('submitted_at', 'is', null)
          .order('submitted_at', { ascending: false }),

        supabase
          .from('attendance')
          .select('status, group_id')
          .eq('student_id', auth.user.id)
          .in('group_id', groupIds),

        supabase
          .from('lessons')
          .select('group_id')
          .in('group_id', groupIds)
          .eq('is_published', true),

        // Yutuqlar: achievement_definitions va groups bilan join
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

        // Ballar snapshoti: so'nggi 6 oy
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
          .eq('role', 'student')
          .eq('period_type', 'monthly')
          .order('period_year', { ascending: false })
          .order('period_month', { ascending: false })
          .limit(6),
      ])

      // 3. O'qituvchi ismlarini alohida olish
      const teacherIds = [...new Set(
        (groupsRes.data ?? []).map((g: any) => g.teacher_id).filter(Boolean)
      )]
      const { data: teachersData } = teacherIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', teacherIds)
        : { data: [] }

      // Lookup map lar
      const groupMap   = new Map((groupsRes.data ?? []).map((g: any) => [g.id, g]))
      const teacherMap = new Map((teachersData ?? []).map((t: any) => [t.id, t]))

      const lessonCountMap = new Map<string, number>()
      for (const l of lessonsRes.data ?? []) {
        const gid = (l as any).group_id
        lessonCountMap.set(gid, (lessonCountMap.get(gid) ?? 0) + 1)
      }

      const grpAttMap = new Map<string, { present: number; total: number }>()
      for (const a of attRes.data ?? []) {
        const gid = (a as any).group_id
        if (!grpAttMap.has(gid)) grpAttMap.set(gid, { present: 0, total: 0 })
        const entry = grpAttMap.get(gid)!
        entry.total++
        if ((a as any).status === 'present') entry.present++
      }

      // Guruhlar birlashtirish
      const mappedGroups: SDGroup[] = enrollments
        .map(e => {
          const g = groupMap.get(e.group_id)
          if (!g) return null
          const teacher = g.teacher_id ? teacherMap.get(g.teacher_id) : null
          const att     = grpAttMap.get(g.id) ?? { present: 0, total: 0 }
          return {
            id:           g.id,
            name:         g.name,
            status:       g.status,
            subject:      (g as any).subject ?? null,
            teacher_name: teacher?.full_name ?? null,
            lesson_count: lessonCountMap.get(g.id) ?? 0,
            enrolled_at:  e.enrolled_at,
            att_present:  att.present,
            att_total:    att.total,
          }
        })
        .filter(Boolean) as SDGroup[]

      setGroups(mappedGroups)

      setTests((testRes.data ?? []).map((r: any) => ({
        id:           r.id,
        test_id:      r.test_id,
        title:        r.test?.title ?? 'Test',
        group_name:   r.test?.group?.name ?? '—',
        score:        r.score,
        total:        r.total_questions,
        submitted_at: r.submitted_at,
      })))

      const attTotals = { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
      for (const a of attRes.data ?? []) {
        attTotals.total++
        const s = (a as any).status as 'present' | 'absent' | 'late' | 'excused'
        if (s === 'present' || s === 'absent' || s === 'late' || s === 'excused') {
          attTotals[s]++
        }
      }
      setAttStats(attTotals)

      // Yutuqlar xaritalash
      setAchievements(
        (achieveRes.data ?? []).map((r: any) => ({
          id:          r.id,
          total_score: r.total_score,
          period_year: r.period_year,
          period_month:r.period_month,
          period_type: r.period_type,
          earned_at:   r.earned_at,
          group_id:    r.group_id,
          group_name:  r.groups?.name ?? null,
          def:         r.achievement_definitions ?? null,
        }))
      )

      // Snapshot xaritalash
      setSnapshots(
        (snapshotRes.data ?? []).map((r: any) => ({
          id:               r.id,
          total_score:      r.total_score,
          attendance_score: r.attendance_score,
          test_score:       r.test_score,
          consistency_score:r.consistency_score,
          activity_score:   r.activity_score,
          period_year:      r.period_year,
          period_month:     r.period_month,
          group_name:       r.groups?.name ?? null,
        }))
      )

    } catch (e) {
      console.error('[StudentDashboard] load error:', e)
    } finally {
      setLoading(false)
    }
  }

  // Hisoblar
  const totalGroups = groups.length
  const totalTests  = tests.length
  const avgScore    = totalTests > 0
    ? Math.round(tests.reduce((a, r) => a + (r.total > 0 ? (r.score/r.total)*100 : 0), 0) / totalTests)
    : 0
  const passedTests = tests.filter(r => r.total > 0 && (r.score/r.total) >= 0.6).length
  const attPct      = attStats && attStats.total > 0
    ? Math.round((attStats.present / attStats.total) * 100) : null

  // Yutuqlar hisobi
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Mening Dashboardim</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{auth.user?.name ?? 'Talaba'} • Real ma&apos;lumotlar</p>
        </div>
        <div className="flex gap-3">
          {[
            { l:'Kurslar',  v: loading ? '...' : String(totalGroups) },
            { l:'Testlar',  v: loading ? '...' : `${passedTests}/${totalTests}` },
            { l:'Davomat',  v: loading ? '...' : attPct !== null ? `${attPct}%` : '—' },
          ].map(s => (
            <div key={s.l} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-2.5 text-center min-w-[72px]">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-none">{s.v}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon; const active = tab === t.key
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0',
                active
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-700/60',
              )}
            >
              <Icon className="w-4 h-4" />{t.label}
              {t.key === 'achievements' && achievements.length > 0 && (
                <span className="ml-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {achievements.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ══ KURSLARIM ══ */}
      {tab === 'courses' && (
        <div className="space-y-5">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i=><div key={i} className="h-44 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"/>)}
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
              <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Hali hech qanday kursga qo&apos;shilmadingiz</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {groups.map(c => {
                const pct = c.att_total > 0 ? Math.round((c.att_present/c.att_total)*100) : null
                return (
                  <div key={c.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{c.subject?.icon ?? '📚'}</span>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                        c.status==='active'?'bg-blue-100 text-blue-700':c.status==='completed'?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-600'
                      )}>
                        {c.status==='active'?'Davom etmoqda':c.status==='completed'?'Tugallandi':'Nofaol'}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-0.5">{c.name}</h3>
                    {c.subject && <p className="text-xs font-medium mb-1" style={{color:c.subject.color}}>{c.subject.name}</p>}
                    {c.teacher_name && <p className="text-xs text-gray-400 mb-3">{c.teacher_name}</p>}
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="text-gray-500">{c.lesson_count} dars</span>
                      {pct !== null && <span className={cn('font-bold', pct>=80?'text-emerald-600':pct>=60?'text-amber-600':'text-red-600')}>{pct}% davomat</span>}
                    </div>
                    {pct !== null && (
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                        <div className={cn('h-full rounded-full', pct>=80?'bg-emerald-500':pct>=60?'bg-amber-500':'bg-red-500')} style={{width:`${pct}%`}} />
                      </div>
                    )}
                    <button onClick={() => navigate(PATHS.STUDENT.LESSONS)}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                      <Play className="w-3.5 h-3.5" /> Darslarga o&apos;tish
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ TARAQQIYOT ══ */}
      {tab === 'progress' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {loading ? (
              [1,2,3,4].map(i=><div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"/>)
            ) : [
              { l:'Kurslar',        v:`${totalGroups} ta`,               e:'📚', bg:'bg-blue-50 dark:bg-blue-900/20'    },
              { l:'Test topshirdi', v:`${passedTests}/${totalTests}`,    e:'📝', bg:'bg-emerald-50 dark:bg-emerald-900/20' },
              { l:"O'rtacha ball",  v:totalTests>0?`${avgScore}%`:'—',  e:'📊', bg:'bg-violet-50 dark:bg-violet-900/20' },
              { l:'Davomat',        v:attPct!==null?`${attPct}%`:'—',   e:'✅', bg:'bg-amber-50 dark:bg-amber-900/20'   },
            ].map(s=>(
              <div key={s.l} className={cn('rounded-2xl border border-gray-100 dark:border-gray-700 p-5', s.bg)}>
                <span className="text-2xl">{s.e}</span>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-2">{s.v}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>

          {!loading && groups.some(g=>g.att_total>0) && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-5">
                <CheckSquare className="w-4 h-4 text-blue-600" /> Guruh bo&apos;yicha davomat
              </h2>
              <div className="space-y-4">
                {groups.filter(g=>g.att_total>0).map(g => {
                  const pct = Math.round((g.att_present/g.att_total)*100)
                  return (
                    <div key={g.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                          {g.subject?.icon??'📚'} {g.name}
                        </span>
                        <span className={cn('font-bold text-xs', pct>=80?'text-emerald-600':pct>=60?'text-amber-600':'text-red-600')}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', pct>=80?'bg-emerald-500':pct>=60?'bg-amber-500':'bg-red-500')} style={{width:`${pct}%`}} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {attStats && attStats.total > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">Davomat taqsimoti</h2>
              <div className="space-y-2.5">
                {([
                  {key:'present',label:'Kelgan',    color:'bg-emerald-500'},
                  {key:'late',   label:'Kechikkan', color:'bg-amber-500'},
                  {key:'excused',label:'Sababli',   color:'bg-blue-500'},
                  {key:'absent', label:'Kelmagan',  color:'bg-red-400'},
                ] as const).map(({key,label,color}) => {
                  const val = attStats[key as keyof typeof attStats] as number
                  const pct = Math.round((val/attStats.total)*100)
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-20 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <div className={cn('h-full rounded-lg flex items-center justify-end px-2', color)} style={{width:`${Math.max(pct,2)}%`}}>
                          {pct>10 && <span className="text-[10px] text-white font-bold">{val}</span>}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-10 text-right">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!loading && !attStats?.total && groups.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
              <TrendingUp className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Hali taraqqiyot ma&apos;lumoti yo&apos;q</p>
            </div>
          )}
        </div>
      )}

      {/* ══ TESTLARIM ══ */}
      {tab === 'tests' && (
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"/>)}</div>
          ) : tests.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Hali hech qanday test topshirmadingiz</p>
              <button onClick={() => navigate(PATHS.STUDENT.TESTS)} className="mt-4 text-sm text-blue-600 font-medium hover:underline">
                Testlar sahifasiga o&apos;tish
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalTests}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Topshirildi</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-gray-100 dark:border-emerald-800 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{passedTests}</p>
                  <p className="text-xs text-gray-400 mt-0.5">O&apos;tdi (≥60%)</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-gray-100 dark:border-blue-800 p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{avgScore}%</p>
                  <p className="text-xs text-gray-400 mt-0.5">O&apos;rtacha</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Test natijalari</p>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {tests.map(t => {
                    const pct    = t.total > 0 ? Math.round((t.score/t.total)*100) : 0
                    const passed = pct >= 60
                    return (
                      <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
                          passed?'bg-emerald-600 text-white':'bg-red-500 text-white'
                        )}>
                          {pct}%
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{t.title}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <span>{t.group_name}</span><span>·</span><span>{fmtDate(t.submitted_at)}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{t.score}/{t.total}</p>
                          <p className={cn('text-[11px] font-semibold', passed?'text-emerald-600':'text-red-600')}>
                            {passed?"O'tdi":"O'tmadi"}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="text-center">
                <button onClick={()=>navigate(PATHS.STUDENT.TESTS)} className="text-sm text-blue-600 font-medium hover:underline inline-flex items-center gap-1">
                  Testlar sahifasiga o&apos;tish <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ YUTUQLAR ══ */}
      {tab === 'achievements' && (
        <div className="space-y-6">

          {/* Skeleton */}
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
              {/* ── 1. Statistika ──────────────────────────────────────────── */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {[
                  { tier:'gold',    label:'Oltin',  emoji:'🥇', count: goldCount,    bg:'bg-amber-50 dark:bg-amber-900/20',   border:'border-amber-200 dark:border-amber-700',  text:'text-amber-600 dark:text-amber-400' },
                  { tier:'silver',  label:'Kumush', emoji:'🥈', count: silverCount,  bg:'bg-slate-50 dark:bg-slate-800/40',   border:'border-slate-200 dark:border-slate-600',  text:'text-slate-500 dark:text-slate-400' },
                  { tier:'bronze',  label:'Bronza', emoji:'🥉', count: bronzeCount,  bg:'bg-orange-50 dark:bg-orange-900/20', border:'border-orange-200 dark:border-orange-700', text:'text-orange-600 dark:text-orange-400'},
                  { tier:'special', label:'Maxsus', emoji:'⭐', count: specialCount, bg:'bg-violet-50 dark:bg-violet-900/20', border:'border-violet-200 dark:border-violet-700', text:'text-violet-600 dark:text-violet-400'},
                ].map(s => (
                  <div key={s.tier} className={cn('rounded-2xl border p-4 flex flex-col items-center text-center', s.bg, s.border)}>
                    <span className="text-2xl mb-1">{s.emoji}</span>
                    <p className={cn('text-2xl font-bold', s.text)}>{s.count}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label} yutuq</p>
                    {s.count > 0 && (
                      <span className="mt-1.5 inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> Erishildi
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* ── 2. Joriy oy bali (snapshot) ───────────────────────────── */}
              {latestSnap && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      Ballar taqsimoti
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

                  {/* Umumiy ball — yirik */}
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
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Umumiy ball</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {latestSnap.total_score >= 90 ? '🥇 Oltin darajaga erishgansiz!' :
                         latestSnap.total_score >= 75 ? '🥈 Kumush darajada!' :
                         latestSnap.total_score >= 60 ? '🥉 Bronza darajada!' :
                         'Hali sertifikat darajasiga yetmadingiz'}
                      </p>
                    </div>
                    <div className="ml-auto text-right flex-shrink-0">
                      <div className={cn('text-xs font-bold px-2.5 py-1 rounded-lg',
                        latestSnap.total_score >= 90 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                        latestSnap.total_score >= 75 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                        latestSnap.total_score >= 60 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                        'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      )}>
                        {latestSnap.total_score >= 90 ? 'Oltin' :
                         latestSnap.total_score >= 75 ? 'Kumush' :
                         latestSnap.total_score >= 60 ? 'Bronza' : '< Bronza'}
                      </div>
                    </div>
                  </div>

                  {/* Komponent progresslar */}
                  <div className="space-y-3">
                    {[
                      { label:'Davomat',    value: latestSnap.attendance_score,   weight:'×40%', icon:'📅' },
                      { label:'Test bali',  value: latestSnap.test_score,         weight:'×40%', icon:'📝' },
                      { label:'Izchillik',  value: latestSnap.consistency_score,  weight:'×20%', icon:'🔁' },
                      { label:'Faollik',    value: latestSnap.activity_score,     weight:'—',    icon:'⚡' },
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
                          <div
                            className={cn('h-full rounded-full transition-all', scoreBarColor(value))}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Keyingi daraja uchun zarur ball */}
                  {latestSnap.total_score < 90 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {latestSnap.total_score < 60
                          ? `Bronza uchun: ${60 - latestSnap.total_score} ball kerak`
                          : latestSnap.total_score < 75
                          ? `Kumush uchun: ${75 - latestSnap.total_score} ball kerak`
                          : `Oltin uchun: ${90 - latestSnap.total_score} ball kerak`}
                      </p>
                      <div className="mt-1.5 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', scoreBarColor(latestSnap.total_score))}
                          style={{ width: `${latestSnap.total_score}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── 3. Erishilgan yutuqlar ────────────────────────────────── */}
              {achievements.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Erishilgan yutuqlar
                    <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({achievements.length} ta)</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {achievements.map(a => {
                      const st = tierStyle(a.def?.tier ?? 'special')
                      return (
                        <div
                          key={a.id}
                          className={cn('rounded-2xl border p-5 flex gap-4', st.bg, st.border)}
                        >
                          {/* Icon */}
                          <div className={cn('w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0', st.iconBg)}>
                            {a.def?.icon_emoji ?? '🏆'}
                          </div>

                          {/* Kontent */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', st.badge)}>
                                {st.label}
                              </span>
                              {a.total_score !== null && (
                                <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                  {a.total_score} ball
                                </span>
                              )}
                            </div>
                            <h3 className={cn('text-sm font-bold truncate', st.text)}>
                              {achName(a.def)}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                              {achDesc(a.def)}
                            </p>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {periodLabel(a.period_year, a.period_month)}
                              </span>
                              {a.group_name && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                  📚 {a.group_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── 4. Bo'sh holat — yutuqlar yo'q ────────────────────────── */}
              {achievements.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-3xl mx-auto mb-4">
                    🏆
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Hali yutuqlar yo&apos;q
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-sm mx-auto">
                    Oylik hisob-kitob tugagandan so&apos;ng yutuqlaringiz bu yerda ko&apos;rinadi.
                  </p>

                  {/* Nima qilish kerak */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
                    {[
                      { emoji:'🥉', title:'Bronza',  desc:'60+ ball to\'pla', bg:'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
                      { emoji:'🥈', title:'Kumush',  desc:'75+ ball to\'pla', bg:'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-600' },
                      { emoji:'🥇', title:'Oltin',   desc:'90+ ball to\'pla', bg:'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' },
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

              {/* ── 5. So'nggi yutuqlar timeline ──────────────────────────── */}
              {achievements.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-5">
                    <Medal className="w-4 h-4 text-blue-500" /> So&apos;nggi faollik
                  </h2>

                  <div className="relative">
                    {/* Vertikal chiziq */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-700" />

                    <div className="space-y-4">
                      {achievements.slice(0, 5).map((a, idx) => {
                        const st = tierStyle(a.def?.tier ?? 'special')
                        return (
                          <div key={a.id} className="flex gap-4 relative">
                            {/* Nuqta */}
                            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 relative z-10 border-2 border-white dark:border-gray-800', st.iconBg)}>
                              {a.def?.icon_emoji ?? '🏆'}
                            </div>

                            {/* Kontent */}
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
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                      {a.group_name}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                    {fmtDate(a.earned_at)}
                                  </p>
                                  <p className={cn('text-[10px] font-bold mt-0.5', st.text)}>
                                    {periodLabel(a.period_year, a.period_month)}
                                  </p>
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
                      + yana {achievements.length - 5} ta yutuq
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
