import { useState, useEffect } from 'react'
import {
  BookOpen, TrendingUp, FileText, Award,
  ChevronRight, Play, Sparkles, ArrowRight,
  CheckCircle, Clock, BarChart3, Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { PATHS } from '@/routes/paths'
import { BentoCard, ProgressRing, ChartPlaceholder } from '@/components/dashboard'

// ─── Types (unchanged from original) ─────────────────────────────────────────

type SDGroup = {
  id:           string
  name:         string
  status:       'active' | 'inactive' | 'completed'
  subject:      { name: string; icon: string; color: string } | null
  teacher_name: string | null
  lesson_count: number
  enrolled_at:  string
  att_present:  number
  att_total:    number
}

type SDTest = {
  id:           string
  test_id:      string
  title:        string
  group_name:   string
  score:        number
  total:        number
  submitted_at: string
}

type EarnedAchievement = {
  id:           string
  total_score:  number | null
  period_year:  number
  period_month: number | null
  period_type:  'monthly' | 'yearly'
  earned_at:    string
  group_id:     string | null
  group_name:   string | null
  def: {
    code:        string
    name:        { uz: string; ru: string; en: string }
    description: { uz: string; ru: string; en: string }
    tier:        'gold' | 'silver' | 'bronze' | 'special'
    icon_emoji:  string
  } | null
}

type ScoreSnapshot = {
  id:                string
  total_score:       number
  attendance_score:  number
  test_score:        number
  consistency_score: number
  activity_score:    number
  period_year:       number
  period_month:      number
  group_name:        string | null
}

// ─── Motion variants ──────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

const GRID_CONTAINER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.065, delayChildren: 0.1 },
  },
}

const GRID_ITEM = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE } },
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800', className)} />
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']
function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]}`
}
function attendanceColor(pct: number) {
  if (pct >= 80) return '#22C55E'
  if (pct >= 60) return '#F59E0B'
  return '#EF4444'
}
function attendanceLabel(pct: number) {
  if (pct >= 80) return 'A\'lo'
  if (pct >= 60) return 'Qoniqarli'
  return 'Past'
}

// ─── Welcome Widget ───────────────────────────────────────────────────────────

function WelcomeWidget({
  name,
  groups,
  attPct,
  passedTests,
  totalTests,
  loading,
}: {
  name: string
  groups: number
  attPct: number | null
  passedTests: number
  totalTests: number
  loading: boolean
}) {
  const now = new Date()
  const hour = now.getHours()
  const greeting =
    hour < 12 ? 'Xayrli tong' :
    hour < 17 ? 'Xayrli kun' :
    'Xayrli kech'

  const dateStr = now.toLocaleDateString('uz-UZ', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <BentoCard
      gradient
      gradientStyle={{
        background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 70%, #6D28D9 100%)',
      }}
      hoverable={false}
      className="text-white overflow-hidden"
    >
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/[0.06] pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/[0.06] pointer-events-none" aria-hidden="true" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm font-medium capitalize">{dateStr}</p>
            <h1 className="text-2xl font-black mt-1 leading-tight">
              {greeting}, {name.split(' ')[0]}! 👋
            </h1>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3].map(i => <Skeleton key={i} className="h-12 bg-white/10" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Kurslar",   value: groups > 0 ? String(groups) : '—', icon: BookOpen  },
              { label: "Davomat",   value: attPct !== null ? `${attPct}%` : '—', icon: CheckCircle },
              { label: "Testlar",   value: totalTests > 0 ? `${passedTests}/${totalTests}` : '—', icon: FileText },
            ].map(s => (
              <div key={s.label} className="bg-white/12 rounded-2xl p-3">
                <s.icon className="w-3.5 h-3.5 text-white/70 mb-1.5" aria-hidden="true" />
                <p className="text-base font-black leading-none">{s.value}</p>
                <p className="text-white/60 text-[10px] mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </BentoCard>
  )
}

// ─── Attendance Widget ────────────────────────────────────────────────────────

function AttendanceWidget({ attPct, loading }: { attPct: number | null; loading: boolean }) {
  const pct   = attPct ?? 0
  const color = attendanceColor(pct)
  const label = attendanceLabel(pct)

  return (
    <BentoCard accentClass="bg-gradient-to-r from-emerald-500 to-green-400">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Davomat
          </p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">
            {loading ? '...' : attPct !== null ? label : 'Ma\'lumot yo\'q'}
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18` }}
        >
          <CheckCircle className="w-4.5 h-4.5" style={{ color }} aria-hidden="true" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-2">
          <Skeleton className="w-16 h-16 rounded-full" />
        </div>
      ) : attPct !== null ? (
        <div className="flex items-center justify-center py-1">
          <ProgressRing value={pct} size={80} strokeWidth={7} color={color} animDelay={0.5} />
        </div>
      ) : (
        <div className="flex items-center justify-center py-4">
          <p className="text-sm text-gray-400 dark:text-gray-500">—</p>
        </div>
      )}
    </BentoCard>
  )
}

