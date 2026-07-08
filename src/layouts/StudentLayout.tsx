/**
 * layouts/StudentLayout.tsx
 * Sprint 4.7 Final Master — Premium sidebar matching approved design
 *
 * ⚠️  ALL BUSINESS LOGIC PRESERVED ⚠️
 * Supabase queries, auth, routing, state — unchanged.
 * Added visual-only nav items (Soon tags) + Premium plan section.
 */

import { useState, useEffect, Suspense } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import PageLoader from '@/components/common/PageLoader'
import { useAuth } from '@/hooks/useAuth'
import {
  Home, BookOpen, FileText, User, Award, Calendar, Settings,
  Trophy, BarChart3, Clipboard, GraduationCap, Zap, Video,
} from 'lucide-react'
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
import StudentBottomNav from '@/components/student/StudentBottomNav'
import NotificationsBell from '@/components/student/NotificationsBell'
import { PremiumModal } from '@/components/student/AssignmentsAI'
import { subscriptionService, PLAN_LABELS } from '@/services/subscription.service'
import type { PlanType } from '@/types/lms.types'

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [premiumOpen, setPremiumOpen] = useState(false)
  const [plan,        setPlan]        = useState<PlanType>('free')
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

  // ── Nav sections — expanded to match approved design ──────────────────────
  const NAV_SECTIONS: SidebarNavSection[] = [
    {
      title: t.learningSection,
      items: [
        { label: t.dashboard,       to: PATHS.STUDENT.ROOT,         icon: Home               },
        { label: '🤖 Yordamchi AI', to: PATHS.STUDENT.AI_ASSISTANT, icon: AsomiddinAIMenuIcon},
        { label: t.myCourses,    to: PATHS.STUDENT.LESSONS,      icon: BookOpen           },
        { label: 'Darslar',      to: PATHS.STUDENT.LESSONS,      icon: Video              },
        { label: t.tests,        to: PATHS.STUDENT.TESTS,        icon: FileText           },
        { label: 'Topshiriqlar', to: PATHS.STUDENT.ASSIGNMENTS,  icon: Clipboard          },
        { label: 'Kalendar',     to: PATHS.STUDENT.ATTENDANCE,   icon: Calendar           },
        { label: t.achievements, to: PATHS.STUDENT.ACHIEVEMENTS, icon: Award              },
        { label: 'Statistika',   to: PATHS.STUDENT.MY_PROGRESS,  icon: BarChart3          },
        { label: 'Sertifikatlar',to: PATHS.STUDENT.CERTIFICATES, icon: GraduationCap      },
        { label: 'Reyting',      to: PATHS.STUDENT.LEADERBOARD,  icon: Trophy             },
      ],
    },
    {
      title: t.otherSection,
      items: [
        { label: t.profile,   to: PATHS.STUDENT.PROFILE, icon: User     },
        { label: t.settings,  to: PATHS.STUDENT.PROFILE, icon: Settings, tag: 'Soon' },
      ],
    },
  ]

  // ── Stats (PRESERVED EXACTLY) ──────────────────────────────────────────────
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

  // Joriy reja — premium badge + upsell holati uchun (on-demand, keshsiz)
  useEffect(() => {
    if (!auth.user?.id) return
    void subscriptionService.getPlan(auth.user.id).then(setPlan)
  }, [auth.user?.id])
  const isPremiumUser = plan !== 'free'

  async function handleLogout() {
    await auth.logout()
    navigate(PATHS.LOGIN, { replace: true })
  }

  // statsDesc preserved for future use (currently displayed via stats mini-card)
  void (stats.attTotal > 0
    ? t.attRecordsFmt.replace('{n}', String(stats.attTotal))
    : stats.groups > 0
      ? t.coursesJoinedFmt.replace('{n}', String(stats.groups))
      : t.noGroupStudent)

  // ── Premium plan section (visual-only) ───────────────────────────────────
  const premiumSection = (
    <div className="space-y-2">
      {/* Stats mini card */}
      <div
        className="rounded-[14px] p-3"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="text-[8.5px] font-black text-white/22 uppercase tracking-[0.18em] mb-2">
          {t.myResultsStudent}
        </p>
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {[
            { value: stats.groups > 0 ? String(stats.groups) : '—', label: t.courseLabel,    color: '#818CF8' },
            { value: stats.passed > 0 ? String(stats.passed) : '—', label: t.completedTests, color: '#34D399' },
            { value: stats.attPct !== null ? `${stats.attPct}%` : '—', label: t.attendancePct, color: '#FCD34D' },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-[10px] p-1.5 text-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.065)' }}
            >
              <p className="text-[13px] font-black leading-tight" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[7px] text-white/28 mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
        {stats.attPct !== null && (
          <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className={cn('h-full rounded-full transition-all', stats.attPct >= 80 ? 'bg-emerald-400' : stats.attPct >= 60 ? 'bg-amber-400' : 'bg-red-400')}
              style={{ width: `${stats.attPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Premium plan CTA */}
      <div
        className="rounded-[14px] p-3.5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(91,127,255,0.14) 0%, rgba(124,58,237,0.10) 100%)',
          border: '1px solid rgba(91,127,255,0.20)',
        }}
      >
        <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full blur-3xl opacity-30"
          style={{ background: '#7C3AED' }} aria-hidden="true" />
        <div className="flex items-center gap-2 mb-2 relative z-10">
          <div className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#F59E0B,#EF4444)', boxShadow: '0 0 10px rgba(245,158,11,0.4)' }}>
            <span className="text-[10px]" aria-hidden="true">👑</span>
          </div>
          <p className="text-[12px] font-bold text-white/75">
            {isPremiumUser ? PLAN_LABELS[plan] : 'Premium reja'}
          </p>
          {isPremiumUser && (
            <span className="ml-auto text-[8.5px] font-black px-1.5 py-0.5 rounded-full text-emerald-300 tracking-wide"
              style={{ background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.35)' }}>
              FAOL
            </span>
          )}
        </div>
        <p className="text-[10px] text-white/38 leading-snug mb-3 relative z-10">
          {isPremiumUser ? 'Barcha premium imkoniyatlar ochiq. Rahmat! 👑' : "Ko'proq imkoniyatlar va cheksiz AI yordam!"}
        </p>
        <button
          type="button"
          onClick={() => setPremiumOpen(true)}
          className="w-full py-[8px] rounded-[10px] text-[11.5px] font-bold text-white flex items-center justify-center gap-1.5 relative z-10 transition-all hover:opacity-88 active:scale-98"
          style={{
            background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)',
            boxShadow: '0 4px 14px rgba(91,127,255,0.38), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          <Zap className="w-3 h-3" aria-hidden="true" />
          {isPremiumUser ? 'Rejani boshqarish' : 'Rejani yangilash'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex" style={{ background: '#070B14' }}>

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
        summaryCard={premiumSection}
      />

      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden" style={{ background: '#070B14' }}>
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          userName={userName}
          userInitial={initial}
          avatarGradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          searchPlaceholder={t.studentSearchPlaceholder}
          avatarNode={avatarEl}
          notificationsSlot={<NotificationsBell />}
        />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 pb-24 lg:pb-6 overflow-x-hidden page-enter">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Mobil/planshet pastki navigatsiya (desktop'da sidebar bor — yashirin).
          Drawer ochilganda ko'rsatmaymiz. */}
      {!sidebarOpen && <StudentBottomNav />}

      {/* Premium reja — "Rejani yangilash" bosilganda ochiladi (mavjud oqim) */}
      <PremiumModal open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </div>
  )
}
