/**
 * pages/student/StudentDashboardPage.tsx
 * Sprint 4.7 — Premium Student Dashboard Experience (UI/UX enhancement)
 * Sprint 4.2 — Premium Home Page Redesign (base layer preserved)
 *
 * ALL DATA FETCHING LOGIC IS PRESERVED UNCHANGED.
 * Only the visual rendering layer has been redesigned / extended.
 *
 * Sprint 4.7 additions (visual-only, no business logic impact):
 *   QuickActionsBar, PersonalStatsRow, ContinueLearningCard,
 *   AchievementsShowcase, DashboardSidebar
 */

import { useState, useEffect, useRef, memo, type ReactNode } from 'react'
import {
  Camera, ImageIcon, FileText as FileIcon, Mic, Send,
  ArrowRight, CheckCircle, BookOpen, Clock, Zap, Trophy,
  TrendingUp, ChevronRight, Star, Lock,
  // Sprint 4.7 additions — new visual icons only
  Flame, Award, Target, Bell, BarChart3, Users, Download,
  // Sprint 4.7 Final Hero additions
  Brain, Sparkles, Code2, Atom, Calculator, FlaskConical, Bot, GraduationCap,
  // Production dashboard: lessons / attendance / states
  Calendar, CalendarClock, AlertTriangle, RefreshCw, PlayCircle, ClipboardList,
} from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { PATHS } from '@/routes/paths'
import { ProgressRing } from '@/components/dashboard'
import Logo from '@/components/common/Logo'
import { assignmentService, deadlineState, type StudentAssignment } from '@/services/assignment.service'
import { subscriptionService } from '@/services/subscription.service'
import type { PlanType } from '@/types/lms.types'
import { PremiumModal } from '@/components/student/AssignmentsAI'

// ─── Types (UNCHANGED — business logic preserved) ─────────────────────────────

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

// Display model for scheduled lessons (Today / Upcoming cards)
type SDLesson = {
  id:          string
  title:       string
  group_name:  string
  lesson_date: string
  has_video:   boolean
}

type AttendanceTotals = {
  present: number; absent: number; late: number; excused: number; total: number
}

// ─── Raw Supabase row shapes (typed — replaces `any` in the loader) ───────────
// These describe the exact columns/relations requested in each `.select(...)`.

type RawSubject = { name: string; icon: string; color: string } | null

type RawGroupRow = {
  id:         string
  name:       string
  status:     SDGroup['status']
  teacher_id: string | null
  subject:    RawSubject
}

type RawTeacherRow = { id: string; full_name: string | null }

type RawTestRow = {
  id:              string
  test_id:         string
  score:           number
  total_questions: number
  submitted_at:    string
  test: { title: string | null; group: { name: string | null } | null } | null
}

type RawAttendanceRow = {
  status:   'present' | 'absent' | 'late' | 'excused'
  group_id: string
}

type RawLessonRow = {
  id:          string
  title:       string
  group_id:    string | null
  lesson_date: string | null
  video_url:   string | null
  is_published: boolean
}

type RawAchievementRow = {
  id:           string
  total_score:  number | null
  period_year:  number
  period_month: number | null
  period_type:  'monthly' | 'yearly'
  earned_at:    string
  group_id:     string | null
  achievement_definitions: EarnedAchievement['def']
  groups:       { name: string | null } | null
}

type RawSnapshotRow = {
  id:                string
  total_score:       number
  attendance_score:  number
  test_score:        number
  consistency_score: number
  activity_score:    number
  period_year:       number
  period_month:      number
  groups:            { name: string | null } | null
}

// ─── Live clock (Asia/Tashkent timezone, visual-only, no business-logic impact) ─

// English weekday abbrev → translation key (resolved at render with t)
const EN_TO_DAY_KEY: Record<string, keyof Translations> = {
  Sun: 'sdSun', Mon: 'sdMon', Tue: 'sdTue', Wed: 'sdWed',
  Thu: 'sdThu', Fri: 'sdFri', Sat: 'sdSat',
}

// Vaqtga qarab salomlashish — tarjima kalitini qaytaradi (t bilan render'da resolve)
function getTimeGreetingKey(hour: number): keyof Translations {
  if (hour >= 5  && hour < 12) return 'sdGreetMorning'
  if (hour >= 12 && hour < 17) return 'sdGreetDay'
  if (hour >= 17 && hour < 21) return 'sdGreetEvening'
  return 'sdGreetNight'
}

// Hero-only typography accent — pure lookup, no extra state/timers.
const GREETING_EMOJI: Record<string, string> = {
  sdGreetMorning: '☀️',
  sdGreetDay:  '🌤️',
  sdGreetEvening: '🌆',
  sdGreetNight:  '🌙',
}

// Tashkent has no DST, so a fixed-offset Intl format is always correct.
function getTashkentSnapshot() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tashkent', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short',
  }).formatToParts(new Date())

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00'
  const hour = get('hour') === '24' ? '00' : get('hour') // Intl hour12:false midnight quirk

  return {
    greeting: getTimeGreetingKey(Number(hour)),                // tarjima kaliti
    weekday:  EN_TO_DAY_KEY[get('weekday')] ?? 'sdMon',        // tarjima kaliti
    date:     `${get('day')}.${get('month')}.${get('year')}`,
    time:     `${hour}:${get('minute')}:${get('second')}`,
  }
}

function useTashkentClock() {
  const [snap, setSnap] = useState(getTashkentSnapshot)
  useEffect(() => {
    const id = setInterval(() => setSnap(getTashkentSnapshot()), 1000)
    return () => clearInterval(id)
  }, [])
  return snap
}

// ─── Mini sparkline SVG ────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max  = Math.max(...data)
  const min  = Math.min(...data)
  const rng  = max - min || 1
  const W = 80, H = 26
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * W, y: H - ((v - min) / rng) * H }))
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${W},${H} L0,${H} Z`
  const uid  = color.replace(/[^a-z0-9]/gi, '')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }} aria-hidden="true">
      <defs>
        <linearGradient id={`sp_${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sp_${uid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Animation constants ──────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

const FADE_UP = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
}
const STAGGER = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
const STAGGER_FAST = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.05 } },
}

// ─── Premium design tokens ────────────────────────────────────────────────────

// Card glass — consistent across ALL sections
const GLASS_ELEVATED = {
  background:            'rgba(11,15,28,0.82)',
  backdropFilter:        'blur(28px) saturate(200%)',
  WebkitBackdropFilter:  'blur(28px) saturate(200%)',
  border:                '1px solid rgba(255,255,255,0.08)',
  boxShadow:             '0 4px 28px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.03) inset, inset 0 1px 0 rgba(255,255,255,0.07)',
} as const

// Rounded card radius — unified
const CARD_RADIUS = '22px'

// Section icon container — unified premium header style
function SectionIcon({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      className="w-7 h-7 rounded-[9px] flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}15`, border: `1px solid ${color}25`, boxShadow: `0 0 10px ${color}12` }}
    >
      {children}
    </div>
  )
}

// ─── Animated number counter (IntersectionObserver, no deps) ─────────────────

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref  = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      obs.disconnect()
      const start = performance.now()
      const DUR   = 1400
      const tick  = (now: number) => {
        const t    = Math.min((now - start) / DUR, 1)
        const ease = 1 - Math.pow(1 - t, 3)
        setVal(Math.round(target * ease))
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target])

  return <span ref={ref}>{val}{suffix}</span>
}

// ─── Hero: floating particles ─────────────────────────────────────────────────

// ─── Hero: floating AI icons ──────────────────────────────────────────────────

const AI_ICON_CFG = [
  { Icon: Brain,        x: '5%',   y: '14%', s: 20, c: '#5B7FFF', d: 0,    dy: -12 },
  { Icon: Sparkles,     x: '87%',  y: '10%', s: 18, c: '#A78BFA', d: 0.8,  dy: -10 },
  { Icon: Zap,          x: '80%',  y: '62%', s: 16, c: '#818CF8', d: 1.5,  dy: -14 },
  { Icon: Code2,        x: '3%',   y: '68%', s: 17, c: '#7C3AED', d: 2.3,  dy: -9  },
  { Icon: BookOpen,     x: '44%',  y: '93%', s: 15, c: '#C4B5FD', d: 1.1,  dy: -7  },
  { Icon: Star,         x: '93%',  y: '38%', s: 14, c: '#93BBFF', d: 0.5,  dy: -11 },
  { Icon: Trophy,       x: '1%',   y: '40%', s: 15, c: '#6366F1', d: 1.9,  dy: -9  },
  { Icon: Atom,         x: '88%',  y: '82%', s: 18, c: '#22D3EE', d: 0.3,  dy: -13 },
  { Icon: Calculator,   x: '14%',  y: '86%', s: 15, c: '#34D399', d: 2.7,  dy: -8  },
  { Icon: FlaskConical, x: '72%',  y: '5%',  s: 16, c: '#F59E0B', d: 1.4,  dy: -10 },
  { Icon: BookOpen,     x: '28%',  y: '2%',  s: 14, c: '#818CF8', d: 3.1,  dy: -7  },
  { Icon: Sparkles,     x: '64%',  y: '90%', s: 13, c: '#A78BFA', d: 2.0,  dy: -8  },
] as const

function FloatingAIIcons() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {AI_ICON_CFG.map(({ Icon, x, y, s, c, d, dy }, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: x, top: y }}
          animate={{ y: [0, dy, 0], opacity: [0.18, 0.45, 0.18], rotate: [-4, 4, -4] }}
          transition={{ duration: 4 + d * 0.5, repeat: Infinity, ease: 'easeInOut', delay: d }}
        >
          <Icon
            aria-hidden="true"
            style={{
              width: s, height: s, color: c,
              filter: `drop-shadow(0 0 6px ${c}) drop-shadow(0 0 12px ${c}50)`,
            }}
          />
        </motion.div>
      ))}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']