// ─── Tests Widget ─────────────────────────────────────────────────────────────

function TestsWidget({
  avgScore, passedTests, totalTests, loading,
}: {
  avgScore: number; passedTests: number; totalTests: number; loading: boolean
}) {
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0

  return (
    <BentoCard accentClass="bg-gradient-to-r from-violet-500 to-purple-500">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Testlar
          </p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">
            {loading ? '...' : totalTests > 0 ? `${passedTests} ta o'tdi` : "Hali topshirilmagan"}
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/25 flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" aria-hidden="true" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-2">
          <Skeleton className="w-16 h-16 rounded-full" />
        </div>
      ) : totalTests > 0 ? (
        <div className="flex items-center justify-center py-1">
          <ProgressRing
            value={passRate}
            size={80}
            strokeWidth={7}
            color="#7C3AED"
            label={`Avg ${avgScore}%`}
            animDelay={0.6}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center py-4">
          <p className="text-sm text-gray-400 dark:text-gray-500">—</p>
        </div>
      )}
    </BentoCard>
  )
}

// ─── Active Courses Widget ────────────────────────────────────────────────────

function CoursesWidget({ groups, loading }: { groups: SDGroup[]; loading: boolean }) {
  const navigate = useNavigate()
  const active   = groups.filter(g => g.status === 'active').slice(0, 3)

  return (
    <BentoCard
      className="flex flex-col"
      accentClass="bg-gradient-to-r from-[#5B5CF6] to-[#7C3AED]"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Faol kurslar</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {loading ? '...' : active.length > 0 ? `${active.length} ta kurs davom etmoqda` : 'Faol kurs yo\'q'}
          </p>
        </div>
        <button
          onClick={() => navigate(PATHS.STUDENT.LESSONS)}
          className="text-xs font-semibold text-brand dark:text-brand-light hover:underline underline-offset-2 flex items-center gap-0.5"
        >
          Barchasi <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : active.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
          <BookOpen className="w-8 h-8 text-gray-200 dark:text-gray-700 mb-2" aria-hidden="true" />
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Hali kursga qo&apos;shilmadingiz
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map(course => {
            const pct = course.att_total > 0
              ? Math.round((course.att_present / course.att_total) * 100)
              : null
            return (
              <div
                key={course.id}
                className="group flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/[0.04] hover:bg-brand/5 dark:hover:bg-brand/8 border border-gray-100 dark:border-white/[0.05] transition-all duration-150 cursor-pointer"
                onClick={() => navigate(PATHS.STUDENT.LESSONS)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(PATHS.STUDENT.LESSONS)}
              >
                <div className="text-2xl flex-shrink-0 w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  {course.subject?.icon ?? '📚'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {course.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: pct !== null ? `${pct}%` : '0%',
                          background: pct !== null ? attendanceColor(pct) : '#E5E7EB',
                        }}
                      />
                    </div>
                    {pct !== null && (
                      <span className="text-[10px] font-bold flex-shrink-0" style={{ color: attendanceColor(pct) }}>
                        {pct}%
                      </span>
                    )}
                  </div>
                </div>
                <Play
                  className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-brand dark:group-hover:text-brand-light transition-colors flex-shrink-0"
                  aria-hidden="true"
                />
              </div>
            )
          })}
        </div>
      )}
    </BentoCard>
  )
}

// ─── AI Assistant Widget ──────────────────────────────────────────────────────

