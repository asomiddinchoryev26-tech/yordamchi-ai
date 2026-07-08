/**
 * AITeacherPanel — Sprint 2.2
 * Premium AI Teacher Intelligence right panel.
 * All data derived from real StudentContext or intelligent mock generation.
 * No new backend calls.
 */

import { useState, useEffect, useRef } from 'react'
import {
  Zap, Flame, Trophy, Target, BookOpen, TrendingUp,
  Lightbulb, AlertTriangle, CheckCircle, Lock,
  ChevronRight, Sparkles, Star, Calendar,
} from 'lucide-react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ProgressRing } from '@/components/dashboard'
import { CtxSection }   from './CtxSection'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'
import type { StudentContext } from '@/services/ai-provider.service'

// ─── Ease constant ────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

// ─── Level definitions ────────────────────────────────────────────────────────

interface LevelDef {
  min: number; max: number
  labelKey: keyof Translations; emoji: string
  from: string; to: string   // CSS gradient colors
}

const LEVELS: LevelDef[] = [
  { min: 0,    max: 150,  labelKey: 'atpLvlBeginner', emoji: '🌱', from: '#10B981', to: '#059669' },
  { min: 150,  max: 400,  labelKey: 'atpLvlLearner',  emoji: '📚', from: '#3B82F6', to: '#2563EB' },
  { min: 400,  max: 750,  labelKey: 'atpLvlKnower',   emoji: '⭐', from: '#8B5CF6', to: '#7C3AED' },
  { min: 750,  max: 1200, labelKey: 'atpLvlMentor',   emoji: '🎓', from: '#F59E0B', to: '#D97706' },
  { min: 1200, max: 9999, labelKey: 'atpLvlExpert',   emoji: '🏆', from: '#EF4444', to: '#DC2626' },
]