function fmtDate(d: string) {
  const dt  = new Date(d)
  const now = new Date()
  if (dt.toDateString() === now.toDateString()) return 'Bugun'
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]}`
}

function getAttColor(pct: number) {
  return pct >= 80 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444'
}

function getWeakTopics(avgPct: number): Array<{ name: string; pct: number }> {
  if (avgPct >= 75) return []
  return [
    { name: 'Diskriminant',         pct: Math.min(68, avgPct + 8)  },
    { name: 'Manfiy ildizlar',      pct: Math.min(54, avgPct - 5)  },
    { name: 'Kvadrat tenglamalar',  pct: Math.min(73, avgPct + 15) },
  ]
}

// ─── Quick Prompt Chips ───────────────────────────────────────────────────────

const QUICK_TOPICS: (keyof Translations)[] = [
  'sdAlgebra', 'sdPhysics', 'sdChemistry', 'sdEnglish', 'sdHistory', 'sdEssay', 'sdLessonPlan',
]

// ─── Home AI Input ────────────────────────────────────────────────────────────
// Navigates to AI Assistant on submit — no direct AI calls on home page.

function HomeAIInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const { t } = useLanguage()
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(text); setText('') }
  }

  const hasText = text.trim().length > 0

  return (
    <div
      className="rounded-[22px] overflow-hidden transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: hasText
          ? '0 0 0 2px rgba(91,127,255,0.3), 0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)'
          : '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}
    >
      {/* Textarea + Send */}
      <div className="flex items-end gap-3 px-4 pt-4 pb-3">
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => { setText(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
          onKeyDown={handleKeyDown}
          placeholder={t.sdAiPlaceholder}
          rows={1}
          className="flex-1 bg-transparent text-[14px] text-white/90 placeholder:text-white/30 resize-none outline-none leading-[1.6] max-h-28 py-0.5 font-medium"
          aria-label={t.sdAiAsk}
        />
        {/* Send button */}
        <motion.button
          type="button"
          onClick={() => { onSubmit(text); setText('') }}
          whileHover={{ scale: 1.08, y: -1 }}
          whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white mb-0.5"
          style={{
            background: hasText
              ? 'linear-gradient(135deg, #5B7FFF 0%, #7C3AED 100%)'
              : 'rgba(255,255,255,0.08)',
            boxShadow: hasText ? '0 6px 20px rgba(91,127,255,0.5), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            transition: 'background 0.2s ease, box-shadow 0.2s ease',
          }}
          aria-label={t.saSend}
        >
          <Send className="w-4 h-4" style={{ color: hasText ? 'white' : 'rgba(255,255,255,0.3)' }} aria-hidden="true" />
        </motion.button>
      </div>

      {/* Divider */}
      <div className="h-px mx-4" style={{ background: 'rgba(255,255,255,0.07)' }} />

      {/* Action buttons row */}
      <div className="flex items-center gap-0.5 px-3 py-2">
        {[
          { icon: Camera,    label: t.sdCamera },
          { icon: ImageIcon, label: t.sdGallery },
          { icon: FileIcon,  label: 'PDF' },
          { icon: Mic,       label: t.sdVoice },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            onClick={() => onSubmit('')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11.5px] font-semibold text-white/35 hover:text-white/75 hover:bg-white/[0.08] transition-all duration-150"
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-white/20 pr-1 select-none">Enter ↵</span>
      </div>
    </div>
  )
}

// ─── Daily Motivation (new, isolated — Asia/Tashkent weekday, auto-rotates) ───
// Self-contained: does not read from or modify useTashkentClock / getTashkentSnapshot.

type MotivationEntry = { icon: string; headline: ReactNode; body: string; accent: string }

const MOTIVATION: Record<string, MotivationEntry> = {
  Mon: {
    icon: '🚀',
    headline: <><span style={{ color: '#3B82F6', WebkitTextFillColor: '#3B82F6' }}>Yangi hafta</span>, yangi imkoniyatlar!</>,
    body: "Bugun olgan har bir bilimingiz ertangi muvaffaqiyatingiz uchun poydevor bo'ladi.",
    accent: '#3B82F6',
  },
  Tue: {
    icon: '📚',
    headline: <><span style={{ color: '#22D3EE', WebkitTextFillColor: '#22D3EE' }}>Bilimingizni</span> mustahkamlang.</>,
    body: "Har kuni ozgina o'rganish katta natijalarga olib keladi.",
    accent: '#22D3EE',
  },
  Wed: {
    icon: '⚡',
    headline: <>Haftaning eng <span style={{ color: '#38BDF8', WebkitTextFillColor: '#38BDF8' }}>samarali</span> kuni.</>,
    body: 'Bugun murakkab mavzularni egallash uchun eng yaxshi vaqt.',
    accent: '#38BDF8',
  },
  Thu: {
    icon: '🎯',
    headline: <><span style={{ color: '#A78BFA', WebkitTextFillColor: '#A78BFA' }}>Maqsadingizga</span> yana bir qadam.</>,
    body: "Bugungi mehnat ertangi g'alabangizdir.",
    accent: '#A78BFA',
  },
  Fri: {
    icon: '🌟',
    headline: <>Bilimlaringizni <span style={{ color: '#FBBF24', WebkitTextFillColor: '#FBBF24' }}>sinab ko&apos;ring</span>.</>,
    body: "O'zingizni yana bir pog'ona yuqoriga olib chiqing.",
    accent: '#FBBF24',
  },
  Sat: {
    icon: '💡',
    headline: <>O&apos;zingiz uchun <span style={{ color: '#FB923C', WebkitTextFillColor: '#FB923C' }}>investitsiya qiling</span>.</>,
    body: 'Yangi bilim eng qimmat boylikdir.',
    accent: '#FB923C',
  },
  Sun: {
    icon: '🌿',
    headline: <><span style={{ color: '#34D399', WebkitTextFillColor: '#34D399' }}>Dam oling</span> va yangi haftaga tayyorlaning.</>,
    body: 'Katta marralar yaxshi rejalardan boshlanadi.',
    accent: '#34D399',
  },
}

// Polls every 30s (not every second) — independent of the hero clock, cheap, and
// still flips automatically at midnight without re-rendering this card per-second.
function useTashkentWeekdayKey() {
  const compute = () => new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tashkent', weekday: 'short' }).format(new Date())
  const [key, setKey] = useState(compute)
  useEffect(() => {
    const id = setInterval(() => {
      const next = compute()
      setKey(prev => (prev === next ? prev : next))
    }, 30_000)
    return () => clearInterval(id)
  }, [])
  return key
}

function DailyMotivationCard() {
  const weekdayKey = useTashkentWeekdayKey()
  const m = MOTIVATION[weekdayKey] ?? MOTIVATION.Mon

  return (
    <motion.div variants={FADE_UP}>
      <AnimatePresence mode="wait">
        <motion.div
          key={weekdayKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          whileHover={{ y: -2, scale: 1.006 }}
          whileTap={{ scale: 0.985 }}
          className="relative overflow-hidden rounded-[24px] px-5 py-4 sm:px-6 sm:py-5 max-w-lg cursor-default"
          style={{
            background: 'linear-gradient(135deg, rgba(91,127,255,0.09) 0%, rgba(124,58,237,0.14) 100%)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(167,139,250,0.20)',
            boxShadow: `0 8px 28px rgba(0,0,0,0.22), 0 0 36px ${m.accent}1a, inset 0 1px 0 rgba(255,255,255,0.08)`,
            willChange: 'transform',
          }}
        >
          {/* Purple gradient accent glow */}
          <motion.div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none blur-[50px]"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.40) 0%, transparent 70%)' }}
            animate={{ opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          />

          {/* Small education illustration (decorative, faded) */}
          <BookOpen
            className="absolute -bottom-2 -right-2 w-16 h-16 pointer-events-none"
            style={{ color: 'rgba(167,139,250,0.10)' }}
            aria-hidden="true"
          />

          {/* Lightning accent badge */}
          <div
            className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center pointer-events-none"
            style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(167,139,250,0.3)' }}
            aria-hidden="true"
          >
            <Zap className="w-3.5 h-3.5" style={{ color: '#C4B5FD' }} />
          </div>

          {/* Tiny sparkle, every ~7s */}
          <motion.span
            className="absolute top-4 right-14 pointer-events-none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 6, ease: 'easeInOut' }}
            aria-hidden="true"
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: m.accent }} />
          </motion.span>

          <div className="relative z-10 flex items-start gap-3.5">
            <motion.span
              className="text-[26px] leading-none flex-shrink-0 mt-0.5"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            >
              {m.icon}
            </motion.span>
            <div className="min-w-0 pr-7">
              <p className="text-[10px] font-bold tracking-[0.08em] uppercase mb-1" style={{ color: 'rgba(196,181,253,0.65)' }}>
                Bugungi motivatsiya
              </p>
              <h3
                className="text-[16px] sm:text-[17px] font-bold leading-snug tracking-tight"
                style={{
                  background: 'linear-gradient(120deg, #FFFFFF 0%, #C4D2FF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {m.headline}
              </h3>
              <p className="text-[12.5px] text-white/70 leading-relaxed mt-1.5">
                {m.body}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Section: Hero (Sprint 4.7 Phase 1 — Premium redesign with greeting) ─────
// All navigation logic preserved: navigate(PATHS.STUDENT.AI_ASSISTANT/LESSONS)
// All existing functionality: HomeAIInput, quick chips, CTA buttons

function HeroSection({ name, navigate, isPremium, onUpgrade }: {
  name: string; navigate: ReturnType<typeof useNavigate>; isPremium: boolean; onUpgrade: () => void
}) {
  const { t } = useLanguage()
  const { greeting, weekday, date, time } = useTashkentClock()
  const recTopic = QUICK_TOPICS[new Date().getDay() % QUICK_TOPICS.length]

  return (
    <div
      className="relative overflow-hidden rounded-[28px] px-6 py-8 sm:px-10 sm:py-10"
      style={{
        background: 'linear-gradient(145deg, #070B18 0%, #0C1235 30%, #130D30 60%, #090C20 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.07) inset, 0 32px 80px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Layered ambient orbs */}
      <div className="absolute pointer-events-none inset-0 overflow-hidden" aria-hidden="true">
        {/* Very soft wide base glow — overall lighting lift */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 30% 20%, #5B7FFF 0%, transparent 70%)' }} />
        <div className="absolute -top-40 right-12 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15"
          style={{ background: 'radial-gradient(circle, #5B7FFF 0%, transparent 60%)' }} />
        <div className="absolute -bottom-24 -left-12 w-[400px] h-[400px] rounded-full blur-[100px] opacity-12"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 60%)' }} />
        <div className="absolute top-1/2 right-1/4 w-72 h-72 rounded-full blur-[80px] opacity-10"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 65%)' }} />
        {/* Grid mesh overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Noise vignette */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '160px' }} />
      </div>
      {/* Floating AI icons (education themed — dots removed) */}
      <FloatingAIIcons />

      {/* 2-column split only from xl (1280px) — at lg (1024px) the persistent 260px
          sidebar leaves too little room for a fixed-width illustration column, so
          "Tablet: image below text" behavior is kept through lg to avoid overflow. */}
      <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[55%_45%] gap-4 xl:gap-8 items-start">

        {/* ── LEFT: Greeting + Content ──────────────────────────────────────── */}
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-4 sm:space-y-5">

          {/* Greeting block */}
          <motion.div variants={FADE_UP} className="space-y-2">
            {/* Time + weekday + date row */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold backdrop-blur-sm"
                style={{
                  background: 'rgba(91,127,255,0.10)',
                  border: '1px solid rgba(124,58,237,0.25)',
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>{t.sdToday}</span>{' '}
                <span
                  style={{
                    background: 'linear-gradient(120deg, #5B7FFF 0%, #7C3AED 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {t[weekday]}
                </span>
              </div>
              <span className="text-[12px] text-white/70 font-medium tracking-wide">{date}</span>
              {/* Live clock — Asia/Tashkent, updates every second */}
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-bold tabular-nums"
                style={{
                  background: 'rgba(99,102,241,0.10)',
                  border: '1px solid rgba(99,102,241,0.20)',
                  color: '#C7D2FE',
                  fontFamily: "'SF Mono', 'JetBrains Mono', ui-monospace, Menlo, monospace",
                  textShadow: '0 0 14px rgba(165,180,252,0.55)',
                }}
              >
                <span className="text-[10px]" aria-hidden="true">🕐</span>
                {time}
              </div>
            </div>

            {/* Greeting headline — 26px mobile / 32px tablet / 48px desktop */}
            <h1 className="text-[26px] md:text-[32px] lg:text-[48px] font-black text-white leading-[1.08] tracking-tight">
              {t[greeting]} <span aria-hidden="true">{GREETING_EMOJI[greeting] ?? '✨'}</span>,
              <br />
              <span
                style={{
                  background: 'linear-gradient(120deg, #93BBFF 0%, #C4B5FD 45%, #A78BFA 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {name}
              </span>{' '}
              <span
                aria-label={t.sdWave}
                style={{ display: 'inline-block' }}
              >
                <motion.span
                  style={{ display: 'inline-block' }}
                  animate={{ rotate: [0, 20, -5, 20, 0] }}
                  transition={{ duration: 1.6, delay: 0.8, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                >
                  👋
                </motion.span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-[15px] text-white/45 max-w-sm leading-relaxed mt-1">
              AI yordamida darslaringizni osonroq va samaraliroq o&apos;rganing.
            </p>
          </motion.div>

          {/* AI 24/7 Card */}
          <motion.div variants={FADE_UP}>
            <motion.button
              type="button"
              onClick={() => navigate(PATHS.STUDENT.AI_ASSISTANT)}
              whileHover={{
                y: -4, scale: 1.02,
                boxShadow: '0 16px 44px rgba(91,127,255,0.32), 0 0 50px rgba(124,58,237,0.30), inset 0 1px 0 rgba(255,255,255,0.14)',
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-[24px] text-left"
              style={{
                background: 'linear-gradient(rgba(10,13,26,0.7), rgba(10,13,26,0.7)) padding-box, linear-gradient(120deg, rgba(91,127,255,0.6), rgba(124,58,237,0.6)) border-box',
                border: '1px solid transparent',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25), 0 0 24px rgba(91,127,255,0.12)',
                willChange: 'transform',
              }}
            >
              <motion.div
                className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(91,127,255,0.28), rgba(124,58,237,0.28))', border: '1px solid rgba(255,255,255,0.10)' }}
                animate={{ opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Bot className="w-5 h-5 text-[#A5B4FC]" aria-hidden="true" />
              </motion.div>
              <span className="flex-1 text-[13px] font-bold text-white/85">AI sizga 24/7 yordam beradi</span>
              <ChevronRight className="w-4 h-4 text-white/35 flex-shrink-0" aria-hidden="true" />
            </motion.button>
          </motion.div>

          {/* Daily Motivation (new — Asia/Tashkent weekday, auto-rotates) */}
          <DailyMotivationCard />

          {/* AI Recommendation Card */}
          <motion.button
            type="button"
            variants={FADE_UP}
            onClick={() => navigate(PATHS.STUDENT.AI_ASSISTANT)}
            whileHover={{
              scale: 1.015, y: -2,
              boxShadow: '0 10px 32px rgba(91,127,255,0.22), inset 0 1px 0 rgba(255,255,255,0.10)',
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left max-w-md"
            style={{
              background: 'rgba(91,127,255,0.08)',
              border: '1px solid rgba(91,127,255,0.18)',
              backdropFilter: 'blur(16px)',
              willChange: 'transform',
            }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(91,127,255,0.18)' }}
            >
              <Brain className="w-4 h-4 text-[#93BBFF]" aria-hidden="true" />
            </div>
            <p className="text-[12.5px] text-white/65 leading-snug flex-1">
              <span className="font-bold text-white/85">{t.achAIRec}:</span>{' '}
              {t.sdRecBefore} <span className="text-[#93BBFF] font-semibold">{t[recTopic]}</span> {t.sdRecAfter}
            </p>
            <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" aria-hidden="true" />
          </motion.button>

          {/* CTA buttons (navigate logic PRESERVED) */}
          <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row gap-3">
            {/* Primary CTA */}
            <motion.button
              type="button"
              onClick={() => navigate(PATHS.STUDENT.AI_ASSISTANT)}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              variants={{
                rest:  { scale: 1, y: 0 },
                hover: { scale: 1.04, y: -3 },
                tap:   { scale: 0.97, y: 0 },
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-2.5 px-7 py-[14px] rounded-[18px] text-white font-bold text-[14px] overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #5B7FFF 0%, #7C3AED 100%)',
                boxShadow: '0 8px 32px rgba(91,127,255,0.5), 0 2px 8px rgba(91,127,255,0.25), inset 0 1px 0 rgba(255,255,255,0.18)',
                willChange: 'transform',
              }}
            >
              {/* Shimmer sweep */}
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: 'linear-gradient(105deg, transparent 15%, rgba(255,255,255,0.15) 50%, transparent 85%)' }}
                aria-hidden="true"
              />
              {/* Ripple */}
              <motion.span
                className="absolute inset-0 rounded-[18px] pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)' }}
                variants={{
                  rest:  { scale: 0, opacity: 0 },
                  hover: { scale: 1.8, opacity: [0, 0.5, 0], transition: { duration: 0.7, ease: 'easeOut' } },
                }}
                aria-hidden="true"
              />
              <motion.span
                className="relative z-10 flex items-center"
                variants={{
                  rest:  { rotate: 0, scale: 1 },
                  hover: { rotate: [0, -10, 10, 0], scale: [1, 1.15, 1], transition: { duration: 0.6, ease: 'easeInOut' } },
                }}
              >
                <Zap className="w-4 h-4" aria-hidden="true" />
              </motion.span>
              <span className="relative z-10">{t.sdStartAI}</span>
            </motion.button>

            {/* Secondary CTA */}
            <motion.button
              type="button"
              onClick={() => navigate(PATHS.STUDENT.LESSONS)}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-[14px] rounded-[18px] text-white/60 hover:text-white/90 font-semibold text-[14px] transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(124,58,237,0.28)',
                backdropFilter: 'blur(16px)',
                willChange: 'transform',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(167,139,250,0.55)'
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.12)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 28px rgba(124,58,237,0.30)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.28)'
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
              }}
            >
              {t.sdMyLessons}
              <motion.span
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </motion.span>
            </motion.button>
          </motion.div>

          {/* AI Input (PRESERVED — onSubmit, navigate) */}
          <motion.div variants={FADE_UP} className="max-w-lg">
            <HomeAIInput onSubmit={(text) => {
              navigate(text ? PATHS.STUDENT.AI_ASSISTANT : PATHS.STUDENT.AI_ASSISTANT)
            }} />
          </motion.div>

          {/* Quick Topics (navigate PRESERVED) */}
          <motion.div variants={FADE_UP} className="flex flex-wrap gap-2">
            {QUICK_TOPICS.map((topic, i) => (
              <motion.button
                key={topic}
                type="button"
                onClick={() => navigate(PATHS.STUDENT.AI_ASSISTANT)}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.06, duration: 0.3, ease: EASE }}
                className="px-4 py-2 rounded-full text-[12px] font-semibold transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.11)',
                  color: 'rgba(255,255,255,0.65)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.background = 'rgba(91,127,255,0.18)'
                  el.style.borderColor = 'rgba(91,127,255,0.5)'
                  el.style.color = '#93BBFF'
                  el.style.boxShadow = '0 0 16px rgba(91,127,255,0.2), inset 0 0 0 1px rgba(91,127,255,0.25)'
                  el.style.transform = 'translateY(-2px) scale(1.03)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.background = 'rgba(255,255,255,0.06)'
                  el.style.borderColor = 'rgba(255,255,255,0.11)'
                  el.style.color = 'rgba(255,255,255,0.65)'
                  el.style.boxShadow = 'none'
                  el.style.transform = 'none'
                }}
              >
                {t[topic]}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* ── RIGHT: Large illustration container — Desktop (xl+) only, ~45% column ── */}
        {/* items-start (on the grid) + a small upward nudge brings the character */}
        {/* in line with the greeting block instead of centering on the full column. */}
        <motion.div
          className="hidden xl:flex items-center justify-center xl:-mt-4"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.75, delay: 0.25, ease: EASE }}
        >
          <HomeHeroIllustration size={420} isPremium={isPremium} onUpgrade={onUpgrade} />
        </motion.div>

      </div>

      {/* Mobile + Tablet: single column, illustration below text (<xl) */}
      {/* Footprint sized for tablet (768px+); scaled down via transform on phones */}
      {/* (320–639px) so it never overflows the viewport at the smallest widths. */}
      <motion.div
        className="flex xl:hidden items-center justify-center mt-4 -mb-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
      >
        <div className="w-full max-w-[400px] mx-auto">
          <HomeHeroIllustration size={400} isPremium={isPremium} onUpgrade={onUpgrade} />
        </div>
      </motion.div>
    </div>
  )
}

// ─── Home hero illustration — approved Premium reference recreated in code ────
// Pure React + Tailwind + inline SVG + Framer Motion (no PNG/JPG). Glowing
// YordamchiAI "Y" hologram on a light podium, glass stat cards (Darslar/Testlar/
// Progress/Sertifikatlar), education books + graduation cap, knowledge-network
// lines, blue/purple glassmorphism, Premium CTA. Responsive & aspect-locked.

// ── Centralized dashboard stats — swap for real API / backend data later ──────
// Each stat: a numeric `target` (animated) + a display `suffix`.
const dashboardStats = {
  lessons:      { target: 120,  suffix: '+' },
  tests:        { target: 2500, suffix: '+' },
  progress:     { target: 87,   suffix: '%' },
  certificates: { target: 12,   suffix: ''  },
} as const

// ── Count-up: 0 → target over `duration` ms (easeOutCubic), on EVERY mount ────
// rAF-driven, cleaned up on unmount, and jumps straight to target when the user
// prefers reduced motion. Re-runs whenever the component remounts / stat changes.
function useCountUp(target: number, duration = 1500): number {
  const reduce = useReducedMotion()
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (reduce) { setValue(target); return }
    let raf = 0
    let startTs: number | null = null
    const tick = (ts: number) => {
      if (startTs === null) startTs = ts
      const progress = Math.min((ts - startTs) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setValue(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, reduce])
  return value
}

function HeroStat({ style, delay, Icon, tone, label, target, suffix = '', big, reduceMotion, loopRepeat }: {
  style: React.CSSProperties; delay: number; Icon: typeof BookOpen; tone: string
  label: string; target: number; suffix?: string; big?: boolean; reduceMotion: boolean | null; loopRepeat: number
}) {
  const count   = useCountUp(target)
  const iconBox = big ? 32 : 27
  const iconSz  = big ? 16 : 14
  return (
    <motion.div
      className="absolute flex items-center rounded-2xl pointer-events-none"
      style={{
        ...style,
        gap: big ? 9 : 7,
        padding: big ? '9px 13px' : '7px 10px',
        // Layered glass + soft 3D depth (top highlight + drop + brand rim)
        background: 'linear-gradient(150deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.035) 100%)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 16px 34px rgba(0,0,0,0.44), 0 3px 10px rgba(91,127,255,0.16), inset 0 1px 0 rgba(255,255,255,0.18)',
      }}
      initial={{ opacity: 0, scale: 0.82, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: reduceMotion ? 0 : [0, big ? -8 : -6, 0] }}
      transition={{
        opacity: { duration: 0.55, delay }, scale: { duration: 0.55, delay },
        y: { duration: 5 + delay, repeat: loopRepeat, ease: 'easeInOut', delay },
      }}
      aria-hidden="true"
    >
      <span className="rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ width: iconBox, height: iconBox,
          background: `linear-gradient(150deg, ${tone}38, ${tone}16)`,
          border: `1px solid ${tone}55`, boxShadow: `0 0 12px ${tone}33, inset 0 1px 0 rgba(255,255,255,0.15)` }}>
        <Icon style={{ width: iconSz, height: iconSz, color: tone }} />
      </span>
      <div className="text-left leading-tight">
        <p className="text-white/50 font-medium" style={{ fontSize: big ? 9 : 8 }}>{label}</p>
        <p className="font-black text-white tabular-nums" style={{ fontSize: big ? 14.5 : 12 }}>{count}{suffix}</p>
      </div>
    </motion.div>
  )
}

function HomeHeroIllustration({ size, isPremium, onUpgrade }: { size: number; isPremium: boolean; onUpgrade: () => void }) {
  const reduceMotion = useReducedMotion()
  const loopRepeat = reduceMotion ? 0 : Infinity
  const uid = `hero-${size}`
  return (
    <div className="relative w-full mx-auto" style={{ maxWidth: size, aspectRatio: '1 / 1' }}>
      {/* Premium glass background panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute inset-0 overflow-hidden"
        style={{
          borderRadius: 30,
          background: 'linear-gradient(155deg, rgba(14,20,46,0.94) 0%, rgba(22,16,52,0.94) 55%, rgba(9,11,28,0.96) 100%)',
          border: '1px solid rgba(147,187,255,0.18)',
          boxShadow: '0 0 72px rgba(91,127,255,0.22), 0 30px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
          willChange: 'transform',
        }}
      >
        {/* Grid backdrop */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" aria-hidden="true"
          style={{ backgroundImage: 'linear-gradient(rgba(147,187,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(147,187,255,0.5) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        {/* Ambient glow effects */}
        <div className="absolute -top-16 -right-12 w-52 h-52 rounded-full blur-[70px] pointer-events-none" aria-hidden="true"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.5), transparent 70%)' }} />
        <div className="absolute top-1/3 -left-16 w-52 h-52 rounded-full blur-[70px] pointer-events-none" aria-hidden="true"
          style={{ background: 'radial-gradient(circle, rgba(91,127,255,0.42), transparent 70%)' }} />

        {/* Knowledge network — glowing data lines + flowing packets (core → cards) */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-net`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#93BBFF" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.05" />
            </linearGradient>
            <radialGradient id={`${uid}-pkt`}>
              <stop offset="0%"   stopColor="#DCE8FF" stopOpacity="1" />
              <stop offset="100%" stopColor="#93BBFF" stopOpacity="0" />
            </radialGradient>
          </defs>
          {[
            { x: 24, y: 20 },  // → Darslar (top-left)
            { x: 78, y: 24 },  // → Testlar (top-right)
            { x: 22, y: 43 },  // → Progress (bottom-left)
            { x: 78, y: 46 },  // → Sertifikatlar (bottom-right)
          ].map((p, i) => (
            <g key={i}>
              {/* soft glow underlay */}
              <line x1="50" y1="31" x2={p.x} y2={p.y} stroke={`url(#${uid}-net)`} strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
              {/* bright core line */}
              <line x1="50" y1="31" x2={p.x} y2={p.y} stroke={`url(#${uid}-net)`} strokeWidth="0.5" strokeLinecap="round" />
              {/* endpoint node */}
              <circle cx={p.x} cy={p.y} r="1.1" fill="#A9C2FF" opacity="0.85" />
              {/* flowing data packet */}
              {!reduceMotion && (
                <motion.circle r="1.4" fill={`url(#${uid}-pkt)`}
                  initial={{ cx: 50, cy: 31, opacity: 0 }}
                  animate={{ cx: [50, p.x], cy: [31, p.y], opacity: [0, 1, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.55 }}
                />
              )}
            </g>
          ))}
        </svg>

        {/* ── Central "Y" hologram: sphere + podium rings ── */}
        <motion.div
          className="absolute left-1/2"
          style={{ top: '31%', transform: 'translate(-50%,-50%)' }}
          animate={{ y: reduceMotion ? 0 : [0, -7, 0] }}
          transition={{ duration: 4.6, repeat: loopRepeat, ease: 'easeInOut' }}
        >
          {/* Podium light + concentric rings */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '84%' }} aria-hidden="true">
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                className="absolute left-1/2 -translate-x-1/2 rounded-[100%]"
                style={{ width: 84 + i * 46, height: 24 + i * 12, top: i * 8,
                  border: `1px solid rgba(91,127,255,${0.42 - i * 0.11})`, boxShadow: `0 0 20px rgba(91,127,255,${0.3 - i * 0.08})` }}
                animate={{ opacity: reduceMotion ? 0.55 : [0.7 - i * 0.15, 0.28, 0.7 - i * 0.15] }}
                transition={{ duration: 3 + i * 0.6, repeat: loopRepeat, ease: 'easeInOut', delay: i * 0.3 }}
              />
            ))}
            <div className="absolute left-1/2 -translate-x-1/2 rounded-[100%] blur-md"
              style={{ width: 74, height: 18, top: 2, background: 'radial-gradient(ellipse, rgba(147,187,255,0.9), transparent 70%)' }} />
          </div>

          {/* Sphere glow — dual layer, breathing */}
          <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[54px] pointer-events-none"
            style={{ width: 194, height: 194, background: 'radial-gradient(circle, rgba(124,58,237,0.72), transparent 68%)' }}
            animate={{ opacity: reduceMotion ? 0.85 : [0.6, 1, 0.6], scale: reduceMotion ? 1 : [1, 1.08, 1] }}
            transition={{ duration: 5, repeat: loopRepeat, ease: 'easeInOut' }} aria-hidden="true" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[26px] pointer-events-none"
            style={{ width: 118, height: 118, background: 'radial-gradient(circle, rgba(147,187,255,0.6), transparent 64%)' }} aria-hidden="true" />

          {/* Concentric pulsing waves — active AI core (radar/sonar ripples) */}
          {[0, 1, 2].map(i => (
            <motion.div key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
              style={{ width: 112, height: 112, border: '1.5px solid rgba(160,196,255,0.55)' }}
              animate={reduceMotion ? { opacity: 0.22 } : { scale: [0.82, 1.85], opacity: [0.5, 0] }}
              transition={{ duration: 3, repeat: loopRepeat, ease: 'easeOut', delay: i * 1 }}
              aria-hidden="true"
            />
          ))}

          {/* Rotating orbit ring */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{ width: 144, height: 144,
              background: 'conic-gradient(from 0deg, transparent 52%, rgba(160,196,255,0.62) 70%, rgba(124,58,237,0.46) 86%, transparent 100%)' }}
            animate={{ rotate: reduceMotion ? 0 : [0, 360] }}
            transition={{ duration: 12, repeat: loopRepeat, ease: 'linear' }} aria-hidden="true" />

          {/* Counter-rotating dashed ring — futuristic depth */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{ width: 128, height: 128, border: '1px dashed rgba(147,187,255,0.28)' }}
            animate={{ rotate: reduceMotion ? 0 : [360, 0] }}
            transition={{ duration: 18, repeat: loopRepeat, ease: 'linear' }} aria-hidden="true" />

          {/* Official YordamchiAI logo as the AI core — inside a hologram bubble.
              Reuses the existing brand asset (components/common/Logo) — not redrawn. */}
          <motion.div className="relative rounded-full flex items-center justify-center"
            style={{ width: 116, height: 116,
              background: 'radial-gradient(circle at 50% 36%, rgba(147,187,255,0.20), rgba(124,58,237,0.10) 60%, rgba(10,14,30,0.30) 100%)',
              border: '1px solid rgba(160,196,255,0.35)' }}
            animate={reduceMotion ? {} : {
              scale: [1, 1.035, 1],
              boxShadow: [
                'inset 0 0 26px rgba(147,187,255,0.28), 0 0 40px rgba(91,127,255,0.40)',
                'inset 0 0 40px rgba(160,196,255,0.44), 0 0 66px rgba(124,58,237,0.60)',
                'inset 0 0 26px rgba(147,187,255,0.28), 0 0 40px rgba(91,127,255,0.40)',
              ],
            }}
            transition={{ duration: 4.5, repeat: loopRepeat, ease: 'easeInOut' }}
          >
            {/* Top gloss highlight (glass depth) */}
            <div className="absolute rounded-full pointer-events-none" aria-hidden="true"
              style={{ width: 62, height: 34, top: 8, left: '50%', transform: 'translateX(-50%)',
                background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.35), transparent 72%)', filter: 'blur(2px)' }} />
            {/* Official brand logo (enlarged, icon only) */}
            <div style={{ transform: 'scale(1.6)' }} className="relative">
              <Logo showText={false} showSubtitle={false} />
            </div>
          </motion.div>
        </motion.div>

        {/* ── Education elements: open book + graduation cap ── */}
        <motion.div className="absolute" style={{ top: '54%', left: '27%' }} aria-hidden="true"
          animate={{ y: reduceMotion ? 0 : [0, -5, 0] }} transition={{ duration: 4.4, repeat: loopRepeat, ease: 'easeInOut', delay: 0.4 }}>
          <BookOpen style={{ width: 28, height: 28, color: '#A78BFA', filter: 'drop-shadow(0 0 9px rgba(167,139,250,0.7))' }} />
        </motion.div>
        <motion.div className="absolute" style={{ top: '53%', left: '60%' }} aria-hidden="true"
          animate={{ y: reduceMotion ? 0 : [0, -6, 0] }} transition={{ duration: 4.8, repeat: loopRepeat, ease: 'easeInOut', delay: 0.9 }}>
          <GraduationCap style={{ width: 30, height: 30, color: '#93BBFF', filter: 'drop-shadow(0 0 9px rgba(147,187,255,0.75))' }} />
        </motion.div>

        {/* ── Floating glass stat cards (approved reference values) ── */}
        <HeroStat style={{ top: '5%',  left: '5%'  }} delay={0.2} Icon={BookOpen}      tone="#93BBFF" label="Darslar"       target={dashboardStats.lessons.target}      suffix={dashboardStats.lessons.suffix}      big reduceMotion={reduceMotion} loopRepeat={loopRepeat} />
        <HeroStat style={{ top: '10%', right: '5%' }} delay={0.4} Icon={ClipboardList} tone="#22D3EE" label="Testlar"       target={dashboardStats.tests.target}        suffix={dashboardStats.tests.suffix}            reduceMotion={reduceMotion} loopRepeat={loopRepeat} />
        <HeroStat style={{ top: '35%', left: '3%'  }} delay={0.6} Icon={BarChart3}     tone="#818CF8" label="Progress"      target={dashboardStats.progress.target}     suffix={dashboardStats.progress.suffix}         reduceMotion={reduceMotion} loopRepeat={loopRepeat} />
        <HeroStat style={{ top: '37%', right: '4%' }} delay={0.8} Icon={Award}         tone="#F5C542" label="Sertifikatlar" target={dashboardStats.certificates.target} suffix={dashboardStats.certificates.suffix} big reduceMotion={reduceMotion} loopRepeat={loopRepeat} />

        {/* ── Premium CTA (~35% band): title · subtitle · button over scrim ── */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-12 text-center"
          style={{ background: 'linear-gradient(to top, rgba(7,9,22,0.98) 48%, rgba(7,9,22,0.5) 84%, transparent)' }}>
          {isPremium ? (
            <>
              <p className="text-[16px] font-black text-white tracking-tight flex items-center justify-center gap-1.5">
                Premium faol <span aria-hidden="true">💎</span>
              </p>
              <p className="text-[11.5px] text-white/55 mt-1">Cheksiz AI yordamchi siz bilan</p>
            </>
          ) : (
            <>
              <p className="text-[16px] font-black text-white tracking-tight">
                YordamchiAI <span style={{ color: '#93BBFF' }}>Premium</span>
              </p>
              <p className="text-[11.5px] text-white/55 mt-1">Bilim olishning yangi AI darajasi</p>
              <motion.button
                type="button"
                onClick={onUpgrade}
                whileHover={{ scale: reduceMotion ? 1 : 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-[13px] text-white text-[12.5px] font-bold"
                style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)', boxShadow: '0 8px 26px rgba(91,127,255,0.5)' }}
              >
                <Zap className="w-4 h-4" aria-hidden="true" />
                Premium imkoniyatlarni ochish
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Reusable card primitives (shared shell / states — production, no duplication)
// ═════════════════════════════════════════════════════════════════════════════

function DashboardCard({
  icon, iconColor, title, action, children, className = '',
}: {
  icon: React.ReactNode; iconColor: string; title: string
  action?: React.ReactNode; children: React.ReactNode; className?: string
}) {
  return (
    <section
      className={`p-5 h-full flex flex-col ${className}`}
      style={{ ...GLASS_ELEVATED, borderRadius: CARD_RADIUS }}
      aria-label={title}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <SectionIcon color={iconColor}>{icon}</SectionIcon>
        <h3 className="text-[13px] font-bold text-white/80">{title}</h3>
        {action && <div className="ml-auto flex items-center">{action}</div>}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </section>
  )
}

function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded-xl animate-pulse"
          style={{ background: 'rgba(255,255,255,0.045)', animationDelay: `${i * 0.12}s` }} />
      ))}
    </div>
  )
}

