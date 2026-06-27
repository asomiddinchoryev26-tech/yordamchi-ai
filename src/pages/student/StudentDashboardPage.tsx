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

import { useState, useEffect, useRef, memo } from 'react'
import {
  Camera, ImageIcon, FileText as FileIcon, Mic, Send,
  ArrowRight, CheckCircle, BookOpen, Clock, Zap, Trophy,
  TrendingUp, ChevronRight, Star, Lock,
  // Sprint 4.7 additions — new visual icons only
  Flame, Award, Target, Bell, BarChart3, Users, Download,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { PATHS } from '@/routes/paths'
import { ProgressRing } from '@/components/dashboard'
import { Badge } from '@/components/ui/Badge'

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

// ─── Sprint 4.7 Phase 1: Dynamic greeting helpers (pure, no side effects) ─────

const UZ_DAYS = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'] as const

function getTimeGreeting(hour: number): string {
  if (hour >= 5  && hour < 12) return 'Xayrli tong'
  if (hour >= 12 && hour < 17) return 'Xayrli kun'
  if (hour >= 17 && hour < 21) return 'Xayrli kech'
  return 'Xayrli tun'
}

function getLiveDate() {
  const now     = new Date()
  const hour    = now.getHours()
  const weekday = UZ_DAYS[now.getDay()]
  const dd      = String(now.getDate()).padStart(2, '0')
  const mm      = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy    = now.getFullYear()
  return { greeting: getTimeGreeting(hour), weekday, date: `${dd}.${mm}.${yyyy}` }
}

// ─── Sprint 4.7 Phase 1: Student Illustration (CSS art, no assets) ────────────

function StudentIllustration() {
  const EASE_SPRING: [number,number,number,number] = [0.21,0.47,0.32,0.98]

  return (
    <div className="relative w-52 h-64 flex items-end justify-center select-none" aria-hidden="true">
      {/* Background radial glow */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div
          className="w-52 h-52 rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, #6366F1 0%, #7C3AED 40%, transparent 70%)' }}
        />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Head */}
        <div
          className="w-14 h-14 rounded-full relative overflow-hidden flex-shrink-0"
          style={{ background: 'linear-gradient(145deg, #F0C4A0, #D4926A)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
        >
          {/* Hair */}
          <div
            className="absolute top-0 inset-x-0 h-7 rounded-t-full"
            style={{ background: 'linear-gradient(145deg, #1A1040, #2D1B69)' }}
          />
          {/* Ears */}
          <div className="absolute top-5 -left-1 w-3 h-4 rounded-full" style={{ background: '#D4926A' }} />
          <div className="absolute top-5 -right-1 w-3 h-4 rounded-full" style={{ background: '#D4926A' }} />
        </div>

        {/* Neck */}
        <div className="w-5 h-2 flex-shrink-0" style={{ background: '#D4926A' }} />

        {/* Hoodie body */}
        <div
          className="relative w-28 h-28 rounded-[28px] flex flex-col items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(145deg, #1A1040 0%, #2D1B69 45%, #1E1B4B 100%)',
            boxShadow: '0 8px 32px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* Hood behind head */}
          <div
            className="absolute -top-3 inset-x-4 h-8 rounded-t-[28px]"
            style={{ background: 'linear-gradient(180deg, #2D1B69, #1A1040)' }}
          />

          {/* Brand Y on hoodie */}
          <motion.span
            className="text-3xl font-black relative z-10"
            style={{
              background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 50%, #A78BFA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            Y
          </motion.span>

          {/* Left arm */}
          <div
            className="absolute top-3 -left-4 w-5 h-14 rounded-full -rotate-6"
            style={{ background: 'linear-gradient(145deg, #2D1B69, #1A1040)' }}
          />
          {/* Right arm */}
          <div
            className="absolute top-3 -right-4 w-5 h-14 rounded-full rotate-6"
            style={{ background: 'linear-gradient(145deg, #2D1B69, #1A1040)' }}
          />

          {/* Left hand */}
          <div className="absolute -bottom-2 -left-2 w-5 h-5 rounded-full" style={{ background: '#D4926A' }} />
          {/* Right hand */}
          <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full" style={{ background: '#D4926A' }} />
        </div>

        {/* Laptop */}
        <div className="relative -mt-1 flex-shrink-0">
          {/* Screen */}
          <div
            className="w-28 h-16 rounded-[10px] flex items-center justify-center overflow-hidden relative"
            style={{
              background: '#060916',
              border: '2px solid rgba(99,102,241,0.5)',
              boxShadow: '0 0 24px rgba(99,102,241,0.3), inset 0 0 16px rgba(99,102,241,0.08)',
            }}
          >
            {/* Screen ambient glow */}
            <div
              className="absolute inset-0 opacity-15"
              style={{ background: 'radial-gradient(circle at 50% 100%, #6366F1, transparent 65%)' }}
            />
            {/* Scan line animation */}
            <motion.div
              className="absolute inset-x-0 h-px opacity-40"
              style={{ background: 'linear-gradient(90deg, transparent, #818CF8, transparent)' }}
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            />
            {/* Glowing Y on screen */}
            <motion.span
              className="relative z-10 text-xl font-black"
              style={{
                background: 'linear-gradient(135deg, #A5B4FC, #6366F1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.8))',
              }}
              animate={{
                filter: [
                  'drop-shadow(0 0 6px rgba(99,102,241,0.6))',
                  'drop-shadow(0 0 16px rgba(99,102,241,1))',
                  'drop-shadow(0 0 6px rgba(99,102,241,0.6))',
                ],
                scale: [0.95, 1.05, 0.95],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              Y
            </motion.span>
          </div>
          {/* Laptop hinge */}
          <div
            className="w-1 h-2 mx-auto"
            style={{ background: 'linear-gradient(180deg,#374151,#1F2937)' }}
          />
          {/* Laptop base */}
          <div
            className="w-32 h-2 rounded-b-lg -mt-0.5"
            style={{
              background: 'linear-gradient(145deg, #374151, #1F2937)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
            }}
          />
          {/* Laptop shadow */}
          <div
            className="w-28 h-2 mx-auto rounded-full mt-1 blur-md opacity-50"
            style={{ background: 'rgba(99,102,241,0.4)' }}
          />
        </div>
      </motion.div>

      {/* Floating particles */}
      {[
        { top: '15%', left: '8%',  size: 5, delay: 0,    color: '#818CF8' },
        { top: '30%', right: '5%', size: 4, delay: 0.8,  color: '#A78BFA' },
        { top: '60%', left: '5%',  size: 3, delay: 1.5,  color: '#6366F1' },
        { top: '70%', right: '8%', size: 5, delay: 2.2,  color: '#7C3AED' },
        { top: '10%', right:'15%', size: 3, delay: 0.4,  color: '#C4B5FD' },
      ].map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            top: p.top, left: (p as any).left, right: (p as any).right,
            width: p.size, height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
          animate={{ y: [-4, 4, -4], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.5 + p.delay * 0.4, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
        />
      ))}

      {void EASE_SPRING}
    </div>
  )
}


// ─── Quick Prompt Chips ───────────────────────────────────────────────────────

const QUICK_TOPICS = [
  'Algebra', 'Fizika', 'Kimyo', 'Ingliz tili', 'Tarix', 'Insho', 'Dars rejasi',
]

// ─── Home AI Input ────────────────────────────────────────────────────────────
// Navigates to AI Assistant on submit — no direct AI calls on home page.

function HomeAIInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(text); setText('') }
  }

  return (
    <div
      className="rounded-[20px] overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}
    >
      {/* Textarea row */}
      <div className="flex items-end gap-3 px-4 py-3">
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => { setText(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
          onKeyDown={handleKeyDown}
          placeholder="Savolingizni yozing yoki rasm/PDF yuklang…"
          rows={1}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 resize-none outline-none leading-6 max-h-28 py-0.5"
          aria-label="AI ga savol yozing"
        />
        {/* Send */}
        <motion.button
          type="button"
          onClick={() => { onSubmit(text); setText('') }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
          style={{
            background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)',
            boxShadow: '0 4px 16px rgba(91,92,246,0.45)',
          }}
          aria-label="Yuborish"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
        </motion.button>
      </div>

      {/* Action buttons row */}
      <div className="flex items-center gap-0.5 px-4 pb-3">
        {[
          { icon: Camera,    label: 'Kamera' },
          { icon: ImageIcon, label: 'Galereya' },
          { icon: FileIcon,  label: 'PDF' },
          { icon: Mic,       label: 'Ovoz' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            onClick={() => onSubmit('')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-semibold text-white/50 hover:text-white/80 hover:bg-white/[0.07] transition-all duration-150"
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Section: Hero (Sprint 4.7 Phase 1 — Premium redesign with greeting) ─────
// All navigation logic preserved: navigate(PATHS.STUDENT.AI_ASSISTANT/LESSONS)
// All existing functionality: HomeAIInput, quick chips, CTA buttons

function HeroSection({ name, navigate }: { name: string; navigate: ReturnType<typeof useNavigate> }) {
  const { greeting, weekday, date } = getLiveDate()

  return (
    <div
      className="relative overflow-hidden rounded-[28px] px-6 py-8 sm:px-10 sm:py-10"
      style={{
        background: 'linear-gradient(145deg, #07091A 0%, #0E1230 40%, #130D2E 75%, #080C1F 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset, 0 24px 64px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Ambient background orbs */}
      <div className="absolute pointer-events-none inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 right-16 w-96 h-96 rounded-full blur-[100px] opacity-20"
          style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 65%)' }} />
        <div className="absolute -bottom-20 left-10 w-72 h-72 rounded-full blur-[80px] opacity-15"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 65%)' }} />
        <div className="absolute top-1/3 right-1/3 w-52 h-52 rounded-full blur-[60px] opacity-08"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 65%)' }} />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
        {/* Left: Dynamic greeting + content */}
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-5">

          {/* Dynamic time-based greeting block */}
          <motion.div variants={FADE_UP} className="space-y-1">
            {/* Greeting + name */}
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
                {greeting},&nbsp;
                <span
                  style={{
                    background: 'linear-gradient(135deg, #818CF8 0%, #C4B5FD 50%, #A78BFA 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {name}
                </span>
                &nbsp;<span className="not-italic">👋</span>
              </h1>
            </div>

            {/* Weekday + date */}
            <div className="flex items-center gap-3">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)', color: '#C4B5FD' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                Bugun {weekday}
              </div>
              <span className="text-[12px] text-white/30 font-medium">{date}</span>
            </div>
          </motion.div>

          {/* AI availability badge */}
          <motion.div variants={FADE_UP}>
            <Badge
              variant="brand"
              dot
              pulse
              className="bg-brand/15 dark:bg-brand/15 border border-brand/25 text-brand-light"
            >
              AI sizga 24/7 yordam beradi
            </Badge>
          </motion.div>

          {/* Subtitle */}
          <motion.div variants={FADE_UP}>
            <p className="text-[15px] text-white/50 max-w-md leading-relaxed">
              Imtihondan qo&apos;rqmang — bugun qaysi mavzuni o&apos;rganamiz?
            </p>
          </motion.div>

          {/* CTA buttons (PRESERVED — same navigate calls) */}
          <motion.div variants={FADE_UP} className="flex flex-wrap gap-3">
            <motion.button
              type="button"
              onClick={() => navigate(PATHS.STUDENT.AI_ASSISTANT)}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[18px] text-white font-bold text-[14px] transition-opacity hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)',
                boxShadow: '0 8px 24px rgba(91,92,246,0.45), 0 2px 8px rgba(91,92,246,0.2)',
              }}
            >
              <Zap className="w-4 h-4" aria-hidden="true" />
              AI bilan suhbatni boshlash
            </motion.button>

            <motion.button
              type="button"
              onClick={() => navigate(PATHS.STUDENT.LESSONS)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-[18px] text-white/65 hover:text-white/90 font-semibold text-[14px] transition-all border border-white/[0.12] hover:border-white/25 hover:bg-white/[0.05]"
            >
              Darslarim
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </motion.button>
          </motion.div>

          {/* Home AI Input (PRESERVED — same onSubmit handler, same navigate target) */}
          <motion.div variants={FADE_UP} className="max-w-lg">
            <HomeAIInput onSubmit={(text) => {
              navigate(text ? PATHS.STUDENT.AI_ASSISTANT : PATHS.STUDENT.AI_ASSISTANT)
            }} />
          </motion.div>

          {/* Quick Prompt Chips (PRESERVED — same navigate call, same QUICK_TOPICS) */}
          <motion.div variants={FADE_UP} className="flex flex-wrap gap-2 pt-1">
            {QUICK_TOPICS.map((topic, i) => (
              <motion.button
                key={topic}
                type="button"
                onClick={() => navigate(PATHS.STUDENT.AI_ASSISTANT)}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.06, duration: 0.3, ease: EASE }}
                className="px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold border transition-all duration-150"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderColor: 'rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.72)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.background = 'rgba(99,102,241,0.2)'
                  el.style.borderColor = 'rgba(99,102,241,0.4)'
                  el.style.color = '#C4B5FD'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.background = 'rgba(255,255,255,0.06)'
                  el.style.borderColor = 'rgba(255,255,255,0.12)'
                  el.style.color = 'rgba(255,255,255,0.72)'
                }}
              >
                {topic}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Right: Premium Student Illustration (replaces RobotMascot visually) */}
        <motion.div
          className="hidden lg:flex items-center justify-center pr-2"
          initial={{ opacity: 0, x: 30, scale: 0.85 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
        >
          <StudentIllustration />
        </motion.div>
      </div>
    </div>
  )
}

// ─── Section: Statistics ──────────────────────────────────────────────────────

const GLOBAL_STATS = [
  { emoji: '✔', value: '15 000+', label: 'Yechilgan savollar',         color: '#22C55E' },
  { emoji: '✔', value: '98%',     label: 'Aniqlik darajasi',           color: '#6366F1' },
  { emoji: '✔', value: '24/7',    label: 'AI mavjud',                  color: '#F59E0B' },
  { emoji: '✔', value: '3',       label: "Qo'llab-quvvatlanadigan tillar", color: '#3B82F6' },
]

function StatsSection() {
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
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="rounded-[20px] p-5 border cursor-default"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderColor: 'rgba(255,255,255,0.07)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          }}
        >
          {/* Top icon bar */}
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm mb-3"
            style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}
          >
            <CheckCircle className="w-4 h-4" style={{ color: s.color }} aria-hidden="true" />
          </div>

          <div
            className="text-[1.9rem] font-black leading-none mb-1.5 tracking-tight"
            style={{ color: s.color }}
          >
            {s.value}
          </div>
          <p className="text-[12px] text-white/50 font-medium leading-snug">{s.label}</p>

          {/* Bottom accent line */}
          <div className="mt-3 h-[2px] rounded-full" style={{ background: `linear-gradient(90deg, ${s.color}60, transparent)` }} />
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
      className="rounded-[24px] p-5 border h-full"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: 'rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
          <TrendingUp className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
        </div>
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
      className="rounded-[24px] p-5 border h-full"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: 'rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand/15 border border-brand/20 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-brand-light" aria-hidden="true" />
          </div>
          <h3 className="text-[13px] font-bold text-white/80">Faol kurslar</h3>
        </div>
        <button
          type="button"
          onClick={() => navigate(PATHS.STUDENT.LESSONS)}
          className="text-[11px] font-semibold text-brand-light/70 hover:text-brand-light transition-colors flex items-center gap-0.5"
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
      className="rounded-[24px] border overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: 'rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
          <Clock className="w-3.5 h-3.5 text-violet-400" aria-hidden="true" />
        </div>
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
    <div className="rounded-[24px] h-full p-5 border border-white/[0.07]"
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
      className="rounded-[24px] p-5 border h-full"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: 'rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-brand/15 border border-brand/20 flex items-center justify-center">
          <Star className="w-3.5 h-3.5 text-brand-light" aria-hidden="true" />
        </div>
        <h3 className="text-[13px] font-bold text-white/80">O&apos;zlashtirish</h3>
      </div>

      <div className="flex items-center gap-4">
        <ProgressRing value={mastery} size={72} strokeWidth={6} color={masteryColor} animDelay={0.4} />
        <div className="space-y-2 flex-1">
          {[
            { label: 'Davomat',  value: attPct ?? 0,               color: '#22C55E' },
            { label: 'Testlar',  value: snapshot?.test_score ?? 0,  color: '#6366F1' },
            { label: 'Faollik',  value: snapshot?.activity_score ?? 0, color: '#F59E0B' },
          ].map(s => (
            <div key={s.label}>
              <div className="flex justify-between mb-1">
                <span className="text-[11px] text-white/45">{s.label}</span>
                <span className="text-[11px] font-bold" style={{ color: s.color }}>{s.value}%</span>
              </div>
              <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: s.color }}
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

// ─── Section: Coming Soon ─────────────────────────────────────────────────────

const COMING_SOON = [
  { icon: '🤖', name: 'Universal AI',        desc: 'Har turdagi savollar uchun'   },
  { icon: '👁',  name: 'AI Vision',           desc: "Rasm va PDF tahlil qilish"     },
  { icon: '📝', name: 'Smart Test Generator', desc: 'AI yordamida test yaratish'   },
]

function ComingSoonCard() {
  return (
    <div
      className="rounded-[24px] p-5 border h-full"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: 'rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
          <Lock className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
        </div>
        <h3 className="text-[13px] font-bold text-white/80">Yaqinda qo&apos;shiladi</h3>
      </div>

      <div className="space-y-3">
        {COMING_SOON.map((f, i) => (
          <motion.div
            key={f.name}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, ease: EASE, duration: 0.35 }}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="text-xl flex-shrink-0" aria-hidden="true">{f.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-white/70">{f.name}</p>
              <p className="text-[11px] text-white/35">{f.desc}</p>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              Tez orada
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Section: Premium Banner ──────────────────────────────────────────────────

function PremiumBanner({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-[28px] px-8 py-10 text-center"
      style={{
        background: 'linear-gradient(135deg, #4338CA 0%, #5B5CF6 35%, #7C3AED 70%, #6D28D9 100%)',
        boxShadow: '0 16px 48px rgba(91,92,246,0.35), 0 4px 16px rgba(91,92,246,0.2)',
      }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {/* Decorative orbs */}
      <div className="absolute pointer-events-none" aria-hidden="true">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-black/20 blur-3xl" />
      </div>

      <div className="relative z-10">
        <Trophy className="w-8 h-8 text-white/80 mx-auto mb-3" aria-hidden="true" />
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
          Bilimingizni yangi bosqichga olib chiqing.
        </h2>
        <p className="text-white/65 mb-6 max-w-md mx-auto text-sm leading-relaxed">
          AI o&apos;qituvchi bilan istalgan mavzuni o&apos;rganing, testlarda muvaffaqiyat qozonin!
        </p>
        <motion.button
          type="button"
          onClick={() => navigate(PATHS.STUDENT.AI_ASSISTANT)}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[18px] bg-white text-brand font-bold text-[14px] transition-all hover:bg-white/90"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
        >
          <Zap className="w-4 h-4" aria-hidden="true" />
          AI bilan boshlash
        </motion.button>
      </div>
    </motion.div>
  )
}

// ═══════════════════════ SPRINT 4.7: NEW VISUAL-ONLY COMPONENTS ═══════════════

// ─── Quick Actions Bar ────────────────────────────────────────────────────────

const QUICK_NAV_ITEMS = [
  { icon: BookOpen,   label: 'Darslar',   color: '#6366F1', path: PATHS.STUDENT.LESSONS      },
  { icon: Zap,        label: 'AI Yordam', color: '#8B5CF6', path: PATHS.STUDENT.AI_ASSISTANT  },
  { icon: FileIcon,   label: 'Testlar',   color: '#22C55E', path: PATHS.STUDENT.TESTS         },
  { icon: Camera,     label: 'AI Vision', color: '#3B82F6', path: PATHS.STUDENT.AI_VISION     },
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

const PersonalStatsRow = memo(function PersonalStatsRow({
  groups, tests, avgScore, attPct, loading,
}: {
  groups: SDGroup[]; tests: SDTest[]; avgScore: number
  attPct: number | null; loading: boolean
}) {
  const activeCount = groups.filter(g => g.status === 'active').length
  const stats = [
    { icon: BookOpen,  label: 'Faol kurslar',    value: loading ? '…' : String(activeCount),     color: '#6366F1', sub: `${groups.length} ta jami` },
    { icon: FileIcon,  label: 'Test topshirildi', value: loading ? '…' : String(tests.length),   color: '#22C55E', sub: 'umumiy'                    },
    { icon: Award,     label: "O'rtacha ball",    value: loading ? '…' : `${avgScore}%`,          color: '#F59E0B', sub: 'testlar bo\'yicha'          },
    { icon: Users,     label: 'Davomat',          value: loading ? '…' : (attPct !== null ? `${attPct}%` : '—'), color: '#14B8A6', sub: "darslarning" },
  ]

  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      variants={STAGGER_FAST} initial="hidden"
      whileInView="show" viewport={{ once: true, amount: 0.3 }}
    >
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          variants={FADE_UP}
          whileHover={{ y: -3, scale: 1.015 }}
          transition={{ duration: 0.18 }}
          className="rounded-[20px] p-4 border relative overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderColor: `${s.color}20`,
            boxShadow: `0 4px 20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)`,
          }}
        >
          {/* Glow accent */}
          <div
            className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none"
            style={{ background: s.color }}
            aria-hidden="true"
          />
          <div className="relative">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}
            >
              <s.icon className="w-4 h-4" style={{ color: s.color }} aria-hidden="true" />
            </div>
            <motion.div
              className="text-2xl font-black leading-none mb-1"
              style={{ color: s.color }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
            >
              {s.value}
            </motion.div>
            <p className="text-[11px] font-bold text-white/60 leading-tight">{s.label}</p>
            <p className="text-[10px] text-white/25 mt-0.5">{s.sub}</p>
          </div>
          <motion.div
            className="absolute bottom-0 inset-x-0 h-[2px] rounded-b-[20px]"
            style={{ background: `linear-gradient(90deg, ${s.color}60, transparent)` }}
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + i * 0.07, duration: 0.8, ease: EASE }}
          />
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
    <div className="rounded-[24px] p-5 border border-white/[0.07] animate-pulse"
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
      className="rounded-[24px] p-5 border"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: 'rgba(255,255,255,0.07)',
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
  const [attStats,     setAttStats]     = useState<{
    present: number; absent: number; late: number; excused: number; total: number
  } | null>(null)
  const [_achievements, setAchievements] = useState<EarnedAchievement[]>([])
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
      <HeroSection name={userName} navigate={navigate} />

      {/* 2. Sprint 4.7: Quick Actions Bar */}
      <QuickActionsBar navigate={navigate} />

      {/* 3. Sprint 4.7: Personal Stats (real data from existing state) */}
      <PersonalStatsRow
        groups={groups} tests={tests}
        avgScore={avgScore} attPct={attPct} loading={loading}
      />

      {/* 4. Main content + sidebar grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_272px] gap-4 items-start">

        {/* ── Main column ── */}
        <div className="space-y-4 min-w-0">

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
            <motion.div variants={FADE_UP} className="md:col-span-2 xl:col-span-2">
              <RecentActivityCard tests={tests} loading={loading} />
            </motion.div>
            <motion.div variants={FADE_UP}>
              <ComingSoonCard />
            </motion.div>
          </motion.div>

          {/* Sprint 4.7: Continue Learning Card */}
          <ContinueLearningCard groups={groups} loading={loading} navigate={navigate} />

          {/* Sprint 4.7: Achievements Showcase (uses existing _achievements state) */}
          <AchievementsShowcase achievements={_achievements} loading={loading} />

          {/* Premium Banner (PRESERVED) */}
          <PremiumBanner navigate={navigate} />
        </div>

        {/* ── Sidebar column (hidden on mobile, visible on xl+) ── */}
        <div className="hidden xl:block">
          <DashboardSidebar
            tests={tests} groups={groups}
            attPct={attPct} navigate={navigate}
          />
        </div>
      </div>
    </div>
  )
}
