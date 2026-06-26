/**
 * pages/student/AIVisionPage.tsx
 * Sprint 3.2 Phase 2 — Universal AI Input
 *
 * Two modes:
 *   IDLE  — beautiful hero with quick prompts + UniversalInput
 *   CHAT  — scrollable message thread + UniversalInput pinned at bottom
 *
 * Supports:
 *   📷 Camera  | 🖼 Gallery | 📄 PDF | ✍️ Text
 *   Auto-routes to vision or text endpoint.
 *   Preserves all Phase 1 features (history panel, VisionResult for solve mode).
 */

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, History, RefreshCw, Copy, Check,
  AlertCircle, RotateCcw, BookOpen, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth }         from '@/hooks/useAuth'
import { useLanguage }     from '@/contexts/LanguageContext'
import { useUniversalAI }  from '@/hooks/useUniversalAI'
import { visionService }   from '@/ai-brain/vision/visionService'
import { loadStudentContext } from '@/services/ai-provider.service'
import { UniversalInput }  from '@/components/vision/UniversalInput'
import MarkdownContent     from '@/components/chat/MarkdownContent'
import { AsomiddinAvatar } from '@/components/ai'
import type { VisionHistoryEntry } from '@/ai-brain/vision/types'
import type { Language }   from '@/ai-brain/core/types'
import type { UniversalMessage } from '@/hooks/useUniversalAI'

// ─── Animation constants ──────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

// ─── Labels ───────────────────────────────────────────────────────────────────

const PAGE_LABELS = {
  uz: {
    title:          'YordamchiAI',
    subtitle:       'Matematika, dasturlash, fan — har qanday savolingizga javob olamiz',
    history:        'So\'nggi yechimlar',
    noHistory:      'Hali hech narsa yechilmagan',
    newChat:        'Yangi suhbat',
    copy:           'Nusxalash',
    copied:         'Nusxalandi!',
    retry:          'Qayta urinish',
    error:          'Xatolik yuz berdi.',
    you:            'Siz',
    historyLoading: 'Yuklanmoqda…',
  },
  ru: {
    title:          'YordamchiAI',
    subtitle:       'Математика, программирование, наука — ответы на любые вопросы',
    history:        'Последние решения',
    noHistory:      'Ничего не решено',
    newChat:        'Новый чат',
    copy:           'Копировать',
    copied:         'Скопировано!',
    retry:          'Повторить',
    error:          'Произошла ошибка.',
    you:            'Вы',
    historyLoading: 'Загрузка…',
  },
  en: {
    title:          'YordamchiAI',
    subtitle:       'Math, coding, science — answers to anything you ask',
    history:        'Recent solutions',
    noHistory:      'Nothing solved yet',
    newChat:        'New chat',
    copy:           'Copy',
    copied:         'Copied!',
    retry:          'Retry',
    error:          'An error occurred.',
    you:            'You',
    historyLoading: 'Loading…',
  },
} as const

// ─── Quick prompts ────────────────────────────────────────────────────────────

