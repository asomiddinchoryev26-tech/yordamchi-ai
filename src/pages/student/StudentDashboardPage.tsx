import { useState, useEffect } from 'react'
import type { ComponentType } from 'react'
import {
  BookOpen, TrendingUp, FileText, Award,
  CheckCircle, Play, Trophy,
  ChevronRight, CheckSquare,
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
  test_id:      string
  title:        string
  group_name:   string
  score:        number
  total:        number
  submitted_at: string
}

// ─── Konstantalar ─────────────────────────────────────────────────────────────

const TABS: TabDef[] = [
  { key:'courses',      label:'Kurslarim',   icon: BookOpen    },
  { key:'progress',     label:'Taraqqiyot',  icon: TrendingUp  },
  { key:'tests',        label:'Testlarim',   icon: FileText    },
  { key:'achievements', label:'Yutuqlar',    icon: Award       },
]

function scoreColor(n: number) {
  if (n >= 90) return 'text-emerald-700 bg-emerald-50'
  if (n >= 75) return 'text-blue-700 bg-blue-50'
  if (n >= 60) return 'text-amber-700 bg-amber-50'
  return 'text-red-700 bg-red-50'
}

const MONTHS = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']
function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

// ═════════════════════════════════════════════════════════════════════════════

export default function StudentDashboardPage() {
  const auth     = useAuth()
  const navigate = useNavigate()

  const [tab,     setTab]     = useState<StudentTab>('courses')
  const [loading, setLoading] = useState(true)

  const [groups,   setGroups]   = useState<SDGroup[]>([])
  const [tests,    setTests]    = useState<SDTest[]>([])
  const [attStats, setAttStats] = useState<{present:number;absent:number;late:number;excused:number;total:number}|null>(null)

  useEffect(() => {
    if (!auth.user?.id) return
    void load()
  }, [auth.user?.id])

  async function load() {
    if (!auth.user?.id) return
    setLoading(true)

    try {
      const [enrollRes, testRes, attRes] = await Promise.all([
        supabase
          .from('student_groups')
          .select('enrolled_at, group:groups(id, name, status, teacher:profiles!groups_teacher_id_fkey(full_name), subject:subjects(name,icon,color), lessons(id))')
          .eq('student_id', auth.user.id)
          .order('enrolled_at', {ascending:false}),

        supabase
          .from('test_results')
          .select('test_id, score, total_questions, submitted_at, test:tests(title, group:groups(name))')
          .eq('student_id', auth.user.id)
          .not('submitted_at','is',null)
          .order('submitted_at',{ascending:false}),

        supabase
          .from('attendance')
          .select('status, group_id')
          .eq('student_id', auth.user.id),
      ])

      // Davomat guruh bo'yicha
      const groupIds = (enrollRes.data ?? []).map((e:any) => e.group?.id).filter(Boolean)
      const { data: grpAtt } = groupIds.length
        ? await supabase.from('attendance').select('group_id, status').eq('student_id', auth.user.id).in('group_id', groupIds)
        : {data:[]}

      const grpAttMap = new Map<string, {present:number; total:number}>()
      for (const a of grpAtt ?? []) {
        if (!grpAttMap.has(a.group_id)) grpAttMap.set(a.group_id, {present:0, total:0})
        const e = grpAttMap.get(a.group_id)!
        e.total++
        if (a.status==='present') e.present++
      }

      setGroups((enrollRes.data ?? []).map((e:any) => {
        const g   = e.group
        if (!g) return null
        const att = grpAttMap.get(g.id) ?? {present:0, total:0}
        return {
          id:           g.id,
          name:         g.name,
          status:       g.status,
          subject:      g.subject ?? null,
          teacher_name: g.teacher?.full_name ?? null,
          lesson_count: (g.lessons ?? []).length,
          enrolled_at:  e.enrolled_at,
          att_present:  att.present,
          att_total:    att.total,
        }
      }).filter(Boolean) as SDGroup[])

      setTests((testRes.data ?? []).map((r:any) => ({
        test_id:      r.test_id,
        title:        (r.test as any)?.title ?? 'Test',
        group_name:   (r.test as any)?.group?.name ?? '—',
        score:        r.score,
        total:        r.total_questions,
        submitted_at: r.submitted_at,
      })))

      const att = {present:0, absent:0, late:0, excused:0, total:0}
      for (const a of attRes.data ?? []) {
        att.total++
        att[a.status as keyof typeof att]++
      }
      setAttStats(att)
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Hisoblar
  const totalGroups    = groups.length
  const totalTests     = tests.length
  const avgScore       = totalTests > 0
    ? Math.round(tests.reduce((a, r) => a + (r.total > 0 ? (r.score/r.total)*100 : 0), 0) / totalTests)
    : 0
  const passedTests    = tests.filter(r => r.total > 0 && (r.score/r.total) >= 0.6).length
  const attPct         = attStats && attStats.total > 0
    ? Math.round((attStats.present / attStats.total) * 100) : null

  return (
    <div className="space-y-6 pb-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mening Dashboardim</h1>
          <p className="text-sm text-gray-500 mt-0.5">{auth.user?.name ?? 'Talaba'} • Real ma&apos;lumotlar</p>
        </div>
        <div className="flex gap-3">
          {[
            { l:'Kurslar',   v: loading ? '...' : String(totalGroups) },
            { l:'Testlar',   v: loading ? '...' : `${passedTests}/${totalTests}` },
            { l:'Davomat', v: loading ? '...' : attPct !== null ? `${attPct}%` : '—' },
          ].map(s => (
            <div key={s.l} className="bg-white rounded-xl border border-gray-100 px-4 py-2.5 text-center min-w-[72px]">
              <p className="text-lg font-bold text-gray-900 leading-none">{s.v}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon; const active = tab === t.key
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0',
                active ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700 hover:bg-white/60',
              )}
            >
              <Icon className="w-4 h-4" />{t.label}
            </button>
          )
        })}
      </div>

      {/* ══ KURSLARIM ══ */}
      {tab === 'courses' && (
        <div className="space-y-5">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i=><div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse"/>)}
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Hali hech qanday kursga qo&apos;shilmadingiz</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {groups.map(c => {
                const attPct = c.att_total > 0 ? Math.round((c.att_present/c.att_total)*100) : null
                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{c.subject?.icon ?? '📚'}</span>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                        c.status==='active'?'bg-blue-100 text-blue-700':c.status==='completed'?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-600'
                      )}>
                        {c.status==='active'?'Davom etmoqda':c.status==='completed'?'Tugallandi':'Nofaol'}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-0.5">{c.name}</h3>
                    {c.subject && <p className="text-xs font-medium mb-1" style={{color:c.subject.color}}>{c.subject.name}</p>}
                    {c.teacher_name && <p className="text-xs text-gray-400 mb-3">{c.teacher_name}</p>}

                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="text-gray-500">{c.lesson_count} dars</span>
                      {attPct !== null && <span className={cn('font-bold', attPct>=80?'text-emerald-600':attPct>=60?'text-amber-600':'text-red-600')}>{attPct}% davomat</span>}
                    </div>
                    {attPct !== null && (
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                        <div className={cn('h-full rounded-full', attPct>=80?'bg-emerald-500':attPct>=60?'bg-amber-500':'bg-red-500')} style={{width:`${attPct}%`}} />
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
              [1,2,3,4].map(i=><div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse"/>)
            ) : [
              { l:'Kurslar',       v:`${totalGroups} ta`,                e:'📚', bg:'bg-blue-50'    },
              { l:'Test topshirdi',v:`${passedTests}/${totalTests}`,     e:'📝', bg:'bg-emerald-50' },
              { l:"O'rtacha ball", v:totalTests>0?`${avgScore}%`:'—',   e:'📊', bg:'bg-violet-50'  },
              { l:'Davomat',       v:attPct!==null?`${attPct}%`:'—',    e:'✅', bg:'bg-amber-50'   },
            ].map(s=>(
              <div key={s.l} className={cn('rounded-2xl border border-gray-100 p-5', s.bg)}>
                <span className="text-2xl">{s.e}</span>
                <p className="text-xl font-bold text-gray-900 mt-2">{s.v}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Guruh bo'yicha davomat */}
          {!loading && groups.some(g=>g.att_total>0) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-5">
                <CheckSquare className="w-4 h-4 text-blue-600" /> Guruh bo&apos;yicha davomat
              </h2>
              <div className="space-y-4">
                {groups.filter(g=>g.att_total>0).map(g => {
                  const pct = Math.round((g.att_present/g.att_total)*100)
                  return (
                    <div key={g.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-800 flex items-center gap-2">
                          {g.subject?.icon??'📚'} {g.name}
                        </span>
                        <span className={cn('font-bold text-xs', pct>=80?'text-emerald-600':pct>=60?'text-amber-600':'text-red-600')}>
                          {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', pct>=80?'bg-emerald-500':pct>=60?'bg-amber-500':'bg-red-500')} style={{width:`${pct}%`}} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Davomat taqsimoti */}
          {attStats && attStats.total > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Davomat taqsimoti</h2>
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
                      <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-lg overflow-hidden">
                        <div className={cn('h-full rounded-lg flex items-center justify-end px-2', color)} style={{width:`${Math.max(pct,2)}%`}}>
                          {pct>10 && <span className="text-[10px] text-white font-bold">{val}</span>}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-10 text-right">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!loading && !attStats?.total && groups.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
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
            <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse"/>)}</div>
          ) : tests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Hali hech qanday test topshirmadingiz</p>
              <button onClick={() => navigate(PATHS.STUDENT.TESTS)} className="mt-4 text-sm text-blue-600 font-medium hover:underline">
                Testlar sahifasiga o&apos;tish
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{totalTests}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Topshirildi</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl border border-gray-100 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{passedTests}</p>
                  <p className="text-xs text-gray-400 mt-0.5">O&apos;tdi (≥60%)</p>
                </div>
                <div className="bg-blue-50 rounded-2xl border border-gray-100 p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{avgScore}%</p>
                  <p className="text-xs text-gray-400 mt-0.5">O&apos;rtacha</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Test natijalari</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {tests.map(t => {
                    const pct    = t.total > 0 ? Math.round((t.score/t.total)*100) : 0
                    const passed = pct >= 60
                    return (
                      <div key={t.test_id} className="flex items-center gap-4 px-5 py-3.5">
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
                          passed?'bg-emerald-600 text-white':'bg-red-500 text-white'
                        )}>
                          {pct}%
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{t.title}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <span>{t.group_name}</span>
                            <span>·</span>
                            <span>{fmtDate(t.submitted_at)}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">{t.score}/{t.total}</p>
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
        <div className="space-y-5">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i=><div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse"/>)}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    emoji:'🎓', title:'Kurs talabasi',
                    desc: totalGroups>0 ? `${totalGroups} ta kursga qo'shilgansiz` : 'Hali kursga qo\'shilmadingiz',
                    active: totalGroups>0,
                    border:'border-blue-200 bg-blue-50',
                  },
                  {
                    emoji:'📝', title:'Test ishtirokchisi',
                    desc: totalTests>0 ? `${totalTests} ta test topshirdingiz` : 'Hali test topshirmadingiz',
                    active: totalTests>0,
                    border:'border-amber-200 bg-amber-50',
                  },
                  {
                    emoji:'🏆', title:'A\'lo natija',
                    desc: passedTests>0 ? `${passedTests} ta testdan o'tdingiz` : 'Test natijasi yo\'q',
                    active: passedTests>0,
                    border:'border-emerald-200 bg-emerald-50',
                  },
                  {
                    emoji:'✅', title:'Ishtirokchi',
                    desc: attStats && attStats.total>0 ? `${attStats.present} marta kelgansiz (${attPct}%)` : 'Davomat belgilanmagan',
                    active: !!(attStats && attStats.total>0),
                    border:'border-violet-200 bg-violet-50',
                  },
                ].map(a => (
                  <div key={a.title} className={cn('rounded-xl border p-4 text-center', a.active?a.border:'bg-gray-50 border-gray-200 opacity-60')}>
                    <div className="text-3xl mb-2">{a.emoji}</div>
                    <p className="text-sm font-bold text-gray-900 mb-1">{a.title}</p>
                    <p className="text-[11px] text-gray-500 leading-snug">{a.desc}</p>
                    {a.active && <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-emerald-600"><CheckCircle className="w-3 h-3" />Erishildi</span>}
                  </div>
                ))}
              </div>

              {tests.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-amber-500" /> So&apos;nggi yutuqlar
                  </h2>
                  <div className="space-y-3">
                    {tests.filter(t=>t.total>0&&(t.score/t.total)>=0.8).slice(0,4).map(t=>{
                      const pct = Math.round((t.score/t.total)*100)
                      return (
                        <div key={t.test_id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                          <span className="text-2xl flex-shrink-0">🏅</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{t.title}</p>
                            <p className="text-xs text-gray-500">{t.group_name} • {fmtDate(t.submitted_at)}</p>
                          </div>
                          <span className={cn('text-sm font-bold px-2.5 py-1 rounded-lg flex-shrink-0', scoreColor(pct))}>
                            {pct}%
                          </span>
                        </div>
                      )
                    })}
                    {tests.filter(t=>t.total>0&&(t.score/t.total)>=0.8).length===0 && (
                      <p className="text-sm text-gray-400 text-center py-4">80%+ natija olsangiz bu yerda ko&apos;rinadi</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
