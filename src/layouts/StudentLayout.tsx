/**
 * layouts/StudentLayout.tsx
 * Sprint 4.7 Final Master — Premium sidebar matching approved design
 *
 * ⚠️  ALL BUSINESS LOGIC PRESERVED ⚠️
 * Supabase queries, auth, routing, state — unchanged.
 * Added visual-only nav items (Soon tags) + Premium plan section.
 */

import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
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

  // ── Nav sections — expanded to match approved design ──────────────────────
  const NAV_SECTIONS: SidebarNavSection[] = [
    {
      title: t.learningSection,
      items: [
        { label: t.dashboard,    to: PATHS.STUDENT.ROOT,         icon: Home               },
        { label: t.myCourses,    to: PATHS.STUDENT.LESSONS,      icon: BookOpen           },
        { label: 'Darslar',      to: PATHS.STUDENT.LESSONS,      icon: Video              },
        { label: t.tests,        to: PATHS.STUDENT.TESTS,        icon: FileText           },
        { label: t.aiAssistant,  to: PATHS.STUDENT.AI_ASSISTANT, icon: AsomiddinAIMenuIcon},
        { label: 'Topshiriqlar', to: PATHS.STUDENT.PROFILE,      icon: Clipboard, tag: 'Soon' },
        { label: 'Kalendar',     to: PATHS.STUDENT.PROFILE,      icon: Calendar,  tag: 'Soon' },
        { label: t.achievements, to: PATHS.STUDENT.ACHIEVEMENTS, icon: Award              },
        { label: 'Statistika',   to: PATHS.STUDENT.PROFILE,      icon: BarChart3, tag: 'Soon' },
        { label: 'Sertifikatlar',to: PATHS.STUDENT.PROFILE,      icon: GraduationCap, tag: 'Soon' },
        { label: 'Reyting',      to: PATHS.STUDENT.PROFILE,      icon: Trophy,    tag: 'Soon' },
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

  async function handleLogout() {
    await auth.logout()
    navigate(PATHS.LOGIN, { replace: true })
  }

  const statsDesc = stats.attTotal > 0
    ? t.attRecordsFmt.replace('{n}', String(stats.attTotal))
    : stats.groups > 0
      ? t.coursesJoinedFmt.replace('{n}', String(stats.groups))
      : t.noGroupStudent

  // ── Premium plan section (visual-only) ───────────────────────────────────
  const premiumSection = (
    <div className="space-y-3">
      {/* Stats mini card */}
      <div
        className="rounded-[16px] p-3 text-white"
        style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.20)' }}
      >
        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em] mb-2">
          {t.myResultsStudent}
        </p>
        <div className="grid grid-cols-3 gap-1.5 mb-2.5">
          {[
            { value: stats.groups > 0 ? String(stats.groups) : '—', label: t.courseLabel,    color: '#818CF8' },
            { value: stats.passed > 0 ? String(stats.passed) : '—', label: t.completedTests, color: '#34D399' },
            { value: stats.attPct !== null ? `${stats.attPct}%` : '—', label: t.attendancePct, color: '#FCD34D' },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl p-1.5 text-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-[13px] font-black leading-tight" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[7.5px] text-white/30 mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
        {stats.attPct !== null && (
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className={cn('h-full rounded-full transition-all', stats.attPct >= 80 ? 'bg-emerald-400' : stats.attPct >= 60 ? 'bg-amber-400' : 'bg-red-400')}
              style={{ width: `${stats.attPct}%` }}
            />
          </div>
        )}
        <p className="text-[8.5px] text-white/25 mt-1">{statsDesc}</p>
      </div>

      {/* Premium plan CTA */}
      <div
        className="rounded-[16px] p-3.5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.20) 0%, rgba(99,102,241,0.12) 100%)',
          border: '1px solid rgba(124,58,237,0.30)',
        }}
      >
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-40"
          style={{ background: '#7C3AED' }} aria-hidden="true" />
        <div className="flex items-center gap-2 mb-2 relative z-10">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#F59E0B,#EF4444)' }}>
            <span className="text-[11px]" aria-hidden="true">👑</span>
          </div>
          <p className="text-[12px] font-bold text-white/80">Premium reja</p>
        </div>
        <p className="text-[10px] text-white/40 leading-snug mb-3 relative z-10">
          Ko&apos;proq imkoniyatlar va cheksiz AI yordam!
        </p>
        <button
          type="button"
          className="w-full py-2 rounded-xl text-[11px] font-bold text-white flex items-center justify-center gap-1.5 relative z-10 transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#7C3AED,#5B5CF6)', boxShadow: '0 4px 12px rgba(124,58,237,0.4)' }}
        >
          <Zap className="w-3 h-3" aria-hidden="true" />
          Rejani yangilash
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
          notificationCount={3}
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
