import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Home, BookOpen, CheckSquare, FileText, User, Award, Calendar, Bell, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import type { SidebarNavSection } from '@/components/layout/Sidebar'
import { PATHS } from '@/routes/paths'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { AsomiddinAIMenuIcon } from '@/components/ai'
import { UserAvatar } from '@/components/identity'
import { useProfile } from '@/hooks/useProfile'

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const auth        = useAuth()
  const { profile } = useProfile()
  const navigate    = useNavigate()
  const { t }       = useLanguage()
  const userName    = profile?.fullName ?? auth.user?.name ?? t.studentRole
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
      title: t.learningSection,
      items: [
        { label: t.dashboard,     to: PATHS.STUDENT.ROOT,         icon: Home        },
        { label: t.myCourses,     to: PATHS.STUDENT.LESSONS,      icon: BookOpen    },
        { label: t.attendance,    to: PATHS.STUDENT.ATTENDANCE,   icon: CheckSquare },
        { label: t.tests,         to: PATHS.STUDENT.TESTS,        icon: FileText    },
        { label: t.achievements,  to: PATHS.STUDENT.ACHIEVEMENTS, icon: Award                },
        { label: t.aiAssistant,   to: PATHS.STUDENT.AI_ASSISTANT, icon: AsomiddinAIMenuIcon  },
        // AI Vision merged into AI Assistant (Sprint 3.3)
      ],
    },
    {
      title: t.otherSection,
      items: [
        { label: t.profile,        to: PATHS.STUDENT.PROFILE,       icon: User     },
        { label: t.notifications,  to: PATHS.STUDENT.PROFILE,       icon: Bell,     tag: 'Soon' },
        { label: 'Kalendar',       to: PATHS.STUDENT.PROFILE,       icon: Calendar, tag: 'Soon' },
        { label: t.settings,       to: PATHS.STUDENT.PROFILE,       icon: Settings, tag: 'Soon' },
      ],
    },
  ]

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

  const statsDesc = stats.attTotal > 0
    ? t.attRecordsFmt.replace('{n}', String(stats.attTotal))
    : stats.groups > 0
      ? t.coursesJoinedFmt.replace('{n}', String(stats.groups))
      : t.noGroupStudent

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navSections={NAV_SECTIONS}
        baseRoute={PATHS.STUDENT.ROOT}
        color="blue"
        userName={userName}
        userRole={t.studentRole}
        userInitial={initial}
        avatarNode={avatarEl}
        onLogout={handleLogout}
        summaryCard={
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white">
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-3">
              {t.myResultsStudent}
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-white/10 rounded-xl p-2 text-center">
                <p className="text-lg font-bold leading-tight">
                  {stats.groups > 0 ? stats.groups : '—'}
                </p>
                <p className="text-[9px] text-blue-200 mt-0.5">{t.courseLabel}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2 text-center">
                <p className="text-lg font-bold leading-tight">
                  {stats.passed > 0 ? stats.passed : '—'}
                </p>
                <p className="text-[9px] text-blue-200 mt-0.5">{t.completedTests}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2 text-center">
                <p className="text-lg font-bold leading-tight">
                  {stats.attPct !== null ? `${stats.attPct}%` : '—'}
                </p>
                <p className="text-[9px] text-blue-200 mt-0.5">{t.attendancePct}</p>
              </div>
            </div>
            {stats.attPct !== null && (
              <div className="h-1.5 bg-blue-500/40 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    stats.attPct >= 80 ? 'bg-emerald-400' : stats.attPct >= 60 ? 'bg-amber-400' : 'bg-red-400',
                  )}
                  style={{ width: `${stats.attPct}%` }}
                />
              </div>
            )}
            <p className="text-[10px] text-blue-300 mt-1.5">{statsDesc}</p>
          </div>
        }
      />

      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          notificationCount={0}
          userName={userName}
          userInitial={initial}
          avatarGradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          searchPlaceholder={t.studentSearchPlaceholder}
          avatarNode={avatarEl}
        />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
