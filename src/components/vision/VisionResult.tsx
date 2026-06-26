/**
 * components/vision/VisionResult.tsx
 * Displays the structured AI Vision solution.
 * Premium card layout with steps, mistakes, mini-quiz, and XP badge.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, AlertTriangle, BookOpen, Zap,
  ChevronDown, Trophy, Target, HelpCircle, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VisionSolution, SubjectArea, DifficultyLevel } from '@/ai-brain/vision/types'
import type { Language } from '@/ai-brain/core/types'

// ─── Sub-components ───────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

const SUBJECT_LABELS: Record<SubjectArea, string> = {
  math: '📐 Matematika', physics: '⚛️ Fizika', chemistry: '⚗️ Kimyo',
  biology: '🧬 Biologiya', history: '📜 Tarix', literature: '📖 Adabiyot',
  language: '🌍 Til', geography: '🗺️ Geografiya', computer_science: '💻 Informatika',
  mixed: '📚 Aralash', unknown: '❓ Noma\'lum',
}

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  elementary:  'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/50',
  middle:      'text-blue-600   dark:text-blue-400   bg-blue-50   dark:bg-blue-900/20   border-blue-200/50',
  high_school: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border-violet-200/50',
  university:  'text-red-600    dark:text-red-400    bg-red-50    dark:bg-red-900/20    border-red-200/50',
  unknown:     'text-gray-500   dark:text-gray-400   bg-gray-50   dark:bg-gray-800      border-gray-200',
}

const DIFFICULTY_LABELS: Record<DifficultyLevel, Record<Language, string>> = {
  elementary:  { uz: 'Boshlang\'ich', ru: 'Начальный',   en: 'Elementary'  },
  middle:      { uz: "O'rta",          ru: 'Средний',     en: 'Middle'       },
  high_school: { uz: 'Lisey',         ru: 'Старшая школа', en: 'High School' },
  university:  { uz: 'Oliy ta\'lim',  ru: 'Вузовский',   en: 'University'   },
  unknown:     { uz: 'Noma\'lum',     ru: 'Неизвестно',  en: 'Unknown'      },
}

// Confidence bar
function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct   = Math.round(confidence * 100)
  const color = pct >= 80 ? '#22C55E' : pct >= 55 ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: EASE, delay: 0.3 }}
        />
      </div>
      <span className="text-[11px] font-bold flex-shrink-0" style={{ color }}>{pct}%</span>
    </div>
  )
}

// Collapsible section wrapper
function Section({
  title, icon: Icon, children, defaultOpen = true, accent,
}: {
  title: string; icon: React.ElementType; children: React.ReactNode;
  defaultOpen?: boolean; accent?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 bg-gray-50/80 dark:bg-white/[0.03] hover:bg-gray-100/80 dark:hover:bg-white/[0.05] transition-colors text-left"
        aria-expanded={open}
      >
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', accent ?? 'bg-brand/10 dark:bg-brand/15')}>
          <Icon className="w-3.5 h-3.5 text-brand dark:text-brand-light" aria-hidden="true" />
        </div>
        <span className="flex-1 text-[12.5px] font-semibold text-gray-800 dark:text-gray-200">{title}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform duration-200', open && 'rotate-180')} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 space-y-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Mini Quiz ────────────────────────────────────────────────────────────────

function MiniQuiz({ items }: { items: VisionSolution['miniQuiz'] }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const toggle = (i: number) => setRevealed(prev => {
    const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next
  })

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
          <button
            type="button"
            onClick={() => toggle(i)}
            className="w-full text-left px-3 py-2.5 flex items-start gap-2 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span className="flex-1 text-[12px] text-gray-700 dark:text-gray-300 font-medium">{item.question}</span>
          </button>
          <AnimatePresence>
            {revealed.has(i) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-2.5">
                  <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-[12px] text-emerald-800 dark:text-emerald-300 font-medium">{item.answer}</span>
                  </div>
                  {item.hint && (
                    <p className="text-[10.5px] text-gray-400 dark:text-gray-500 mt-1.5 pl-1">💡 {item.hint}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface VisionResultProps {
  solution:  VisionSolution
  language?: Language
  className?: string
}

export function VisionResult({ solution, language = 'uz', className }: VisionResultProps) {
  const LABELS: Record<Language, Record<string, string>> = {
    uz: {
      detected:    'Aniqlangan matn',
      steps:       'Yechim bosqichlari',
      answer:      'Yakuniy javob',
      mistakes:    'Keng tarqalgan xatolar',
      quiz:        'Tushunishni tekshirish',
      next:        'Keyingi qadamlar',
      accuracy:    'Aniqlik',
      xpEarned:    'XP',
    },
    ru: {
      detected:    'Обнаруженный текст',
      steps:       'Шаги решения',
      answer:      'Финальный ответ',
      mistakes:    'Частые ошибки',
      quiz:        'Проверка понимания',
      next:        'Следующие шаги',
      accuracy:    'Точность',
      xpEarned:    'XP',
    },
    en: {
      detected:    'Detected Text',
      steps:       'Solution Steps',
      answer:      'Final Answer',
      mistakes:    'Common Mistakes',
      quiz:        'Check Understanding',
      next:        'Next Steps',
      accuracy:    'Accuracy',
      xpEarned:    'XP',
    },
  }
  const lbl = LABELS[language]

  return (
    <motion.div
      className={cn('space-y-3', className)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      {/* Header: topic + subject + difficulty + XP + confidence */}
      <div className="rounded-[24px] border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-gray-900/80 p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-0.5">
              {SUBJECT_LABELS[solution.subject]}
            </p>
            <h2 className="text-[15px] font-bold text-gray-900 dark:text-white leading-snug">
              {solution.topic}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-lg border', DIFFICULTY_COLORS[solution.difficulty])}>
              {DIFFICULTY_LABELS[solution.difficulty][language]}
            </span>
            <motion.div
              className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[11px] font-black px-2 py-0.5 rounded-lg"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.5 }}
            >
              <Trophy className="w-3 h-3" aria-hidden="true" />
              +{solution.xpEarned} {lbl.xpEarned}
            </motion.div>
          </div>
        </div>
        {/* Confidence bar */}
        <div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mb-1">{lbl.accuracy}</p>
          <ConfidenceBar confidence={solution.confidence} />
        </div>
      </div>

      {/* Detected text */}
      {solution.detectedText && (
        <Section title={lbl.detected} icon={BookOpen} defaultOpen={false} accent="bg-gray-100 dark:bg-gray-800">
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl px-3 py-2.5 font-mono text-[11.5px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
            {solution.detectedText}
          </div>
          {solution.detectedFormulas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {solution.detectedFormulas.map((f, i) => (
                <span key={i} className="text-[11px] font-mono bg-brand/8 dark:bg-brand/12 text-brand dark:text-brand-light px-2 py-0.5 rounded-lg border border-brand/20">
                  {f}
                </span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Solution steps */}
      {solution.steps.length > 0 && (
        <Section title={lbl.steps} icon={Target} defaultOpen>
          <div className="space-y-3">
            {solution.steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.07, ease: EASE }}
                className="flex gap-3"
              >
                {/* Step number */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)' }}
                >
                  {step.stepNumber}
                </div>
                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] text-gray-800 dark:text-gray-200 leading-snug font-medium">
                    {step.description}
                  </p>
                  {step.formula && (
                    <div className="mt-1.5 font-mono text-[11.5px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 rounded-lg border border-gray-200/60 dark:border-white/[0.06]">
                      {step.formula}
                    </div>
                  )}
                  {step.result && (
                    <p className="mt-1 text-[11.5px] font-semibold text-brand dark:text-brand-light">
                      = {step.result}
                    </p>
                  )}
                  {step.explanation && (
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
                      {step.explanation}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Final answer */}
      {solution.finalAnswer && (
        <div
          className="rounded-2xl p-4 border"
          style={{
            background: 'linear-gradient(135deg, rgba(91,92,246,0.08) 0%, rgba(124,58,237,0.05) 100%)',
            borderColor: 'rgba(91,92,246,0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-brand" aria-hidden="true" />
            <span className="text-[12px] font-bold text-brand dark:text-brand-light uppercase tracking-wide">{lbl.answer}</span>
          </div>
          <p className="text-[14px] font-bold text-gray-900 dark:text-white leading-relaxed">
            {solution.finalAnswer}
          </p>
        </div>
      )}

      {/* Common mistakes */}
      {solution.commonMistakes.length > 0 && (
        <Section title={lbl.mistakes} icon={AlertTriangle} defaultOpen={false} accent="bg-amber-50 dark:bg-amber-900/20">
          <ul className="space-y-2" role="list">
            {solution.commonMistakes.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600 dark:text-gray-400">
                <span className="text-amber-500 flex-shrink-0 mt-0.5 font-bold">⚠</span>
                {m}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Mini quiz */}
      {solution.miniQuiz.length > 0 && (
        <Section title={lbl.quiz} icon={Zap} defaultOpen={false}>
          <MiniQuiz items={solution.miniQuiz} />
        </Section>
      )}

      {/* Next recommendation */}
      {solution.nextRecommendation && (
        <div className="flex items-start gap-2.5 bg-gray-50 dark:bg-white/[0.03] rounded-2xl px-4 py-3 border border-gray-100 dark:border-white/[0.06]">
          <ArrowRight className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">{lbl.next}</p>
            <p className="text-[12.5px] text-gray-700 dark:text-gray-300">{solution.nextRecommendation}</p>
          </div>
        </div>
      )}
    </motion.div>
  )
}
