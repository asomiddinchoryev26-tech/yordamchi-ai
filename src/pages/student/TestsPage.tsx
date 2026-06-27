/**
 * pages/student/TestsPage.tsx
 * Sprint 4.5 — Premium Quiz & Exam Experience UI Redesign
 *
 * ⚠️  ALL BUSINESS LOGIC PRESERVED UNCHANGED ⚠️
 * All state, functions, API calls, Supabase queries, hooks — identical.
 * Only the visual/render layer has been redesigned.
 *
 * Visual-only additions (no data-flow impact):
 *   • timeLeft — visual countdown timer (no auto-submit, no API effect)
 *   • currentQ  — tracks visible question for navigator highlight
 */

import { useState, useEffect, useRef } from 'react'
import {
  FileText, Clock, AlertCircle, CheckCircle,
  ChevronLeft, Trophy, Zap, Star,
  Sparkles, Target, X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { testService } from '@/services/test.service'
import type { TestForStudent, TestQuestion, TestResultRow } from '@/services/test.service'

// ─── Animation constants ──────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]
const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const

// ─── Business logic type (PRESERVED) ─────────────────────────────────────────

type View = 'list' | 'taking' | 'done'

// ─── Visual-only: Timer display ───────────────────────────────────────────────

function TimerDisplay({ seconds }: { seconds: number }) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const isLow     = seconds <= 300   // ≤5 min → amber
  const isWarning = seconds <= 60    // ≤1 min → orange
  const isCritical= seconds <= 10    // ≤10s  → red + shake

  const color = isCritical ? '#EF4444' : isWarning ? '#F97316' : isLow ? '#F59E0B' : '#22C55E'

  return (
    <motion.div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
      style={{
        background: `${color}18`,
        border: `1px solid ${color}35`,
      }}
      animate={isCritical ? { x: [0, -3, 3, -3, 3, 0] } : {}}
      transition={isCritical ? { duration: 0.4, repeat: Infinity, repeatDelay: 0.6 } : {}}
    >
      <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} aria-hidden="true" />
      <span className="text-[13px] font-black tabular-nums" style={{ color }}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
    </motion.div>
  )
}

// ─── Visual-only: Question navigator pill ────────────────────────────────────

function QNavPill({
  idx, answered, isCurrent, onClick,
}: { idx: number; answered: boolean; isCurrent: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.93 }}
      className="w-8 h-8 rounded-lg text-[11px] font-bold flex items-center justify-center transition-all"
      style={
        isCurrent
          ? { background: 'linear-gradient(135deg,#5B5CF6,#7C3AED)', color: '#fff', boxShadow: '0 0 10px rgba(91,92,246,0.5)' }
          : answered
            ? { background: 'rgba(34,197,94,0.2)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)' }
            : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }
      }
      aria-label={`${idx + 1}-savol`}
    >
      {idx + 1}
    </motion.button>
  )
}

// ─── Visual-only: Progress ring (SVG) ────────────────────────────────────────

function MiniProgressRing({ pct, size = 40 }: { pct: number; size?: number }) {
  const r   = (size - 4) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color  = pct >= 80 ? '#22C55E' : pct >= 60 ? '#5B5CF6' : '#F59E0B'

  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
      <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth="3" stroke="rgba(255,255,255,0.08)" />
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none" strokeWidth="3"
        stroke={color} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
      />
    </svg>
  )
}

// ─── Visual-only: Skeleton loader ────────────────────────────────────────────

