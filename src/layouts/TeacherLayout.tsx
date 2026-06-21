import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { ComponentType } from 'react'
import {
  Home, GraduationCap, Users, BookOpen, CheckSquare,
  FileText, User, Menu, X, Search, LogOut, Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import logoSrc from '@/assets/images/logo.svg'
import { supabase } from '@/lib/supabase'

interface NavItem {
  label: string
  to: string
  icon: ComponentType<{ className?: string }>
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Asosiy',
    items: [
      { label: 'Dashboard', to: '/teacher', icon: Home },
    ],
  },
  {
    title: "O'quv jarayoni",
    items: [
      { label: 'Talabalar', to: '/teacher/students',   icon: GraduationCap },
      { label: 'Guruhlar',  to: '/teacher/groups',     icon: Users         },
      { label: 'Darslar',   to: '/teacher/courses',    icon: BookOpen      },
      { label: 'Davomat',   to: '/teacher/attendance', icon: CheckSquare   },
      { label: 'Testlar',   to: '/teacher/tests',      icon: FileText      },
    ],
  },
  {
    title: 'Boshqa',
    items: [
      { label: 'Profil', to: '/teacher/profile', icon: User },
    ],
  },
]

export default function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const auth     = useAuth()
  const navigate = useNavigate()
  const userName = auth.user?.name ?? "O'qituvchi"
  const initial  = userName.charAt(0).toUpperCase()

  // ── Real statistika ────────────────────────────────────────────────────────
  const [stats, setStats] = useState({ students: 0, lessons: 0, groups: 0 })

  useEffect(() => {
    if (!auth.user?.id) return
    void (async () => {
      const { data } = await supabase
        .from('groups')
        .select('id, student_groups(id), lessons(id)')
        .eq('teacher_id', auth.user!.id)

      const groups   = data ?? []
      const students = groups.reduce((a: number, g: any) => a + (g.student_groups?.length ?? 0), 0)
      const lessons  = groups.reduce((a: number, g: any) => a + (g.lessons?.length ?? 0), 0)
      setStats({ students, lessons, groups: groups.length })
    })()
  }, [auth.user?.id])

  async function handleLogout() {
    await auth.logout()
    navigate('/login', { replace: true })
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
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigatsiya */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {NAV_SECTIONS.map(section => (
            <div key={section.title}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1.5">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/teacher'}
                      className={({ isActive }) => cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Real statistika karta */}
        <div className="px-3 pb-3">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-4 text-white">
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-3">
              Mening natijalari
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-white/10 rounded-xl p-2 text-center">
                <p className="text-lg font-bold leading-tight">
                  {stats.groups > 0 ? stats.groups : '—'}
                </p>
                <p className="text-[9px] text-indigo-200 mt-0.5">Guruh</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2 text-center">
                <p className="text-lg font-bold leading-tight">
                  {stats.students > 0 ? stats.students : '—'}
                </p>
                <p className="text-[9px] text-indigo-200 mt-0.5">Talaba</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2 text-center">
                <p className="text-lg font-bold leading-tight">
                  {stats.lessons > 0 ? stats.lessons : '—'}
                </p>
                <p className="text-[9px] text-indigo-200 mt-0.5">Dars</p>
              </div>
            </div>
            <div className="h-1.5 bg-indigo-500/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/70 rounded-full transition-all"
                style={{ width: stats.students > 0 ? '100%' : '0%' }}
              />
            </div>
            <p className="text-[10px] text-indigo-300 mt-1.5">
              {stats.students > 0
                ? `${stats.students} ta talabangiz bor`
                : 'Guruh biriktirilmagan'}
            </p>
          </div>
        </div>

        {/* Profil / Logout */}
        <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 group transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
              <p className="text-xs text-gray-500 truncate">O&apos;qituvchi</p>
            </div>
            <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-400 transition-colors flex-shrink-0" />
          </button>
        </div>
      </aside>

      {/* ══ Asosiy kontent ══ */}
      <div className="lg:ml-64 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="sticky top-0 z-10 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center gap-3 px-4 lg:px-6 flex-shrink-0">
          <button
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
                placeholder="Talaba, guruh yoki dars..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-sm">
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
