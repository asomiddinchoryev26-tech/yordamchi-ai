import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { ComponentType } from 'react'
import {
  Home, BookOpen, CheckSquare, FileText,
  User, Bell, Menu, X, LogOut, Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PATHS } from '@/routes/paths'
import logoSrc from '@/assets/images/logo.svg'
import { supabase } from '@/lib/supabase'

interface NavItem {
  label: string
  to:    string
  icon:  ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Bosh sahifa', to: PATHS.STUDENT.ROOT,       icon: Home        },
  { label: 'Darslarim',   to: PATHS.STUDENT.LESSONS,    icon: BookOpen    },
  { label: 'Davomat',     to: PATHS.STUDENT.ATTENDANCE, icon: CheckSquare },
  { label: 'Testlar',     to: PATHS.STUDENT.TESTS,      icon: FileText    },
  { label: 'Profil',      to: PATHS.STUDENT.PROFILE,    icon: User        },
]

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const auth     = useAuth()
  const navigate = useNavigate()
  const userName = auth.user?.name ?? 'Foydalanuvchi'
  const initial  = userName.charAt(0).toUpperCase()

  // ── Real statistika ────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    groups:   0,
    passed:   0,
    attPct:   null as number | null,
    attTotal: 0,
  })

  useEffect(() => {
    if (!auth.user?.id) return
    void (async () => {
      const [grpRes, testRes, attRes] = await Promise.all([
        supabase
          .from('student_groups')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', auth.user!.id),

        supabase
          .from('test_results')
          .select('score, total_questions')
          .eq('student_id', auth.user!.id)
          .not('submitted_at', 'is', null),

        supabase
          .from('attendance')
          .select('status')
          .eq('student_id', auth.user!.id),
      ])

      const tests   = testRes.data  ?? []
      const attData = attRes.data   ?? []
      const present = attData.filter(a => a.status === 'present').length
      const passed  = tests.filter(t => t.total_questions > 0 && (t.score / t.total_questions) >= 0.6).length

      setStats({
        groups:   grpRes.count ?? 0,
        passed,
        attPct:   attData.length > 0 ? Math.round((present / attData.length) * 100) : null,
        attTotal: attData.length,
      })
    })()
  }, [auth.user?.id])

  async function handleLogout() {
    await auth.logout()
    navigate(PATHS.LOGIN, { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══ Sidebar ══ */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 flex flex-col',
        'transition-transform duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      )}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-100 flex-shrink-0">
          <img src={logoSrc} alt="YordamchiAI" className="w-8 h-8 rounded-lg shadow-sm" />
          <span className="font-bold text-gray-900 tracking-tight">YordamchiAI</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-3">
            Menyu
          </p>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === PATHS.STUDENT.ROOT}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* Real statistika karta */}
        <div className="px-3 pb-3">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white">
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-3">
              Mening natijalarim
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-white/10 rounded-xl p-2 text-center">
                <p className="text-lg font-bold leading-tight">
                  {stats.groups > 0 ? stats.groups : '—'}
                </p>
                <p className="text-[9px] text-blue-200 mt-0.5">Kurs</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2 text-center">
                <p className="text-lg font-bold leading-tight">
                  {stats.passed > 0 ? stats.passed : '—'}
                </p>
                <p className="text-[9px] text-blue-200 mt-0.5">Test ✓</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2 text-center">
                <p className="text-lg font-bold leading-tight">
                  {stats.attPct !== null ? `${stats.attPct}%` : '—'}
                </p>
                <p className="text-[9px] text-blue-200 mt-0.5">Davomat</p>
              </div>
            </div>
            {stats.attPct !== null && (
              <div className="h-1.5 bg-blue-500/40 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    stats.attPct >= 80 ? 'bg-emerald-400' : stats.attPct >= 60 ? 'bg-amber-400' : 'bg-red-400'
                  )}
                  style={{ width: `${stats.attPct}%` }}
                />
              </div>
            )}
            <p className="text-[10px] text-blue-300 mt-1.5">
              {stats.attTotal > 0
                ? `${stats.attTotal} ta dars yozuvi mavjud`
                : stats.groups > 0
                  ? `${stats.groups} ta kursga qo'shilgansiz`
                  : "Hali kursga qo'shilmadingiz"
              }
            </p>
          </div>
        </div>

        {/* User / Logout */}
        <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 group transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
              <p className="text-xs text-gray-500">Talaba</p>
            </div>
            <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors flex-shrink-0" />
          </button>
        </div>
      </aside>

      {/* ══ Main kontent ══ */}
      <div className="lg:ml-64 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="sticky top-0 z-10 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center gap-3 px-4 lg:px-6 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Menyu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 max-w-sm hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Dars, mavzu yoki o'qituvchi..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              aria-label="Bildirishnomalar"
            >
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-sm">
              {initial}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