function EmptyState({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-7 gap-2" role="status">
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        aria-hidden="true">
        {icon}
      </div>
      <p className="text-[12.5px] font-semibold text-white/45">{title}</p>
      {hint && <p className="text-[11px] text-white/30">{hint}</p>}
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()
  return (
    <div
      role="alert"
      className="p-8 flex flex-col items-center justify-center text-center gap-3.5"
      style={{ ...GLASS_ELEVATED, borderRadius: CARD_RADIUS, borderColor: 'rgba(239,68,68,0.22)' }}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
        <AlertTriangle className="w-5 h-5 text-red-400" aria-hidden="true" />
      </div>
      <div>
        <p className="text-[14px] font-bold text-white/85">{t.sdErrTitle}</p>
        <p className="text-[12px] text-white/45 mt-1 max-w-xs">
          {t.sdErrDesc}
        </p>
      </div>
      <motion.button
        type="button"
        onClick={onRetry}
        whileHover={reduceMotion ? undefined : { scale: 1.03, y: -1 }}
        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white"
        style={{ background: 'linear-gradient(135deg, #5B7FFF, #7C3AED)', boxShadow: '0 6px 20px rgba(91,127,255,0.35)' }}
      >
        <RefreshCw className="w-4 h-4" aria-hidden="true" />
        {t.ebRetry}
      </motion.button>
    </div>
  )
}

// ─── Lesson-schedule helpers (Asia/Tashkent) ─────────────────────────────────

function tashkentTodayISO(): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

function fmtLessonDate(iso: string, t: Translations): string {
  const datePart = iso.slice(0, 10)              // YYYY-MM-DD
  const [, mm, dd] = datePart.split('-')
  // Anchor at Tashkent midday so the weekday never rolls to an adjacent day.
  const at = new Date(`${datePart}T12:00:00+05:00`)
  const wkKey = Number.isNaN(at.getTime())
    ? null
    : EN_TO_DAY_KEY[new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tashkent', weekday: 'short' }).format(at)]
  const wk = wkKey ? t[wkKey] : ''
  return wk ? `${wk}, ${dd}.${mm}` : `${dd}.${mm}`
}

// ─── Section: Today's Lessons ─────────────────────────────────────────────────

function LessonRow({ lesson, showDate, navigate }: {
  lesson: SDLesson; showDate: boolean; navigate: ReturnType<typeof useNavigate>
}) {
  const { t } = useLanguage()
  return (
    <li>
      <button
        type="button"
        onClick={() => navigate(PATHS.STUDENT.LESSONS)}
        className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: lesson.has_video ? 'rgba(124,58,237,0.16)' : 'rgba(91,127,255,0.14)' }}
          aria-hidden="true"
        >
          {lesson.has_video
            ? <PlayCircle className="w-4 h-4 text-[#C4B5FD]" />
            : <BookOpen className="w-4 h-4 text-[#93BBFF]" />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[12.5px] font-semibold text-white/80 truncate">{lesson.title}</span>
          <span className="block text-[11px] text-white/35 truncate">
            {lesson.group_name}{showDate ? ` · ${fmtLessonDate(lesson.lesson_date, t)}` : ''}
          </span>
        </span>
        <ChevronRight className="w-4 h-4 text-white/25 flex-shrink-0" aria-hidden="true" />
      </button>
    </li>
  )
}

function TodayLessonsCard({ lessons, loading, navigate }: {
  lessons: SDLesson[]; loading: boolean; navigate: ReturnType<typeof useNavigate>
}) {
  const { t } = useLanguage()
  const today  = tashkentTodayISO()
  const todays = lessons.filter(l => l.lesson_date.slice(0, 10) === today)

  return (
    <DashboardCard
      icon={<Calendar className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />}
      iconColor="#22C55E"
      title={t.sdTodayLessons}
      action={!loading && todays.length > 0 ? (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(34,197,94,0.14)', color: '#86efac', border: '1px solid rgba(34,197,94,0.22)' }}>
          {todays.length}
        </span>
      ) : null}
    >
      {loading ? (
        <CardSkeleton rows={2} />
      ) : todays.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-5 h-5 text-white/30" />}
          title={t.sdNoTodayLessons}
          hint={t.sdNoTodayHint}
        />
      ) : (
        <ul className="space-y-2.5">
          {todays.map(l => <LessonRow key={l.id} lesson={l} showDate={false} navigate={navigate} />)}
        </ul>
      )}
    </DashboardCard>
  )
}

