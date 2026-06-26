/**
 * pages/student/AIVisionPage.tsx
 * AI Vision — solve homework/exam problems from photos or PDFs.
 * Sprint 3.2 Phase 1 — AI Vision Foundation
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Clock, Zap, Trophy, BookOpen,
  History, ChevronRight, RefreshCw, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth }    from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { visionService }  from '@/ai-brain/vision/visionService'
import { loadStudentContext } from '@/services/ai-provider.service'
import { ImageDropzone } from '@/components/vision/ImageDropzone'
import { VisionResult }  from '@/components/vision/VisionResult'
import type { VisionResult as VisionResultType, VisionProcessingState, VisionHistoryEntry } from '@/ai-brain/vision/types'
import type { Language } from '@/ai-brain/core/types'

// ─── Processing Steps UI ──────────────────────────────────────────────────────

const STEP_LABELS: Record<string, Record<Language, string>> = {
  compressing: { uz: 'Rasm siqilmoqda…',       ru: 'Сжатие изображения…',    en: 'Compressing image…'    },
  validating:  { uz: 'Tekshirilmoqda…',         ru: 'Проверка…',              en: 'Validating…'           },
  analyzing:   { uz: 'Profil tayyorlanmoqda…',  ru: 'Подготовка профиля…',    en: 'Preparing profile…'    },
  solving:     { uz: 'AI hal qilmoqda…',        ru: 'AI решает задачу…',      en: 'AI solving problem…'   },
  saving:      { uz: 'Natija saqlanmoqda…',     ru: 'Сохранение результата…', en: 'Saving result…'        },
  complete:    { uz: 'Bajarildi!',              ru: 'Готово!',                en: 'Done!'                 },
  error:       { uz: 'Xatolik yuz berdi',       ru: 'Произошла ошибка',       en: 'An error occurred'     },
}

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

function ProcessingOverlay({ state, language }: { state: VisionProcessingState; language: Language }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 gap-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: EASE }}
    >
      {/* Animated ring */}
      <div className="relative w-20 h-20">
        <motion.div
          className="absolute inset-0 rounded-full border-[3px] border-brand/20"
        />
        <motion.div
          className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-brand"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-brand" aria-hidden="true" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-48">
        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #5B5CF6, #7C3AED)' }}
            animate={{ width: `${state.progress}%` }}
            transition={{ duration: 0.5, ease: EASE }}
          />
        </div>
      </div>

      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {STEP_LABELS[state.step]?.[language] ?? state.message}
      </p>
      <p className="text-xs text-brand dark:text-brand-light font-bold">{state.progress}%</p>
    </motion.div>
  )
}

// ─── History Item ─────────────────────────────────────────────────────────────

function HistoryItem({ entry }: { entry: VisionHistoryEntry }) {
  const dt = new Date(entry.createdAt)
  const timeStr = dt.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })
    + ' · ' + dt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors rounded-xl">
      <div className="w-9 h-9 rounded-xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
        <BookOpen className="w-4 h-4 text-brand dark:text-brand-light" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-gray-900 dark:text-white truncate">{entry.topic}</p>
        <p className="text-[10.5px] text-gray-400 dark:text-gray-500 mt-0.5">{timeStr}</p>
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">+{entry.xpEarned} XP</span>
        <span className="text-[9px] text-gray-300 dark:text-gray-600">
          {Math.round(entry.durationMs / 1000)}s
        </span>
      </div>
    </div>
  )
}

// ─── Page Labels ──────────────────────────────────────────────────────────────