function TestSkeleton() {
  return (
    <div
      className="rounded-[20px] p-5 animate-pulse relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }}
        aria-hidden="true" />
      <div className="flex gap-4">
        <div className="w-11 h-11 rounded-xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 rounded-lg w-2/5" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="h-3 rounded-lg w-1/3" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Component — ALL BUSINESS LOGIC PRESERVED
// ═════════════════════════════════════════════════════════════════════════════

export default function StudentTestsPage() {
  const auth = useAuth()

  // ── All original state (PRESERVED EXACTLY) ────────────────────────────────
  const [tests,   setTests]   = useState<TestForStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [view,        setView]        = useState<View>('list')
  const [activeTest,  setActiveTest]  = useState<TestForStudent | null>(null)
  const [answers,     setAnswers]     = useState<Record<string, number>>({})
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [finalResult, setFinalResult] = useState<TestResultRow | null>(null)

  // ── Visual-only state (no business logic impact) ──────────────────────────
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [currentQ, setCurrentQ] = useState(0)   // for navigator highlight
  const [showNav,  setShowNav]  = useState(false) // mobile nav drawer
  const questionsRef = useRef<HTMLDivElement>(null)

  // Visual-only countdown (no auto-submit, no API effects)
  useEffect(() => {
    if (view !== 'taking' || !activeTest) { setTimeLeft(null); return }
    setTimeLeft(activeTest.duration_minutes * 60)
    const id = setInterval(() => setTimeLeft(prev => prev !== null && prev > 0 ? prev - 1 : 0), 1000)
    return () => clearInterval(id)
  }, [view, activeTest])

  // ── Original effects + functions (PRESERVED EXACTLY) ─────────────────────

  useEffect(() => {
    if (!auth.user?.id) return
    void load()
  }, [auth.user?.id])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setTests(await testService.getForStudent(auth.user!.id))
    } catch {
      setError("Testlarni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }

  function startTest(test: TestForStudent) {
    setActiveTest(test)
    setAnswers({})
    setSubmitError(null)
    setView('taking')
    setCurrentQ(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function selectAnswer(questionId: string, optionIndex: number) {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
  }

  async function handleSubmit() {
    if (!activeTest || !auth.user?.id) return

    const unanswered = activeTest.questions.filter(q => answers[q.id] === undefined)
    if (unanswered.length > 0) {
      setSubmitError(`${unanswered.length} ta savolga javob berilmagan`)
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await testService.submitResult(
        activeTest.id,
        auth.user.id,
        answers,
        activeTest.questions,
      )
      setFinalResult(result)
      setView('done')
      setTests(prev => prev.map(t =>
        t.id === activeTest.id ? { ...t, result } : t
      ))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setSubmitting(false)
    }
  }

  // Visual-only: scroll to question
  function scrollToQuestion(idx: number) {
    setCurrentQ(idx)
    setShowNav(false)
    const el = document.getElementById(`q-${idx}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEWS — redesigned visual layer
  // ═══════════════════════════════════════════════════════════════════════════

  // ── VIEW: TAKING ──────────────────────────────────────────────────────────
  if (view === 'taking' && activeTest) {
    const answered = Object.keys(answers).length
    const total    = activeTest.questions.length
    const pct      = total ? Math.round((answered / total) * 100) : 0

    return (
      <div
        className="min-h-screen pb-32"
        style={{ background: '#080C1A' }}
      >
        {/* ── Sticky Premium Header ────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-30 px-4 py-3"
          style={{
            background: 'rgba(13,18,37,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          }}
        >
          {/* Progress bar */}
          <div className="absolute bottom-0 inset-x-0 h-[2px] bg-white/[0.05]">
            <motion.div
              className="h-full"
              style={{ background: 'linear-gradient(90deg,#5B5CF6,#7C3AED)' }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: EASE }}
            />
          </div>

          <div className="max-w-3xl mx-auto flex items-center gap-3">
            {/* Back */}
            <button
              type="button"
              onClick={() => setView('list')}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.07] transition-all flex-shrink-0"
              aria-label="Testlar ro'yxatiga qaytish"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-white/80 truncate tracking-tight">{activeTest.title}</p>
              <p className="text-[10px] text-white/30 mt-0.5">
                {answered}/{total} javoblangan · {pct}%
              </p>
            </div>

            {/* Progress ring */}
            <div className="relative flex-shrink-0">
              <MiniProgressRing pct={pct} size={36} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-black text-white/70">{pct}%</span>
              </div>
            </div>

            {/* Timer */}
            {timeLeft !== null && <TimerDisplay seconds={timeLeft} />}

            {/* Nav toggle (mobile) */}
            <button
              type="button"
              onClick={() => setShowNav(v => !v)}
              className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.07] transition-all flex-shrink-0"
              aria-label="Savollar"
            >
              <Target className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── Mobile navigator drawer ─────────────────────────────────────── */}
        <AnimatePresence>
          {showNav && (
            <motion.div
              key="nav-drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.28, ease: EASE }}
              className="fixed bottom-0 inset-x-0 z-40 p-4 sm:hidden"
              style={{
                background: 'rgba(13,18,37,0.98)',
                backdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px 20px 0 0',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-bold text-white/60">Savollar palitasi</span>
                <button type="button" onClick={() => setShowNav(false)}
                  className="text-white/40 hover:text-white/70 transition-colors">
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeTest.questions.map((q, i) => (
                  <QNavPill key={q.id} idx={i} answered={answers[q.id] !== undefined}
                    isCurrent={currentQ === i} onClick={() => scrollToQuestion(i)} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto px-4 pt-6">

          {/* Desktop question navigator */}
          <div
            className="hidden sm:flex flex-wrap gap-2 mb-6 p-4 rounded-[20px]"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider w-full mb-1">
              Savollar palitasi
            </span>
            {activeTest.questions.map((q, i) => (
              <QNavPill key={q.id} idx={i} answered={answers[q.id] !== undefined}
                isCurrent={currentQ === i} onClick={() => scrollToQuestion(i)} />
            ))}
          </div>

          {/* Questions list */}
          <div ref={questionsRef} className="space-y-4">
            {activeTest.questions.map((q: TestQuestion, idx: number) => (
              <motion.div
                key={q.id}
                id={`q-${idx}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.4), duration: 0.35, ease: EASE }}
                onViewportEnter={() => setCurrentQ(idx)}
              >
                <div
                  className="rounded-[24px] p-5 sm:p-6"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
                  }}
                >
                  {/* Question header */}
                  <div className="flex items-start gap-3 mb-5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-black text-white flex-shrink-0 mt-0.5"
                      style={{ background: 'linear-gradient(135deg,#5B5CF6,#7C3AED)' }}
                    >
                      {idx + 1}
                    </div>
                    <p className="text-[15px] font-semibold text-white/85 leading-snug flex-1">
                      {q.question}
                    </p>
                  </div>

                  {/* Answer options */}
                  <div className="space-y-2.5">
                    {q.options.map((opt, oi) => {
                      const selected = answers[q.id] === oi
                      return (
                        <motion.label
                          key={oi}
                          htmlFor={`q-${q.id}-o-${oi}`}
                          whileHover={{ scale: 1.01, x: 2 }}
                          whileTap={{ scale: 0.99 }}
                          transition={{ duration: 0.12 }}
                          className="flex items-center gap-3 p-3.5 rounded-[16px] cursor-pointer transition-all duration-150"
                          style={selected ? {
                            background: 'rgba(91,92,246,0.15)',
                            border: '1.5px solid rgba(91,92,246,0.5)',
                            boxShadow: '0 0 16px rgba(91,92,246,0.2)',
                          } : {
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          <input
                            id={`q-${q.id}-o-${oi}`}
                            type="radio"
                            name={`q-${q.id}`}
                            checked={selected}
                            onChange={() => selectAnswer(q.id, oi)}
                            className="sr-only"
                          />
                          {/* Letter badge */}
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0"
                            style={selected ? {
                              background: 'linear-gradient(135deg,#5B5CF6,#7C3AED)',
                              color: '#fff',
                            } : {
                              background: 'rgba(255,255,255,0.07)',
                              color: 'rgba(255,255,255,0.4)',
                            }}
                          >
                            {OPTION_LETTERS[oi]}
                          </div>
                          {/* Custom radio */}
                          <div
                            className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                            style={selected ? {
                              borderColor: '#6366F1',
                              background: '#6366F1',
                            } : {
                              borderColor: 'rgba(255,255,255,0.2)',
                            }}
                          >
                            {selected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span className={cn(
                            'text-sm leading-snug flex-1',
                            selected ? 'text-white/90 font-medium' : 'text-white/55',
                          )}>
                            {opt}
                          </span>
                        </motion.label>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 flex items-center gap-2 p-3.5 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" aria-hidden="true" />
                <p className="text-sm text-red-400">{submitError}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Sticky Submit Button ──────────────────────────────────────────── */}
        <div
          className="fixed bottom-0 inset-x-0 z-20 px-4 py-4"
          style={{
            background: 'rgba(8,12,26,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="max-w-3xl mx-auto">
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 text-white text-[15px] font-bold rounded-[18px] flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg,#5B5CF6 0%,#7C3AED 100%)',
                boxShadow: '0 8px 24px rgba(91,92,246,0.45)',
              }}
            >
              {submitting ? (
                <span
                  className="w-5 h-5 border-2 border-white/25 border-t-white rounded-full animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <CheckCircle className="w-5 h-5" aria-hidden="true" />
              )}
              Testni topshirish
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  // ── VIEW: DONE ────────────────────────────────────────────────────────────
  if (view === 'done' && activeTest && finalResult) {
    const pct    = finalResult.total_questions
      ? Math.round((finalResult.score / finalResult.total_questions) * 100)
      : 0
    const passed = pct >= 60

    const scoreColor  = pct >= 80 ? '#22C55E' : pct >= 60 ? '#5B5CF6' : '#F59E0B'
    const circ        = 2 * Math.PI * 50
    const dashOffset  = circ - (pct / 100) * circ

    const motivational = pct >= 90
      ? "Ajoyib! Siz bu mavzuni mukammal o'zlashtirgansiz! 🏆"
      : pct >= 80
        ? "Zo'r natija! Deyarli mukammal erishuvingiz bor! ⭐"
        : pct >= 60
          ? "Tabriklaymiz! Muvaffaqiyatli topshirdingiz! 🎉"
          : "Yaxshi urinish! Biroz ko'proq mashq qilsangiz — muvaffaqiyatga erishasiz 📚"

    return (
      <div className="pb-8 max-w-2xl" style={{ color: 'white' }}>
        {/* Result hero card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="relative overflow-hidden rounded-[28px] p-8 mb-5 text-center"
          style={{
            background: 'linear-gradient(145deg,#0D0F1E 0%,#131A30 50%,#0D0F1E 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 60%, ${scoreColor}18 0%, transparent 65%)` }}
            aria-hidden="true"
          />

          {/* Score ring */}
          <div className="relative inline-flex items-center justify-center mb-5">
            <svg width="120" height="120" className="-rotate-90" aria-hidden="true">
              <circle cx="60" cy="60" r="50" fill="none" strokeWidth="6" stroke="rgba(255,255,255,0.06)" />
              <motion.circle
                cx="60" cy="60" r="50" fill="none" strokeWidth="6"
                stroke={scoreColor} strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1.5, ease: EASE, delay: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className="text-3xl font-black"
                style={{ color: scoreColor }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4, ease: EASE }}
              >
                {pct}%
              </motion.span>
              <span className="text-[10px] text-white/30 font-bold tracking-wider mt-0.5">NATIJA</span>
            </div>
          </div>

          {/* Score info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4, ease: EASE }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              {passed
                ? <Trophy className="w-5 h-5 text-amber-400" aria-hidden="true" />
                : <FileText className="w-5 h-5 text-white/30" aria-hidden="true" />
              }
              <span
                className="text-sm font-bold px-3 py-1 rounded-full"
                style={passed
                  ? { background: 'rgba(34,197,94,0.15)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)' }
                  : { background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }
                }
              >
                {passed ? "Muvaffaqiyatli topshirildi" : "Qaytadan urinib ko'ring"}
              </span>
            </div>

            <p className="text-white/50 text-sm">
              {finalResult.score} ta to&apos;g&apos;ri / {finalResult.total_questions} ta savol
            </p>

            {/* XP display (visual only) */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <Zap className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                <span className="text-[12px] font-bold text-amber-400">+{Math.round(pct * 0.5)} XP</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <Star className="w-3.5 h-3.5 text-brand-light" aria-hidden="true" />
                <span className="text-[12px] font-bold text-brand-light">
                  {pct >= 80 ? '★★★' : pct >= 60 ? '★★☆' : '★☆☆'}
                </span>
              </div>
            </div>

            <p className="text-white/40 text-sm mt-4 italic">{motivational}</p>
          </motion.div>
        </motion.div>

        {/* Question analysis */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <h3 className="text-[13px] font-bold text-white/50 uppercase tracking-wider px-1">
            Savollar tahlili
          </h3>
          {activeTest.questions.map((q: TestQuestion, idx: number) => {
            const selected  = finalResult.answers[q.id]
            const isCorrect = selected === q.correct_index

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.04, duration: 0.3, ease: EASE }}
                className="rounded-[20px] p-4"
                style={isCorrect ? {
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.2)',
                } : {
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <div className="flex items-start gap-2.5 mb-3">
                  <span className={cn('text-sm font-black mt-0.5 flex-shrink-0', isCorrect ? 'text-emerald-400' : 'text-red-400')}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                  <p className="text-[13.5px] font-medium text-white/80">{idx + 1}. {q.question}</p>
                </div>
                <div className="space-y-1.5 pl-5">
                  {q.options.map((opt, oi) => {
                    const isRight    = oi === q.correct_index
                    const isSelected = oi === selected
                    return (
                      <div
                        key={oi}
                        className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
                        style={isRight
                          ? { background: 'rgba(34,197,94,0.15)', color: '#86efac' }
                          : isSelected && !isCorrect
                            ? { background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }
                            : { color: 'rgba(255,255,255,0.3)' }
                        }
                      >
                        <span className="font-bold w-5 flex-shrink-0">{OPTION_LETTERS[oi]})</span>
                        <span className="flex-1">{opt}</span>
                        {isRight && <span className="ml-auto font-bold text-emerald-400">✓ To&apos;g&apos;ri</span>}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Back button */}
        <motion.button
          type="button"
          onClick={() => setView('list')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="mt-5 w-full py-3 rounded-[16px] text-sm font-semibold text-white/50 transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          ← Testlar ro&apos;yxatiga qaytish
        </motion.button>
      </div>
    )
  }

  // ── VIEW: LIST ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-8 max-w-3xl">

      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#5B5CF6,#7C3AED)', boxShadow: '0 0 16px rgba(91,92,246,0.4)' }}
          >
            <FileText className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Testlar</h1>
            <p className="text-[12px] text-white/35 mt-0.5">Mavjud online testlar</p>
          </div>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3.5 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm text-red-400">{error}</span>
        </motion.div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <TestSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && tests.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="rounded-[28px] p-14 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}
            aria-hidden="true"
          >
            <Sparkles className="w-7 h-7 text-brand-light/60" />
          </motion.div>
          <p className="text-sm font-semibold text-white/40 mb-1">Mavjud test yo&apos;q</p>
          <p className="text-xs text-white/20">O&apos;qituvchi test nashr qilsa, bu yerda ko&apos;rinadi</p>
        </motion.div>
      )}

      {/* Test cards */}
      {!loading && tests.length > 0 && (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          {tests.map((test, i) => {
            const done = !!test.result?.submitted_at
            const pct  = done && test.result
              ? Math.round((test.result.score / test.result.total_questions) * 100)
              : null
            const passed = pct !== null && pct >= 60
            const scoreColor = pct !== null
              ? (pct >= 80 ? '#22C55E' : pct >= 60 ? '#5B5CF6' : '#F59E0B')
              : null

            return (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35, ease: EASE, type: 'tween' }}
                whileHover={!done ? { y: -2, scale: 1.005 } : {}}
                className="rounded-[22px] p-5"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: done
                    ? `1px solid ${passed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
                    : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
                    style={done
                      ? { background: passed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', border: `1px solid ${passed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }
                      : { background: 'linear-gradient(135deg,#5B5CF6,#7C3AED)', boxShadow: '0 4px 12px rgba(91,92,246,0.3)' }
                    }
                  >
                    {done
                      ? <CheckCircle className="w-5 h-5" style={{ color: passed ? '#86efac' : '#fca5a5' }} aria-hidden="true" />
                      : <FileText className="w-5 h-5 text-white" aria-hidden="true" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white/85 text-[14.5px] truncate">{test.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/30 flex-wrap">
                      {test.group && <span className="text-brand-light/60">{(test.group as { name?: string }).name}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {test.duration_minutes} daqiqa
                      </span>
                      <span>{test.questions.length} ta savol</span>
                      {done && pct !== null && (
                        <span
                          className="font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${scoreColor}20`, color: scoreColor as string }}
                        >
                          {pct}%
                        </span>
                      )}
                    </div>
                    {test.description && (
                      <p className="text-[11px] text-white/25 mt-1.5 line-clamp-1">{test.description}</p>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0 text-right">
                    {done && test.result ? (
                      <div className="space-y-1">
                        <div className="relative">
                          <MiniProgressRing pct={pct ?? 0} size={40} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[9px] font-black" style={{ color: scoreColor ?? '#fff' }}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTest(test)
                            setAnswers(test.result!.answers)
                            setFinalResult(test.result)
                            setView('done')
                          }}
                          className="text-[11px] font-semibold text-brand-light/70 hover:text-brand-light transition-colors"
                        >
                          Ko&apos;rish
                        </button>
                      </div>
                    ) : (
                      <motion.button
                        type="button"
                        onClick={() => startTest(test)}
                        whileHover={{ scale: 1.04, y: -1 }}
                        whileTap={{ scale: 0.96 }}
                        className="px-4 py-2.5 text-white text-sm font-bold rounded-[14px] transition-opacity hover:opacity-90"
                        style={{
                          background: 'linear-gradient(135deg,#5B5CF6,#7C3AED)',
                          boxShadow: '0 4px 12px rgba(91,92,246,0.4)',
                        }}
                      >
                        Boshlash
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
