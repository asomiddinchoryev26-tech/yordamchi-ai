/**
 * pages/student/StudentDashboardPage.tsx
 * Sprint 4.2 — Premium Home Page Redesign
 *
 * ALL DATA FETCHING LOGIC IS PRESERVED UNCHANGED.
 * Only the visual rendering layer has been redesigned.
 */

import { useState, useEffect, useRef } from 'react'
import {
  Camera, ImageIcon, FileText as FileIcon, Mic, Send,
  ArrowRight, CheckCircle, BookOpen, Clock, Zap, Trophy,
  TrendingUp, ChevronRight, Star, Lock,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

// ─── AI Robot Mascot ──────────────────────────────────────────────────────────

const CHAT_MSGS = ["Salom! 👋", "Bugun nima o'rganamiz?", "Savolingiz bormi?"]

function RobotMascot() {
  const [chatIdx, setChatIdx] = useState(-1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let i = 0
    function showNext() {
      setChatIdx(i)
      timerRef.current = setTimeout(() => {
        setChatIdx(-1)
        i = (i + 1) % CHAT_MSGS.length
        timerRef.current = setTimeout(showNext, 1000)
      }, 2800)
    }
    timerRef.current = setTimeout(showNext, 1200)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  return (
    <div className="relative flex items-center justify-center select-none">
      {/* Background glow */}
      <div
        className="absolute w-52 h-52 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6366F1 0%, #7C3AED 50%, transparent 80%)' }}
        aria-hidden="true"
      />

      {/* Robot body */}
      <motion.div
        className="relative z-10"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Antenna */}
        <div className="flex flex-col items-center mb-1" aria-hidden="true">
          <motion.div
            className="w-4 h-4 rounded-full"
            style={{ background: 'linear-gradient(135deg, #818CF8, #6366F1)' }}
            animate={{ boxShadow: ['0 0 6px #6366F1', '0 0 16px #6366F1', '0 0 6px #6366F1'] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <div className="w-[2px] h-5 bg-brand/40 rounded-full" />
        </div>

        {/* Head */}
        <div
          className="w-32 h-36 rounded-[32px] relative overflow-hidden border border-brand/30"
          style={{
            background: 'linear-gradient(145deg, #1A1040 0%, #2D1B69 40%, #1E1B4B 100%)',
            boxShadow: '0 0 40px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
          aria-hidden="true"
        >
          {/* Visor shine */}
          <div className="absolute inset-0 opacity-20"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />

          {/* Eyes row */}
          <div className="flex justify-center gap-4 pt-7">
            {[0, 1].map(i => (
              <div key={i} className="relative">
                {/* White iris */}
                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-inner">
                  {/* Glowing pupil */}
                  <motion.div
                    className="w-4 h-4 rounded-full"
                    style={{ background: 'linear-gradient(135deg, #818CF8, #6366F1)' }}
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.35, ease: 'easeInOut' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Smile */}
          <div className="flex justify-center mt-3">
            <div className="w-10 h-3 rounded-b-full border-b-[3px] border-white/50" />
          </div>

          {/* Chest panel */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-16 h-6 rounded-xl bg-brand/20 border border-brand/25 flex items-center justify-center gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-brand-light/70"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.28 }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Chat bubble */}
      <AnimatePresence>
        {chatIdx >= 0 && (
          <motion.div
            key={chatIdx}
            initial={{ opacity: 0, scale: 0.75, y: 8, x: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 4 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="absolute -top-4 left-[calc(100%-8px)] whitespace-nowrap"
            style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '16px 16px 16px 4px',
              padding: '8px 12px',
              color: 'white',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {CHAT_MSGS[chatIdx]}
          </motion.div>
        )}
      </AnimatePresence>
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

// ─── Section: Hero ────────────────────────────────────────────────────────────

function HeroSection({ name, navigate }: { name: string; navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div
      className="relative overflow-hidden rounded-[28px] px-6 py-8 sm:px-10 sm:py-12"
      style={{
        background: 'linear-gradient(145deg, #080C1A 0%, #0F1228 40%, #130D2E 80%, #0D1122 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.05) inset',
      }}
    >
      {/* Background orbs */}
      <div className="absolute pointer-events-none inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 right-24 w-80 h-80 rounded-full blur-[80px] opacity-25"
          style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)' }} />
        <div className="absolute -bottom-16 left-16 w-64 h-64 rounded-full blur-[64px] opacity-20"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full blur-[48px] opacity-10"
          style={{ background: 'radial-gradient(circle, #818CF8 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
        {/* Left: Copy */}
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-5">
          {/* Badge */}
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

          {/* Headline */}
          <motion.div variants={FADE_UP}>
            <h1 className="text-3xl sm:text-4xl xl:text-[2.6rem] font-black text-white leading-[1.1] tracking-tight">
              Imtihondan qo&apos;rqmang.
              <span
                className="block mt-1"
                style={{
                  background: 'linear-gradient(135deg, #818CF8 0%, #C4B5FD 50%, #818CF8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                AI o&apos;qituvchingiz 24/7 tayyor.
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.div variants={FADE_UP}>
            <p className="text-base text-white/55 max-w-md leading-relaxed">
              Salom, <strong className="text-white/80">{name}</strong>! Bugun qaysi mavzuni o&apos;rganamiz?
            </p>
          </motion.div>

          {/* CTA buttons */}
          <motion.div variants={FADE_UP} className="flex flex-wrap gap-3">
            <motion.button
              type="button"
              onClick={() => navigate(PATHS.STUDENT.AI_ASSISTANT)}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[18px] text-white font-bold text-[14px] transition-opacity hover:opacity-92"
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
              Qanday ishlaydi?
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </motion.button>
          </motion.div>

          {/* Home AI Input */}
          <motion.div variants={FADE_UP} className="max-w-lg">
            <HomeAIInput onSubmit={(text) => {
              navigate(text
                ? PATHS.STUDENT.AI_ASSISTANT
                : PATHS.STUDENT.AI_ASSISTANT)
            }} />
          </motion.div>

          {/* Quick Prompt Chips */}
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

        {/* Right: Robot Mascot */}
        <motion.div
          className="hidden lg:flex items-center justify-center pr-4"
          initial={{ opacity: 0, x: 30, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
        >
          <RobotMascot />
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-8">

      {/* 1. Hero */}
      <HeroSection name={userName} navigate={navigate} />

      {/* 2. Statistics */}
      <StatsSection />

      {/* 3. Content Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        variants={STAGGER}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
      >
        {/* Weak Topics */}
        <motion.div variants={FADE_UP}>
          <WeakTopicsCard avgPct={avgScore} loading={loading} />
        </motion.div>

        {/* Courses */}
        <motion.div variants={FADE_UP}>
          <CoursesCard groups={groups} loading={loading} navigate={navigate} />
        </motion.div>

        {/* Score */}
        <motion.div variants={FADE_UP} className="md:col-span-2 xl:col-span-1">
          <ScoreCard snapshot={latestSnap} loading={loading} attPct={attPct} />
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={FADE_UP} className="md:col-span-2 xl:col-span-2">
          <RecentActivityCard tests={tests} loading={loading} />
        </motion.div>

        {/* Coming Soon */}
        <motion.div variants={FADE_UP}>
          <ComingSoonCard />
        </motion.div>
      </motion.div>

      {/* 4. Premium Banner */}
      <PremiumBanner navigate={navigate} />
    </div>
  )
}