function AIWidget({ language }: { language: string }) {
  const headline =
    language === 'ru' ? 'Ваш ИИ-репетитор готов' :
    language === 'en' ? 'Your AI tutor is ready' :
    'AI o\'qituvchingiz tayyor'

  const subtext =
    language === 'ru' ? 'Задайте любой вопрос по предмету' :
    language === 'en' ? 'Ask any question about your lessons' :
    'Har qanday savol bering — AI javob beradi'

  const cta =
    language === 'ru' ? 'Начать' :
    language === 'en' ? 'Start' :
    'Boshlash'

  return (
    <BentoCard
      gradient
      gradientStyle={{
        background: 'linear-gradient(145deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)',
      }}
      className="text-white flex flex-col"
      hoverable={false}
    >
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-violet-400/15 pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-white/5 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex flex-col h-full">
        {/* AI avatar */}
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 flex-shrink-0 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)' }}
        >
          <img
            src="/asomiddin.jpg"
            alt="AI"
            className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        </div>

        <p className="text-base font-bold leading-snug mb-1">{headline}</p>
        <p className="text-white/60 text-xs leading-relaxed flex-1">{subtext}</p>

        <Link
          to={PATHS.STUDENT.AI_ASSISTANT}
          className="mt-4 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-white/90 transition-all duration-150"
        >
          <Zap className="w-3.5 h-3.5" aria-hidden="true" />
          {cta}
          <ArrowRight className="w-3.5 h-3.5 ml-auto" aria-hidden="true" />
        </Link>
      </div>
    </BentoCard>
  )
}

// ─── Achievements Widget ──────────────────────────────────────────────────────

