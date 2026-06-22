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
import { useLanguage } from '@/contexts/LanguageContext'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const auth     = useAuth()
  const navigate = useNavigate()
  const { t }    = useLanguage()
  const userName = auth.user?.name ?? 'Administrator'
  const initial  = userName.charAt(0).toUpperCase()

  const NAV_SECTIONS: SidebarNavSection[] = [
    {
      title: t.mainSection,
      items: [
        { label: t.dashboard, to: PATHS.ADMIN.ROOT, icon: Home },
      ],
    },
    {
      title: t.studentsSection,
      items: [
        { label: t.students,  to: PATHS.ADMIN.STUDENTS, icon: Users         },
        { label: t.teachers,  to: PATHS.ADMIN.TEACHERS, icon: GraduationCap },
        { label: t.groups,    to: PATHS.ADMIN.GROUPS,   icon: Layers        },
      ],
    },
    {
      title: t.learningSection,
      items: [
        { label: t.subjects,    to: PATHS.ADMIN.SUBJECTS,   icon: BookMarked  },
        { label: t.lessons,     to: PATHS.ADMIN.LESSONS,    icon: BookOpen    },
        { label: t.attendance,  to: PATHS.ADMIN.ATTENDANCE, icon: CheckSquare },
        { label: t.tests,       to: PATHS.ADMIN.TESTS,      icon: FileText    },
      ],
    },
    {
      title: t.systemSection,
      items: [
        { label: t.reports,   to: PATHS.ADMIN.REPORTS,  icon: BarChart2 },
        { label: t.settings,  to: PATHS.ADMIN.SETTINGS, icon: Settings  },
      ],
    },
  ]

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navSections={NAV_SECTIONS}
        baseRoute={PATHS.ADMIN.ROOT}
        color="emerald"
        userName={userName}
        userRole={t.adminRole}
        userInitial={initial}
        onLogout={handleLogout}
        summaryCard={
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-4 text-white">
            <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-3">
              {t.systemStatus}
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="text-xl font-bold leading-tight">
                  {stats.users > 0 ? stats.users.toLocaleString() : '—'}
                </p>
                <p className="text-[10px] text-emerald-200 mt-0.5">{t.usersLabel}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="text-xl font-bold leading-tight">
                  {stats.groups > 0 ? stats.groups : '—'}
                </p>
                <p className="text-[10px] text-emerald-200 mt-0.5">{t.activeGroupsLabel}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-emerald-300 mb-1.5">
              <span>{t.totalLessonsLabel}</span>
              <span className="font-semibold text-white">{stats.lessons}</span>
            </div>
            <div className="h-1.5 bg-emerald-500/40 rounded-full overflow-hidden">
              <div className="h-full w-full bg-white/70 rounded-full" />
            </div>
            <p className="text-[10px] text-emerald-300 mt-1.5">
              {t.systemWorking}
            </p>
          </div>
        }
      />

      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          notificationCount={0}
          userName={userName}
          userInitial={initial}
          avatarGradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          searchPlaceholder={t.adminSearchPlaceholder}
        />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
