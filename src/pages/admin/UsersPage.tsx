import { useState, useEffect } from 'react'
import {
  Users, Search, AlertCircle, X,
  ChevronDown, CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { profileService } from '@/services/profile.service'
import type { ProfileRow } from '@/types/database.types'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

// ─── Konstantalar ─────────────────────────────────────────────────────────────

type RoleFilter   = 'all' | 'student' | 'teacher' | 'admin'
type StatusFilter = 'all' | 'active' | 'inactive'

const ROLE_META: Record<string, { label: keyof Translations; bg: string; color: string }> = {
  student: { label: 'adStudent', bg: 'bg-blue-100',    color: 'text-blue-700'    },
  teacher: { label: 'tdTeacher', bg: 'bg-indigo-100',  color: 'text-indigo-700'  },
  admin:   { label: 'adAdmin',   bg: 'bg-emerald-100', color: 'text-emerald-700' },
}

const MONTHS = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']
function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

// ─── Avatarka ─────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  student: 'from-blue-500 to-indigo-600',
  teacher: 'from-indigo-500 to-violet-600',
  admin:   'from-emerald-500 to-teal-600',
}

function Avatar({ name, email, role }: { name: string | null; email: string | null; role: string }) {
  const letter = (name ?? email ?? '?').charAt(0).toUpperCase()
  return (
    <div className={cn(
      'w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-gradient-to-br',
      ROLE_COLORS[role] ?? 'from-gray-400 to-gray-600'
    )}>
      {letter}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════

export default function UsersPage() {
  const { t } = useLanguage()
  const [users,     setUsers]     = useState<ProfileRow[]>([])
  const [loading,   setLoading]   = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [search,    setSearch]    = useState('')
  const [roleFilter,   setRoleFilter]   = useState<RoleFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Inline o'zgartirish holati
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [savedId,    setSavedId]    = useState<string | null>(null)

  // ── Yuklash ───────────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only load; load() is intentionally unmemoized
  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    setPageError(null)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      setUsers((data ?? []) as ProfileRow[])
    } catch {
      setPageError(t.mpLoadErr)
    } finally {
      setLoading(false)
    }
  }

  // ── Filtrlash ─────────────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || (u.full_name ?? '').toLowerCase().includes(q)
      || (u.email    ?? '').toLowerCase().includes(q)
      || (u.phone    ?? '').includes(q)
    const matchRole   = roleFilter   === 'all' || u.role   === roleFilter
    const matchStatus = statusFilter === 'all' || u.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  // ── Role o'zgartirish ─────────────────────────────────────────────────────
  async function changeRole(user: ProfileRow, role: 'student' | 'teacher' | 'admin') {
    if (user.role === role) return
    setUpdatingId(user.id)
    try {
      const updated = await profileService.update(user.id, { role })
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
      showSaved(user.id)
    } catch {
      setPageError(t.auRoleChangeErr)
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Status toggle ─────────────────────────────────────────────────────────
  async function toggleStatus(user: ProfileRow) {
    const next = user.status === 'active' ? 'inactive' : 'active'
    setUpdatingId(user.id)
    try {
      const updated = await profileService.update(user.id, { status: next })
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
      showSaved(user.id)
    } catch {
      setPageError(t.tcStatusErr)
    } finally {
      setUpdatingId(null)
    }
  }

  function showSaved(id: string) {
    setSavedId(id)
    setTimeout(() => setSavedId(s => s === id ? null : s), 2000)
  }

  // ── Statistika ────────────────────────────────────────────────────────────
  const counts = {
    total:    users.length,
    student:  users.filter(u => u.role === 'student').length,
    teacher:  users.filter(u => u.role === 'teacher').length,
    admin:    users.filter(u => u.role === 'admin').length,
    active:   users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-8">

      {/* Sarlavha */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.adTabUsers}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {loading ? t.notifLoading : `${users.length} ${t.adUsersWord}`}
        </p>
      </div>

      {/* Xato */}
      {pageError && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{pageError}</p>
          <button type="button" onClick={() => setPageError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Statistika */}
      {!loading && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: t.auJami,      value: counts.total,    bg: 'bg-white dark:bg-gray-800',         text: 'text-gray-900 dark:text-gray-100'    },
            { label: t.tdStudents,  value: counts.student,  bg: 'bg-blue-50',       text: 'text-blue-700'    },
            { label: t.adTeachers,  value: counts.teacher,  bg: 'bg-indigo-50',     text: 'text-indigo-700'  },
            { label: t.auAdmins,    value: counts.admin,    bg: 'bg-emerald-50',    text: 'text-emerald-700' },
            { label: t.admActive,   value: counts.active,   bg: 'bg-emerald-50',    text: 'text-emerald-700' },
            { label: t.tdInactive,  value: counts.inactive, bg: 'bg-gray-50 dark:bg-gray-800/50',       text: 'text-gray-500 dark:text-gray-400'    },
          ].map(s => (
            <div key={s.label} className={cn('rounded-2xl border border-gray-100 dark:border-gray-700 p-3 text-center', s.bg)}>
              <p className={cn('text-xl font-bold', s.text)}>{s.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Qidiruv + Filtrlar */}
      {!loading && users.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.tstSearchPh}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Rol filtri */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'student', 'teacher', 'admin'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={cn(
                  'px-3 py-2 text-xs font-semibold rounded-xl border transition-colors',
                  roleFilter === r
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-emerald-300',
                )}
              >
                {r === 'all' ? t.adAll : ROLE_META[r] ? t[ROLE_META[r].label] : r}
              </button>
            ))}

            {/* Status filtri */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                className="appearance-none pl-3 pr-7 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              >
                <option value="all">{t.auAllStatuses}</option>
                <option value="active">{t.admActive}</option>
                <option value="inactive">{t.tdInactive}</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* Yuklanmoqda */}
      {loading && (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 animate-pulse flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/4" />
              </div>
              <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-full w-16" />
              <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded-full w-14" />
            </div>
          ))}
        </div>
      )}

      {/* Bo'sh holat */}
      {!loading && users.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-14 text-center">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">{t.auEmpty}</p>
        </div>
      )}

      {/* Filtr bo'yicha natija yo'q */}
      {!loading && users.length > 0 && filtered.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.auNotFound}</p>
        </div>
      )}

      {/* Foydalanuvchilar jadvali */}
      {!loading && filtered.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">

          {/* Sarlavha qatori */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-5 py-3 bg-gray-50/60 border-b border-gray-100 dark:border-gray-700">
            <div className="w-9" />
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.adUser}</p>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-28 text-center">Rol</p>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-20 text-center">{t.tdColStatus}</p>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-24 text-right">{t.auJoined}</p>
          </div>

          {/* Qatorlar */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(user => {
              const roleMeta   = ROLE_META[user.role]
              const isUpdating = updatingId === user.id
              const isSaved    = savedId    === user.id

              return (
                <div
                  key={user.id}
                  className={cn(
                    'grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-5 py-3.5 transition-colors',
                    isUpdating ? 'bg-gray-50 dark:bg-gray-800/50' : 'hover:bg-gray-50/50',
                  )}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar name={user.full_name} email={user.email} role={user.role} />
                    {isSaved && (
                      <CheckCircle className="absolute -top-1 -right-1 w-3.5 h-3.5 text-emerald-500 bg-white dark:bg-gray-800 rounded-full" />
                    )}
                  </div>

                  {/* Ism + Email */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {user.full_name ?? t.taNoName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    {user.phone && (
                      <p className="text-xs text-gray-400 mt-0.5">{user.phone}</p>
                    )}
                  </div>

                  {/* Rol — inline o'zgartirish */}
                  <div className="w-28 flex justify-center">
                    <div className="relative">
                      <select
                        value={user.role}
                        onChange={e => void changeRole(user, e.target.value as 'student' | 'teacher' | 'admin')}
                        disabled={isUpdating}
                        className={cn(
                          'appearance-none text-[11px] font-semibold px-2 py-1 pr-5 rounded-full border cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30',
                          roleMeta?.bg ?? 'bg-gray-100 dark:bg-gray-700',
                          roleMeta?.color ?? 'text-gray-600 dark:text-gray-300',
                          'border-transparent',
                          isUpdating && 'opacity-50 cursor-not-allowed',
                        )}
                      >
                        <option value="student">{t.adStudent}</option>
                        <option value="teacher">{t.tdTeacher}</option>
                        <option value="admin">{t.adAdmin}</option>
                      </select>
                      <ChevronDown className={cn(
                        'absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 pointer-events-none',
                        roleMeta?.color ?? 'text-gray-500 dark:text-gray-400'
                      )} />
                    </div>
                  </div>

                  {/* Status — toggle */}
                  <div className="w-20 flex justify-center">
                    <button
                      type="button"
                      onClick={() => void toggleStatus(user)}
                      disabled={isUpdating}
                      className={cn(
                        'text-[11px] font-semibold px-2.5 py-1 rounded-full border-none transition-all disabled:cursor-not-allowed disabled:opacity-50',
                        user.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200',
                      )}
                      title={t.auToggleHint}
                    >
                      {isUpdating ? (
                        <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        user.status === 'active' ? t.admActive : t.tdInactive
                      )}
                    </button>
                  </div>

                  {/* Qo'shilgan sana */}
                  <div className="w-24 text-right">
                    <p className="text-xs text-gray-400 whitespace-nowrap">
                      {fmtDate(user.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Ko'rsatilayotgan yozuvlar */}
          {filtered.length !== users.length && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 text-center">
              {filtered.length} ta ko'rsatilmoqda (jami {users.length} tadan)
            </div>
          )}
        </div>
      )}
    </div>
  )
}