function AchievementsWidget({
  achievements, goldCount, silverCount, bronzeCount, loading,
}: {
  achievements: EarnedAchievement[]
  goldCount: number
  silverCount: number
  bronzeCount: number
  loading: boolean
}) {
  const navigate = useNavigate()

  return (
    <BentoCard accentClass="bg-gradient-to-r from-amber-400 to-orange-400">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Yutuqlar
          </p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">
            {loading ? '...' : achievements.length > 0
              ? `${achievements.length} ta yutuq`
              : 'Hali yutuq yo\'q'}
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/25 flex items-center justify-center flex-shrink-0">
          <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { emoji: '🥇', count: goldCount,   label: 'Oltin',  color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
              { emoji: '🥈', count: silverCount, label: 'Kumush', color: 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400' },
              { emoji: '🥉', count: bronzeCount, label: 'Bronza', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' },
            ].map(t => (
              <div key={t.label} className={cn('rounded-xl p-2.5 text-center', t.color)}>
                <p className="text-sm leading-none mb-1">{t.emoji}</p>
                <p className="text-base font-black leading-none">{t.count}</p>
                <p className="text-[9px] font-semibold mt-0.5 opacity-70">{t.label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate(PATHS.STUDENT.ACHIEVEMENTS)}
            className="w-full py-2 rounded-xl border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          >
            Yutuqlarni ko&apos;rish
          </button>
        </>
      )}
    </BentoCard>
  )
}

// ─── Score Progress Widget ────────────────────────────────────────────────────

function ScoreWidget({ snapshot, loading }: {
  snapshot: ScoreSnapshot | null
  loading: boolean
}) {
  if (loading) {
    return (
      <BentoCard>
        <Skeleton className="h-6 w-32 mb-3" />
        <Skeleton className="h-24" />
      </BentoCard>
    )
  }

  if (!snapshot) {
    return (
      <BentoCard accentClass="bg-gradient-to-r from-blue-500 to-indigo-500">
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
          Ballar
        </p>
        <ChartPlaceholder label="Ball taqsimoti" height={100} />
      </BentoCard>
    )
  }

  const score = snapshot.total_score
  const tier  = score >= 90 ? 'gold' : score >= 75 ? 'silver' : score >= 60 ? 'bronze' : null
  const tierLabel = tier === 'gold' ? '🥇 Oltin' : tier === 'silver' ? '🥈 Kumush' : tier === 'bronze' ? '🥉 Bronza' : ''

  return (
    <BentoCard accentClass="bg-gradient-to-r from-blue-500 to-indigo-500">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Umumiy ball
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-gray-900 dark:text-white leading-none">
              {score}
            </span>
            {tier && (
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">{tierLabel}</span>
            )}
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/25 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
        </div>
      </div>

      <div className="space-y-2">
        {[
          { label: 'Davomat',   value: snapshot.attendance_score,  color: '#22C55E' },
          { label: 'Testlar',   value: snapshot.test_score,        color: '#5B5CF6' },
          { label: 'Izchillik', value: snapshot.consistency_score, color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 w-14 flex-shrink-0 font-medium">
              {s.label}
            </span>
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: s.color }}
                initial={{ width: 0 }}
                animate={{ width: `${s.value}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
              />
            </div>
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 w-8 text-right flex-shrink-0">
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </BentoCard>
  )
}

// ─── Recent Tests Widget ──────────────────────────────────────────────────────

function RecentTestsWidget({ tests, loading }: { tests: SDTest[]; loading: boolean }) {
  const navigate = useNavigate()
  const recent   = tests.slice(0, 5)

  return (
    <BentoCard noPadding className="overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-400" aria-hidden="true" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">So&apos;nggi testlar</h2>
        </div>
        <button
          onClick={() => navigate(PATHS.STUDENT.TESTS)}
          className="text-xs font-semibold text-brand dark:text-brand-light hover:underline underline-offset-2 flex items-center gap-0.5"
        >
          Barchasi <ChevronRight className="w-3 h-3" aria-hidden="true" />
        </button>
      </div>

      {loading ? (
        <div className="p-5 space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-5">
          <FileText className="w-8 h-8 text-gray-200 dark:text-gray-700 mb-2" aria-hidden="true" />
          <p className="text-sm text-gray-400 dark:text-gray-500">Hali test topshirilmagan</p>
          <button
            onClick={() => navigate(PATHS.STUDENT.TESTS)}
            className="mt-3 text-sm text-brand dark:text-brand-light font-medium hover:underline"
          >
            Testlarga o&apos;tish
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {recent.map(test => {
            const pct    = test.total > 0 ? Math.round((test.score / test.total) * 100) : 0
            const passed = pct >= 60
            return (
              <div key={test.id} className="flex items-center gap-4 px-5 py-3.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 text-white"
                  style={{ background: passed ? '#22C55E' : '#EF4444' }}
                  aria-label={`${pct}% — ${passed ? "O'tdi" : "O'tmadi"}`}
                >
                  {pct}%
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {test.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    <span>{test.group_name}</span>
                    <span>·</span>
                    <span>{fmtDate(test.submitted_at)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {test.score}/{test.total}
                  </p>
                  <p className={cn('text-[11px] font-semibold', passed ? 'text-emerald-600' : 'text-red-500')}>
                    {passed ? "O'tdi" : "O'tmadi"}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </BentoCard>
  )
}

// ─── Quick Actions Widget ─────────────────────────────────────────────────────

function QuickActionsWidget({ language: _language }: { language: string }) {
  const navigate = useNavigate()

  const actions = [
    { label: 'Darslar',   icon: BookOpen,    path: PATHS.STUDENT.LESSONS,      color: '#5B5CF6' },
    { label: 'Davomat',   icon: CheckCircle, path: PATHS.STUDENT.ATTENDANCE,   color: '#22C55E' },
    { label: 'Testlar',   icon: FileText,    path: PATHS.STUDENT.TESTS,        color: '#F59E0B' },
    { label: 'Yutuqlar',  icon: Award,       path: PATHS.STUDENT.ACHIEVEMENTS, color: '#7C3AED' },
  ]

  return (
    <BentoCard>
      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">
        Tezkor o&apos;tish
      </p>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(a => (
          <button
            key={a.label}
            type="button"
            onClick={() => navigate(a.path)}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.08] border border-gray-100 dark:border-white/[0.05] transition-all duration-150 group"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${a.color}14` }}
            >
              <a.icon className="w-4 h-4" style={{ color: a.color }} aria-hidden="true" />
            </div>
            <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              {a.label}
            </span>
          </button>
        ))}
      </div>
    </BentoCard>
  )
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export default function StudentDashboardPage() {
  const auth             = useAuth()
  const { language }     = useLanguage()
  const [loading, setLoading] = useState(true)

  const [groups,       setGroups]       = useState<SDGroup[]>([])
  const [tests,        setTests]        = useState<SDTest[]>([])
  const [attStats,     setAttStats]     = useState<{
    present: number; absent: number; late: number; excused: number; total: number
  } | null>(null)
  const [achievements, setAchievements] = useState<EarnedAchievement[]>([])
  const [snapshots,    setSnapshots]    = useState<ScoreSnapshot[]>([])

  useEffect(() => {
    if (!auth.user?.id) return
    void load()
  }, [auth.user?.id])

  async function load() {
    if (!auth.user?.id) return
    setLoading(true)
    try {
      const { data: enrollments } = await supabase
        .from('student_groups')
        .select('group_id, enrolled_at')
        .eq('student_id', auth.user.id)
        .order('enrolled_at', { ascending: false })

      if (!enrollments?.length) { setLoading(false); return }

      const groupIds = enrollments.map(e => e.group_id)

      const [groupsRes, testRes, attRes, lessonsRes, achieveRes, snapshotRes] = await Promise.all([
        supabase.from('groups').select('id,name,status,teacher_id,subject:subjects(name,icon,color)').in('id', groupIds),
        supabase.from('test_results').select('id,test_id,score,total_questions,submitted_at,test:tests(title,group:groups(name))').eq('student_id', auth.user.id).not('submitted_at', 'is', null).order('submitted_at', { ascending: false }),
        supabase.from('attendance').select('status,group_id').eq('student_id', auth.user.id).in('group_id', groupIds),
        supabase.from('lessons').select('group_id').in('group_id', groupIds).eq('is_published', true),
        supabase.from('user_achievements').select('id,total_score,period_year,period_month,period_type,earned_at,group_id,achievement_definitions(code,name,description,tier,icon_emoji),groups(name)').eq('user_id', auth.user.id).order('earned_at', { ascending: false }).limit(20),
        supabase.from('user_score_snapshots').select('id,total_score,attendance_score,test_score,consistency_score,activity_score,period_year,period_month,group_id,groups(name)').eq('user_id', auth.user.id).eq('role', 'student').eq('period_type', 'monthly').order('period_year', { ascending: false }).order('period_month', { ascending: false }).limit(6),
      ])

      const teacherIds = [...new Set((groupsRes.data ?? []).map((g: any) => g.teacher_id).filter(Boolean))]
      const { data: teachersData } = teacherIds.length
        ? await supabase.from('profiles').select('id,full_name').in('id', teacherIds)
        : { data: [] }

      const groupMap   = new Map((groupsRes.data ?? []).map((g: any) => [g.id, g]))
      const teacherMap = new Map((teachersData ?? []).map((t: any) => [t.id, t]))
      const lessonCountMap = new Map<string, number>()
      for (const l of lessonsRes.data ?? []) { const gid = (l as any).group_id; lessonCountMap.set(gid, (lessonCountMap.get(gid) ?? 0) + 1) }
      const grpAttMap = new Map<string, { present: number; total: number }>()
      for (const a of attRes.data ?? []) {
        const gid = (a as any).group_id
        if (!grpAttMap.has(gid)) grpAttMap.set(gid, { present: 0, total: 0 })
        const entry = grpAttMap.get(gid)!
        entry.total++
        if ((a as any).status === 'present') entry.present++
      }

      setGroups(enrollments.map(e => {
        const g = groupMap.get(e.group_id)
        if (!g) return null
        const teacher = g.teacher_id ? teacherMap.get(g.teacher_id) : null
        const att     = grpAttMap.get(g.id) ?? { present: 0, total: 0 }
        return { id: g.id, name: g.name, status: g.status, subject: (g as any).subject ?? null, teacher_name: teacher?.full_name ?? null, lesson_count: lessonCountMap.get(g.id) ?? 0, enrolled_at: e.enrolled_at, att_present: att.present, att_total: att.total }
      }).filter(Boolean) as SDGroup[])

      setTests((testRes.data ?? []).map((r: any) => ({ id: r.id, test_id: r.test_id, title: r.test?.title ?? 'Test', group_name: r.test?.group?.name ?? '—', score: r.score, total: r.total_questions, submitted_at: r.submitted_at })))

      const attTotals = { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
      for (const a of attRes.data ?? []) {
        attTotals.total++
        const s = (a as any).status as 'present' | 'absent' | 'late' | 'excused'
        if (['present','absent','late','excused'].includes(s)) attTotals[s]++
      }
      setAttStats(attTotals)

      setAchievements((achieveRes.data ?? []).map((r: any) => ({ id: r.id, total_score: r.total_score, period_year: r.period_year, period_month: r.period_month, period_type: r.period_type, earned_at: r.earned_at, group_id: r.group_id, group_name: r.groups?.name ?? null, def: r.achievement_definitions ?? null })))
      setSnapshots((snapshotRes.data ?? []).map((r: any) => ({ id: r.id, total_score: r.total_score, attendance_score: r.attendance_score, test_score: r.test_score, consistency_score: r.consistency_score, activity_score: r.activity_score, period_year: r.period_year, period_month: r.period_month, group_name: r.groups?.name ?? null })))
    } catch (e) {
      console.error('[StudentDashboard] load error:', e)
    } finally {
      setLoading(false)
    }
  }

  // ── Computed values ──────────────────────────────────────────────────────────
  const totalTests  = tests.length
  const avgScore    = totalTests > 0
    ? Math.round(tests.reduce((a, r) => a + (r.total > 0 ? (r.score / r.total) * 100 : 0), 0) / totalTests)
    : 0
  const passedTests = tests.filter(r => r.total > 0 && r.score / r.total >= 0.6).length
  const attPct      = attStats && attStats.total > 0
    ? Math.round((attStats.present / attStats.total) * 100)
    : null
  const goldCount    = achievements.filter(a => a.def?.tier === 'gold').length
  const silverCount  = achievements.filter(a => a.def?.tier === 'silver').length
  const bronzeCount  = achievements.filter(a => a.def?.tier === 'bronze').length
  const latestSnap   = snapshots[0] ?? null
  const userName     = auth.user?.name ?? 'Talaba'

  // ── Bento Grid ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-6 max-w-[1400px]">
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={GRID_CONTAINER}
        initial="hidden"
        animate="show"
      >
        {/* Row 1: Welcome (2 cols) + Attendance (1 col) + Tests (1 col) */}
        <motion.div variants={GRID_ITEM} className="sm:col-span-2">
          <WelcomeWidget
            name={userName}
            groups={groups.length}
            attPct={attPct}
            passedTests={passedTests}
            totalTests={totalTests}
            loading={loading}
          />
        </motion.div>

        <motion.div variants={GRID_ITEM}>
          <AttendanceWidget attPct={attPct} loading={loading} />
        </motion.div>

        <motion.div variants={GRID_ITEM}>
          <TestsWidget
            avgScore={avgScore}
            passedTests={passedTests}
            totalTests={totalTests}
            loading={loading}
          />
        </motion.div>

        {/* Row 2: Courses (2 cols) + AI (1 col) + Achievements (1 col) */}
        <motion.div variants={GRID_ITEM} className="sm:col-span-2">
          <CoursesWidget groups={groups} loading={loading} />
        </motion.div>

        <motion.div variants={GRID_ITEM}>
          <AIWidget language={language} />
        </motion.div>

        <motion.div variants={GRID_ITEM}>
          <AchievementsWidget
            achievements={achievements}
            goldCount={goldCount}
            silverCount={silverCount}
            bronzeCount={bronzeCount}
            loading={loading}
          />
        </motion.div>

        {/* Row 3: Score progress (1 col) + Quick actions (1 col) + placeholder (2 cols) */}
        <motion.div variants={GRID_ITEM}>
          <ScoreWidget snapshot={latestSnap} loading={loading} />
        </motion.div>

        <motion.div variants={GRID_ITEM}>
          <QuickActionsWidget language={language} />
        </motion.div>

        <motion.div variants={GRID_ITEM} className="sm:col-span-2">
          <BentoCard className="h-full" accentClass="bg-gradient-to-r from-sky-400 to-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  Haftalik taraqqiyot
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Sprint 2.1 da qo&apos;shiladi
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-gray-300 dark:text-gray-600" aria-hidden="true" />
            </div>
            <ChartPlaceholder label="Haftalik taraqqiyot" height={100} sprint="2.1" />
          </BentoCard>
        </motion.div>

        {/* Row 4: Recent tests (full width) */}
        <motion.div variants={GRID_ITEM} className="sm:col-span-2 lg:col-span-4">
          <RecentTestsWidget tests={tests} loading={loading} />
        </motion.div>
      </motion.div>
    </div>
  )
}
