import { useState, useEffect } from 'react'
import type { ComponentType } from 'react'
import {
  BarChart2, Users, GraduationCap, BookOpen,
  Layers, Search, TrendingUp, Check,
  ChevronRight, Shield, Activity, Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { AdminPremiumStats } from '@/components/admin/AdminFeatures'
import { SuperAdminPanel } from '@/components/admin/SuperAdminPRO'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

type AdminTab  = 'statistics' | 'users' | 'teachers' | 'students' | 'courses' | 'activity' | 'superadmin'
type UserRole  = 'student' | 'teacher' | 'admin'

interface TabDef    { key: AdminTab; label: string; icon: ComponentType<{ className?: string }> }
interface DashStats { students: number; teachers: number; groups: number; lessons: number; tests: number; att: number }
interface MonthBar  { month: string; count: number }
interface DUser     { id: string; full_name: string | null; email: string | null; role: UserRole; status: string; created_at: string }
interface DTeacher  { id: string; full_name: string | null; email: string | null; group_count: number; student_count: number }
interface DStudent  { id: string; full_name: string | null; email: string | null; group_name: string; status: string; created_at: string }
interface DGroup    { id: string; name: string; status: string; subject: {name:string;icon:string;color:string}|null; teacher_name:string|null; student_count:number; lesson_count:number }
interface DActivity { id: string; type: 'signup'|'test'; name: string; detail: string; time: string }

// ─── Konstantalar ─────────────────────────────────────────────────────────────

const TABS: { key: AdminTab; label: keyof Translations; icon: TabDef['icon'] }[] = [
  { key:'statistics', label:'navStats',       icon: BarChart2     },
  { key:'users',      label:'adTabUsers',     icon: Users         },
  { key:'teachers',   label:'adTabTeachers',  icon: GraduationCap },
  { key:'students',   label:'tdStudents',     icon: Layers        },
  { key:'courses',    label:'adCourses',      icon: BookOpen      },
  { key:'activity',   label:'adTabActivity',  icon: Activity      },
  { key:'superadmin', label:'admSuperAdmin',  icon: Crown         },
]

const ROLE_CFG: Record<UserRole, { label: keyof Translations; cls: string }> = {
  student: { label:'adStudent', cls:'bg-blue-100 text-blue-700'     },
  teacher: { label:'tdTeacher', cls:'bg-indigo-100 text-indigo-700' },
  admin:   { label:'adAdmin',   cls:'bg-emerald-100 text-emerald-700'},
}

const MONTH_LABELS = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']

function buildMonthly(dates: {created_at:string}[]): MonthBar[] {
  const now = new Date()
  const countMap: Record<string,number> = {}
  dates.forEach(p => { const k = p.created_at.slice(0,7); countMap[k] = (countMap[k]??0)+1 })
  return Array.from({length:12}, (_,i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    return { month: MONTH_LABELS[d.getMonth()], count: countMap[k]??0 }
  })
}

function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getDate()} ${MONTH_LABELS[dt.getMonth()]} ${dt.getFullYear()}`
}


// ═════════════════════════════════════════════════════════════════════════════

export default function AdminDashboardPage() {
  const auth = useAuth()
  const { t } = useLanguage()
  const [tab,    setTab]    = useState<AdminTab>('statistics')
  const [loading,setLoading]= useState(true)

  const [stats,    setStats]    = useState<DashStats|null>(null)
  const [monthly,  setMonthly]  = useState<MonthBar[]>([])
  const [users,    setUsers]    = useState<DUser[]>([])
  const [teachers, setTeachers] = useState<DTeacher[]>([])
  const [students, setStudents] = useState<DStudent[]>([])
  const [groups,   setGroups]   = useState<DGroup[]>([])
  const [activity, setActivity] = useState<DActivity[]>([])

  const [userSearch,     setUserSearch]     = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<'all'|UserRole>('all')

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [
        studC, teachC, grpC, lesC, tstC, attC,
        datesRes, usersRes, teachersRes, studentsRes, groupsRes, recentRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*',{count:'exact',head:true}).eq('role','student'),
        supabase.from('profiles').select('*',{count:'exact',head:true}).eq('role','teacher'),
        supabase.from('groups').select('*',{count:'exact',head:true}),
        supabase.from('lessons').select('*',{count:'exact',head:true}),
        supabase.from('tests').select('*',{count:'exact',head:true}).eq('is_published',true),
        supabase.from('attendance').select('*',{count:'exact',head:true}),

        supabase.from('profiles').select('created_at').order('created_at'),

        supabase.from('profiles').select('id,full_name,email,role,status,created_at')
          .order('created_at',{ascending:false}).limit(30),

        supabase.from('profiles').select('id,full_name,email,groups!groups_teacher_id_fkey(id,student_groups(id))')
          .eq('role','teacher').order('full_name').limit(10),

        supabase.from('profiles')
          .select('id,full_name,email,status,created_at,student_groups(group:groups(name))')
          .eq('role','student').order('created_at',{ascending:false}).limit(15),

        supabase.from('groups')
          .select('id,name,status,subject:subjects(name,icon,color),teacher:profiles!groups_teacher_id_fkey(full_name),student_groups(id),lessons(id)')
          .order('status').order('name').limit(10),

        supabase.from('test_results')
          .select('id,score,total_questions,submitted_at,student:profiles(full_name),test:tests(title)')
          .not('submitted_at','is',null).order('submitted_at',{ascending:false}).limit(10),
      ])

      setStats({
        students: studC.count   ?? 0,
        teachers: teachC.count  ?? 0,
        groups:   grpC.count    ?? 0,
        lessons:  lesC.count    ?? 0,
        tests:    tstC.count    ?? 0,
        att:      attC.count    ?? 0,
      })

      setMonthly(buildMonthly(datesRes.data ?? []))

      setUsers((usersRes.data ?? []).map((u:any) => ({
        id:         u.id,
        full_name:  u.full_name,
        email:      u.email,
        role:       u.role,
        status:     u.status ?? 'active',
        created_at: u.created_at,
      })))

      setTeachers((teachersRes.data ?? []).map((t:any) => {
        const grps = t.groups ?? []
        return {
          id:            t.id,
          full_name:     t.full_name,
          email:         t.email,
          group_count:   grps.length,
          student_count: grps.reduce((a:number, g:any) => a + (g.student_groups?.length??0), 0),
        }
      }))

      setStudents((studentsRes.data ?? []).map((s:any) => ({
        id:         s.id,
        full_name:  s.full_name,
        email:      s.email,
        status:     s.status ?? 'active',
        group_name: (s.student_groups ?? []).map((sg:any) => sg.group?.name).filter(Boolean).join(', ') || '—',
        created_at: s.created_at,
      })))

      setGroups((groupsRes.data ?? []).map((g:any) => ({
        id:            g.id,
        name:          g.name,
        status:        g.status,
        subject:       g.subject ?? null,
        teacher_name:  g.teacher?.full_name ?? null,
        student_count: (g.student_groups ?? []).length,
        lesson_count:  (g.lessons ?? []).length,
      })))

      const recentActivity: DActivity[] = (recentRes.data ?? []).map((r:any) => {
        const pct = r.total_questions > 0 ? Math.round((r.score/r.total_questions)*100) : 0
        return {
          id:     r.id,
          type:   'test' as const,
          name:   (r.student as any)?.full_name ?? t.adStudent,
          detail: `${(r.test as any)?.title ?? t.adTest} — ${r.score}/${r.total_questions} (${pct}%)`,
          time:   fmtDate(r.submitted_at),
        }
      })
      const recentSignups: DActivity[] = (usersRes.data ?? []).slice(0,5).map((u:any) => ({
        id:     `s-${u.id}`,
        type:   'signup' as const,
        name:   u.full_name ?? u.email ?? t.adUserWord,
        detail: ROLE_CFG[u.role as UserRole] ? t[ROLE_CFG[u.role as UserRole].label] : u.role,
        time:   fmtDate(u.created_at),
      }))
      setActivity([...recentSignups, ...recentActivity].slice(0,12))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase()
    const matchSearch = !userSearch || (u.full_name??'').toLowerCase().includes(q) || (u.email??'').toLowerCase().includes(q)
    const matchRole   = userRoleFilter === 'all' || u.role === userRoleFilter
    return matchSearch && matchRole
  })

  const monthlyMax = Math.max(...monthly.map(m=>m.count), 1)

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">

      {/* ── Header ── */}
      <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 rounded-2xl p-4 sm:p-6 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div>
            <p className="text-emerald-200 text-sm mb-1">{t.adWelcome}</p>
            <h1 className="text-2xl font-bold text-white">{t.adTitle}</h1>
            <p className="text-emerald-200 text-sm mt-1">
              {t.adInSystem}{' '}
              {loading
                ? <span className="inline-block w-8 h-4 bg-white/20 rounded animate-pulse align-middle" />
                : <span className="font-semibold text-white">{(stats?.students??0) + (stats?.teachers??0)}</span>
              }{' '}
              {t.adUsersWord}
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-3xl">⚙️</div>
            <div className="flex items-center gap-1 text-emerald-300 text-xs">
              <TrendingUp className="w-3 h-3" /> {t.adRealtime}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-x-auto">
        {TABS.map(ti => {
          const Icon = ti.icon
          const active = tab === ti.key
          return (
            <button key={ti.key} type="button" onClick={() => setTab(ti.key)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0',
                active ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-400 shadow-sm font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-700/60',
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t[ti.label]}</span>
            </button>
          )
        })}
      </div>

      {/* ══ STATISTIKA ══ */}
      {tab === 'statistics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {loading
              ? Array.from({length:6}).map((_,i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 animate-pulse h-28" />
                ))
              : [
                  { l:t.tdStudents,   v: stats!.students, e:'📚', bg:'bg-violet-50  dark:bg-violet-950/40'  },
                  { l:t.adTeachers,   v: stats!.teachers, e:'🎓', bg:'bg-indigo-50  dark:bg-indigo-950/40'  },
                  { l:t.tdGroups,     v: stats!.groups,   e:'🏫', bg:'bg-blue-50    dark:bg-blue-950/40'    },
                  { l:t.tdLessons,    v: stats!.lessons,  e:'📖', bg:'bg-emerald-50 dark:bg-emerald-950/40' },
                  { l:t.adTests,      v: stats!.tests,    e:'📝', bg:'bg-amber-50   dark:bg-amber-950/40'   },
                  { l:t.adAttRecords, v: stats!.att,      e:'✅', bg:'bg-teal-50    dark:bg-teal-950/40'    },
                ].map(s => (
                  <div key={s.l} className={cn('rounded-2xl border border-gray-100 dark:border-gray-700 p-5', s.bg)}>
                    <span className="text-2xl">{s.e}</span>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">{s.v.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.l}</p>
                  </div>
                ))
            }
          </div>

          {/* Oylik grafik */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center">
                  <BarChart2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                {t.adMonthlySignups}
              </h2>
              {!loading && (
                <span className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-lg">
                  {t.adTotal} {monthly.reduce((a,b)=>a+b.count,0)}
                </span>
              )}
            </div>
            {loading ? (
              <div className="h-28 bg-gray-50 dark:bg-gray-700 rounded-xl animate-pulse" />
            ) : (
              <div className="flex items-end gap-1.5 h-28">
                {monthly.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 hidden sm:block">{m.count || ''}</span>
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={cn('w-full rounded-t-md', i === monthly.length - 1 ? 'bg-emerald-600 shadow-sm' : 'bg-emerald-200')}
                        style={{ height:`${Math.round((m.count/monthlyMax)*100)}%`, minHeight: m.count > 0 ? '4px' : '0' }}
                      />
                    </div>
                    <span className={cn('text-[10px] font-medium', i===monthly.length-1 ? 'text-emerald-700 font-bold' : 'text-gray-400')}>
                      {m.month}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tizim holati */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-emerald-500" /> {t.saSysHealth}
            </h2>
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{t.adAllSystemsOk}</p>
            </div>
          </div>

          {/* Premium statistikasi (additiv) */}
          <AdminPremiumStats />
        </div>
      )}

      {/* ══ FOYDALANUVCHILAR ══ */}
      {tab === 'users' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input type="text" value={userSearch} onChange={e=>setUserSearch(e.target.value)}
                placeholder={t.adSearchUser}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-1.5">
              {(['all','student','teacher','admin'] as const).map(r => (
                <button key={r} type="button" onClick={()=>setUserRoleFilter(r)}
                  className={cn('px-3 py-2 rounded-xl text-xs font-semibold border whitespace-nowrap transition-all',
                    userRoleFilter===r ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600',
                  )}
                >
                  {r==='all' ? t.adAll : t[ROLE_CFG[r].label]}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-4 sm:p-6 space-y-3">
                {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto hidden sm:block">
                <table className="w-full text-sm min-w-[540px]">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                      {[t.adUser,'Email',t.adRole,t.tdColStatus,t.adJoined].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide py-3 px-4 last:pr-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredUsers.map(u => {
                      const role = ROLE_CFG[u.role]
                      const letter = (u.full_name??u.email??'?').charAt(0).toUpperCase()
                      return (
                        <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-gradient-to-br',
                                u.role==='student'?'from-blue-500 to-indigo-600':u.role==='teacher'?'from-indigo-500 to-violet-600':'from-emerald-500 to-teal-600'
                              )} style={{color:'white'}}>{letter}</div>
                              <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px]">{u.full_name ?? '—'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs max-w-[150px] truncate">{u.email}</td>
                          <td className="py-3 px-4 whitespace-nowrap"><span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', role?.cls)}>{role?.label}</span></td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                              u.status==='active'?'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400':'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            )}>
                              {u.status==='active'?t.admActive:t.tdInactive}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{fmtDate(u.created_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                </div>
                <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredUsers.map(u => {
                    const letter = (u.full_name??u.email??'?').charAt(0).toUpperCase()
                    return (
                      <div key={u.id} className="flex items-center gap-3 p-4">
                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 text-white bg-gradient-to-br',
                          u.role==='student'?'from-blue-500 to-indigo-600':u.role==='teacher'?'from-indigo-500 to-violet-600':'from-emerald-500 to-teal-600'
                        )}>{letter}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{u.full_name??'—'}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
                        </div>
                        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', ROLE_CFG[u.role]?.cls)}>
                          {ROLE_CFG[u.role] ? t[ROLE_CFG[u.role].label] : u.role}
                        </span>
                      </div>
                    )
                  })}
                </div>
                {filteredUsers.length === 0 && (
                  <div className="p-10 text-center text-sm text-gray-400">{t.adUserNotFound}</div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ O'QITUVCHILAR ══ */}
      {tab === 'teachers' && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">{loading ? '...' : `${teachers.length} ${t.adTeachersCount}`}</p>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teachers.map(tc => {
                const letter = (tc.full_name??tc.email??'O').charAt(0).toUpperCase()
                return (
                  <div key={tc.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md dark:hover:shadow-gray-900/40 transition-shadow">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold flex-shrink-0 text-white text-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                        {letter}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">{tc.full_name ?? '—'}</h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{tc.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 dark:bg-blue-950/40 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{tc.group_count}</p>
                        <p className="text-[10px] text-blue-400 dark:text-blue-500">{t.adGroupC}</p>
                      </div>
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{tc.student_count}</p>
                        <p className="text-[10px] text-indigo-400 dark:text-indigo-500">{t.adStudent}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
              {teachers.length === 0 && (
                <div className="sm:col-span-2 p-10 text-center text-sm text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                  {t.adNoTeachers}
                </div>
              )}
            </div>
          )}
          <div className="text-center">
            <a href="/admin/teachers" className="text-sm text-emerald-600 font-medium hover:underline inline-flex items-center gap-1">
              {t.adAllTeachers} <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* ══ TALABALAR ══ */}
      {tab === 'students' && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">{loading ? '...' : `${students.length} ${t.adRecentStudents}`}</p>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-4 sm:p-6 space-y-3">{[1,2,3,4,5].map(i=><div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse"/>)}</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                      {[t.adStudent,'Email',t.adGroupC,t.tdColStatus,t.adJoined].map(h=>(
                        <th key={h} className="text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide py-3 px-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {students.map(s => {
                      const letter = (s.full_name??s.email??'T').charAt(0).toUpperCase()
                      return (
                        <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white bg-gradient-to-br from-blue-500 to-indigo-600">
                                {letter}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[100px]">{s.full_name??'—'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs max-w-[130px] truncate">{s.email}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg">{s.group_name}</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                              s.status==='active'?'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400':'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            )}>
                              {s.status==='active'?t.admActive:t.tdInactive}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{fmtDate(s.created_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                </div>
                {students.length === 0 && <div className="p-10 text-center text-sm text-gray-400">Talabalar yo'q</div>}
              </>
            )}
          </div>
          <div className="text-center">
            <a href="/admin/students" className="text-sm text-emerald-600 font-medium hover:underline inline-flex items-center gap-1">
              Barcha talabalar <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* ══ KURSLAR ══ */}
      {tab === 'courses' && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">{loading ? '...' : `${groups.length} ${t.adCoursesCount}`}</p>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i=><div key={i} className="h-36 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"/>)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.map(g => {
                return (
                  <div key={g.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md dark:hover:shadow-gray-900/40 transition-shadow">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={g.subject ? {backgroundColor:g.subject.color+'18',border:`2px solid ${g.subject.color}30`} : {backgroundColor:'#374151'}}
                      >
                        {g.subject?.icon ?? '📚'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">{g.name}</h3>
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                            g.status==='active'?'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400':g.status==='completed'?'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400':'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          )}>
                            {g.status==='active'?t.admActive:g.status==='completed'?t.tdCompleted:t.tdInactive}
                          </span>
                        </div>
                        {g.subject && <p className="text-xs mt-0.5 font-medium" style={{color:g.subject.color}}>{g.subject.name}</p>}
                        {g.teacher_name && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{g.teacher_name}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{g.student_count} {t.tdStudentWord}</span>
                      <span>{g.lesson_count} {t.tdLessonWord}</span>
                    </div>
                  </div>
                )
              })}
              {groups.length === 0 && (
                <div className="sm:col-span-2 p-10 text-center text-sm text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">{t.adNoCourses}</div>
              )}
            </div>
          )}
          <div className="text-center">
            <a href="/admin/courses" className="text-sm text-emerald-600 font-medium hover:underline inline-flex items-center gap-1">
              {t.adAllCourses} <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* ══ FAOLLIK ══ */}
      {tab === 'activity' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-5">
              <Activity className="w-4 h-4 text-emerald-500" /> {t.tdRecentActivity}
            </h2>
            {loading ? (
              <div className="space-y-3">{[1,2,3,4,5].map(i=><div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse"/>)}</div>
            ) : activity.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">{t.adNoActivity}</p>
            ) : (
              <div className="space-y-3">
                {activity.map(a => (
                  <div key={a.id} className={cn(
                    'flex items-center gap-3 p-3 rounded-xl',
                    a.type==='signup' ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30'
                  )}>
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0',
                      a.type==='signup' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-emerald-100 dark:bg-emerald-900/40'
                    )}>
                      {a.type==='signup' ? '👤' : '📝'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{a.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{a.detail}</p>
                    </div>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">{a.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ SUPER ADMIN PRO (faqat super admin — komponent ichida tekshiriladi) ══ */}
      {tab === 'superadmin' && auth.user?.id && <SuperAdminPanel currentUserId={auth.user.id} />}
    </div>
  )
}