const PAGE_LABELS: Record<Language, {
  title: string; subtitle: string; solve: string; reset: string;
  history: string; noHistory: string; historyLoading: string;
  errorTitle: string;
}> = {
  uz: {
    title:          'AI Vision',
    subtitle:       'Rasm yoki PDF yuklang — AI masalani hal qiladi',
    solve:          'Hal qilish',
    reset:          'Yangi masala',
    history:        'So\'nggi yechimlar',
    noHistory:      'Hali hech qanday masala hal qilinmagan',
    historyLoading: 'Tarix yuklanmoqda…',
    errorTitle:     'Xatolik yuz berdi',
  },
  ru: {
    title:          'AI Vision',
    subtitle:       'Загрузите фото или PDF — AI решит задачу',
    solve:          'Решить',
    reset:          'Новая задача',
    history:        'Последние решения',
    noHistory:      'Ещё не было решено ни одной задачи',
    historyLoading: 'Загрузка истории…',
    errorTitle:     'Произошла ошибка',
  },
  en: {
    title:          'AI Vision',
    subtitle:       'Upload a photo or PDF — AI will solve the problem',
    solve:          'Solve',
    reset:          'New Problem',
    history:        'Recent Solutions',
    noHistory:      'No problems solved yet',
    historyLoading: 'Loading history…',
    errorTitle:     'An error occurred',
  },
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIVisionPage() {
  const auth             = useAuth()
  const { language }     = useLanguage()
  const lang             = (language === 'uz' || language === 'ru' || language === 'en')
    ? language : 'uz' as Language

  const lbl = PAGE_LABELS[lang]

  // State
  const [selectedFile,  setSelectedFile]  = useState<File | null>(null)
  const [previewUrl,    setPreviewUrl]     = useState<string | null>(null)
  const [processing,    setProcessing]     = useState<VisionProcessingState | null>(null)
  const [result,        setResult]         = useState<VisionResultType | null>(null)
  const [error,         setError]          = useState<string | null>(null)
  const [history,       setHistory]        = useState<VisionHistoryEntry[]>([])
  const [historyOpen,   setHistoryOpen]    = useState(false)
  const [historyLoaded, setHistoryLoaded]  = useState(false)
  const [historyLoading,setHistoryLoading] = useState(false)

  const isProcessing = processing !== null && processing.step !== 'complete' && processing.step !== 'error'
  const userId = auth.user?.id ?? ''

  // Handle file selection
  const handleFile = useCallback((file: File, preview: string) => {
    setSelectedFile(file)
    setPreviewUrl(preview)
    setResult(null)
    setError(null)
    setProcessing(null)
  }, [])

  // Solve
  const handleSolve = async () => {
    if (!selectedFile || !userId || isProcessing) return
    setError(null)
    setResult(null)

    try {
      const ctx = await loadStudentContext(userId, auth.user?.name ?? 'Talaba')

      const solution = await visionService.solve({
        file:       selectedFile,
        userId,
        ctx,
        language:   lang,
        maxRetries: 2,
        onProgress: state => setProcessing(state),
      })
      setResult(solution)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'processing_failed'
      setError(msg)
      setProcessing({ step: 'error', progress: 0, message: msg })
    }
  }

  // Reset
  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null); setPreviewUrl(null)
    setResult(null); setError(null); setProcessing(null)
  }

  // Load history
  const handleHistoryToggle = async () => {
    setHistoryOpen(v => !v)
    if (!historyLoaded && userId) {
      setHistoryLoading(true)
      const entries = await visionService.loadHistory(userId, 15)
      setHistory(entries)
      setHistoryLoaded(true)
      setHistoryLoading(false)
    }
  }

  const canSolve = selectedFile !== null && !isProcessing && result === null

  return (
    <div className="space-y-4 pb-8 max-w-[1200px]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand" aria-hidden="true" />
            {lbl.title}
            <span className="text-[10px] font-bold text-brand dark:text-brand-light bg-brand/10 dark:bg-brand/15 px-2 py-0.5 rounded-full ml-1">
              Beta
            </span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{lbl.subtitle}</p>
        </div>
        {result && (
          <motion.button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-brand dark:hover:text-brand-light transition-colors"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            {lbl.reset}
          </motion.button>
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* LEFT: Upload + Processing */}
        <div className="space-y-3">

          {/* Upload zone */}
          <div className="bg-white dark:bg-gray-900/80 rounded-[24px] border border-gray-100 dark:border-white/[0.07] p-5">
            <ImageDropzone
              onFile={handleFile}
              disabled={isProcessing}
              language={lang}
            />
          </div>

          {/* Solve / Processing */}
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                className="bg-white dark:bg-gray-900/80 rounded-[24px] border border-gray-100 dark:border-white/[0.07]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ProcessingOverlay state={processing!} language={lang} />
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200/60 dark:border-red-800/30 px-4 py-3 flex items-start gap-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <span className="text-red-600 dark:text-red-400 text-sm font-semibold">{lbl.errorTitle}:</span>
                <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
              </motion.div>
            ) : canSolve ? (
              <motion.div
                key="solve-btn"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <motion.button
                  type="button"
                  onClick={() => void handleSolve()}
                  disabled={!canSolve}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-[18px] text-white font-bold text-[15px] transition-opacity hover:opacity-92 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)',
                    boxShadow:  '0 8px 24px rgba(91,92,246,0.38)',
                  }}
                >
                  <Zap className="w-5 h-5" aria-hidden="true" />
                  {lbl.solve}
                </motion.button>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* History panel */}
          <div className="bg-white dark:bg-gray-900/80 rounded-[24px] border border-gray-100 dark:border-white/[0.07] overflow-hidden">
            <button
              type="button"
              onClick={() => void handleHistoryToggle()}
              className="w-full flex items-center gap-2.5 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors text-left"
              aria-expanded={historyOpen}
            >
              <History className="w-4 h-4 text-gray-400" aria-hidden="true" />
              <span className="flex-1 text-[13px] font-semibold text-gray-700 dark:text-gray-300">{lbl.history}</span>
              {history.length > 0 && (
                <span className="text-[10px] font-bold text-brand dark:text-brand-light bg-brand/10 px-1.5 py-0.5 rounded-md">
                  {history.length}
                </span>
              )}
              <ChevronRight className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', historyOpen && 'rotate-90')} aria-hidden="true" />
            </button>

            <AnimatePresence>
              {historyOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-gray-100 dark:border-white/[0.05] divide-y divide-gray-50 dark:divide-white/[0.03] max-h-64 overflow-y-auto">
                    {historyLoading ? (
                      <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        {lbl.historyLoading}
                      </div>
                    ) : history.length === 0 ? (
                      <p className="text-center py-6 text-[12.5px] text-gray-400 dark:text-gray-500">
                        {lbl.noHistory}
                      </p>
                    ) : (
                      history.map(entry => <HistoryItem key={entry.id} entry={entry} />)
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT: Result */}
        <div>
          <AnimatePresence mode="wait">
            {result ? (
              <VisionResult
                key="result"
                solution={result.solution}
                language={lang}
              />
            ) : (
              <motion.div
                key="empty"
                className="flex flex-col items-center justify-center min-h-[320px] text-center bg-white dark:bg-gray-900/80 rounded-[24px] border border-gray-100 dark:border-white/[0.07] p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(91,92,246,0.1), rgba(124,58,237,0.1))' }}
                >
                  <Sparkles className="w-8 h-8 text-brand" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                  {lang === 'uz' ? 'Natija bu yerda ko\'rinadi'
                    : lang === 'ru' ? 'Результат появится здесь'
                    : 'Result will appear here'}
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed">
                  {lang === 'uz' ? 'Rasm yuklang va "Hal qilish" tugmasini bosing'
                    : lang === 'ru' ? 'Загрузите изображение и нажмите «Решить»'
                    : 'Upload an image and click "Solve"'}
                </p>

                {/* Feature chips */}
                <div className="flex flex-wrap gap-2 mt-5 justify-center">
                  {[
                    { icon: BookOpen, label: lang === 'uz' ? 'Bosqichma-bosqich' : lang === 'ru' ? 'Пошагово' : 'Step-by-step' },
                    { icon: Zap,      label: lang === 'uz' ? 'Formula yechim'    : lang === 'ru' ? 'Формулы'    : 'Formulas'     },
                    { icon: Trophy,   label: lang === 'uz' ? 'XP yutasiz'        : lang === 'ru' ? 'Зарабатывайте XP' : 'Earn XP' },
                    { icon: Clock,    label: lang === 'uz' ? 'Tarix'             : lang === 'ru' ? 'История'    : 'History'      },
                  ].map(f => (
                    <div key={f.label} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.04] px-2.5 py-1.5 rounded-full border border-gray-100 dark:border-white/[0.06]">
                      <f.icon className="w-3 h-3" aria-hidden="true" />
                      {f.label}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