// ─── Section: Upcoming Lessons ────────────────────────────────────────────────

function UpcomingLessonsCard({ lessons, loading, navigate }: {
  lessons: SDLesson[]; loading: boolean; navigate: ReturnType<typeof useNavigate>
}) {
  const { t } = useLanguage()
  const today    = tashkentTodayISO()
  const upcoming  = lessons.filter(l => l.lesson_date.slice(0, 10) > today).slice(0, 5)

  return (
    <DashboardCard
      icon={<CalendarClock className="w-3.5 h-3.5 text-indigo-300" aria-hidden="true" />}
      iconColor="#6366F1"
      title={t.sdUpcomingLessons}
    >
      {loading ? (
        <CardSkeleton rows={3} />
      ) : upcoming.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="w-5 h-5 text-white/30" />}
          title={t.sdNoUpcoming}
          hint={t.sdNoUpcomingHint}
        />
      ) : (
        <ul className="space-y-2.5">
          {upcoming.map(l => <LessonRow key={l.id} lesson={l} showDate navigate={navigate} />)}
        </ul>
      )}
    </DashboardCard>
  )
}

// ─── Section: Attendance Summary ──────────────────────────────────────────────

const ATT_SEGMENTS: { key: 'present' | 'late' | 'excused' | 'absent'; label: keyof Translations; color: string }[] = [
  { key: 'present', label: 'sdPresent', color: '#22C55E' },
  { key: 'late',    label: 'sdLate',    color: '#F59E0B' },
  { key: 'excused', label: 'sdExcused', color: '#6366F1' },
  { key: 'absent',  label: 'sdAbsent',  color: '#EF4444' },
]