function getLevel(xp: number) {
  return LEVELS.find(l => xp >= l.min && xp < l.max) ?? LEVELS[0]
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function CountUp({ to, suffix = '', duration = 1200 }: { to: number; suffix?: string; duration?: number }) {
  const ref      = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const [n, setN] = useState(0)
  const shouldReduce = useReducedMotion()

  useEffect(() => {
    if (!isInView || shouldReduce) { setN(to); return }
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setN(Math.round((1 - Math.pow(1 - p, 3)) * to))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [isInView, to, duration, shouldReduce])

  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>
}

// ─── Animated progress bar ────────────────────────────────────────────────────

function AnimBar({ value, color, delay = 0 }: { value: number; color: string; delay?: number }) {
  return (
    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(value, 2)}%` }}
        transition={{ duration: 1.2, ease: EASE, delay }}
      />
    </div>
  )
}

// ─── XP Computation ──────────────────────────────────────────────────────────

function computeXP(ctx: StudentContext | null): number {
  if (!ctx) return 0
  return Math.round(
    (ctx.attPct ?? 50) * 7 +
    (ctx.testStats?.passed  ?? 0) * 30 +
    (ctx.testStats?.avgPct  ?? 0) * 2 +
    (ctx.groups?.length     ?? 0) * 50,
  )
}

// ─── Streak computation ───────────────────────────────────────────────────────

function computeStreak(attPct: number | null): number {
  if (attPct === null) return 3
  if (attPct >= 95) return 21
  if (attPct >= 85) return 14
  if (attPct >= 75) return 10
  if (attPct >= 60) return 6
  return 3
}

// ─── AI Insight generation ────────────────────────────────────────────────────

function generateInsights(ctx: StudentContext | null, t: Translations): string[] {
  if (!ctx) return [t.atpInsLoading]
  const { testStats, attPct, groups } = ctx
  const insights: string[] = []

  if (testStats && testStats.avgPct < 60 && testStats.total > 0) {
    insights.push(t.atpInsTestLow.replace('{pct}', String(testStats.avgPct)))
  } else if (testStats && testStats.avgPct >= 80 && testStats.total > 0) {
    insights.push(t.atpInsTestHigh.replace('{pct}', String(testStats.avgPct)))
  } else if (testStats && testStats.total === 0) {
    insights.push(t.atpInsTestNone)
  }

  if (attPct !== null && attPct < 75) {
    insights.push(t.atpInsAttLow.replace('{pct}', String(attPct)))
  } else if (attPct !== null && attPct >= 90) {
    insights.push(t.atpInsAttHigh.replace('{pct}', String(attPct)))
  } else if (attPct !== null) {
    insights.push(t.atpInsAttMid.replace('{pct}', String(attPct)))
  }

  if (groups && groups.length > 0) {
    insights.push(t.atpInsSubject.replace('{subject}', groups[0].subjectName ?? groups[0].name))
  }

  const xp = computeXP(ctx)
  if (xp >= 500) {
    insights.push(t.atpInsXpHigh)
  } else if (xp >= 150) {
    insights.push(t.atpInsXpMid)
  } else {
    insights.push(t.atpInsXpLow)
  }

  return insights.slice(0, 4)
}

// ─── Weak Topics ──────────────────────────────────────────────────────────────

interface WeakTopic { topic: string; score: number; color: string }

function computeWeakTopics(ctx: StudentContext | null, t: Translations): WeakTopic[] {
  const avgPct = ctx?.testStats?.avgPct ?? 75
  if (avgPct >= 75) return []
  return [
    { topic: t.atpWeakDiscriminant, score: Math.max(20, avgPct - 28), color: '#EF4444' },
    { topic: t.atpWeakNegRoots,     score: Math.max(30, avgPct - 17), color: '#F59E0B' },
    { topic: t.atpWeakFuncVals,     score: Math.max(42, avgPct - 8),  color: '#F97316' },
  ].filter(w => w.score < 65)
}

// ─── Learning Path ────────────────────────────────────────────────────────────

interface PathItem { title: string; status: 'completed' | 'current' | 'upcoming' }

function computeLearningPath(ctx: StudentContext | null, t: Translations): PathItem[] {
  const lessons = ctx?.recentLessons ?? []
  return [
    ...(lessons.slice(0, 2).map(l => ({ title: l.title, status: 'completed' as const }))),
    { title: lessons[2]?.title ?? t.atpPathCurrent, status: 'current'   as const },
    { title: t.atpPathTopic3,                       status: 'upcoming'  as const },
    { title: t.atpPathTopic4,                       status: 'upcoming'  as const },
  ]
}

// ─── Achievements ─────────────────────────────────────────────────────────────

interface AchievementDef { emoji: string; name: string; desc: string; earned: boolean }

function computeAchievements(ctx: StudentContext | null, xp: number, t: Translations): AchievementDef[] {
  const attPct   = ctx?.attPct ?? 0
  const avgPct   = ctx?.testStats?.avgPct ?? 0
  const passed   = ctx?.testStats?.passed ?? 0
  return [
    { emoji: '💬', name: t.atpAch1Name, desc: t.atpAch1Desc, earned: true          },
    { emoji: '🔥', name: t.atpAch2Name, desc: t.atpAch2Desc, earned: computeStreak(attPct > 0 ? attPct : null) >= 7 },
    { emoji: '🏆', name: t.atpAch3Name, desc: t.atpAch3Desc, earned: avgPct >= 75  },
    { emoji: '✅', name: t.atpAch4Name, desc: t.atpAch4Desc, earned: attPct >= 90  },
    { emoji: '📚', name: t.atpAch5Name, desc: t.atpAch5Desc, earned: xp >= 500    },
    { emoji: '⭐', name: t.atpAch6Name, desc: t.atpAch6Desc, earned: avgPct >= 90  },
    { emoji: '🎯', name: t.atpAch7Name, desc: t.atpAch7Desc, earned: passed >= 5   },
    { emoji: '🚀', name: t.atpAch8Name, desc: t.atpAch8Desc, earned: (ctx?.groups?.length ?? 0) >= 1 },
  ]
}

// ─── Weekly Mission ───────────────────────────────────────────────────────────

function computeMission(ctx: StudentContext | null, t: Translations) {
  void (ctx?.attPct ?? 0) // attPct informs task state indirectly via xp
  const total  = ctx?.testStats?.total ?? 0
  const avgPct = ctx?.testStats?.avgPct ?? 0
  const groups = ctx?.groups?.length ?? 0
  const xp     = computeXP(ctx)
  return {
    title: t.atpMissionTitle,
    reward: t.atpMissionReward,
    tasks: [
      { label: t.atpMissionTask1, done: groups >= 1       },
      { label: t.atpMissionTask2, done: total >= 2        },
      { label: t.atpMissionTask3, done: true              },
      { label: t.atpMissionTask4, done: avgPct >= 80      },
      { label: t.atpMissionTask5, done: xp >= 50          },
    ],
  }
}

// ─── XP Level Widget ─────────────────────────────────────────────────────────

function XPLevelWidget({ xp, ctx: _ctx }: { xp: number; ctx: StudentContext | null }) {
  const { t }    = useLanguage()
  const level    = getLevel(xp)
  const xpInLvl  = xp - level.min
  const xpToNext = level.max - level.min
  const pct      = Math.round((xpInLvl / xpToNext) * 100)

  return (
    <div
      className="mx-3 my-3 rounded-2xl p-4 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${level.from}22 0%, ${level.to}15 100%)`, border: `1px solid ${level.from}30` }}
    >
      {/* Background glow */}
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl pointer-events-none" style={{ background: `${level.from}25` }} aria-hidden="true" />

      <div className="flex items-center gap-3 mb-3 relative z-10">
        <motion.div
          className="text-3xl select-none"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          aria-hidden="true"
        >
          {level.emoji}
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-none mb-1">
            {t.atpLevel}
          </p>
          <p className="text-[15px] font-black text-gray-900 dark:text-white leading-none truncate">
            {t[level.labelKey]}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[22px] font-black leading-none" style={{ color: level.from }}>
            <CountUp to={xp} />
          </p>
          <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">XP</p>
        </div>
      </div>

      {/* XP bar */}
      <div className="relative z-10">
        <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${level.from}, ${level.to})` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.4, ease: EASE, delay: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">
            <CountUp to={xpInLvl} /> XP
          </span>
          <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">
            {xpToNext} XP → {t.atpNextLevel}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Streak Widget ────────────────────────────────────────────────────────────

function StreakWidget({ streak }: { streak: number }) {
  const { t }    = useLanguage()
  const days     = [t.atpDayMon, t.atpDayTue, t.atpDayWed, t.atpDayThu, t.atpDayFri, t.atpDaySat, t.atpDaySun]
  const todayRaw = new Date().getDay() // 0=Sun
  const todayIdx = todayRaw === 0 ? 6 : todayRaw - 1 // Mo=0

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <motion.span
          className="text-3xl select-none"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          🔥
        </motion.span>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              <CountUp to={streak} />
            </span>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t.atpKun}</span>
          </div>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">{t.atpStreakActive}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" aria-hidden="true" />
            {t.atpTodayActive}
          </p>
        </div>
      </div>

      {/* Day dots */}
      <div className="grid grid-cols-7 gap-1" role="list" aria-label={t.atpWeeklyActivity}>
        {days.map((d, i) => {
          const daysAgo  = (todayIdx - i + 7) % 7
          const isActive = daysAgo < Math.min(streak, 7) && daysAgo >= 0
          const isToday  = i === todayIdx
          return (
            <div key={d} className="flex flex-col items-center gap-1" role="listitem">
              <motion.div
                className={cn(
                  'w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold transition-colors',
                  isActive
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                    : 'bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-gray-600',
                  isToday && isActive && 'ring-2 ring-amber-300 ring-offset-1',
                )}
                initial={isActive ? { scale: 0.7, opacity: 0 } : false}
                animate={isActive ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.3, delay: i * 0.05, ease: EASE }}
              >
                {isActive ? '✓' : ''}
              </motion.div>
              <span className={cn('text-[8px] font-semibold', isToday ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-600')}>
                {d}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Mastery Score Widget ─────────────────────────────────────────────────────

function MasteryWidget({ ctx }: { ctx: StudentContext | null }) {
  const { t }   = useLanguage()
  const attPct  = ctx?.attPct ?? 0
  const avgPct  = ctx?.testStats?.avgPct ?? 0
  const groups  = ctx?.groups?.length ?? 0
  // Weighted mastery: 40% attendance, 40% tests, 20% activity
  const mastery = Math.round(attPct * 0.4 + avgPct * 0.4 + Math.min(groups * 20, 20))
  const masteryColor = mastery >= 80 ? '#22C55E' : mastery >= 60 ? '#5B5CF6' : '#F59E0B'

  const bars = [
    { label: t.attendance,      value: attPct, color: '#22C55E' },
    { label: t.tests,           value: avgPct, color: '#5B5CF6' },
    { label: t.tdScoreActivity, value: Math.min(groups * 20, 100), color: '#F59E0B' },
  ]

  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0">
        <ProgressRing value={mastery} size={68} strokeWidth={6} color={masteryColor} label={t.atpMasteryOverall} animDelay={0.5} />
      </div>
      <div className="flex-1 space-y-2.5 min-w-0">
        {bars.map(b => (
          <div key={b.label}>
            <div className="flex justify-between text-[10px] font-medium mb-1">
              <span className="text-gray-500 dark:text-gray-400">{b.label}</span>
              <span className="font-bold" style={{ color: b.color }}>
                <CountUp to={b.value} suffix="%" />
              </span>
            </div>
            <AnimBar value={b.value} color={b.color} delay={0.4} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── AI Insights Widget ───────────────────────────────────────────────────────

function InsightItem({ text, index }: { text: string; index: number }) {
  const icons = ['💡', '📈', '🎯', '⚡']
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1, ease: EASE }}
      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.05]"
    >
      <span className="text-base leading-none flex-shrink-0 mt-0.5" aria-hidden="true">
        {icons[index % icons.length]}
      </span>
      <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">{text}</p>
    </motion.div>
  )
}

// ─── Learning Path Timeline ───────────────────────────────────────────────────

function LearningPathTimeline({ items, onPromptSelect }: {
  items: PathItem[]
  onPromptSelect: (text: string) => void
}) {
  const { t } = useLanguage()
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200 dark:bg-white/[0.08]" aria-hidden="true" />

      <div className="space-y-3">
        {items.map((item, i) => {
          const isDone     = item.status === 'completed'
          const isCurrent  = item.status === 'current'
          const isUpcoming = item.status === 'upcoming'
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.07, ease: EASE }}
              className="flex items-start gap-3"
            >
              {/* Status dot */}
              <div className={cn(
                'w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center z-10 mt-0.5 text-[10px] font-bold',
                isDone     && 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30',
                isCurrent  && 'bg-brand text-white shadow-sm shadow-brand/30 ring-2 ring-brand/30 ring-offset-1 dark:ring-offset-gray-900',
                isUpcoming && 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500',
              )}>
                {isDone && '✓'}
                {isCurrent && '▶'}
                {isUpcoming && <Lock className="w-2.5 h-2.5" aria-hidden="true" />}
              </div>

              {/* Content */}
              <button
                type="button"
                disabled={isUpcoming}
                onClick={() => isCurrent && onPromptSelect(t.atpPromptPath.replace('{topic}', item.title))}
                className={cn(
                  'flex-1 min-w-0 text-left p-2 rounded-xl transition-all duration-150 text-[11px] font-medium leading-snug',
                  isDone    && 'text-gray-500 dark:text-gray-400',
                  isCurrent && 'text-brand dark:text-brand-light bg-brand/8 dark:bg-brand/12 border border-brand/20 hover:bg-brand/12 cursor-pointer',
                  isUpcoming && 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60',
                )}
              >
                <span className="line-clamp-2">{item.title}</span>
                {isDone && (
                  <span className="text-[9px] text-emerald-500 font-semibold block mt-0.5">{t.atpDone} ✓</span>
                )}
                {isCurrent && (
                  <span className="text-[9px] text-brand dark:text-brand-light font-semibold block mt-0.5">{t.atpInProgress} ▶</span>
                )}
              </button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Achievement Badge ────────────────────────────────────────────────────────

function AchievementBadge({ emoji, name, earned, desc }: AchievementDef) {
  return (
    <motion.div
      whileHover={earned ? { scale: 1.12, y: -2 } : {}}
      transition={{ duration: 0.15 }}
      title={earned ? `✓ ${desc}` : `🔒 ${desc}`}
      className={cn('flex flex-col items-center gap-1 cursor-default', !earned && 'opacity-35 grayscale')}
    >
      <div className={cn(
        'w-10 h-10 rounded-2xl flex items-center justify-center text-xl',
        earned
          ? 'bg-gradient-to-br from-amber-400/20 to-orange-400/20 border border-amber-300/50 dark:border-amber-600/30 shadow-sm'
          : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
      )}>
        {emoji}
      </div>
      <p className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 text-center leading-tight w-[46px]">
        {name}
      </p>
    </motion.div>
  )
}

// ─── Weekly Mission ───────────────────────────────────────────────────────────

function WeeklyMission({ ctx }: { ctx: StudentContext | null }) {
  const { t }   = useLanguage()
  const mission = computeMission(ctx, t)
  const done    = mission.tasks.filter(task => task.done).length
  const total   = mission.tasks.length
  const pct     = Math.round((done / total) * 100)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
          {done}/{total} {t.atpMissionDoneSuffix}
        </span>
        <span className="text-[10px] font-bold text-brand dark:text-brand-light bg-brand/10 dark:bg-brand/15 px-2 py-0.5 rounded-md">
          {mission.reward}
        </span>
      </div>

      {/* Mission progress bar */}
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #5B5CF6, #7C3AED)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
        />
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {mission.tasks.map((task, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.06, ease: EASE }}
            className={cn(
              'flex items-center gap-2 text-[11px] font-medium',
              task.done ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300',
            )}
          >
            <div className={cn(
              'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[8px]',
              task.done
                ? 'bg-emerald-500 text-white'
                : 'border-2 border-gray-300 dark:border-gray-600',
            )}>
              {task.done && '✓'}
            </div>
            {task.label}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Main AI Teacher Panel ────────────────────────────────────────────────────

interface AITeacherPanelProps {
  context:        StudentContext | null
  onPromptSelect: (text: string) => void
}

export function AITeacherPanel({ context, onPromptSelect }: AITeacherPanelProps) {
  const { t }        = useLanguage()
  const xp           = computeXP(context)
  const streak       = computeStreak(context?.attPct ?? null)
  const insights     = generateInsights(context, t)
  const weakTopics   = computeWeakTopics(context, t)
  const pathItems    = computeLearningPath(context, t)
  const achievements = computeAchievements(context, xp, t)
  const earnedCount  = achievements.filter(a => a.earned).length

  return (
    <aside
      className="flex-shrink-0 flex flex-col bg-white dark:bg-[#0F172A] border-l border-gray-100 dark:border-white/[0.06] overflow-hidden"
      style={{ width: 272 }}
      aria-label={t.atpPanelAria}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-gray-100 dark:border-white/[0.06] flex-shrink-0">
        <motion.span
          className="text-lg select-none"
          animate={{ rotate: [-8, 8, -8] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          🧑‍🏫
        </motion.span>
        <h2 className="text-[13px] font-black text-gray-900 dark:text-white flex-1 tracking-tight">
          {t.atpTitle}
        </h2>
        <Sparkles className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* 1. XP Level — always visible at top, no section wrapper */}
        <XPLevelWidget xp={xp} ctx={context} />

        {/* Divider */}
        <div className="h-px bg-gray-100 dark:bg-white/[0.05] mx-3" />

        {/* 2. Daily Streak */}
        <CtxSection icon={Flame} title={t.atpStreakTitle} defaultOpen>
          <StreakWidget streak={streak} />
        </CtxSection>

        {/* 3. AI Insights */}
        <CtxSection icon={Lightbulb} title={t.atpInsightsTitle} defaultOpen badge={t.atpNewBadge}>
          <div className="space-y-2">
            {insights.map((text, i) => (
              <InsightItem key={i} text={text} index={i} />
            ))}
          </div>
        </CtxSection>

        {/* 4. Mastery Score */}
        <CtxSection icon={TrendingUp} title={t.atpMasteryTitle} defaultOpen>
          <MasteryWidget ctx={context} />
        </CtxSection>

        {/* 5. Weak Topics — only shown when struggling */}
        {weakTopics.length > 0 && (
          <CtxSection icon={AlertTriangle} title={t.atpWeakTitle} defaultOpen>
            <div className="space-y-2">
              {weakTopics.map((wt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onPromptSelect(t.atpPromptWeak.replace('{topic}', wt.topic))}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/15 border border-red-100 dark:border-red-900/25 bg-red-50/50 dark:bg-red-900/10 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-red-700 dark:text-red-400 truncate">{wt.topic}</span>
                    <span className="text-[10px] font-bold ml-2 flex-shrink-0" style={{ color: wt.color }}>{wt.score}%</span>
                  </div>
                  <AnimBar value={wt.score} color={wt.color} />
                  <p className="text-[9px] text-red-500 dark:text-red-400 mt-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-2.5 h-2.5" aria-hidden="true" /> {t.atpWeakPractice}
                  </p>
                </button>
              ))}
            </div>
          </CtxSection>
        )}

        {/* 6. Learning Path */}
        <CtxSection icon={BookOpen} title={t.atpPathTitle}>
          <LearningPathTimeline items={pathItems} onPromptSelect={onPromptSelect} />
        </CtxSection>

        {/* 7. Today's Goal */}
        <CtxSection icon={Target} title={t.atpGoalTitle} defaultOpen>
          <div className="p-3 rounded-xl bg-brand/6 dark:bg-brand/10 border border-brand/15 dark:border-brand/20">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-brand dark:text-brand-light flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-[12px] font-semibold text-brand dark:text-brand-light leading-snug">
                  {context?.groups?.[0]?.subjectName ?? context?.groups?.[0]?.name ?? t.atpGoalStudy}
                  {' '}{t.atpGoalHourSuffix}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                  {t.atpGoalReview}
                </p>
              </div>
            </div>
          </div>

          {/* Quick prompts for today */}
          <div className="space-y-1.5 mt-1">
            {[
              context?.groups?.[0]
                ? t.atpPromptSubject.replace('{subject}', context.groups[0].subjectName ?? context.groups[0].name)
                : t.atpPromptToday,
              t.atpPromptExam,
              t.atpPromptWeakImprove,
            ].map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onPromptSelect(p)}
                className="w-full text-left text-[11px] text-gray-500 dark:text-gray-400 hover:text-brand dark:hover:text-brand-light p-2 rounded-xl hover:bg-brand/5 dark:hover:bg-brand/8 transition-all duration-150 flex items-center gap-2 group"
              >
                <Zap className="w-3 h-3 text-brand/40 group-hover:text-brand flex-shrink-0 transition-colors" aria-hidden="true" />
                <span className="truncate">{p}</span>
              </button>
            ))}
          </div>
        </CtxSection>

        {/* 8. Achievement Badges */}
        <CtxSection icon={Trophy} title={t.atpAchTitle} badge={`${earnedCount}/${achievements.length}`}>
          <div className="grid grid-cols-4 gap-2">
            {achievements.map((a, i) => (
              <AchievementBadge key={i} {...a} />
            ))}
          </div>
          <p className="text-[9px] text-gray-400 dark:text-gray-600 text-center mt-1">
            {achievements.length - earnedCount} {t.atpAchLockedSuffix}
          </p>
        </CtxSection>

        {/* 9. Weekly Mission */}
        <CtxSection icon={Star} title={t.atpMissionTitle} defaultOpen>
          <WeeklyMission ctx={context} />
        </CtxSection>

        {/* 10. Next Level Teaser */}
        <CtxSection icon={Calendar} title={t.atpNextTitle}>
          <div className="text-center py-2">
            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
              {t.atpNextDesc}
            </p>
          </div>
        </CtxSection>

      </div>
    </aside>
  )
}
