import { useState, useEffect } from 'react'
import type { ComponentType } from 'react'
import {
  Users, BookOpen, CheckSquare, BarChart2,
  Search, TrendingUp, GraduationCap, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/routes/paths'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

type TeacherTab = 'students' | 'courses' | 'attendance' | 'reports'
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

// ─── Konstantalar ─────────────────────────────────────────────────────────────

const TABS: TabDef[] = [
  { key:'students',   label:'Talabalarim', icon: Users       },
  { key:'courses',    label:'Guruhlarim',  icon: BookOpen    },
  { key:'attendance', label:'Davomat',     icon: CheckSquare },
  { key:'reports',    label:'Hisobotlar',  icon: BarChart2   },
]

function avgColor(n: number) {
  if (n >= 80) return 'text-emerald-700 bg-emerald-50'
  if (n >= 60) return 'text-amber-700 bg-amber-50'
  return 'text-red-700 bg-red-50'
}

// ═════════════════════════════════════════════════════════════════════════════

export default function TeacherDashboardPage() {
  const auth     = useAuth()
  const navigate = useNavigate()

  const [tab,     setTab]     = useState<TeacherTab>('students')
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  const [students,    setStudents]    = useState<TDStudent[]>([])
  const [groups,      setGroups]      = useState<TDGroup[]>([])
  const [topStudents, setTopStudents] = useState<TDTopStudent[]>([])
  const [attSummary,  setAttSummary]  = useState<TDAtt[]>([])

  useEffect(() => {
    if (!auth.user?.id) return
    void load()
  }, [auth.user?.id])

  async function load() {
    if (!auth.user?.id) return
    setLoading(true)

    try {
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
      const [enrollRes, attRes, testRes] = await Promise.all([
        supabase
          .from('student_groups')
          .select('group_id, student:profiles(id, full_name, email, status), group:groups(name)')
          .in('group_id', groupIds),

        supabase
          .from('attendance')
          .select('student_id, group_id, status')
          .in('group_id', groupIds),

        supabase
          .from('test_results')
          .select('student_id, score, total_questions, test:tests(group_id)')
          .not('submitted_at', 'is', null)
          .in('test:tests(group_id)', groupIds)
          .limit(200),
      ])

      // Davomat map: student_id → {present, total}
      const attMap = new Map<string, {present:number; total:number}>()
      const grpAttMap = new Map<string, {present:number; absent:number; total:number}>()

      for (const a of attRes.data ?? []) {
        // per student
        if (!attMap.has(a.student_id)) attMap.set(a.student_id, {present:0, total:0})
        const e = attMap.get(a.student_id)!
        e.total++
        if (a.status==='present') e.present++
        // per group
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

      // Guruh davomat xulosasi
      setAttSummary(
        grpList.map(g => {
          const ga = grpAttMap.get(g.id) ?? {present:0, absent:0, total:0}
          return { group_name: g.name, present: ga.present, absent: ga.absent, total: ga.total }
        })
      )

      // Top talabalar (testlardan)
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
      console.error(e)
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

  return (
    <div className="space-y-6 pb-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">O&apos;qituvchi Dashboardi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {auth.user?.name ?? 'O\'qituvchi'} • Real ma&apos;lumotlar
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { l:'Talabalar', v: loading ? '...' : String(totalStudents) },
            { l:'Guruhlar',  v: loading ? '...' : String(totalGroups)   },
            { l:'Darslar',   v: loading ? '...' : String(totalLessons)  },
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
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0',
                active ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-700/60',
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
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
                placeholder="Talaba ism yoki guruh..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <span className="text-sm text-gray-500">{filtered.length} ta</span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">{[1,2,3,4].map(i=><div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-400">
                {students.length === 0 ? 'Guruhlarda talabalar yo\'q' : 'Talaba topilmadi'}
              </div>
            ) : (
              <>
                <table className="w-full text-sm hidden sm:table">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                      {['#','Talaba','Guruh','Davomat','Holat'].map(h=>(
                        <th key={h} className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide py-3 px-5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filtered.map((s, i) => {
                      const attPct = s.att_total > 0 ? Math.round((s.att_present/s.att_total)*100) : null
                      return (
                        <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                          <td className="py-3 px-5 text-gray-400 text-xs font-medium">{i+1}</td>
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white bg-gradient-to-br from-blue-500 to-indigo-600">
                                {(s.full_name??s.email??'T').charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{s.full_name ?? '—'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-5">
                            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit">
                              <GraduationCap className="w-3 h-3" />{s.group_name}
                            </span>
                          </td>
                          <td className="py-3 px-5">
                            {attPct !== null
                              ? <span className={cn('text-sm font-bold px-2.5 py-0.5 rounded-lg', avgColor(attPct))}>{attPct}%</span>
                              : <span className="text-xs text-gray-400">—</span>
                            }
                          </td>
                          <td className="py-3 px-5">
                            <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full',
                              s.status==='active'?'bg-emerald-100 text-emerald-700':'bg-gray-100 text-gray-500'
                            )}>
                              {s.status==='active'?'Faol':'Nofaol'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className="sm:hidden divide-y divide-gray-100">
                  {filtered.map(s => {
                    const attPct = s.att_total > 0 ? Math.round((s.att_present/s.att_total)*100) : null
                    return (
                      <div key={s.id} className="flex items-center gap-3 p-4">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white bg-gradient-to-br from-blue-500 to-indigo-600">
                          {(s.full_name??s.email??'T').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{s.full_name??'—'}</p>
                          <p className="text-xs text-gray-400">{s.group_name}</p>
                        </div>
                        {attPct !== null && <span className={cn('text-sm font-bold px-2 py-0.5 rounded-lg', avgColor(attPct))}>{attPct}%</span>}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
          <div className="text-center">
            <button onClick={() => navigate(PATHS.TEACHER.STUDENTS)} className="text-sm text-indigo-600 font-medium hover:underline inline-flex items-center gap-1">
              To&apos;liq talabalar sahifasi <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ══ GURUHLARIM ══ */}
      {tab === 'courses' && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500">{loading ? '...' : `${groups.length} ta guruh`}</p>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i=><div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse"/>)}
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center text-sm text-gray-400">
              Guruh biriktirilmagan
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
                          {g.student_count} talaba • {g.lesson_count} dars
                        </p>
                      </div>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                        g.status==='active'?'bg-emerald-100 text-emerald-700':g.status==='completed'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-500'
                      )}>
                        {g.status==='active'?'Faol':g.status==='completed'?'Tugatilgan':'Nofaol'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{g.student_count} / {g.student_count} talaba</span>
                      <button onClick={()=>navigate(PATHS.TEACHER.GROUPS)} className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                        Ko&apos;rish <ChevronRight className="w-3.5 h-3.5" />
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
              Davomat ma&apos;lumoti yo&apos;q
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-5">Guruh bo&apos;yicha davomat xulosa</h2>
                <div className="space-y-4">
                  {attSummary.map(a => {
                    const pct = a.total > 0 ? Math.round((a.present/a.total)*100) : 0
                    return (
                      <div key={a.group_name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-800 dark:text-gray-200">{a.group_name}</span>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{a.total} qatnashish</span>
                            <span className={cn('font-bold', pct>=80?'text-emerald-600':pct>=60?'text-amber-600':'text-red-600')}>
                              {pct}% kelgan
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
                  Davomat belgilash sahifasiga o&apos;tish <ChevronRight className="w-4 h-4" />
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
              { l:'Talabalar', v: totalStudents, e:'👥', bg:'bg-indigo-50'  },
              { l:'Guruhlar',  v: totalGroups,   e:'🏫', bg:'bg-blue-50'   },
              { l:'Darslar',   v: totalLessons,  e:'📖', bg:'bg-emerald-50'},
              { l:'Test natijalari', v: topStudents.length>0?'✓':'—', e:'📝', bg:'bg-amber-50'},
            ].map(s=>(
              <div key={s.l} className={cn('rounded-2xl border border-gray-100 dark:border-gray-700 p-5',s.bg)}>
                <span className="text-2xl">{s.e}</span>
                <p className="text-xl font-bold text-gray-900 mt-2">{s.v}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Top talabalar */}
          {topStudents.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Top talabalar (test natijalari)
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
              Test natijalari yo&apos;q — testlarni nashr qilib, talabalar topshirgach hisobot paydo bo&apos;ladi
            </div>
          )}
        </div>
      )}
    </div>
  )
}