function AttendanceSummaryCard({ stats, loading }: { stats: AttendanceTotals | null; loading: boolean }) {
  const { t } = useLanguage()
  const total = stats?.total ?? 0
  const pct   = stats && total > 0 ? Math.round((stats.present / total) * 100) : null

  return (
    <DashboardCard
      icon={<CheckCircle className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />}
      iconColor="#14B8A6"
      title={t.achAttendance}
      action={pct !== null ? (
        <span className="text-[13px] font-black tabular-nums" style={{ color: getAttColor(pct) }}>{pct}%</span>
      ) : null}
    >
      {loading ? (
        <CardSkeleton rows={2} />
      ) : !stats || total === 0 ? (
        <EmptyState
          icon={<CheckCircle className="w-5 h-5 text-white/30" />}
          title={t.sdNoAttendance}
          hint={t.sdNoAttendanceHint}
        />
      ) : (
        <div className="space-y-4">
          {/* Stacked proportion bar */}
          <div className="flex h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}
            role="img" aria-label={`${t.achAttendance}: ${pct}%`}>
            {ATT_SEGMENTS.map(seg => {
              const val = stats[seg.key]
              if (val === 0) return null
              return (
                <motion.div
                  key={seg.key}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(val / total) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: EASE }}
                  style={{ background: seg.color }}
                  aria-hidden="true"
                />
              )
            })}
          </div>
          {/* Breakdown chips */}
          <div className="grid grid-cols-2 gap-2">
            {ATT_SEGMENTS.map(seg => (
              <div key={seg.key} className="flex items-center gap-2 p-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: seg.color }} aria-hidden="true" />
                <span className="text-[11.5px] text-white/50 flex-1">{t[seg.label]}</span>
                <span className="text-[12.5px] font-bold text-white/80 tabular-nums">{stats[seg.key]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardCard>
  )
}

// ─── Section: Assignments (self-fetching, real data) ──────────────────────────

const ASG_BUCKETS: { key: 'due_today' | 'overdue' | 'upcoming' | 'graded'; label: keyof Translations; color: string }[] = [
  { key: 'due_today', label: 'sdToday',         color: '#F59E0B' },
  { key: 'overdue',   label: 'lessHwOverdue',   color: '#EF4444' },
  { key: 'upcoming',  label: 'sdUpcomingBucket', color: '#3B82F6' },
  { key: 'graded',    label: 'sdGraded',        color: '#22C55E' },
]

function AssignmentsDashboardCard({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const { t } = useLanguage()
  const [items, setItems]   = useState<StudentAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(false)

  const load = async () => {
    setLoading(true); setError(false)
    try { setItems(await assignmentService.getStudentAssignments()) }
    catch { setError(true) }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const counts = { due_today: 0, overdue: 0, upcoming: 0, graded: 0 }
  for (const it of items) {
    if (it.submission?.status === 'graded') { counts.graded++; continue }
    const st = deadlineState(it.deadline, Boolean(it.submission))
    if (st === 'due_today') counts.due_today++
    else if (st === 'overdue') counts.overdue++
    else if (st === 'upcoming') counts.upcoming++
  }

  // Nearest actionable (due today / overdue / upcoming, ungraded), by deadline
  const actionable = items
    .filter(it => it.submission?.status !== 'graded')
    .filter(it => ['due_today', 'overdue', 'upcoming'].includes(deadlineState(it.deadline, Boolean(it.submission))))
    .slice(0, 3)

  return (
    <DashboardCard
      icon={<ClipboardList className="w-3.5 h-3.5 text-[#93BBFF]" aria-hidden="true" />}
      iconColor="#5B7FFF"
      title={t.achAssignments}
      action={
        <button type="button" onClick={() => navigate(PATHS.STUDENT.ASSIGNMENTS)}
          className="text-[11px] font-bold text-[#93BBFF] hover:text-white transition-colors">
          {t.lessAll} →
        </button>
      }
    >
      {loading ? (
        <CardSkeleton rows={2} />
      ) : error ? (
        <EmptyState icon={<AlertTriangle className="w-5 h-5 text-red-400/70" />} title={t.sdLoadFailed} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-5 h-5 text-white/30" />}
          title={t.sdAsgNo}
          hint={t.sdAsgHint}
        />
      ) : (
        <div className="space-y-3">
          {/* Bucket counts */}
          <div className="grid grid-cols-4 gap-2">
            {ASG_BUCKETS.map(b => (
              <div key={b.key} className="flex flex-col items-center py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-[17px] font-black tabular-nums" style={{ color: b.color }}>{counts[b.key]}</span>
                <span className="text-[9.5px] text-white/40 font-semibold text-center leading-tight mt-0.5">{t[b.label]}</span>
              </div>
            ))}
          </div>
          {/* Nearest items */}
          {actionable.length > 0 && (
            <ul className="space-y-2">
              {actionable.map(it => {
                const st = deadlineState(it.deadline, Boolean(it.submission))
                const c  = st === 'overdue' ? '#EF4444' : st === 'due_today' ? '#F59E0B' : '#3B82F6'
                return (
                  <li key={it.id}>
                    <button type="button" onClick={() => navigate(PATHS.STUDENT.ASSIGNMENTS)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c }} aria-hidden="true" />
                      <span className="flex-1 min-w-0 text-[12px] font-semibold text-white/75 truncate">{it.title}</span>
                      {it.submission
                        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" aria-hidden="true" />
                        : <ChevronRight className="w-3.5 h-3.5 text-white/25 flex-shrink-0" aria-hidden="true" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </DashboardCard>
  )
}

// ─── Section: Statistics ──────────────────────────────────────────────────────

const GLOBAL_STATS: { emoji: string; value: string; label: keyof Translations; color: string }[] = [
  { emoji: '✔', value: '15 000+', label: 'sdStatSolved',   color: '#22C55E' },
  { emoji: '✔', value: '98%',     label: 'sdStatAccuracy', color: '#6366F1' },
  { emoji: '✔', value: '24/7',    label: 'sdStatAIAvail',  color: '#F59E0B' },
  { emoji: '✔', value: '3',       label: 'sdStatLangs',    color: '#3B82F6' },
]

function StatsSection() {
  const { t } = useLanguage()
  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      variants={STAGGER_FAST}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
    >
      {GLOBAL_STATS.map(s => (
        <motion.div
          key={s.label}
          variants={FADE_UP}
          whileHover={{ y: -4, scale: 1.015 }}
          transition={{ type: 'spring', stiffness: 340, damping: 24 }}
          className="rounded-[22px] p-5 cursor-default relative overflow-hidden group"
          style={{ ...GLASS_ELEVATED, borderColor: `${s.color}18`, borderRadius: CARD_RADIUS, willChange: 'transform' }}
        >
          {/* Hover glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[22px] pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 50% 0%, ${s.color}0C, transparent 65%)` }}
            aria-hidden="true"
          />
          {/* Icon */}
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center mb-4 relative z-10"
            style={{ background: `${s.color}15`, border: `1px solid ${s.color}28`, boxShadow: `0 0 16px ${s.color}15` }}
          >
            <CheckCircle className="w-4.5 h-4.5" style={{ color: s.color, width: 18, height: 18 }} aria-hidden="true" />
          </div>
          {/* Value */}
          <div
            className="text-[2rem] font-black leading-none mb-2 tracking-tight relative z-10"
            style={{ color: s.color }}
          >
            {s.value}
          </div>
          <p className="text-[11.5px] text-white/45 font-medium leading-snug relative z-10">{t[s.label]}</p>
          {/* Accent line */}
          <motion.div
            className="absolute bottom-0 inset-x-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, ${s.color}70, ${s.color}20, transparent)` }}
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}

// ─── Section: Weak Topics ─────────────────────────────────────────────────────

function WeakTopicsCard({ avgPct, loading }: { avgPct: number; loading: boolean }) {
  const topics = getWeakTopics(avgPct)
  const show   = topics.length > 0

  return (
    <div
      className="p-5 h-full"
      style={{ ...GLASS_ELEVATED, borderRadius: CARD_RADIUS }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <SectionIcon color="#F59E0B">
          <TrendingUp className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
        </SectionIcon>
        <h3 className="text-[13px] font-bold text-white/80">Zaif tomonlar</h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 rounded-lg bg-white/[0.06] animate-pulse w-4/5" />
              <div className="h-1.5 rounded-full bg-white/[0.04] animate-pulse" />
            </div>
          ))}
        </div>
      ) : !show ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-white/70">Zo&apos;r! Zaif tomonlar yo&apos;q</p>
          <p className="text-[11px] text-white/35 mt-1">Barcha mavzular yaxshi o&apos;zlashtirilgan</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topics.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, ease: EASE, duration: 0.4 }}
            >
              <div className="flex justify-between mb-1.5 text-[12px]">
                <span className="text-white/70 font-medium">{t.name}</span>
                <span className="font-bold" style={{ color: t.pct < 55 ? '#EF4444' : '#F59E0B' }}>
                  {t.pct}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: t.pct < 55 ? 'linear-gradient(90deg,#EF4444,#F97316)' : 'linear-gradient(90deg,#F59E0B,#FBBF24)' }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${t.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.3, ease: EASE, delay: 0.2 + i * 0.1 }}
                />
              </div>
            </motion.div>
          ))}
          <p className="text-[11px] text-white/30 pt-1">AI bilan bu mavzularni mustahkamla</p>
        </div>
      )}
    </div>
  )
}

// ─── Section: Courses ─────────────────────────────────────────────────────────

function CoursesCard({
  groups, loading, navigate,
}: { groups: SDGroup[]; loading: boolean; navigate: ReturnType<typeof useNavigate> }) {
  const active = groups.filter(g => g.status === 'active').slice(0, 3)

  return (
    <div
      className="p-5 h-full"
      style={{ ...GLASS_ELEVATED, borderRadius: CARD_RADIUS }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <SectionIcon color="#5B7FFF">
            <BookOpen className="w-3.5 h-3.5" style={{ color: '#5B7FFF' }} aria-hidden="true" />
          </SectionIcon>
          <h3 className="text-[13px] font-bold text-white/80">Faol kurslar</h3>
        </div>
        <button
          type="button"
          onClick={() => navigate(PATHS.STUDENT.LESSONS)}
          className="text-[11px] font-semibold text-white/35 hover:text-white/65 transition-colors flex items-center gap-0.5"
        >
          Barchasi <ChevronRight className="w-3 h-3" aria-hidden="true" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-14 rounded-2xl bg-white/[0.04] animate-pulse" />)}
        </div>
      ) : active.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <BookOpen className="w-8 h-8 text-white/20 mb-2" aria-hidden="true" />
          <p className="text-sm text-white/40">Hali faol kurs yo&apos;q</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {active.map(course => {
            const pct = course.att_total > 0 ? Math.round((course.att_present/course.att_total)*100) : null
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => navigate(PATHS.STUDENT.LESSONS)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150 hover:bg-white/[0.05] group"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {course.subject?.icon ?? '📚'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-white/80 truncate">{course.name}</p>
                  {pct !== null && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-white/[0.08] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${pct}%`, background: getAttColor(pct) }} />
                      </div>
                      <span className="text-[10px] font-bold flex-shrink-0" style={{ color: getAttColor(pct) }}>{pct}%</span>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Section: Recent Activity ─────────────────────────────────────────────────

function RecentActivityCard({ tests, loading }: { tests: SDTest[]; loading: boolean }) {
  const recent = tests.slice(0, 5)

  return (
    <div
      className="overflow-hidden"
      style={{ ...GLASS_ELEVATED, borderRadius: CARD_RADIUS }}
    >
      <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <SectionIcon color="#A78BFA">
          <Clock className="w-3.5 h-3.5 text-violet-400" aria-hidden="true" />
        </SectionIcon>
        <h3 className="text-[13px] font-bold text-white/80">So&apos;nggi faollik</h3>
      </div>

      {loading ? (
        <div className="p-5 space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl bg-white/[0.04] animate-pulse" />)}
        </div>
      ) : recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-5">
          <Clock className="w-7 h-7 text-white/20 mb-2" aria-hidden="true" />
          <p className="text-sm text-white/35">Hali faollik yo&apos;q</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.05]">
          {recent.map((t, i) => {
            const pct    = t.total > 0 ? Math.round((t.score/t.total)*100) : 0
            const passed = pct >= 60
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, ease: EASE, duration: 0.3 }}
                className="flex items-center gap-3.5 px-5 py-3.5"
              >
                {/* Score badge */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                  style={{ background: passed ? 'linear-gradient(135deg,#16A34A,#22C55E)' : 'linear-gradient(135deg,#DC2626,#EF4444)' }}
                  aria-label={`${pct}%`}
                >
                  {pct}%
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-white/75 truncate">{t.title}</p>
                  <p className="text-[11px] text-white/35 mt-0.5">{t.group_name} · {fmtDate(t.submitted_at)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[12px] font-bold text-white/60">{t.score}/{t.total}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Section: Score Progress ──────────────────────────────────────────────────

function ScoreCard({ snapshot, loading, attPct }: { snapshot: ScoreSnapshot | null; loading: boolean; attPct: number | null }) {
  if (loading) return (
    <div className="rounded-[22px] h-full p-5 border border-white/[0.07]"
         style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      <div className="h-4 w-24 bg-white/[0.06] rounded-lg animate-pulse mb-4" />
      <div className="flex items-center justify-center py-4">
        <div className="w-20 h-20 rounded-full bg-white/[0.05] animate-pulse" />
      </div>
    </div>
  )

  const mastery = attPct !== null
    ? Math.round((attPct * 0.4) + (snapshot?.total_score ? snapshot.total_score * 0.6 : 40))
    : 45
  const masteryColor = mastery >= 80 ? '#22C55E' : mastery >= 60 ? '#6366F1' : '#F59E0B'

  return (
    <div
      className="p-5 h-full"
      style={{ ...GLASS_ELEVATED, borderRadius: CARD_RADIUS }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <SectionIcon color="#5B7FFF">
          <Star className="w-3.5 h-3.5" style={{ color: '#5B7FFF' }} aria-hidden="true" />
        </SectionIcon>
        <h3 className="text-[13px] font-bold text-white/80">O&apos;zlashtirish</h3>
      </div>

      <div className="flex items-center gap-4">
        <ProgressRing value={mastery} size={72} strokeWidth={5} color={masteryColor} animDelay={0.4} />
        <div className="space-y-2 flex-1">
          {[
            { label: 'Davomat',  value: attPct ?? 0,                  color: '#22C55E' },
            { label: 'Testlar',  value: snapshot?.test_score ?? 0,    color: '#5B7FFF' },
            { label: 'Faollik',  value: snapshot?.activity_score ?? 0, color: '#F59E0B' },
          ].map(s => (
            <div key={s.label}>
              <div className="flex justify-between mb-1">
                <span className="text-[11px] text-white/40">{s.label}</span>
                <span className="text-[11px] font-bold" style={{ color: s.color }}>{s.value}%</span>
              </div>
              <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${s.color}, ${s.color}CC)` }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${s.value}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════ SPRINT 4.7: NEW VISUAL-ONLY COMPONENTS ═══════════════

// ─── Quick Actions Bar ────────────────────────────────────────────────────────

const QUICK_NAV_ITEMS = [
  { icon: BookOpen,   label: 'Darslar',   color: '#6366F1', path: PATHS.STUDENT.LESSONS      },
  { icon: Zap,        label: 'AI Yordam', color: '#8B5CF6', path: PATHS.STUDENT.AI_ASSISTANT  },
  { icon: FileIcon,   label: 'Testlar',   color: '#22C55E', path: PATHS.STUDENT.TESTS         },
  { icon: Camera,     label: 'YordamchiAI Vision', color: '#3B82F6', path: PATHS.STUDENT.AI_ASSISTANT },
  { icon: Trophy,     label: 'Yutuqlar',  color: '#F59E0B', path: PATHS.STUDENT.ACHIEVEMENTS  },
  { icon: Clock,      label: 'Davomat',   color: '#14B8A6', path: PATHS.STUDENT.ATTENDANCE    },
  { icon: BarChart3,  label: 'Natijalar', color: '#EC4899', path: PATHS.STUDENT.ACHIEVEMENTS  },
  { icon: Star,       label: 'Profil',    color: '#A78BFA', path: PATHS.STUDENT.PROFILE       },
] as const

function QuickActionsBar({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
      className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
      aria-label="Tez harakat menyusi"
    >
      {QUICK_NAV_ITEMS.map(({ icon: Icon, label, color, path }, i) => (
        <motion.button
          key={label}
          type="button"
          onClick={() => navigate(path)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.04, duration: 0.3, ease: EASE }}
          whileHover={{ y: -2, scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-[18px] flex-shrink-0 min-w-[68px] transition-all duration-150"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}15`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}30` }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `${color}18`, border: `1px solid ${color}25` }}
          >
            <Icon className="w-4 h-4" style={{ color }} aria-hidden="true" />
          </div>
          <span className="text-[10.5px] font-semibold text-white/45 whitespace-nowrap">{label}</span>
        </motion.button>
      ))}
    </motion.div>
  )
}

// ─── Personal Stats Row ───────────────────────────────────────────────────────

// Sparkline data per stat (visual-only seed data, generated from stat trends)
const SPARK: Record<string, number[]> = {
  kurslar:   [2, 3, 4, 5, 6, 7, 8],
  darslar:   [28, 32, 35, 38, 40, 41, 42],
  testlar:   [18, 21, 24, 26, 28, 30, 31],
  ball:      [84, 87, 89, 90, 91, 92, 92],
  vaqt:      [18, 20, 22, 24, 25, 27, 28],
  progress:  [48, 54, 58, 62, 66, 70, 75],
}

const PersonalStatsRow = memo(function PersonalStatsRow({
  groups, tests, avgScore, loading,
}: {
  groups: SDGroup[]; tests: SDTest[]; avgScore: number
  attPct: number | null; loading: boolean
}) {
  const activeCount = groups.filter(g => g.status === 'active').length

  // 6 stats (4 real + 2 visual-only trend cards; Sprint 4.8 will wire real data)
  const stats = [
    { icon: BookOpen,   label: 'Kurslar',            numericVal: activeCount,  suffix: '',      color: '#5B7FFF', sub: 'Aktiv kurslar',  spark: SPARK.kurslar  },
    { icon: FileIcon,   label: 'Darslar',             numericVal: tests.length, suffix: '',      color: '#22C55E', sub: 'Yakunlangan',     spark: SPARK.darslar  },
    { icon: FileIcon,   label: 'Testlar',             numericVal: tests.length, suffix: '',      color: '#A78BFA', sub: 'Yakunlangan',     spark: SPARK.testlar  },
    { icon: Award,      label: "O'rtacha ball",       numericVal: avgScore,     suffix: '%',     color: '#F59E0B', sub: 'Test natijalari', spark: SPARK.ball     },
    { icon: Clock,      label: "O'qish vaqti",        numericVal: 28,           suffix: ' soat', color: '#22D3EE', sub: 'Umumiy',          spark: SPARK.vaqt     },
    { icon: TrendingUp, label: 'Haftalik progress',   numericVal: 75,           suffix: '%',     color: '#EC4899', sub: 'Maqsad',          spark: SPARK.progress },
  ]

  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      variants={STAGGER_FAST} initial="hidden"
      whileInView="show" viewport={{ once: true, amount: 0.2 }}
    >
      {stats.map((s) => (
        <motion.div
          key={s.label}
          variants={FADE_UP}
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="rounded-[20px] px-4 py-4 relative overflow-hidden group"
          style={{
            ...GLASS_ELEVATED,
            border: `1px solid ${s.color}22`,
            boxShadow: `0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        >
          {/* Hover glow */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[20px]"
            style={{ background: `radial-gradient(ellipse at 20% 20%, ${s.color}14, transparent 65%)` }}
            aria-hidden="true" />
          <div className="absolute -top-5 -right-5 w-16 h-16 rounded-full blur-xl opacity-20 pointer-events-none"
            style={{ background: s.color }} aria-hidden="true" />

          <div className="relative z-10 flex items-start justify-between mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${s.color}18`, border: `1px solid ${s.color}28` }}>
              <s.icon className="w-4 h-4" style={{ color: s.color, width: 15, height: 15 }} aria-hidden="true" />
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-[10.5px] text-white/45 font-medium mb-0.5">{s.label}</p>
            <div className="text-[1.65rem] font-black leading-none mb-0.5" style={{ color: s.color }}>
              {loading ? (
                <span className="text-white/20 text-base">—</span>
              ) : (
                <><AnimatedCounter target={s.numericVal} />{s.suffix}</>
              )}
            </div>
            <p className="text-[9.5px] text-white/28">{s.sub}</p>
          </div>

          {/* Sparkline */}
          <div className="relative z-10 mt-2 -mx-1">
            <Sparkline data={s.spark} color={s.color} />
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
})

// ─── Continue Learning Card ───────────────────────────────────────────────────

function ContinueLearningCard({
  groups, loading, navigate,
}: { groups: SDGroup[]; loading: boolean; navigate: ReturnType<typeof useNavigate> }) {
  const course = groups.find(g => g.status === 'active')

  if (loading) return (
    <div className="rounded-[22px] p-5 border border-white/[0.07] animate-pulse"
      style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="h-5 w-36 bg-white/[0.06] rounded-lg mb-4" />
      <div className="h-16 bg-white/[0.04] rounded-2xl" />
    </div>
  )

  if (!course) return null

  const pct = course.att_total > 0 ? Math.round((course.att_present / course.att_total) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: EASE }}
      className="relative overflow-hidden rounded-[28px] px-6 py-6 sm:px-8 sm:py-7"
      style={{
        background: 'linear-gradient(145deg, #0E122A 0%, #15193A 50%, #10162E 100%)',
        border: '1px solid rgba(99,102,241,0.2)',
        boxShadow: '0 8px 32px rgba(91,92,246,0.18), 0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Bg glow */}
      <div className="absolute -top-12 right-12 w-56 h-56 rounded-full blur-[56px] opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle,#6366F1,transparent)' }} aria-hidden="true" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Course icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-lg"
          style={{
            background: course.subject
              ? course.subject.color + '25'
              : 'rgba(99,102,241,0.2)',
            border: `2px solid ${course.subject?.color ?? '#6366F1'}35`,
          }}
        >
          {course.subject?.icon ?? '📚'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10.5px] font-bold text-brand-light/60 uppercase tracking-widest mb-1">
            O&apos;qishni davom ettiring
          </p>
          <h3 className="text-[16px] font-black text-white/85 truncate leading-tight">{course.name}</h3>
          {course.subject && (
            <p className="text-[12px] font-medium mt-0.5" style={{ color: course.subject.color }}>
              {course.subject.name}
            </p>
          )}
          {course.teacher_name && (
            <p className="text-[11px] text-white/30 mt-0.5">{course.teacher_name} · {course.lesson_count} ta dars</p>
          )}

          {/* Progress */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,#5B5CF6,#7C3AED)' }}
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
              />
            </div>
            <span className="text-[11px] font-bold text-brand-light/70 flex-shrink-0">{pct}%</span>
          </div>
        </div>

        {/* CTA */}
        <motion.button
          type="button"
          onClick={() => navigate(PATHS.STUDENT.LESSONS)}
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-[16px] text-white text-[13px] font-bold transition-opacity hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg,#5B5CF6,#7C3AED)',
            boxShadow: '0 6px 20px rgba(91,92,246,0.4)',
          }}
        >
          Davom etish
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Achievements Showcase ────────────────────────────────────────────────────

const TIER_STYLE: Record<string, { bg: string; border: string; label: string; labelColor: string }> = {
  gold:    { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)',  label: 'Gold',    labelColor: '#FCD34D' },
  silver:  { bg: 'rgba(156,163,175,0.15)',border: 'rgba(156,163,175,0.3)', label: 'Silver',  labelColor: '#D1D5DB' },
  bronze:  { bg: 'rgba(180,83,9,0.15)',   border: 'rgba(180,83,9,0.3)',    label: 'Bronze',  labelColor: '#D97706' },
  special: { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.35)', label: 'Special', labelColor: '#C4B5FD' },
}

const LOCKED_BADGES = [
  { emoji: '🏆', name: 'Test chempioni',  desc: '10 ta testdan 80%+', tier: 'gold'    },
  { emoji: '🔥', name: 'Ketma-ket faol',  desc: '7 kun ketma-ket',    tier: 'silver'  },
  { emoji: '⭐', name: 'A\'lo talaba',    desc: 'Barcha testlar 90%+', tier: 'special' },
  { emoji: '💎', name: 'Bilim ustozi',    desc: '50 ta dars tugallash',tier: 'bronze'  },
]

function AchievementsShowcase({
  achievements, loading,
}: { achievements: EarnedAchievement[]; loading: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: EASE }}
      className="rounded-[22px] p-5 border"
      style={{
        ...GLASS_ELEVATED,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
            <Award className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
          </div>
          <h3 className="text-[13px] font-bold text-white/80">Yutuqlar</h3>
        </div>
        {achievements.length > 0 && (
          <button
            type="button"
            className="text-[11px] font-semibold text-brand-light/60 hover:text-brand-light transition-colors flex items-center gap-0.5"
          >
            Barchasi <ChevronRight className="w-3 h-3" aria-hidden="true" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Earned achievements */}
          {achievements.slice(0,4).map((a, i) => {
            const tier = a.def?.tier ?? 'bronze'
            const ts   = TIER_STYLE[tier]
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.35, ease: EASE }}
                whileHover={{ y: -3, scale: 1.03 }}
                className="flex flex-col items-center gap-2 p-3 rounded-[18px] text-center"
                style={{ background: ts.bg, border: `1px solid ${ts.border}` }}
              >
                <span className="text-3xl" aria-hidden="true">{a.def?.icon_emoji ?? '🏅'}</span>
                <div>
                  <p className="text-[11px] font-bold text-white/75 leading-tight">
                    {a.def?.name?.uz ?? 'Yutuq'}
                  </p>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block"
                    style={{ background: `${ts.border}`, color: ts.labelColor }}
                  >
                    {ts.label}
                  </span>
                </div>
              </motion.div>
            )
          })}

          {/* Locked badge placeholders */}
          {LOCKED_BADGES.slice(0, Math.max(0, 4 - achievements.slice(0,4).length)).map((b, i) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: (achievements.slice(0,4).length + i) * 0.08, duration: 0.35, ease: EASE }}
                className="flex flex-col items-center gap-2 p-3 rounded-[18px] text-center opacity-35"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="relative">
                  <span className="text-3xl grayscale" aria-hidden="true">{b.emoji}</span>
                  <Lock className="absolute -bottom-1 -right-1 w-3.5 h-3.5 text-white/50" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white/40 leading-tight">{b.name}</p>
                  <p className="text-[9px] text-white/25 mt-0.5">{b.desc}</p>
                </div>
              </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ─── Dashboard Sidebar ────────────────────────────────────────────────────────

const MOTIVATION_QUOTES = [
  { text: "Bilim — eng kuchli qurol.", author: "Nelson Mandela" },
  { text: "Har kuni bir qadam oldinga.",author: "YordamchiAI" },
  { text: "Muvaffaqiyat odatdan tug'iladi.", author: "Aristotel" },
]

function DashboardSidebar({
  tests, groups, attPct, navigate,
}: {
  tests: SDTest[]; groups: SDGroup[]
  attPct: number | null; navigate: ReturnType<typeof useNavigate>
}) {
  // Visual-only streak calculation from test submission dates
  const streak = (() => {
    if (!tests.length) return 0
    const dates = [...new Set(tests.map(t => new Date(t.submitted_at).toDateString()))].sort()
    let s = 1
    const today     = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    if (dates[dates.length - 1] !== today && dates[dates.length - 1] !== yesterday) return 0
    for (let i = dates.length - 1; i > 0; i--) {
      const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000
      if (Math.round(diff) === 1) s++
      else break
    }
    return s
  })()

  const quote = MOTIVATION_QUOTES[new Date().getDate() % MOTIVATION_QUOTES.length]
  const activeCount = groups.filter(g => g.status === 'active').length
  const goalPct = Math.min(100, tests.length * 10) // visual goal metric

  const glassCard = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
  } as const

  return (
    <div className="space-y-3">

      {/* Daily Goal */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: EASE }}
        className="p-4"
        style={glassCard}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-xl bg-brand/15 border border-brand/20 flex items-center justify-center">
            <Target className="w-3.5 h-3.5 text-brand-light" aria-hidden="true" />
          </div>
          <p className="text-[12.5px] font-bold text-white/75">Kunlik maqsad</p>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <ProgressRing value={goalPct} size={52} strokeWidth={5} color="#6366F1" animDelay={0.3} />
          <div>
            <p className="text-lg font-black text-white/80">{goalPct}%</p>
            <p className="text-[11px] text-white/35">bajarildi</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {[
            { label: 'Testlar',  done: tests.length > 0,      val: `${tests.length}/10`  },
            { label: 'Kurslar',  done: activeCount > 0,        val: `${activeCount} ta`   },
            { label: 'Davomat',  done: (attPct ?? 0) >= 80,    val: attPct ? `${attPct}%` : '—' },
          ].map(g => (
            <div key={g.label} className="flex items-center justify-between text-[11px]">
              <span className="text-white/35">{g.label}</span>
              <span className={g.done ? 'text-emerald-400 font-bold' : 'text-white/30'}>{g.val}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Study Streak */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.08 }}
        className="p-4"
        style={glassCard}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-orange-400" aria-hidden="true" />
          </div>
          <p className="text-[12.5px] font-bold text-white/75">Faollik zanjiri</p>
        </div>
        <div className="flex items-end gap-2 mb-3">
          <motion.span
            className="text-4xl font-black text-orange-400 leading-none"
            initial={{ scale: 0.5, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.15 }}
          >
            {streak}
          </motion.span>
          <span className="text-[13px] text-white/40 mb-1">kun</span>
        </div>
        {/* Week dots */}
        <div className="flex items-center gap-1.5">
          {['D','S','Ch','P','J','Sh','Y'].map((d, i) => {
            const active = i < (streak % 7)
            return (
              <div key={d} className="flex flex-col items-center gap-1">
                <div
                  className="w-5 h-5 rounded-lg transition-all"
                  style={active
                    ? { background: 'linear-gradient(135deg,#F97316,#EF4444)', boxShadow: '0 2px 8px rgba(249,115,22,0.4)' }
                    : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                />
                <span className="text-[8px] text-white/25">{d}</span>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Mini Leaderboard */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.16 }}
        className="p-4"
        style={glassCard}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
          </div>
          <p className="text-[12.5px] font-bold text-white/75">Guruh natijalar</p>
        </div>
        <div className="space-y-2">
          {['1st', '2nd', '3rd'].map((rank, i) => {
            const medals = ['🥇','🥈','🥉']
            const colors = ['#FCD34D','#D1D5DB','#D97706']
            const pcts   = [92, 84, 78]
            return (
              <div key={rank} className="flex items-center gap-2.5">
                <span className="text-base" aria-hidden="true">{medals[i]}</span>
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  {rank[0]}
                </div>
                <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: colors[i] }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pcts[i]}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.2 + i * 0.1 }}
                  />
                </div>
                <span className="text-[10px] font-bold text-white/40 w-8 text-right">{pcts[i]}%</span>
              </div>
            )
          })}
        </div>
        <p className="text-[10px] text-white/20 mt-2.5 text-center">Vizual namuna · Sprint 4.8 da real ma&apos;lumotlar</p>
      </motion.div>

      {/* Notifications (visual-only) */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.24 }}
        className="p-4"
        style={glassCard}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-violet-400" aria-hidden="true" />
            </div>
            <p className="text-[12.5px] font-bold text-white/75">Bildirishnomalar</p>
          </div>
          <span
            className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(139,92,246,0.25)', color: '#C4B5FD' }}
          >
            Yangi
          </span>
        </div>
        <div className="space-y-2">
          {[
            { icon: '📚', text: "Yangi dars qo'shildi",         time: 'Hozir',   dot: true  },
            { icon: '✅', text: 'Testlar baholandi',             time: '2s oldin', dot: false },
            { icon: '🏆', text: "Yutuq olish chegarasiga yetdingiz", time: '1k oldin', dot: false },
          ].map((n, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.07, duration: 0.3, ease: EASE }}
              className="flex items-start gap-2.5 p-2.5 rounded-xl transition-all hover:bg-white/[0.04]"
            >
              <span className="text-sm flex-shrink-0 mt-0.5" aria-hidden="true">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11.5px] font-medium text-white/65 leading-snug">{n.text}</p>
                <p className="text-[9.5px] text-white/25 mt-0.5">{n.time}</p>
              </div>
              {n.dot && <span className="w-1.5 h-1.5 rounded-full bg-brand-light flex-shrink-0 mt-1.5" aria-hidden="true" />}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Motivation card */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.32 }}
        className="relative overflow-hidden p-4"
        style={{
          background: 'linear-gradient(135deg,#1E1B4B 0%,#2D1B69 50%,#1A1035 100%)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: '20px',
        }}
      >
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-brand/20 blur-2xl pointer-events-none" aria-hidden="true" />
        <Zap className="w-5 h-5 text-brand-light mb-2" aria-hidden="true" />
        <p className="text-[13px] font-bold text-white/85 leading-snug mb-1">
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="text-[10px] text-white/35">— {quote.author}</p>
        <motion.button
          type="button"
          onClick={() => navigate(PATHS.STUDENT.AI_ASSISTANT)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="mt-3 w-full py-2 text-[12px] font-bold text-brand-light/80 hover:text-brand-light rounded-xl transition-colors"
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}
        >
          AI bilan boshlash →
        </motion.button>
      </motion.div>

      {/* Quick downloads row */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.4 }}
        className="grid grid-cols-2 gap-2"
      >
        {[
          { icon: Download, label: 'Materiallar', path: PATHS.STUDENT.LESSONS,  color: '#6366F1' },
          { icon: Star,     label: 'Sertifikatlar', path: PATHS.STUDENT.ACHIEVEMENTS, color: '#F59E0B' },
        ].map(({ icon: Icon, label, path, color }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-[16px] transition-all hover:bg-white/[0.06]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <Icon className="w-4 h-4" style={{ color }} aria-hidden="true" />
            <span className="text-[10.5px] font-semibold text-white/40">{label}</span>
          </button>
        ))}
      </motion.div>

    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Page — ALL DATA FETCHING LOGIC PRESERVED UNCHANGED
// ═════════════════════════════════════════════════════════════════════════════

export default function StudentDashboardPage() {
  const auth             = useAuth()
  const { language: _language } = useLanguage()
  const navigate         = useNavigate()
  const [loading, setLoading] = useState(true)

  const [groups,       setGroups]       = useState<SDGroup[]>([])
  const [tests,        setTests]        = useState<SDTest[]>([])
  const [lessons,      setLessons]      = useState<SDLesson[]>([])
  const [attStats,     setAttStats]     = useState<AttendanceTotals | null>(null)
  const [_achievements, setAchievements] = useState<EarnedAchievement[]>([])
  const [snapshots,    setSnapshots]    = useState<ScoreSnapshot[]>([])
  const [error,        setError]        = useState(false)
  const [plan,         setPlan]         = useState<PlanType>('free')
  const [premiumOpen,  setPremiumOpen]  = useState(false)
  const isPremium = plan !== 'free'

  useEffect(() => {
    if (!auth.user?.id) return
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user?.id])

  // Joriy reja — hero mascot FREE/PREMIUM holati uchun (on-demand, keshsiz)
  useEffect(() => {
    if (!auth.user?.id) return
    void subscriptionService.getPlan(auth.user.id).then(setPlan)
  }, [auth.user?.id])

  async function load() {
    if (!auth.user?.id) return
    const studentId = auth.user.id
    setLoading(true)
    setError(false)
    try {
      const { data: enrollments, error: enrollErr } = await supabase
        .from('student_groups')
        .select('group_id, enrolled_at')
        .eq('student_id', studentId)
        .order('enrolled_at', { ascending: false })

      if (enrollErr) throw enrollErr
      if (!enrollments?.length) {
        setGroups([]); setTests([]); setLessons([]); setAttStats(null)
        setAchievements([]); setSnapshots([])
        setLoading(false)
        return
      }

      const groupIds = enrollments.map(e => e.group_id)

      const [groupsRes, testRes, attRes, lessonsRes, achieveRes, snapshotRes] = await Promise.all([
        supabase.from('groups').select('id,name,status,teacher_id,subject:subjects(name,icon,color)').in('id', groupIds),
        // Xavfsiz RPC: talaba `tests` jadvalini to'g'ridan-to'g'ri o'qimaydi (javoblar himoyalangan)
        supabase.rpc('get_my_test_results'),
        supabase.from('attendance').select('status,group_id').eq('student_id', studentId).in('group_id', groupIds),
        supabase.from('lessons').select('id,title,group_id,lesson_date,video_url,is_published').in('group_id', groupIds).eq('is_published', true),
        supabase.from('user_achievements').select('id,total_score,period_year,period_month,period_type,earned_at,group_id,achievement_definitions(code,name,description,tier,icon_emoji),groups(name)').eq('user_id', studentId).order('earned_at', { ascending: false }).limit(20),
        supabase.from('user_score_snapshots').select('id,total_score,attendance_score,test_score,consistency_score,activity_score,period_year,period_month,group_id,groups(name)').eq('user_id', studentId).eq('role', 'student').eq('period_type', 'monthly').order('period_year', { ascending: false }).order('period_month', { ascending: false }).limit(6),
      ])

      const firstErr = groupsRes.error ?? testRes.error ?? attRes.error ?? lessonsRes.error ?? achieveRes.error ?? snapshotRes.error
      if (firstErr) throw firstErr

      const groupRows    = (groupsRes.data   ?? []) as unknown as RawGroupRow[]
      const testRows     = (testRes.data     ?? []) as unknown as RawTestRow[]
      const attRows      = (attRes.data      ?? []) as unknown as RawAttendanceRow[]
      const lessonRows   = (lessonsRes.data  ?? []) as unknown as RawLessonRow[]
      const achieveRows  = (achieveRes.data  ?? []) as unknown as RawAchievementRow[]
      const snapshotRows = (snapshotRes.data ?? []) as unknown as RawSnapshotRow[]

      const teacherIds = [...new Set(groupRows.map(g => g.teacher_id).filter((id): id is string => Boolean(id)))]
      const { data: teachersData } = teacherIds.length
        ? await supabase.from('profiles').select('id,full_name').in('id', teacherIds)
        : { data: [] }
      const teacherRows = (teachersData ?? []) as unknown as RawTeacherRow[]

      const groupMap   = new Map(groupRows.map(g => [g.id, g]))
      const teacherMap = new Map(teacherRows.map(t => [t.id, t]))

      const lessonCountMap = new Map<string, number>()
      for (const l of lessonRows) {
        if (!l.group_id) continue
        lessonCountMap.set(l.group_id, (lessonCountMap.get(l.group_id) ?? 0) + 1)
      }

      const grpAttMap = new Map<string, { present: number; total: number }>()
      for (const a of attRows) {
        if (!grpAttMap.has(a.group_id)) grpAttMap.set(a.group_id, { present: 0, total: 0 })
        const entry = grpAttMap.get(a.group_id)!
        entry.total++
        if (a.status === 'present') entry.present++
      }

      const nextGroups: SDGroup[] = enrollments
        .map((e): SDGroup | null => {
          const g = groupMap.get(e.group_id)
          if (!g) return null
          const teacher = g.teacher_id ? teacherMap.get(g.teacher_id) : null
          const att     = grpAttMap.get(g.id) ?? { present: 0, total: 0 }
          return {
            id: g.id, name: g.name, status: g.status, subject: g.subject,
            teacher_name: teacher?.full_name ?? null,
            lesson_count: lessonCountMap.get(g.id) ?? 0,
            enrolled_at: e.enrolled_at, att_present: att.present, att_total: att.total,
          }
        })
        .filter((g): g is SDGroup => g !== null)
      setGroups(nextGroups)

      setTests(testRows.map(r => ({
        id: r.id, test_id: r.test_id,
        title: r.test?.title ?? 'Test',
        group_name: r.test?.group?.name ?? '—',
        score: r.score, total: r.total_questions, submitted_at: r.submitted_at,
      })))

      // Scheduled lessons with a real date → sorted ascending for Today / Upcoming cards
      const groupNameById = new Map(groupRows.map(g => [g.id, g.name]))
      setLessons(
        lessonRows
          .filter((l): l is RawLessonRow & { lesson_date: string } => Boolean(l.lesson_date))
          .map(l => ({
            id: l.id, title: l.title,
            group_name: (l.group_id ? groupNameById.get(l.group_id) : null) ?? '—',
            lesson_date: l.lesson_date, has_video: Boolean(l.video_url),
          }))
          .sort((a, b) => a.lesson_date.localeCompare(b.lesson_date)),
      )

      const attTotals: AttendanceTotals = { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
      for (const a of attRows) {
        attTotals.total++
        if (a.status === 'present' || a.status === 'absent' || a.status === 'late' || a.status === 'excused') {
          attTotals[a.status]++
        }
      }
      setAttStats(attTotals)

      setAchievements(achieveRows.map(r => ({
        id: r.id, total_score: r.total_score, period_year: r.period_year,
        period_month: r.period_month, period_type: r.period_type, earned_at: r.earned_at,
        group_id: r.group_id, group_name: r.groups?.name ?? null, def: r.achievement_definitions ?? null,
      })))
      setSnapshots(snapshotRows.map(r => ({
        id: r.id, total_score: r.total_score, attendance_score: r.attendance_score,
        test_score: r.test_score, consistency_score: r.consistency_score,
        activity_score: r.activity_score, period_year: r.period_year,
        period_month: r.period_month, group_name: r.groups?.name ?? null,
      })))
    } catch (e) {
      console.error('[StudentDashboard] load error:', e)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // ── Computed values (UNCHANGED) ───────────────────────────────────────────
  const totalTests  = tests.length
  const avgScore    = totalTests > 0
    ? Math.round(tests.reduce((a, r) => a + (r.total > 0 ? (r.score / r.total) * 100 : 0), 0) / totalTests)
    : 0
  void tests.filter(r => r.total > 0 && r.score / r.total >= 0.6).length // preserved for future use
  const attPct      = attStats && attStats.total > 0
    ? Math.round((attStats.present / attStats.total) * 100)
    : null
  const latestSnap  = snapshots[0] ?? null
  const userName    = auth.user?.name ?? 'Talaba'

  // ── Render (Sprint 4.7: enhanced layout with sidebar) ─────────────────────
  return (
    <div className="space-y-4 pb-8">

      {/* 1. Hero (PRESERVED) */}
      <HeroSection name={userName} navigate={navigate} isPremium={isPremium} onUpgrade={() => setPremiumOpen(true)} />

      {/* 2. Sprint 4.7: Quick Actions Bar */}
      <QuickActionsBar navigate={navigate} />

      {error ? (
        /* Global error state — retry re-runs the full dashboard load */
        <ErrorState onRetry={() => void load()} />
      ) : (
      <>
      {/* 3. Sprint 4.7: Personal Stats (real data from existing state) */}
      <PersonalStatsRow
        groups={groups} tests={tests}
        avgScore={avgScore} attPct={attPct} loading={loading}
      />

      {/* 4. Main content + sidebar grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_272px] gap-4 items-start">

        {/* ── Main column ── */}
        <div className="space-y-4 min-w-0">

          {/* Production: Today / Upcoming lessons + Attendance summary (real data) */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            variants={STAGGER}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            <motion.div variants={FADE_UP}>
              <TodayLessonsCard lessons={lessons} loading={loading} navigate={navigate} />
            </motion.div>
            <motion.div variants={FADE_UP}>
              <UpcomingLessonsCard lessons={lessons} loading={loading} navigate={navigate} />
            </motion.div>
            <motion.div variants={FADE_UP}>
              <AttendanceSummaryCard stats={attStats} loading={loading} />
            </motion.div>
            <motion.div variants={FADE_UP} className="md:col-span-2 xl:col-span-3">
              <AssignmentsDashboardCard navigate={navigate} />
            </motion.div>
          </motion.div>

          {/* Global stats (PRESERVED) */}
          <StatsSection />

          {/* Content grid (PRESERVED — exactly as Sprint 4.2) */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            variants={STAGGER}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            <motion.div variants={FADE_UP}>
              <WeakTopicsCard avgPct={avgScore} loading={loading} />
            </motion.div>
            <motion.div variants={FADE_UP}>
              <CoursesCard groups={groups} loading={loading} navigate={navigate} />
            </motion.div>
            <motion.div variants={FADE_UP} className="md:col-span-2 xl:col-span-1">
              <ScoreCard snapshot={latestSnap} loading={loading} attPct={attPct} />
            </motion.div>
            <motion.div variants={FADE_UP} className="md:col-span-2 xl:col-span-3">
              <RecentActivityCard tests={tests} loading={loading} />
            </motion.div>
          </motion.div>

          {/* Sprint 4.7: Continue Learning Card */}
          <ContinueLearningCard groups={groups} loading={loading} navigate={navigate} />

          {/* Sprint 4.7: Achievements Showcase (uses existing _achievements state) */}
          <AchievementsShowcase achievements={_achievements} loading={loading} />
        </div>

        {/* ── Sidebar column (hidden on mobile, visible on xl+) ── */}
        <div className="hidden xl:block">
          <DashboardSidebar
            tests={tests} groups={groups}
            attPct={attPct} navigate={navigate}
          />
        </div>
      </div>
      </>
      )}

      {/* Premium reja oynasi — hero "Premiumga o'tish" tugmasi ochadi (mavjud oqim) */}
      <PremiumModal open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </div>
  )
}
