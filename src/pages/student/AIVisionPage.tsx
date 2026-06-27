/**
 * pages/student/AIVisionPage.tsx
 * Sprint 4.4 — Premium AI Vision UI/UX Redesign
 *
 * ⚠️  ALL BUSINESS LOGIC PRESERVED UNCHANGED ⚠️
 * state, hooks, API calls, handlers, effects — identical to Sprint 3.2
 * Only the visual/render layer has been redesigned.
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

// ─── Animation constants (PRESERVED) ─────────────────────────────────────────

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

// ─── Labels (PRESERVED EXACTLY) ──────────────────────────────────────────────

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

// ─── Quick prompts (PRESERVED EXACTLY) ───────────────────────────────────────

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

// ─── Sprint 4.4: Vision action cards (UI-only data, feeds into handleQuickPrompt) ─

const VISION_ACTIONS: ReadonlyArray<{
  emoji: string; label: Record<Language, string>
  desc:  Record<Language, string>; prompt: Record<Language, string>
  color: string
}> = [
  {
    emoji: '📷',
    label: { uz: 'Kamera',      ru: 'Камера',      en: 'Camera'       },
    desc:  { uz: 'Rasm tushiring', ru: 'Сделать фото', en: 'Take a photo' },
    prompt:{ uz: 'Kameradan rasm tushirib tahlil qiling', ru: 'Сфотографируйте и проанализируйте', en: 'Take a photo and analyze it' },
    color: 'from-blue-500 to-cyan-500',
  },
  {
    emoji: '🖼',
    label: { uz: 'Rasm yuklash', ru: 'Загрузить фото', en: 'Upload Image' },
    desc:  { uz: 'Galereyadan tanlang', ru: 'Выбрать из галереи', en: 'Choose from gallery' },
    prompt:{ uz: 'Rasmni yuklang va men tushuntiraman', ru: 'Загрузите изображение для анализа', en: 'Upload an image for analysis' },
    color: 'from-violet-500 to-purple-500',
  },
  {
    emoji: '📄',
    label: { uz: 'PDF yuklash',  ru: 'PDF файл',   en: 'Upload PDF'   },
    desc:  { uz: 'Hujjatni tahlil', ru: 'Анализ документа', en: 'Document analysis' },
    prompt:{ uz: 'PDF hujjatini yuklang va tahlil qiling', ru: 'Загрузите PDF для анализа', en: 'Upload PDF and analyze it' },
    color: 'from-red-500 to-orange-500',
  },
  {
    emoji: '🔍',
    label: { uz: 'Matn aniqlash', ru: 'Распознать текст', en: 'OCR Scan' },
    desc:  { uz: 'OCR texnologiyasi', ru: 'Технология OCR', en: 'Text recognition' },
    prompt:{ uz: 'Rasmdagi matnni aniqlang va o\'qing (OCR)', ru: 'Распознайте текст на изображении', en: 'Recognize and read text from image' },
    color: 'from-emerald-500 to-teal-500',
  },
  {
    emoji: '📚',
    label: { uz: 'Uy ishi',      ru: 'Домашнее задание', en: 'Homework' },
    desc:  { uz: 'Masalani yeching', ru: 'Решить задачу', en: 'Solve the problem' },
    prompt:{ uz: 'Uy ishini yeching va bosqichma-bosqich tushuntiring', ru: 'Решите домашнее задание по шагам', en: 'Solve homework step by step' },
    color: 'from-amber-500 to-yellow-500',
  },
  {
    emoji: '🌍',
    label: { uz: 'Tarjima',      ru: 'Перевод',     en: 'Translate'    },
    desc:  { uz: 'Matnni tarjima', ru: 'Перевести текст', en: 'Translate text' },
    prompt:{ uz: 'Rasmdagi matnni o\'zbek, rus va ingliz tillariga tarjima qiling', ru: 'Переведите текст на изображении', en: 'Translate text from the image' },
    color: 'from-pink-500 to-rose-500',
  },
]

// ─── AI Illustration (CSS art, no external assets) ────────────────────────────

function AiOrb() {
  return (
    <div className="relative flex items-center justify-center w-48 h-48 flex-shrink-0">
      {/* Outer pulse ring */}
      <motion.div
        className="absolute w-44 h-44 rounded-full"
        style={{ border: '1px solid rgba(99,102,241,0.3)' }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.2, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      {/* Middle ring */}
      <motion.div
        className="absolute w-32 h-32 rounded-full"
        style={{ border: '1.5px solid rgba(139,92,246,0.5)' }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.2, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        aria-hidden="true"
      />
      {/* Floating mini orbs */}
      {[
        { angle: 0,   size: 10, delay: 0,   color: '#6366F1' },
        { angle: 72,  size: 7,  delay: 0.5, color: '#8B5CF6' },
        { angle: 144, size: 8,  delay: 1.0, color: '#818CF8' },
        { angle: 216, size: 6,  delay: 1.5, color: '#7C3AED' },
        { angle: 288, size: 9,  delay: 2.0, color: '#6366F1' },
      ].map((orb, i) => {
        const rad = (orb.angle * Math.PI) / 180
        const r   = 60
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: orb.size, height: orb.size,
              background: orb.color,
              boxShadow: `0 0 ${orb.size * 2}px ${orb.color}`,
              left: `calc(50% + ${Math.cos(rad) * r}px - ${orb.size / 2}px)`,
              top:  `calc(50% + ${Math.sin(rad) * r}px - ${orb.size / 2}px)`,
            }}
            animate={{ scale: [0.7, 1.2, 0.7], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2 + orb.delay * 0.4, repeat: Infinity, ease: 'easeInOut', delay: orb.delay }}
            aria-hidden="true"
          />
        )
      })}
      {/* Core orb */}
      <motion.div
        className="relative w-24 h-24 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 40%, #7C3AED 80%, #6D28D9 100%)',
          boxShadow: '0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.25)',
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        aria-hidden="true"
      >
        {/* Inner scan line */}
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden"
          aria-hidden="true"
        >
          <motion.div
            className="absolute inset-x-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)' }}
            animate={{ top: ['-2px', '100%'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
        <Sparkles className="w-10 h-10 text-white relative z-10" aria-hidden="true" />
      </motion.div>
    </div>
  )
}

// ─── Premium typing indicator ─────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-[5px] py-2" aria-label="AI is thinking" aria-live="polite">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="block w-[7px] h-[7px] rounded-full"
          style={{ background: 'linear-gradient(135deg, #818CF8, #6366F1)' }}
          animate={{ scale: [0.5, 1, 0.5], opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.22 }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

// ─── Premium Chat Bubble ──────────────────────────────────────────────────────

const ChatBubble = memo(function ChatBubble({
  msg, onRetry, userName, language,
}: {
  msg: UniversalMessage; onRetry?: () => void
  userName: string; language: Language
}) {
  const [copied, setCopied] = useState(false)
  const lbl = PAGE_LABELS[language]

  const handleCopy = () => {
    if (!msg.content) return
    navigator.clipboard.writeText(msg.content).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser   = msg.role === 'user'
  const hasImage = !!(msg.attachedFile && msg.attachedFile.mimeType !== 'application/pdf')
  const hasPdf   = !!(msg.attachedFile && msg.attachedFile.mimeType === 'application/pdf')

  // ── User bubble ────────────────────────────────────────────────────────────
  if (isUser) {
    return (
      <motion.div
        className="flex items-end justify-end gap-2 group/msg"
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <div className="flex flex-col items-end gap-1.5 max-w-[78%] sm:max-w-[65%]">
          {hasImage && msg.attachedFile && (
            <img
              src={msg.attachedFile.previewUrl}
              alt="Attached"
              className="max-w-[200px] rounded-[20px] rounded-br-sm object-cover"
              style={{ border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
            />
          )}
          {hasPdf && msg.attachedFile && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-[18px] rounded-br-sm"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <span className="text-lg" aria-hidden="true">📄</span>
              <span className="text-[12px] font-medium text-red-300 truncate max-w-[140px]">
                {msg.attachedFile.name}
              </span>
            </div>
          )}
          {msg.content && (
            <div
              className="px-4 py-3 text-sm text-white leading-relaxed"
              style={{
                background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)',
                borderRadius: '20px 20px 4px 20px',
                boxShadow: '0 4px 20px rgba(91,92,246,0.3)',
              }}
            >
              {msg.content}
            </div>
          )}
          <time className="text-[10px] text-white/20 opacity-0 group-hover/msg:opacity-100 transition-opacity">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-black flex-shrink-0 mb-1"
          style={{ background: 'linear-gradient(135deg, #374151, #1F2937)' }}
        >
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
        {msg.isLoading && <TypingDots />}

        {msg.hasError && (
          <div
            className="flex items-center gap-2 text-[12.5px] text-red-400 px-4 py-3"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px 18px 18px 18px' }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{lbl.error}</span>
            {onRetry && (
              <button type="button" onClick={onRetry}
                className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors">
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                {lbl.retry}
              </button>
            )}
          </div>
        )}

        {!msg.isLoading && !msg.hasError && msg.content && (
          <>
            <div
              className="px-4 py-3.5 relative overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '4px 20px 20px 20px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
              }}
            >
              <p className="text-[10.5px] font-bold text-brand-light/70 mb-2 uppercase tracking-widest leading-none">
                ASOMIDDIN AI
              </p>
              <MarkdownContent text={msg.content} />
            </div>
            <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover/msg:opacity-100 transition-all duration-200">
              <button type="button" onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-white/25 hover:text-white/60 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.07]"
                aria-label={lbl.copy}>
                {copied
                  ? <><Check className="w-3 h-3 text-emerald-400" aria-hidden="true" /><span className="text-emerald-400">{lbl.copied}</span></>
                  : <><Copy className="w-3 h-3" aria-hidden="true" />{lbl.copy}</>
                }
              </button>
            </div>
          </>
        )}

        <time className="text-[10px] text-white/20 mt-0.5 block opacity-0 group-hover/msg:opacity-100 transition-opacity">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </time>
      </div>
    </motion.div>
  )
})

// ─── Premium Idle Hero ────────────────────────────────────────────────────────

function IdleHero({ language, onPrompt }: { language: Language; onPrompt: (text: string) => void }) {
  const prompts = QUICK_PROMPTS[language]

  const heroTitle = language === 'ru' ? 'Анализируй любой контент с ИИ'
    : language === 'en' ? 'Analyze any content with AI'
    : 'Har qanday kontentni AI bilan tahlil qiling'

  const heroSub = language === 'ru' ? 'Фото, PDF, формулы — всё анализирует Gemini 2.5 Flash'
    : language === 'en' ? 'Photos, PDFs, formulas — all analyzed by Gemini 2.5 Flash'
    : 'Rasm, PDF, formulalar — barchasini Gemini 2.5 Flash tahlil qiladi'

  return (
    <motion.div
      key="idle-hero"
      className="flex flex-col px-4 py-6 sm:py-8 space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {/* ── Hero card ──────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-[28px] px-6 py-8 sm:px-10 sm:py-10"
        style={{
          background: 'linear-gradient(145deg, #0D0F1E 0%, #131A30 45%, #1A1035 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset',
        }}
      >
        {/* Bg orbs */}
        <div className="absolute pointer-events-none overflow-hidden inset-0" aria-hidden="true">
          <div className="absolute -top-20 right-16 w-72 h-72 rounded-full blur-[80px] opacity-20"
            style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)' }} />
          <div className="absolute -bottom-12 left-8 w-56 h-56 rounded-full blur-[64px] opacity-15"
            style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Left: text */}
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.45, ease: EASE }}
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-5 text-[11.5px] font-semibold"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#C4B5FD' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              AI Vision · Beta · Gemini 2.5 Flash
            </div>

            <h1
              className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 50%, #A78BFA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {heroTitle}
            </h1>
            <p className="text-sm text-white/45 max-w-sm leading-relaxed">
              {heroSub}
            </p>
          </motion.div>

          {/* Right: AI illustration */}
          <motion.div
            className="hidden sm:flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
          >
            <AiOrb />
          </motion.div>
        </div>
      </div>

      {/* ── Premium vision action cards ──────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.45, ease: EASE }}
      >
        {VISION_ACTIONS.map((action, i) => (
          <motion.button
            key={action.label.en}
            type="button"
            onClick={() => onPrompt(action.prompt[language])}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05, duration: 0.35, ease: EASE }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="relative flex flex-col items-start p-4 rounded-[20px] text-left overflow-hidden group"
            style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            }}
          >
            {/* Gradient glow on hover */}
            <div
              className={cn('absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[20px] bg-gradient-to-br', action.color)}
              style={{ opacity: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0.08' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0' }}
              aria-hidden="true"
            />
            {/* Top accent */}
            <div
              className={cn('absolute top-0 inset-x-0 h-[2px] rounded-t-[20px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300', action.color)}
              aria-hidden="true"
            />

            <motion.span
              className="text-2xl mb-3 block"
              aria-hidden="true"
              whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.4 }}
            >
              {action.emoji}
            </motion.span>
            <p className="text-[13px] font-bold text-white/80 mb-0.5">{action.label[language]}</p>
            <p className="text-[11px] text-white/35 leading-snug">{action.desc[language]}</p>
          </motion.button>
        ))}
      </motion.div>

      {/* ── Existing quick prompt chips (PRESERVED) ─────────────────────────── */}
      <motion.div
        className="space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.35 }}
      >
        <p className="text-[10.5px] font-bold text-white/20 uppercase tracking-widest px-1">
          {language === 'ru' ? 'Быстрые подсказки' : language === 'en' ? 'Quick prompts' : 'Tezkor savollar'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {prompts.map(p => (
            <motion.button
              key={p.text}
              type="button"
              onClick={() => onPrompt(p.text)}
              whileHover={{ y: -2, scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-3 text-left px-4 py-3 rounded-[16px] group transition-all duration-150"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <span className="text-xl flex-shrink-0 transition-transform duration-200 group-hover:scale-110" aria-hidden="true">
                {p.icon}
              </span>
              <span className="text-[12.5px] font-medium text-white/50 group-hover:text-white/80 transition-colors leading-snug">
                {p.text}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Premium History Entry ────────────────────────────────────────────────────

function HistoryEntry({ entry }: { entry: VisionHistoryEntry }) {
  const dt  = new Date(entry.createdAt)
  const ago = dt.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })
    + ' · ' + dt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 transition-all duration-150 rounded-xl"
      style={{ cursor: 'default' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}
      >
        <BookOpen className="w-4 h-4 text-brand-light" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-white/70 truncate">{entry.topic}</p>
        <p className="text-[10.5px] text-white/30 mt-0.5">{ago}</p>
      </div>
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <span className="text-[10px] font-bold text-amber-400">+{entry.xpEarned} XP</span>
        <span className="text-[9px] text-white/20">{Math.round(entry.durationMs / 1000)}s</span>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Page — ALL BUSINESS LOGIC PRESERVED FROM SPRINT 3.2
// ═════════════════════════════════════════════════════════════════════════════

export default function AIVisionPage() {
  // ── All state and hooks (UNCHANGED) ──────────────────────────────────────
  const auth              = useAuth()
  const { language }      = useLanguage()
  const lang              = (['uz', 'ru', 'en'].includes(language) ? language : 'uz') as Language
  const lbl               = PAGE_LABELS[lang]
  const userId            = auth.user?.id ?? ''
  const userName          = auth.user?.name ?? 'User'

  const [prefill,         setPrefill]         = useState<string | undefined>()
  const [historyOpen,     setHistoryOpen]     = useState(false)
  const [history,         setHistory]         = useState<VisionHistoryEntry[]>([])
  const [historyLoaded,   setHistoryLoaded]   = useState(false)
  const [historyLoading,  setHistoryLoading]  = useState(false)
  const [ctx, setCtx] = useState<Parameters<typeof useUniversalAI>[0]['ctx'] | null>(null)

  useEffect(() => {
    if (!userId) return
    loadStudentContext(userId, userName)
      .then(setCtx)
      .catch(() => {})
  }, [userId, userName])

  const defaultCtx = {
    studentName: userName, groups: [], recentLessons: [],
    testStats: { passed: 0, total: 0, avgPct: 0 }, attPct: null, attTotal: 0,
  }

  const { messages, isChatMode, isLoading, sendMessage, retryLast, reset } =
    useUniversalAI({ userId, ctx: ctx ?? defaultCtx, language: lang })

  const bottomRef     = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isChatMode) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isChatMode])

  const handleQuickPrompt = useCallback((text: string) => { setPrefill(text) }, [])

  const handleSend = useCallback((text: string, file: File | null) => {
    setPrefill(undefined)
    void sendMessage(text, file)
  }, [sendMessage])

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

  // ── Render (REDESIGNED) ───────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col h-[calc(100vh-5rem)] -mt-3 -mx-3 sm:-mt-4 sm:-mx-4 lg:-mt-6 lg:-mx-6 overflow-hidden rounded-none sm:rounded-[24px]"
      style={{ background: '#080C1A', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* ── Premium Header ────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{
          background: 'rgba(13,18,37,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #5B5CF6, #7C3AED)', boxShadow: '0 0 12px rgba(99,102,241,0.4)' }}
          >
            <Sparkles className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div>
            <span className="text-[14px] font-black text-white tracking-tight">AI Vision</span>
            <span
              className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(99,102,241,0.2)', color: '#C4B5FD', border: '1px solid rgba(99,102,241,0.3)' }}
            >
              Beta
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void toggleHistory()}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-white/40 hover:text-white/75 transition-colors px-2.5 py-1.5 rounded-xl hover:bg-white/[0.06]"
          >
            <History className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{lbl.history}</span>
          </button>

          {isChatMode && (
            <motion.button
              type="button"
              onClick={reset}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-white/40 hover:text-white/75 transition-colors px-2.5 py-1.5 rounded-xl hover:bg-white/[0.06]"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{lbl.newChat}</span>
            </motion.button>
          )}
        </div>
      </header>

      {/* ── History Panel ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {historyOpen && (
          <motion.div
            key="history-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="max-h-52 overflow-y-auto divide-y divide-white/[0.04]">
              {historyLoading ? (
                <div className="flex items-center justify-center py-4 gap-2 text-sm text-white/30">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  {lbl.historyLoading}
                </div>
              ) : history.length === 0 ? (
                <p className="text-center py-5 text-[12px] text-white/25">{lbl.noHistory}</p>
              ) : (
                history.map(e => <HistoryEntry key={e.id} entry={e} />)
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scrollable Content ────────────────────────────────────────────────── */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!isChatMode ? (
            <div key="idle" className="flex flex-col min-h-full">
              <IdleHero language={lang} onPrompt={handleQuickPrompt} />
            </div>
          ) : (
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

      {/* ── Premium Input Bar ─────────────────────────────────────────────────── */}
      <div
        className={cn('flex-shrink-0 px-4 py-4', isChatMode && 'shadow-[0_-4px_32px_rgba(0,0,0,0.3)]')}
        style={{
          background: 'rgba(13,18,37,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-3xl mx-auto">
          <UniversalInput
            onSend={handleSend}
            disabled={isLoading}
            language={lang}
            compact={isChatMode}
            key={prefill ?? 'input'}
          />
          {prefill && (
            <PrefillConsumer
              text={prefill}
              onConsumed={() => setPrefill(undefined)}
              onSend={handleSend}
            />
          )}
          {isChatMode && (
            <p className="text-center text-[9.5px] text-white/15 mt-2 select-none tracking-wide">
              YordamchiAI · AI Vision · Gemini 2.5 Flash
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── PrefillConsumer (PRESERVED EXACTLY UNCHANGED) ───────────────────────────

function PrefillConsumer({
  text, onConsumed, onSend,
}: {
  text: string; onConsumed: () => void; onSend: (text: string, file: File | null) => void
}) {
  useEffect(() => {
    if (text) { onSend(text, null); onConsumed() }
  }, [text, onSend, onConsumed])
  return null
}
