import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  Home, Users, GraduationCap, Layers,
  BookOpen, BookMarked, CheckSquare, FileText,
  BarChart2, Settings,
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import type { SidebarNavSection } from '@/components/layout/Sidebar'
import { PATHS } from '@/routes/paths'
import { supabase } from '@/lib/supabase'

const NAV_SECTIONS: SidebarNavSection[] = [
  {
    title: 'Asosiy',
    items: [
      { label: 'Dashboard', to: PATHS.ADMIN.ROOT, icon: Home },
    ],
  },
  {
    title: "O'quvchilar",
    items: [
      { label: 'Talabalar',     to: PATHS.ADMIN.STUDENTS, icon: Users         },
      { label: "O'qituvchilar", to: PATHS.ADMIN.TEACHERS, icon: GraduationCap },
      { label: 'Guruhlar',      to: PATHS.ADMIN.GROUPS,   icon: Layers        },
    ],
  },
  {
    title: "Ta'lim jarayoni",
    items: [
      { label: 'Fanlar',   to: PATHS.ADMIN.SUBJECTS,   icon: BookMarked  },
      { label: 'Darslar',  to: PATHS.ADMIN.LESSONS,    icon: BookOpen    },
      { label: 'Davomat',  to: PATHS.ADMIN.ATTENDANCE, icon: CheckSquare },
      { label: 'Testlar',  to: PATHS.ADMIN.TESTS,      icon: FileText    },
    ],
  },
  {
    title: 'Tizim',
    items: [
      { label: 'Hisobotlar', to: PATHS.ADMIN.REPORTS,  icon: BarChart2 },
      { label: 'Sozlamalar', to: PATHS.ADMIN.SETTINGS, icon: Settings  },
    ],
  },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const auth     = useAuth()
  const navigate = useNavigate()
  const userName = auth.user?.name ?? 'Administrator'
  const initial  = userName.charAt(0).toUpperCase()

  // ── Real statistika ────────────────────────────────────────────────────────
  const [stats, setStats] = useState({ users: 0, groups: 0, lessons: 0 })

  useEffect(() => {
    void (async () => {
      const [usersRes, groupsRes, lessonsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('groups').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
      ])
      setStats({
        users:   usersRes.count  ?? 0,
        groups:  groupsRes.count ?? 0,
        lessons: lessonsRes.count ?? 0,
      })
    })()
  }, [])

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

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navSections={NAV_SECTIONS}
        baseRoute={PATHS.ADMIN.ROOT}
        color="emerald"
        userName={userName}
        userRole="Tizim administratori"
        userInitial={initial}
        onLogout={handleLogout}
        summaryCard={
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-4 text-white">
            <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-3">
              Tizim holati
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="text-xl font-bold leading-tight">
                  {stats.users > 0 ? stats.users.toLocaleString() : '—'}
                </p>
                <p className="text-[10px] text-emerald-200 mt-0.5">Foydalanuvchi</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="text-xl font-bold leading-tight">
                  {stats.groups > 0 ? stats.groups : '—'}
                </p>
                <p className="text-[10px] text-emerald-200 mt-0.5">Faol guruh</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-emerald-300 mb-1.5">
              <span>Jami darslar</span>
              <span className="font-semibold text-white">{stats.lessons}</span>
            </div>
            <div className="h-1.5 bg-emerald-500/40 rounded-full overflow-hidden">
              <div className="h-full w-full bg-white/70 rounded-full" />
            </div>
            <p className="text-[10px] text-emerald-300 mt-1.5">
              Barcha tizimlar ishlayapti ✓
            </p>
          </div>
        }
      />

      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          notificationCount={0}
          userName={userName}
          userInitial={initial}
          avatarGradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          searchPlaceholder="Foydalanuvchi, kurs, guruh..."
        />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
