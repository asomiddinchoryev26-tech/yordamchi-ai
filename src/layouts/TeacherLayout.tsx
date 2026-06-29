import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  Home, GraduationCap, Users, BookOpen, CheckSquare, FileText, User, Award,
} from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import type { SidebarNavSection } from '@/components/layout/Sidebar'
import { PATHS } from '@/routes/paths'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { UserAvatar } from '@/components/identity'
import { useProfile } from '@/hooks/useProfile'

export default function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const auth        = useAuth()
  const { profile } = useProfile()
  const navigate    = useNavigate()
  const { t }       = useLanguage()
  const userName    = profile?.fullName ?? auth.user?.name ?? t.teacherRole
  const initial     = userName.charAt(0).toUpperCase()

  const avatarEl = (
    <UserAvatar
      name={userName}
      avatarUrl={profile?.avatarUrl}
      size="sm"
      showStatus
    />
  )

  const NAV_SECTIONS: SidebarNavSection[] = [
    {
      title: t.mainSection,
      items: [
        { label: t.dashboard, to: PATHS.TEACHER.ROOT, icon: Home },
      ],
    },
    {
      title: t.learningProcessSection,
      items: [
        { label: t.students,   to: PATHS.TEACHER.STUDENTS,   icon: GraduationCap },
        { label: t.groups,     to: PATHS.TEACHER.GROUPS,     icon: Users         },
        { label: t.lessons,    to: PATHS.TEACHER.COURSES,    icon: BookOpen      },
        { label: t.attendance, to: PATHS.TEACHER.ATTENDANCE, icon: CheckSquare   },
        { label: t.tests,      to: PATHS.TEACHER.TESTS,      icon: FileText      },
      ],
    },
    {
      title: t.otherSection,
      items: [
        { label: t.achievements, to: PATHS.TEACHER.ACHIEVEMENTS, icon: Award },
        { label: t.profile,      to: PATHS.TEACHER.PROFILE,      icon: User  },
      ],
    },
  ]

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
    navigate(PATHS.LOGIN, { replace: true })
  }

  const statsDesc = stats.students > 0
    ? t.teacherStudentsFmt.replace('{n}', String(stats.students))
    : t.noGroup

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navSections={NAV_SECTIONS}
        baseRoute={PATHS.TEACHER.ROOT}
        color="indigo"
        userName={userName}
        userRole={t.teacherRole}
        userInitial={initial}
        avatarNode={avatarEl}
        onLogout={handleLogout}
        summaryCard={
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-4 text-white">
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-3">
              {t.myResults}
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-white/10 rounded-xl p-2 text-center">
                <p className="text-lg font-bold leading-tight">
                  {stats.groups > 0 ? stats.groups : '—'}
                </p>
                <p className="text-[9px] text-indigo-200 mt-0.5">{t.groupLabel}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2 text-center">
                <p className="text-lg font-bold leading-tight">
                  {stats.students > 0 ? stats.students : '—'}
                </p>
                <p className="text-[9px] text-indigo-200 mt-0.5">{t.studentLabel}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2 text-center">
                <p className="text-lg font-bold leading-tight">
                  {stats.lessons > 0 ? stats.lessons : '—'}
                </p>
                <p className="text-[9px] text-indigo-200 mt-0.5">{t.lessonLabel}</p>
              </div>
            </div>
            <div className="h-1.5 bg-indigo-500/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/70 rounded-full transition-all"
                style={{ width: stats.students > 0 ? '100%' : '0%' }}
              />
            </div>
            <p className="text-[10px] text-indigo-300 mt-1.5">{statsDesc}</p>
          </div>
        }
      />

      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          notificationCount={0}
          userName={userName}
          userInitial={initial}
          avatarGradient="bg-gradient-to-br from-indigo-500 to-blue-600"
          searchPlaceholder={t.teacherSearchPlaceholder}
          avatarNode={avatarEl}
        />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