const QUICK_PROMPTS: Record<Language, ReadonlyArray<{ icon: string; text: string }>> = {
  uz: [
    { icon: '📐', text: "2x + 5 = 15 ni yeching" },
    { icon: '💻', text: "Python'da try/except ni tushuntiring" },
    { icon: '🧬', text: "Fotosintezni oddiy tushuntiring" },
    { icon: '📝', text: "Ushbu matnni xatolardan toza qiling" },
  ],
  ru: [
    { icon: '📐', text: "Решите: 2x + 5 = 15" },
    { icon: '💻', text: "Объясните try/except в Python" },
    { icon: '🧬', text: "Объясните фотосинтез просто" },
    { icon: '📝', text: "Проверьте текст на ошибки" },
  ],
  en: [
    { icon: '📐', text: "Solve: 2x + 5 = 15" },
    { icon: '💻', text: "Explain Python try/except" },
    { icon: '🧬', text: "Explain photosynthesis simply" },
    { icon: '📝', text: "Check this text for errors" },
  ],
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2" aria-label="AI is thinking" aria-live="polite">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="block w-2 h-2 rounded-full bg-brand/60 dark:bg-brand-light/60"
          animate={{ scale: [0.6, 1, 0.6], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

// ─── Chat message bubble ──────────────────────────────────────────────────────

const ChatBubble = memo(function ChatBubble({
  msg,
  onRetry,
  userName,
  language,
}: {
  msg: UniversalMessage
  onRetry?: () => void
  userName: string
  language: Language
}) {
  const [copied, setCopied] = useState(false)
  const lbl = PAGE_LABELS[language]

  const handleCopy = () => {
    if (!msg.content) return
    navigator.clipboard.writeText(msg.content).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser = msg.role === 'user'
  const hasImage = !!(msg.attachedFile && msg.attachedFile.mimeType !== 'application/pdf')
  const hasPdf   = !!(msg.attachedFile && msg.attachedFile.mimeType === 'application/pdf')

  // ── User bubble ────────────────────────────────────────────────────────────
  if (isUser) {
    return (
      <motion.div
        className="flex items-end justify-end gap-2 group/msg"
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <div className="flex flex-col items-end gap-1.5 max-w-[78%] sm:max-w-[65%]">
          {/* Image thumbnail */}
          {hasImage && msg.attachedFile && (
            <img
              src={msg.attachedFile.previewUrl}
              alt="Attached"
              className="max-w-[200px] rounded-2xl rounded-br-sm shadow-md object-cover"
            />
          )}
          {/* PDF badge */}
          {hasPdf && msg.attachedFile && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 px-3 py-2 rounded-2xl rounded-br-sm">
              <span className="text-lg" aria-hidden="true">📄</span>
              <span className="text-[12px] font-medium text-red-700 dark:text-red-300 truncate max-w-[140px]">
                {msg.attachedFile.name}
              </span>
            </div>
          )}
          {/* Text */}
          {msg.content && (
            <div
              className="px-4 py-3 text-sm text-white leading-relaxed rounded-2xl rounded-br-sm"
              style={{ background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)' }}
            >
              {msg.content}
            </div>
          )}
          <time className="text-[10px] text-gray-400 dark:text-gray-600 opacity-0 group-hover/msg:opacity-100 transition-opacity">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
        </div>
        {/* User initial */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white text-[11px] font-black flex-shrink-0 mb-1">
          {userName.charAt(0).toUpperCase()}
        </div>
      </motion.div>
    )
  }

  // ── AI bubble ──────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="flex items-start gap-2.5 group/msg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <div className="flex-shrink-0 mt-0.5">
        <AsomiddinAvatar size="sm" showStatus />
      </div>

      <div className="flex-1 min-w-0 max-w-[85%] sm:max-w-[75%]">
        {/* Loading state */}
        {msg.isLoading && <TypingDots />}

        {/* Error state */}
        {msg.hasError && (
          <div className="flex items-center gap-2 text-[12.5px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-2xl border border-red-200/50 dark:border-red-800/30">
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{lbl.error}</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                {lbl.retry}
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {!msg.isLoading && !msg.hasError && msg.content && (
          <>
            <div className="bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3 shadow-soft">
              <MarkdownContent text={msg.content} />
            </div>

            {/* Action row */}
            <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover/msg:opacity-100 transition-all duration-200 translate-y-1 group-hover/msg:translate-y-0">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 hover:text-brand dark:hover:text-brand-light transition-colors px-2 py-1 rounded-lg hover:bg-brand/5"
                aria-label={lbl.copy}
              >
                {copied
                  ? <><Check className="w-3 h-3 text-emerald-500" aria-hidden="true" /><span className="text-emerald-500">{lbl.copied}</span></>
                  : <><Copy className="w-3 h-3" aria-hidden="true" />{lbl.copy}</>
                }
              </button>
            </div>
          </>
        )}

        <time className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5 block opacity-0 group-hover/msg:opacity-100 transition-opacity">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </time>
      </div>
    </motion.div>
  )
})

// ─── Idle hero section ────────────────────────────────────────────────────────

function IdleHero({
  language,
  onPrompt,
}: {
  language: Language
  onPrompt: (text: string) => void
}) {
  const lbl     = PAGE_LABELS[language]
  const prompts = QUICK_PROMPTS[language]

  return (
    <motion.div
      key="idle-hero"
      className="flex flex-col items-center text-center py-8 sm:py-12 px-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {/* Logo mark */}
      <motion.div
        className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5 shadow-large"
        style={{ background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)' }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <Sparkles className="w-8 h-8 text-white" />
      </motion.div>

      <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
        {lbl.title}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed mb-8">
        {lbl.subtitle}
      </p>

      {/* Quick prompt chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg mb-1">
        {prompts.map(p => (
          <motion.button
            key={p.text}
            type="button"
            onClick={() => onPrompt(p.text)}
            whileHover={{ y: -2, scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-3 text-left px-4 py-3 bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-white/[0.07] shadow-soft hover:border-brand/30 dark:hover:border-brand/25 hover:shadow-[0_4px_16px_rgba(91,92,246,0.12)] transition-all duration-150 group"
          >
            <span className="text-xl flex-shrink-0 transition-transform duration-200 group-hover:scale-110" aria-hidden="true">
              {p.icon}
            </span>
            <span className="text-[12.5px] font-medium text-gray-600 dark:text-gray-300 group-hover:text-brand dark:group-hover:text-brand-light transition-colors leading-snug">
              {p.text}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

// ─── History history item ─────────────────────────────────────────────────────

function HistoryEntry({ entry }: { entry: VisionHistoryEntry }) {
  const dt  = new Date(entry.createdAt)
  const ago = dt.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })
    + ' · ' + dt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors rounded-xl">
      <div className="w-9 h-9 rounded-xl bg-brand/8 dark:bg-brand/12 flex items-center justify-center flex-shrink-0">
        <BookOpen className="w-4 h-4 text-brand dark:text-brand-light" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-gray-900 dark:text-white truncate">{entry.topic}</p>
        <p className="text-[10.5px] text-gray-400 dark:text-gray-500 mt-0.5">{ago}</p>
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">+{entry.xpEarned} XP</span>
        <span className="text-[9px] text-gray-300 dark:text-gray-600">{Math.round(entry.durationMs / 1000)}s</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIVisionPage() {
  const auth              = useAuth()
  const { language }      = useLanguage()
  const lang              = (['uz', 'ru', 'en'].includes(language) ? language : 'uz') as Language
  const lbl               = PAGE_LABELS[lang]
  const userId            = auth.user?.id ?? ''
  const userName          = auth.user?.name ?? 'User'

  // Prefill input when quick prompt is clicked
  const [prefill,         setPrefill]         = useState<string | undefined>()

  // History panel
  const [historyOpen,     setHistoryOpen]     = useState(false)
  const [history,         setHistory]         = useState<VisionHistoryEntry[]>([])
  const [historyLoaded,   setHistoryLoaded]   = useState(false)
  const [historyLoading,  setHistoryLoading]  = useState(false)

  // Student context (loaded once on mount)
  const [ctx, setCtx] = useState<Parameters<typeof useUniversalAI>[0]['ctx'] | null>(null)
  useEffect(() => {
    if (!userId) return
    loadStudentContext(userId, userName)
      .then(setCtx)
      .catch(() => {/* non-critical; hook uses empty ctx */})
  }, [userId, userName])

  const defaultCtx = {
    studentName: userName, groups: [], recentLessons: [],
    testStats: { passed: 0, total: 0, avgPct: 0 }, attPct: null, attTotal: 0,
  }

  const { messages, isChatMode, isLoading, sendMessage, retryLast, reset } =
    useUniversalAI({ userId, ctx: ctx ?? defaultCtx, language: lang })

  // Auto-scroll to bottom in chat mode
  const bottomRef    = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (isChatMode) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isChatMode])

  // Handle quick prompt: set prefill, input will pick it up
  const handleQuickPrompt = useCallback((text: string) => {
    setPrefill(text)
  }, [])
  // After prefill is consumed, clear it
  const handleSend = useCallback((text: string, file: File | null) => {
    setPrefill(undefined)
    void sendMessage(text, file)
  }, [sendMessage])

  // Load history
  const toggleHistory = useCallback(async () => {
    setHistoryOpen(v => !v)
    if (!historyLoaded && userId) {
      setHistoryLoading(true)
      const entries = await visionService.loadHistory(userId, 15)
      setHistory(entries)
      setHistoryLoaded(true)
      setHistoryLoading(false)
    }
  }, [historyLoaded, userId])

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -mt-3 -mx-3 sm:-mt-4 sm:-mx-4 lg:-mt-6 lg:-mx-6 overflow-hidden bg-white dark:bg-[#0F172A] rounded-none sm:rounded-2xl border border-gray-100 dark:border-white/[0.06] shadow-xl shadow-gray-900/5 dark:shadow-none">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/[0.06] bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-brand" aria-hidden="true" />
          <div>
            <span className="text-[14px] font-black text-gray-900 dark:text-white tracking-tight">AI Vision</span>
            <span className="ml-2 text-[9px] font-bold text-brand dark:text-brand-light bg-brand/10 dark:bg-brand/15 px-1.5 py-0.5 rounded-full">Beta</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* History */}
          <button
            type="button"
            onClick={() => void toggleHistory()}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 hover:text-brand dark:hover:text-brand-light transition-colors px-2.5 py-1.5 rounded-xl hover:bg-brand/5 dark:hover:bg-brand/8"
          >
            <History className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{lbl.history}</span>
          </button>

          {/* Reset / New Chat */}
          {isChatMode && (
            <motion.button
              type="button"
              onClick={reset}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 dark:text-gray-400 hover:text-brand dark:hover:text-brand-light transition-colors px-2.5 py-1.5 rounded-xl hover:bg-brand/5 dark:hover:bg-brand/8"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{lbl.newChat}</span>
            </motion.button>
          )}
        </div>
      </header>

      {/* ── History panel ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {historyOpen && (
          <motion.div
            key="history-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden border-b border-gray-100 dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02]"
          >
            <div className="max-h-52 overflow-y-auto divide-y divide-gray-50 dark:divide-white/[0.03]">
              {historyLoading ? (
                <div className="flex items-center justify-center py-4 gap-2 text-sm text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  {lbl.historyLoading}
                </div>
              ) : history.length === 0 ? (
                <p className="text-center py-5 text-[12px] text-gray-400 dark:text-gray-500">
                  {lbl.noHistory}
                </p>
              ) : (
                history.map(e => <HistoryEntry key={e.id} entry={e} />)
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scrollable content area ──────────────────────────────────────────── */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!isChatMode ? (
            // ── IDLE STATE ────────────────────────────────────────────────────
            <div key="idle" className="flex flex-col min-h-full">
              <IdleHero language={lang} onPrompt={handleQuickPrompt} />
            </div>
          ) : (
            // ── CHAT STATE ────────────────────────────────────────────────────
            <motion.div
              key="chat"
              className="w-full max-w-3xl mx-auto px-4 py-6 space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {messages.map(msg => (
                <ChatBubble
                  key={msg.id}
                  msg={msg}
                  onRetry={msg.hasError ? retryLast : undefined}
                  userName={userName}
                  language={lang}
                />
              ))}
              <div ref={bottomRef} className="h-1" aria-hidden="true" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Input bar ────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex-shrink-0 px-4 py-4',
          'bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md',
          'border-t border-gray-100 dark:border-white/[0.06]',
          isChatMode && 'shadow-[0_-4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.2)]',
        )}
      >
        <div className="max-w-3xl mx-auto">
          <UniversalInput
            onSend={handleSend}
            disabled={isLoading}
            language={lang}
            compact={isChatMode}
            // Pass prefill through key trick — when prefill changes, component re-renders
            // and the parent sets the value via the defaultValue pattern
            key={prefill ?? 'input'}
          />
          {/* Prefill: controlled through a hidden state that gets consumed on mount */}
          {prefill && (
            <PrefillConsumer
              text={prefill}
              onConsumed={() => setPrefill(undefined)}
              onSend={handleSend}
            />
          )}
          {isChatMode && (
            <p className="text-center text-[10px] text-gray-300 dark:text-gray-700 mt-2 select-none">
              YordamchiAI · Gemini 2.5 Flash · Enter — yuborish
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Prefill consumer ─────────────────────────────────────────────────────────
// A tiny helper that automatically sends a prefilled prompt
// (from quick prompt chips in the idle state).

function PrefillConsumer({
  text,
  onConsumed,
  onSend,
}: {
  text:       string
  onConsumed: () => void
  onSend:     (text: string, file: File | null) => void
}) {
  useEffect(() => {
    if (text) {
      onSend(text, null)
      onConsumed()
    }
  }, [text, onSend, onConsumed])
  return null
}
