/**
 * pages/student/AIAssistantPage.tsx
 * Sprint 4.3 — Premium AI Assistant UI Redesign
 *
 * ⚠️  ALL BUSINESS LOGIC PRESERVED UNCHANGED ⚠️
 * Only the visual/render layer has been redesigned.
 * State, handlers, effects, API calls — identical to Sprint 3.3.
 */

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import {
  Send, Plus, Trash2, MessageSquare, Search,
  PanelLeftOpen, PanelLeftClose, AlertCircle, Loader2,
  Copy, Check, ThumbsUp, ThumbsDown, RefreshCw, ChevronRight,
  Mic, Square, Pin, PinOff, Pencil, RotateCw, Download,
  Camera, ImageIcon, FileText as FileIcon, X as XIcon,
  Upload,
} from 'lucide-react'
import { IllustrationImage, ILLUS } from '@/components/illustration'
import { AITeacherPanel }   from '@/components/ai-teacher'
import { useVoiceInput }    from '@/hooks/useVoiceInput'
import { supabase }                   from '@/lib/supabase'
import { processImage, validateFile } from '@/ai-brain/vision/imageProcessor'
import { buildVisionChatPrompt }      from '@/ai-brain/vision/promptBuilder'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { aiChatService }                  from '@/services/ai-chat.service'
import { aiProvider, loadStudentContext } from '@/services/ai-provider.service'
import { intelligenceService }            from '@/ai-brain/services/intelligence-service'
import {
  AsomiddinAvatar,
  UserAvatar,
  MessageFooter,
  ThinkingCard,
} from '@/components/ai'
import MarkdownContent from '@/components/chat/MarkdownContent'
import type { AiConversationRow, AiMessageRow } from '@/services/ai-chat.service'
import type { StudentContext, ChatMessageWithParts } from '@/services/ai-provider.service'

// ─── Supported file types ─────────────────────────────────────────────────────

const SUPPORTED_MIME_TYPES = new Set([
  // Images
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  // Documents
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Audio
  'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/webm',
])

/** FileReader with onprogress (0-100) + abort support */
function fileToBase64WithProgress(
  file: File,
  onProgress: (pct: number) => void,
  readerRef?: React.MutableRefObject<FileReader | null>,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    if (readerRef) readerRef.current = reader
    reader.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 92)) }
    reader.onload  = (e) => { onProgress(100); resolve(((e.target?.result as string).split(',')[1]) ?? '') }
    reader.onerror = () => reject(new Error('Fayl o\'qishda xatolik'))
    reader.onabort = () => reject(Object.assign(new Error('Yuklash bekor qilindi'), { name: 'AbortError' }))
    reader.readAsDataURL(file)
  })
}

function fileToTextWithProgress(
  file: File,
  onProgress: (pct: number) => void,
  readerRef?: React.MutableRefObject<FileReader | null>,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    if (readerRef) readerRef.current = reader
    reader.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 92)) }
    reader.onload  = (e) => { onProgress(100); resolve(e.target?.result as string) }
    reader.onerror = () => reject(new Error('Matn faylni o\'qishda xatolik'))
    reader.onabort = () => reject(Object.assign(new Error('Yuklash bekor qilindi'), { name: 'AbortError' }))
    reader.readAsText(file, 'UTF-8')
  })
}

// (fileToBase64WithProgress + fileToTextWithProgress are the canonical versions)
void fileToBase64WithProgress  // keep alive
void fileToTextWithProgress    // keep alive

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/'))  return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType === 'text/plain')      return '📝'
  if (mimeType.includes('word'))      return '📃'
  if (mimeType.startsWith('audio/'))  return '🎵'
  return '📎'
}

// ─── Export utilities ─────────────────────────────────────────────────────────

function downloadBlob(content: string, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime + ';charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

type ExportMsg = { role: string; content: string; created_at: string }

function buildMarkdown(title: string, msgs: ExportMsg[]): string {
  const lines = msgs.map(m => {
    const who  = m.role === 'user' ? '**Siz**' : '**YordamchiAI**'
    const ts   = new Date(m.created_at).toLocaleString('uz-UZ')
    return `### ${who} — ${ts}\n\n${m.content}`
  })
  return `# ${title}\n\n*Eksport: ${new Date().toLocaleString('uz-UZ')}*\n\n---\n\n${lines.join('\n\n---\n\n')}`
}

function buildTxt(title: string, msgs: ExportMsg[]): string {
  const sep = '=' .repeat(60)
  const lines = msgs.map(m => {
    const who  = m.role === 'user' ? 'SIZ' : 'YORDAMCHI AI'
    const ts   = new Date(m.created_at).toLocaleString()
    const text = m.content.replace(/#{1,6}\s?/g, '').replace(/[*_`]/g, '')
    return `[${who} • ${ts}]\n${text}`
  })
  return `${title}\n${sep}\n\n${lines.join('\n\n' + '-'.repeat(40) + '\n\n')}`
}

function buildHtmlDoc(title: string, msgs: ExportMsg[]): string {
  const rows = msgs.map(m => {
    const who   = m.role === 'user' ? 'Siz' : 'YordamchiAI'
    const color = m.role === 'user' ? '#1e3a8a' : '#4c1d95'
    const ts    = new Date(m.created_at).toLocaleString()
    const text  = m.content.replace(/\n/g, '<br>')
    return `<div style="margin:16px 0;padding:12px;border-left:4px solid ${color}">
      <b style="color:${color}">${who}</b> <small style="color:#888">${ts}</small><br><br>${text}</div>`
  })
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:sans-serif;max-width:800px;margin:40px auto;line-height:1.6}</style>
    </head><body><h1>${title}</h1>${rows.join('')}</body></html>`
}

// ─── Pinned conversations: localStorage offline fallback ──────────────────────

const PINNED_FALLBACK_KEY = 'yai_pinned_fallback'

function getFallbackPinned(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(PINNED_FALLBACK_KEY) ?? '[]') as string[]) } catch { return new Set() }
}
function setFallbackPinned(ids: Set<string>) {
  try { localStorage.setItem(PINNED_FALLBACK_KEY, JSON.stringify([...ids])) } catch { /* ignore */ }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type UIMessage = Pick<AiMessageRow, 'id' | 'role' | 'content' | 'created_at'>

// ─── Motion constants ─────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

const MSG_FADE = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.32, ease: EASE } },
}

const CONV_CONTAINER = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
}

const CONV_ITEM = {
  hidden: { opacity: 0, x: -10 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.22, ease: EASE } },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']

function fmtTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function fmtDate(iso: string) {
  const d   = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return fmtTime(iso)
  if (d.toDateString() === new Date(Date.now() - 86400000).toDateString()) return 'Kecha'
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function groupConversations(convs: AiConversationRow[]) {
  const today     = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  return {
    today:     convs.filter(c => new Date(c.updated_at).toDateString() === today),
    yesterday: convs.filter(c => new Date(c.updated_at).toDateString() === yesterday),
    older:     convs.filter(c => {
      const d = new Date(c.updated_at).toDateString()
      return d !== today && d !== yesterday
    }),
  }
}

// ─── Quick action data ────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: '📐', label: 'Matematika',    desc: 'Tenglamalar, formulalar',     grad: 'from-blue-500 to-cyan-400',    prompt: '2x + 5 = 15 ni yeching' },
  { icon: '💻', label: 'Dasturlash',   desc: 'Kod, debugging',               grad: 'from-violet-500 to-purple-400', prompt: "Python'da try/except ni tushuntiring" },
  { icon: '🌍', label: 'Tarjima',      desc: "Ko'p tilli",                   grad: 'from-emerald-500 to-teal-400',  prompt: "Bu matnni inglizchaga tarjima qiling:\n" },
  { icon: '📄', label: 'PDF tahlili',  desc: 'Hujjat tahlili',              grad: 'from-orange-500 to-amber-400',  prompt: 'Ushbu PDFni tahlil qiling' },
  { icon: '✍️', label: 'Insho',        desc: 'Yozish, tahrir',              grad: 'from-pink-500 to-rose-400',     prompt: "Mavzuga insho yozing:\n" },
  { icon: '📝', label: 'Test yaratish',desc: 'Savollar generatsiyasi',       grad: 'from-indigo-500 to-blue-500',   prompt: 'Bu mavzu bo\'yicha 5 ta test savoli yarating:\n' },
]

// ─── Voice Waveform ───────────────────────────────────────────────────────────

function VoiceWaveform() {
  return (
    <div className="flex items-center gap-[3px] h-6" aria-hidden="true">
      {[0,1,2,3,4,5,6,7].map(i => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full"
          style={{ background: 'linear-gradient(180deg, #818CF8, #6366F1)' }}
          animate={{ height: ['6px', '20px', '8px', '16px', '6px'] }}
          transition={{
            duration: 1.0, repeat: Infinity, ease: 'easeInOut',
            delay: i * 0.09, repeatType: 'mirror',
          }}
        />
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  onAction, language,
}: {
  onAction: (prompt: string) => void
  language: string
}) {
  const greeting = language === 'ru'
    ? 'Чем я могу помочь сегодня?'
    : language === 'en'
      ? 'What can I help you with today?'
      : 'Bugun nima bilan yordam bera olaman?'

  const sub = language === 'ru'
    ? 'Задайте любой вопрос — по математике, программированию, языкам и многому другому.'
    : language === 'en'
      ? 'Ask me anything — math, coding, languages, and much more.'
      : 'Har qanday savol bering — matematika, dasturlash, tillar va boshqa ko\'p narsalar haqida.'

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[56vh] text-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      {/* AI Chat illustration — PNG when available, avatar fallback */}
      <motion.div
        className="relative mb-6"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="absolute -inset-12 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(91,127,255,0.32) 0%, transparent 65%)' }}
          aria-hidden="true"
        />
        <div className="relative z-10">
          <IllustrationImage
            src={ILLUS.AI_CHAT}
            alt="Yordamchi AI — Sun'iy intellekt yordamchisi"
            width={200}
            height={220}
            glow="0 0 40px rgba(91,127,255,0.45)"
            fallback={<AsomiddinAvatar size="xl" showStatus />}
          />
        </div>
      </motion.div>

      <motion.h1
        className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
      >
        YordamchiAI
      </motion.h1>
      <motion.p
        className="text-sm text-white/45 mb-2 font-medium"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.4, ease: EASE }}
      >
        {greeting}
      </motion.p>
      <motion.p
        className="text-[13px] text-white/30 mb-10 max-w-sm leading-relaxed"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.4, ease: EASE }}
      >
        {sub}
      </motion.p>

      {/* Suggestion cards */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full max-w-xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.45, ease: EASE }}
      >
        {QUICK_ACTIONS.map(({ icon, label, desc, prompt }) => (
          <motion.button
            key={label}
            type="button"
            onClick={() => onAction(prompt)}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 340, damping: 24 }}
            className="flex flex-col items-start p-4 rounded-[20px] text-left transition-all duration-150"
            style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
              willChange: 'transform',
            }}
          >
            <span className="text-xl mb-2.5" aria-hidden="true">{icon}</span>
            <p className="text-[12.5px] font-bold text-white/80 mb-0.5">{label}</p>
            <p className="text-[11px] text-white/35 leading-snug">{desc}</p>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  )
}

// ─── Premium Action Button ────────────────────────────────────────────────────

function ActionBtn({
  onClick, title, active = false, children,
}: {
  onClick: () => void; title: string; active?: boolean; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-150 active:scale-90',
        active
          ? 'text-brand-light bg-brand/20'
          : 'text-white/30 hover:text-white/70 hover:bg-white/[0.08]',
      )}
    >
      {children}
    </button>
  )
}

// ─── Premium MessageBubble ────────────────────────────────────────────────────

const MessageBubble = memo(function MessageBubble({
  msg, onRegenerate, onContinue, userName, userAvatarUrl, isStreaming, onStreamComplete, isLastAi,
}: {
  msg: UIMessage
  onRegenerate?:     () => void
  onContinue?:       () => void
  userName?:         string
  userAvatarUrl?:    string | null
  isStreaming?:      boolean
  onStreamComplete?: () => void
  isLastAi?:         boolean
}) {
  const shouldReduce = useReducedMotion()
  const [copied,     setCopied]     = useState(false)
  const [liked,      setLiked]      = useState(false)
  const [disliked,   setDisliked]   = useState(false)
  const [streamDone, setStreamDone] = useState(!isStreaming)
  const isUser = msg.role === 'user'

  const handleCopy           = () => { navigator.clipboard.writeText(msg.content).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const handleLike           = () => { setLiked(v => !v); setDisliked(false) }
  const handleDislike        = () => { setDisliked(v => !v); setLiked(false) }
  const handleStreamComplete = useCallback(() => { setStreamDone(true); onStreamComplete?.() }, [onStreamComplete])
  void handleStreamComplete  // consumed by streamDone state above

  /* ── USER message ────────────────────────────────────────────────────────── */
  if (isUser) {
    return (
      <motion.div
        variants={shouldReduce ? undefined : MSG_FADE}
        initial={shouldReduce ? false : 'hidden'}
        animate={shouldReduce ? false : 'show'}
        className="flex items-end justify-end gap-2.5 group/msg"
      >
        <div className="flex flex-col items-end gap-1.5 min-w-0" style={{ maxWidth: 'min(82%, 560px)' }}>
          {/* Text bubble */}
          <div className="relative group/bubble w-full">
            <div
              className="relative text-white text-sm leading-relaxed break-words px-4 py-3 w-full overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)',
                borderRadius: '20px 20px 4px 20px',
                boxShadow: '0 4px 20px rgba(91,92,246,0.3)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-[inherit]" />
              <span className="relative">{msg.content}</span>
            </div>
            {/* Copy on hover */}
            <div className="flex justify-end mt-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-150">
              <button
                type="button"
                onClick={handleCopy}
                title="Nusxalash"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.08] transition-all active:scale-90"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <time className="text-[10px] text-white/25 px-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
            {fmtTime(msg.created_at)}
          </time>
        </div>
        <UserAvatar name={userName} avatarUrl={userAvatarUrl} showStatus />
      </motion.div>
    )
  }

  /* ── AI message ──────────────────────────────────────────────────────────── */
  return (
    <motion.div
      variants={shouldReduce ? undefined : MSG_FADE}
      initial={shouldReduce ? false : 'hidden'}
      animate={shouldReduce ? false : 'show'}
      className="flex items-start gap-2.5 group/msg"
    >
      <AsomiddinAvatar size="md" showStatus />

      <div className="flex-1 min-w-0 flex flex-col group/card">
        {/* Glass card */}
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: '4px 20px 20px 20px',
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            padding: '14px 16px',
          }}
        >
          {/* Assistant name */}
          <p className="text-[10.5px] font-bold text-brand-light/80 mb-2 tracking-wider uppercase leading-none">
            ASOMIDDIN AI
          </p>

          {/* Content — thinking state → cursor → rendered markdown */}
          {isStreaming && !streamDone && msg.content === '' ? (
            /* Thinking state: before first token */
            <div className="flex items-center gap-2.5 py-1" aria-live="polite" aria-label="AI o'ylayapti">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <motion.span
                    key={i}
                    className="block w-1.5 h-1.5 rounded-full"
                    style={{ background: 'rgba(139,92,246,0.7)' }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
                  />
                ))}
              </div>
              <span className="text-[13px] text-white/40 font-medium">YordamchiAI o&apos;ylayapti…</span>
            </div>
          ) : isStreaming && !streamDone ? (
            /* Streaming: show rendered content + blinking cursor */
            <div className="relative">
              <MarkdownContent text={msg.content} />
              <span
                className="inline-block w-[2px] h-[1.1em] bg-brand-light/85 ml-0.5 align-text-bottom"
                style={{ animation: 'v6-ring-pulse 0.9s step-end infinite' }}
                aria-hidden="true"
              />
            </div>
          ) : (
            <MarkdownContent text={msg.content} />
          )}
        </div>

        {/* Action bar — hover reveal */}
        <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover/card:opacity-100 transition-all duration-200 translate-y-0.5 group-hover/card:translate-y-0">
          <ActionBtn onClick={handleCopy} title="Nusxalash">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </ActionBtn>
          <ActionBtn onClick={handleLike}    title="Yaxshi"           active={liked}>    <ThumbsUp   className="w-3.5 h-3.5" /></ActionBtn>
          <ActionBtn onClick={handleDislike} title="Yomon"            active={disliked}> <ThumbsDown className="w-3.5 h-3.5" /></ActionBtn>
          {onRegenerate && (
            <ActionBtn onClick={onRegenerate} title="Qaytadan yaratish"><RefreshCw className="w-3.5 h-3.5" /></ActionBtn>
          )}
          {/* Continue generation — only on last AI message, not while streaming */}
          {isLastAi && !isStreaming && onContinue && (
            <ActionBtn onClick={onContinue} title="Davom etish">
              <ChevronRight className="w-3.5 h-3.5" />
            </ActionBtn>
          )}
        </div>

        <div style={{ marginTop: '10px' }}>
          <MessageFooter visible={streamDone} />
        </div>
        <time className="text-[10px] text-white/20 mt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
          {fmtTime(msg.created_at)}
        </time>
      </div>
    </motion.div>
  )
})

// ─── Premium ConvItem — rename + pin + delete ─────────────────────────────────

function ConvItem({
  conv, active, deleting, pinned, onSelect, onDelete, onPin, onRename,
}: {
  conv: AiConversationRow; active: boolean; deleting: boolean; pinned: boolean
  onSelect: () => void; onDelete: (e: React.MouseEvent) => void
  onPin: (e: React.MouseEvent) => void; onRename: (e: React.MouseEvent) => void
}) {
  return (
    <motion.div variants={CONV_ITEM} layout>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'w-full text-left px-3 py-2.5 rounded-xl group relative flex items-center gap-2.5 transition-all duration-150 border',
          active
            ? 'text-brand-light border-brand/25 font-semibold'
            : 'text-white/50 border-transparent hover:text-white/75 hover:border-white/[0.06]',
        )}
        style={active ? {
          background: 'rgba(99,102,241,0.15)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        } : {}}
      >
        {pinned ? (
          <Pin className="w-3 h-3 flex-shrink-0 text-amber-400/70" aria-hidden="true" />
        ) : (
          <MessageSquare className={cn('w-3.5 h-3.5 flex-shrink-0', active ? 'text-brand-light' : 'text-white/25')} aria-hidden="true" />
        )}
        <span className="flex-1 text-[12.5px] font-medium truncate pr-16">{conv.title}</span>
        <span className="text-[10px] text-white/25 flex-shrink-0 group-hover:opacity-0 transition-opacity absolute right-9">
          {fmtDate(conv.updated_at)}
        </span>
        {/* Action buttons — reveal on hover */}
        <div className="absolute right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
          <button type="button" onClick={onRename} aria-label="Nomini o'zgartirish"
            className="w-6 h-6 flex items-center justify-center rounded-md text-white/20 hover:text-white/60 hover:bg-white/[0.07] transition-all">
            <Pencil className="w-3 h-3" />
          </button>
          <button type="button" onClick={onPin} aria-label={pinned ? 'Pinni olib tashlash' : 'Pinlash'}
            className={cn('w-6 h-6 flex items-center justify-center rounded-md transition-all',
              pinned ? 'text-amber-400 hover:bg-amber-500/12' : 'text-white/20 hover:text-amber-400 hover:bg-white/[0.07]')}>
            {pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
          </button>
          <button type="button" onClick={onDelete} disabled={deleting} aria-label="O'chirish"
            className="w-6 h-6 flex items-center justify-center rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/12 transition-all disabled:opacity-30">
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          </button>
        </div>
      </button>
    </motion.div>
  )
}

function GroupLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold text-white/20 uppercase tracking-[0.15em]">
      {label}
    </p>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Page — ALL BUSINESS LOGIC PRESERVED FROM SPRINT 3.3
// ═════════════════════════════════════════════════════════════════════════════

export default function AIAssistantPage() {
  const auth         = useAuth()
  const { language } = useLanguage()
  const shouldReduce = useReducedMotion()

  // ── Core state (PRESERVED UNCHANGED) ─────────────────────────────────────
  const [conversations, setConversations] = useState<AiConversationRow[]>([])
  const [activeConvId,  setActiveConvId]  = useState<string | null>(null)
  const [messages,      setMessages]      = useState<UIMessage[]>([])
  const [input,         setInput]         = useState('')
  const [isTyping,      setIsTyping]      = useState(false)
  const [convLoading,   setConvLoading]   = useState(true)
  const [msgLoading,    setMsgLoading]    = useState(false)
  const [sidebarOpen,   setSidebarOpen]   = useState(true)
  const [rightOpen,     setRightOpen]     = useState(true)
  const [context,       setContext]       = useState<StudentContext | null>(null)
  const [error,         setError]         = useState<string | null>(null)
  const [deletingId,    setDeletingId]    = useState<string | null>(null)
  const [search,        setSearch]        = useState('')
  const [streamingId,   setStreamingId]   = useState<string | null>(null)
  const [attachedFile,  setAttachedFile]  = useState<File | null>(null)
  const [filePreviewUrl,setFilePreviewUrl]= useState<string | null>(null)
  const [voiceError,    setVoiceError]    = useState<string | null>(null)

  // ── Engine additions ───────────────────────────────────────────────────────
  // Streaming
  const [isStreaming,      setIsStreaming]      = useState(false)
  const [streamingMsgId,   setStreamingMsgId]  = useState<string | null>(null)
  const abortRef                                = useRef<AbortController | null>(null)
  // Extended file (base64 for DOCX/audio)
  const [fileBase64,       setFileBase64]       = useState<string | null>(null)
  // Upload progress
  const [uploadProgress,   setUploadProgress]  = useState<number | null>(null)
  const uploadReaderRef                         = useRef<FileReader | null>(null)
  // Drag & Drop
  const [isDragging,       setIsDragging]       = useState(false)
  // Rename
  const [renamingId,       setRenamingId]       = useState<string | null>(null)
  const [renameVal,        setRenameVal]        = useState('')
  const renameInputRef                          = useRef<HTMLInputElement>(null)
  // Pin (Supabase-backed, localStorage offline fallback)
  const [pinnedIds,        setPinnedIds]        = useState<Set<string>>(getFallbackPinned)
  // Network recovery
  const [netError,         setNetError]         = useState<string | null>(null)
  const retryRef                                = useRef<(() => void) | null>(null)
  const inputDraftRef                           = useRef('')
  // Export menu
  const [showExportMenu,   setShowExportMenu]   = useState(false)
  const exportMenuRef                           = useRef<HTMLDivElement>(null)

  const { isListening, isSupported: voiceSupported, toggle: toggleVoice } = useVoiceInput({
    language,
    onResult: (transcript) => {
      setInput(prev => (prev ? prev + ' ' : '') + transcript)
      setVoiceError(null)
      setTimeout(() => inputRef.current?.focus(), 60)
    },
    onInterim: (_partial) => {},
  })

  const bottomRef       = useRef<HTMLDivElement>(null)
  const inputRef        = useRef<HTMLTextAreaElement>(null)
  const chatAreaRef     = useRef<HTMLDivElement>(null)
  const cameraInputRef  = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef     = useRef<HTMLInputElement>(null)
  const anyFileInputRef = useRef<HTMLInputElement>(null)
  const studentId        = auth.user?.id        ?? ''
  const studentName      = auth.user?.name      ?? 'Talaba'
  const studentAvatarUrl = auth.user?.avatarUrl ?? null

  // ── All effects + handlers ────────────────────────────────────────────────

  // Memory cleanup on unmount
  useEffect(() => () => {
    abortRef.current?.abort()
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (studentId) void init(); else setConvLoading(false) }, [studentId])

  async function init() {
    setConvLoading(true); setError(null)
    try {
      const [convs, ctx] = await Promise.all([
        aiChatService.getConversations(studentId),
        loadStudentContext(studentId, studentName),
      ])
      setConversations(convs); setContext(ctx)
      // Sync pinned IDs from server (is_pinned field) + merge offline fallback
      const serverPinned = new Set(convs.filter(c => c.is_pinned).map(c => c.id))
      setPinnedIds(serverPinned); setFallbackPinned(serverPinned)
      if (convs.length > 0) await selectConversation(convs[0].id)
    } catch { setError("Ma'lumotlarni yuklashda xatolik") }
    finally  { setConvLoading(false) }
  }

  const selectConversation = useCallback(async (id: string) => {
    setActiveConvId(id); setMsgLoading(true); setMessages([]); setStreamingId(null)
    try   { setMessages(await aiChatService.getMessages(id)) }
    catch { setError("Xabarlarni yuklashda xatolik") }
    finally { setMsgLoading(false) }
  }, [])

  async function handleNewConversation() {
    if (!studentId) return
    if (window.innerWidth < 768) setSidebarOpen(false)
    try {
      const conv = await aiChatService.createConversation(studentId)
      setConversations(prev => [conv, ...prev])
      setActiveConvId(conv.id); setMessages([])
      setTimeout(() => inputRef.current?.focus(), 80)
    } catch { setError("Yangi suhbat yaratishda xatolik") }
  }

  // ── Extended file handler (all types) ────────────────────────────────────
  function cancelUpload() {
    uploadReaderRef.current?.abort()
    setUploadProgress(null)
  }

  async function handleFileSelectExtended(file: File) {
    setError(null); setNetError(null)
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)

    const isImage = file.type.startsWith('image/')
    const isPdf   = file.type === 'application/pdf'
    const isTxt   = file.type === 'text/plain'
    const isDocx  = file.type.includes('wordprocessingml')
    const isAudio = file.type.startsWith('audio/')

    if (isImage || isPdf) {
      setUploadProgress(30)
      const { valid, errorCode } = validateFile(file)
      if (!valid) { setError(errorCode ?? 'Fayl noto\'g\'ri'); setUploadProgress(null); return }
      setAttachedFile(file); setFilePreviewUrl(URL.createObjectURL(file)); setFileBase64(null)
      setUploadProgress(100); setTimeout(() => setUploadProgress(null), 400)
      return
    }

    if (isTxt) {
      setUploadProgress(0)
      try {
        const text    = await fileToTextWithProgress(file, setUploadProgress, uploadReaderRef)
        const excerpt = text.length > 4000 ? text.slice(0, 4000) + '\n...(qisqartirildi)' : text
        setInput(prev => (prev ? prev + '\n\n' : '') + `[${file.name}]:\n\`\`\`\n${excerpt}\n\`\`\``)
        setUploadProgress(100); setTimeout(() => setUploadProgress(null), 400)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError('Matn faylni o\'qishda xatolik')
        setUploadProgress(null)
      }
      return
    }

    if (isDocx || isAudio) {
      if (!SUPPORTED_MIME_TYPES.has(file.type)) { setError(`Qo'llab-quvvatlanmagan fayl turi`); return }
      setUploadProgress(0)
      try {
        const b64 = await fileToBase64WithProgress(file, setUploadProgress, uploadReaderRef)
        setAttachedFile(file); setFilePreviewUrl(null); setFileBase64(b64)
        setUploadProgress(100); setTimeout(() => setUploadProgress(null), 400)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError('Fayl o\'qishda xatolik')
        setUploadProgress(null)
      }
      return
    }

    setError(`Bu fayl turi qo'llab-quvvatlanmaydi: ${file.type || file.name.split('.').pop()}`)
  }

  function clearFile() {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
    setAttachedFile(null); setFilePreviewUrl(null); setFileBase64(null); setUploadProgress(null)
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) void handleFileSelectExtended(f)
    e.target.value = ''
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }
  function handleDragLeave(e: React.DragEvent) { e.preventDefault(); if (!chatAreaRef.current?.contains(e.relatedTarget as Node)) setIsDragging(false) }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) void handleFileSelectExtended(file)
  }

  // ── Stop generation ────────────────────────────────────────────────────────
  function handleStop() {
    abortRef.current?.abort()
    abortRef.current = null
  }

  // ── Rename conversation ───────────────────────────────────────────────────
  function startRename(e: React.MouseEvent, conv: AiConversationRow) {
    e.stopPropagation()
    setRenamingId(conv.id)
    setRenameVal(conv.title)
    setTimeout(() => renameInputRef.current?.focus(), 60)
  }

  async function commitRename(convId: string) {
    const title = renameVal.trim()
    setRenamingId(null)
    if (!title || title === conversations.find(c => c.id === convId)?.title) return
    try {
      await aiChatService.updateTitle(convId, title)
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, title } : c))
    } catch { /* silent */ }
  }

  // ── Pin conversation — Supabase + localStorage fallback ───────────────────
  function togglePin(e: React.MouseEvent, convId: string) {
    e.stopPropagation()
    setPinnedIds(prev => {
      const next    = new Set(prev)
      const pinned  = !next.has(convId)
      pinned ? next.add(convId) : next.delete(convId)
      // Optimistic UI — update local state immediately
      setConversations(p => p.map(c => c.id === convId ? { ...c, is_pinned: pinned } : c))
      setFallbackPinned(next)  // persist to localStorage for offline
      // Sync to Supabase in background
      void aiChatService.setPinned(convId, pinned).catch(() => {
        // Revert on failure
        setPinnedIds(prev2 => {
          const revert = new Set(prev2)
          pinned ? revert.delete(convId) : revert.add(convId)
          setFallbackPinned(revert)
          return revert
        })
        setConversations(p => p.map(c => c.id === convId ? { ...c, is_pinned: !pinned } : c))
      })
      return next
    })
  }

  // ── Continue generation (ChatGPT-style append) ────────────────────────────
  async function handleContinue(lastAiMsgId: string) {
    if (!activeConvId || isTyping || isStreaming) return
    const lastAI = messages.find(m => m.id === lastAiMsgId)
    if (!lastAI) return

    const history: ChatMessageWithParts[] = [
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: language === 'ru'
          ? 'Продолжи, пожалуйста. Напиши оставшуюся часть ответа.'
          : language === 'en'
          ? 'Please continue. Write the remaining part of your answer.'
          : 'Iltimos, davom eting. Javobingizning qolgan qismini yozing.' },
    ]

    const currentCtx = context ?? {
      studentName, groups: [], recentLessons: [],
      testStats: { passed: 0, total: 0, avgPct: 0 }, attPct: null, attTotal: 0,
    }
    const originalContent = lastAI.content
    const sep = '\n\n'

    setIsTyping(true); setIsStreaming(true); setStreamingMsgId(lastAiMsgId)
    const ctrl = new AbortController(); abortRef.current = ctrl
    let cont = ''; let aborted = false

    try {
      for await (const chunk of aiProvider.streamComplete(history, currentCtx,
        { userId: studentId, conversationId: activeConvId }, ctrl.signal)) {
        cont += chunk
        const combined = originalContent + sep + cont
        setMessages(prev => prev.map(m => m.id === lastAiMsgId ? { ...m, content: combined } : m))
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') aborted = true
      else { setError('Davom etishda xatolik'); setMessages(prev => prev.map(m => m.id === lastAiMsgId ? { ...m, content: originalContent } : m)) }
    } finally {
      abortRef.current = null; setIsStreaming(false); setStreamingMsgId(null); setIsTyping(false)
    }

    if (cont && !aborted) {
      const combined = originalContent + sep + cont
      await aiChatService.updateMessageContent(lastAiMsgId, combined).catch(() => {})
    } else if (aborted && cont) {
      const combined = originalContent + sep + cont + '\n\n*(to\'xtatildi)*'
      setMessages(prev => prev.map(m => m.id === lastAiMsgId ? { ...m, content: combined } : m))
      await aiChatService.updateMessageContent(lastAiMsgId, combined).catch(() => {})
    }
  }

  // ── Network recovery ───────────────────────────────────────────────────────
  function handleRetry() {
    const fn = retryRef.current
    if (!fn) return
    retryRef.current = null
    setNetError(null)
    fn()
  }

  // ── Export conversation ────────────────────────────────────────────────────
  function getActiveConv() { return conversations.find(c => c.id === activeConvId) }

  function exportMarkdown() {
    const conv = getActiveConv()
    downloadBlob(buildMarkdown(conv?.title ?? 'Suhbat', messages), 'text/markdown', `suhbat-${Date.now()}.md`)
    setShowExportMenu(false)
  }
  function exportTxt() {
    const conv = getActiveConv()
    downloadBlob(buildTxt(conv?.title ?? 'Suhbat', messages), 'text/plain', `suhbat-${Date.now()}.txt`)
    setShowExportMenu(false)
  }
  function exportPdf() {
    const conv  = getActiveConv()
    const html  = buildHtmlDoc(conv?.title ?? 'Suhbat', messages)
    const win   = window.open('', '_blank')
    if (!win) return
    win.document.write(html + '<script>window.onload=()=>setTimeout(()=>window.print(),200)</script>')
    win.document.close()
    setShowExportMenu(false)
  }
  function exportDoc() {
    const conv = getActiveConv()
    const html = buildHtmlDoc(conv?.title ?? 'Suhbat', messages)
    downloadBlob(html, 'application/msword', `suhbat-${Date.now()}.doc`)
    setShowExportMenu(false)
  }

  // Close export menu on outside click
  useEffect(() => {
    if (!showExportMenu) return
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setShowExportMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showExportMenu])

  async function callVisionInAssistant(
    imageBase64: string, mimeType: string,
    systemInstruction: string, userQuestion: string,
  ): Promise<string> {
    const { data, error: fnError } = await supabase.functions.invoke('ai-vision', {
      body: { imageBase64, mimeType, systemInstruction, userMessage: userQuestion },
    })
    if (fnError) {
      const ctx = (fnError as unknown as { context?: { error?: string } }).context
      throw new Error(ctx?.error ?? fnError.message)
    }
    if (!data?.response) throw new Error('ai_empty_response')
    return data.response as string
  }

  async function handleSend() {
    const text = input.trim()
    if (!text && !attachedFile) return
    if (!activeConvId || isTyping || isStreaming) return

    setInput(''); setError(null)
    if (inputRef.current) inputRef.current.style.height = 'auto'

    const file    = attachedFile
    const b64     = fileBase64
    if (file) clearFile()

    const icon = file ? getFileIcon(file.type) : ''
    const displayContent = file
      ? (text ? `${text}\n${icon} ${file.name}` : `${icon} ${file.name}`)
      : text

    const tempMsg: UIMessage = {
      id: `temp-${Date.now()}`, role: 'user', content: displayContent, created_at: new Date().toISOString(),
    }
    const newMsgs = [...messages, tempMsg]
    setMessages(newMsgs)

    try {
      const savedUser = await aiChatService.addMessage(activeConvId, 'user', displayContent)

      if (messages.filter(m => m.role === 'user').length === 0) {
        const titleBase = text || file?.name || 'Yangi suhbat'
        const title = titleBase.slice(0, 40) + (titleBase.length > 40 ? '…' : '')
        void aiChatService.updateTitle(activeConvId, title)
        setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, title } : c))
      }

      setIsTyping(true)
      const currentCtx = context ?? {
        studentName, groups: [], recentLessons: [],
        testStats: { passed: 0, total: 0, avgPct: 0 }, attPct: null, attTotal: 0,
      }

      // ── Vision path (image or processable file via ai-vision edge function) ──
      if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
        const processed = await processImage(file)
        const profile   = intelligenceService.getProfile(currentCtx, studentId)
        const { systemInstruction } = buildVisionChatPrompt(
          processed, profile,
          (language === 'uz' || language === 'ru' || language === 'en') ? language : 'uz',
        )
        const question = text || (
          language === 'ru' ? 'Проанализируйте и объясните'
          : language === 'en' ? 'Analyze and explain'
          : 'Tahlil qiling va tushuntiring'
        )
        const aiResponse = await callVisionInAssistant(processed.base64, processed.mimeType, systemInstruction, question)
        const savedAI = await aiChatService.addMessage(activeConvId, 'assistant', aiResponse)
        setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), savedUser, savedAI])
        setStreamingId(savedAI.id)
        setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, updated_at: new Date().toISOString() } : c))
        intelligenceService.recordAIResponse(activeConvId, aiResponse, displayContent, currentCtx)
        return
      }

      // ── Streaming text path (DOCX/audio as inline data, or pure text) ────────
      const historyBase = [
        ...newMsgs.filter(m => !m.id.startsWith('temp')), savedUser,
      ]

      const historyForStream: ChatMessageWithParts[] = historyBase.map((m, idx) => {
        // Attach file data only to the last user message
        if (idx === historyBase.length - 1 && file && b64) {
          return {
            role: m.role as 'user' | 'assistant',
            content: m.content,
            parts: [
              { type: 'text' as const, text: m.content },
              { type: 'file' as const, base64: b64, mimeType: file.type, name: file.name },
            ],
          }
        }
        return { role: m.role as 'user' | 'assistant', content: m.content }
      })

      intelligenceService.recordUserMessage(activeConvId, text, currentCtx)

      // Create streaming placeholder message
      const tempAI: UIMessage = {
        id:         `stream-${Date.now()}`,
        role:       'assistant',
        content:    '',
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), savedUser, tempAI])
      setIsStreaming(true)
      setStreamingMsgId(tempAI.id)

      const ctrl = new AbortController()
      abortRef.current = ctrl

      let fullText = ''
      let aborted  = false

      try {
        const gen = aiProvider.streamComplete(
          historyForStream, currentCtx,
          { userId: studentId, conversationId: activeConvId, lastUserMessage: text },
          ctrl.signal,
        )

        for await (const chunk of gen) {
          fullText += chunk
          const snapshot = fullText
          setMessages(prev => prev.map(m => m.id === tempAI.id ? { ...m, content: snapshot } : m))
          // Auto-scroll during streaming
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      } catch (streamErr) {
        if ((streamErr as Error).name === 'AbortError') {
          aborted = true
        } else {
          throw streamErr
        }
      } finally {
        abortRef.current = null
        setIsStreaming(false)
        setStreamingMsgId(null)
      }

      // Save to DB (partial response if aborted)
      const finalText = aborted && fullText
        ? fullText + '\n\n*(Generatsiya to\'xtatildi)*'
        : fullText

      if (finalText) {
        const savedAI = await aiChatService.addMessage(activeConvId, 'assistant', finalText)
        setMessages(prev => prev.map(m => m.id === tempAI.id ? { ...savedAI } : m))
        setStreamingId(savedAI.id)
        setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, updated_at: new Date().toISOString() } : c))
        intelligenceService.recordAIResponse(activeConvId, finalText, displayContent, currentCtx)
      } else if (aborted) {
        setMessages(prev => prev.filter(m => m.id !== tempAI.id))
      }

    } catch {
      // Network recovery: preserve draft + offer retry
      const draftText = displayContent
      inputDraftRef.current = draftText
      retryRef.current = () => {
        setInput(draftText)
        setTimeout(() => inputRef.current?.focus(), 60)
      }
      setNetError("Xabar yuborishda xatolik. Internet aloqasini tekshiring.")
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
    } finally {
      setIsTyping(false)
    }
  }

  async function handleRegenerate(aiMsgId: string) {
    if (!activeConvId || isTyping || isStreaming) return
    const aiIdx = messages.findIndex(m => m.id === aiMsgId)
    if (aiIdx < 0) return
    const history: ChatMessageWithParts[] = messages.slice(0, aiIdx).map(m => ({
      role: m.role as 'user' | 'assistant', content: m.content,
    }))
    if (!history.some(m => m.role === 'user')) return

    setIsTyping(true); setError(null)
    try {
      const lastUserMsg = history.filter(m => m.role === 'user').at(-1)?.content ?? ''
      const currentCtx  = context ?? {
        studentName, groups: [], recentLessons: [],
        testStats: { passed: 0, total: 0, avgPct: 0 }, attPct: null, attTotal: 0,
      }

      // Streaming regenerate
      const tempAI: UIMessage = {
        id: `regen-${Date.now()}`, role: 'assistant', content: '', created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev.slice(0, aiIdx), tempAI])
      setIsStreaming(true); setStreamingMsgId(tempAI.id)

      const ctrl = new AbortController(); abortRef.current = ctrl
      let fullText = ''

      try {
        for await (const chunk of aiProvider.streamComplete(history, currentCtx, {
          userId: studentId, conversationId: activeConvId, lastUserMessage: lastUserMsg,
        }, ctrl.signal)) {
          fullText += chunk
          const snap = fullText
          setMessages(prev => prev.map(m => m.id === tempAI.id ? { ...m, content: snap } : m))
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') throw e
      } finally {
        abortRef.current = null; setIsStreaming(false); setStreamingMsgId(null)
      }

      if (fullText) {
        const savedAI = await aiChatService.addMessage(activeConvId, 'assistant', fullText)
        setMessages(prev => [...prev.slice(0, aiIdx), { ...savedAI }])
        intelligenceService.recordAIResponse(activeConvId, fullText, lastUserMsg, currentCtx)
      } else {
        setMessages(prev => prev.slice(0, aiIdx))
      }
    } catch { setError("Qaytadan yaratishda xatolik") }
    finally   { setIsTyping(false) }
  }

  async function handleDelete(e: React.MouseEvent, convId: string) {
    e.stopPropagation(); setDeletingId(convId)
    try {
      await aiChatService.deleteConversation(convId)
      const rest = conversations.filter(c => c.id !== convId)
      setConversations(rest)
      if (activeConvId === convId) {
        setActiveConvId(null); setMessages([])
        if (rest.length > 0) await selectConversation(rest[0].id)
      }
    } catch { setError("O'chirishda xatolik") }
    finally   { setDeletingId(null) }
  }

  useEffect(() => {
    const el = chatAreaRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (atBottom || isTyping) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend() }
  }
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
  }
  function handlePromptSelect(prompt: string) {
    setInput(prompt)
    if (!activeConvId) void handleNewConversation().then(() => setTimeout(() => inputRef.current?.focus(), 80))
    else setTimeout(() => inputRef.current?.focus(), 60)
  }

  // Pinned convs at top, then others grouped by date
  const allFiltered  = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
  const pinnedConvs  = allFiltered.filter(c => pinnedIds.has(c.id))
  const unpinned     = allFiltered.filter(c => !pinnedIds.has(c.id))
  const grouped      = groupConversations(unpinned)
  const filtered     = allFiltered  // kept for compat

  const canSend      = (input.trim().length > 0 || attachedFile !== null) && !isTyping && !isStreaming

  // ── ConvItem wrapper — handles rename inline mode ────────────────────────
  function ConvItemWrapper({ c }: { c: AiConversationRow }) {
    if (renamingId === c.id) {
      return (
        <motion.div variants={CONV_ITEM} layout className="px-1 py-0.5">
          <input
            ref={renameInputRef}
            value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onBlur={() => void commitRename(c.id)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); void commitRename(c.id) }
              if (e.key === 'Escape') { setRenamingId(null) }
            }}
            className="w-full px-3 py-2 rounded-xl text-[12.5px] font-medium text-white/85 outline-none"
            style={{ background: 'rgba(91,127,255,0.18)', border: '1px solid rgba(91,127,255,0.45)' }}
            aria-label="Nomini tahrirlash"
          />
        </motion.div>
      )
    }
    return (
      <ConvItem
        conv={c}
        active={c.id === activeConvId}
        deleting={deletingId === c.id}
        pinned={pinnedIds.has(c.id)}
        onSelect={() => { void selectConversation(c.id); if (window.innerWidth < 768) setSidebarOpen(false) }}
        onDelete={e => void handleDelete(e, c.id)}
        onPin={e => togglePin(e, c.id)}
        onRename={e => startRename(e, c)}
      />
    )
  }

  // ── RENDER — Premium dark design ─────────────────────────────────────────
  return (
    <div
      className="flex h-[calc(100vh-5rem)] -mt-3 -mx-3 sm:-mt-4 sm:-mx-4 lg:-mt-6 lg:-mx-6 overflow-hidden rounded-none sm:rounded-[24px]"
      style={{ background: '#080C1A', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ══════ LEFT: SIDEBAR ══════ */}
      <aside
        className={cn(
          'flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out',
          'md:relative max-md:fixed max-md:left-0 max-md:top-0 max-md:bottom-0 max-md:z-50',
          sidebarOpen
            ? 'w-[272px] max-md:shadow-[4px_0_40px_rgba(0,0,0,0.5)]'
            : 'max-md:w-[272px] max-md:-translate-x-full md:w-0 md:overflow-hidden',
        )}
        style={{ background: 'rgba(13,18,37,0.95)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
        aria-label="Chat history"
      >
        {/* Brand + New Chat */}
        <div className="p-4 flex-shrink-0 space-y-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 px-1">
            <AsomiddinAvatar size="sm" />
            <div>
              <p className="text-[13px] font-black text-white tracking-tight leading-none">Asomiddin AI</p>
              <p className="text-[9px] text-white/30 mt-1">Gemini 2.5 Flash</p>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={handleNewConversation}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[14px] text-white text-[13px] font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)', boxShadow: '0 4px 14px rgba(91,92,246,0.38)' }}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Yangi suhbat
          </motion.button>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-1 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="w-full pl-9 pr-3 py-2 text-xs text-white/70 placeholder:text-white/25 outline-none transition-all rounded-xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {convLoading ? (
            <div className="space-y-1.5 p-2 pt-4">
              {[100, 85, 70, 90, 60].map((w, i) => (
                <div
                  key={i}
                  className="h-9 rounded-xl animate-pulse"
                  style={{ width: `${w}%`, opacity: 1 - i * 0.12, background: 'rgba(255,255,255,0.04)' }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <MessageSquare className="w-4 h-4 text-white/20" aria-hidden="true" />
              </div>
              <p className="text-[11px] text-white/25 leading-relaxed">
                {search ? `"${search}" topilmadi` : "Hali suhbat yo'q"}
              </p>
            </div>
          ) : (
            <motion.div
              variants={shouldReduce ? undefined : CONV_CONTAINER}
              initial={shouldReduce ? false : 'hidden'}
              animate={shouldReduce ? false : 'show'}
            >
              {/* Pinned conversations */}
              {pinnedConvs.length > 0 && (
                <><GroupLabel label="📌 Pinlangan" />
                {pinnedConvs.map(c => <ConvItemWrapper key={c.id} c={c} />)}</>
              )}
              {grouped.today.length > 0 && (
                <><GroupLabel label="Bugun" />{grouped.today.map(c => <ConvItemWrapper key={c.id} c={c} />)}</>
              )}
              {grouped.yesterday.length > 0 && (
                <><GroupLabel label="Kecha" />{grouped.yesterday.map(c => <ConvItemWrapper key={c.id} c={c} />)}</>
              )}
              {grouped.older.length > 0 && (
                <><GroupLabel label="Oldingi" />{grouped.older.map(c => <ConvItemWrapper key={c.id} c={c} />)}</>
              )}
            </motion.div>
          )}
        </div>

        {/* User profile */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all hover:bg-white/[0.04]">
            <UserAvatar name={studentName} avatarUrl={studentAvatarUrl} showStatus />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-white/70 truncate leading-none mb-0.5">{studentName}</p>
              <p className="text-[9px] text-brand-light/50 font-medium truncate">Student</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ══════ CENTER: CHAT ══════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Premium Header */}
        <header
          className="h-14 flex items-center gap-3 px-4 flex-shrink-0"
          style={{
            background: 'rgba(13,18,37,0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Sidebar toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen(o => !o)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all"
            aria-label={sidebarOpen ? 'Yopish' : 'Ochish'}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          {/* Brand */}
          <div className="flex items-center gap-2.5 flex-1">
            <AsomiddinAvatar showStatus />
            <div>
              <p className="text-[13px] font-black text-white tracking-tight leading-none">Asomiddin AI</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                <p className="text-[9px] text-emerald-400/70 font-medium">Gemini 2.5 Flash · Online</p>
              </div>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {error && (
              <div
                className="flex items-center gap-1.5 text-[11px] text-red-400 px-3 py-1.5 rounded-xl max-w-[180px] sm:max-w-xs truncate"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{error}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setRightOpen(o => !o)}
              className="hidden xl:flex w-8 h-8 items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all"
              aria-label="Kontekst paneli"
            >
              {rightOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
            {/* Export conversation */}
            {activeConvId && messages.length > 0 && (
              <div className="relative" ref={exportMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowExportMenu(v => !v)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all"
                  aria-label="Eksport"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                </button>
                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.94, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94, y: -4 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 top-10 z-50 py-1.5 rounded-[14px] min-w-[140px]"
                      style={{ background: 'rgba(10,14,27,0.97)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}
                    >
                      {[
                        { label: 'Markdown (.md)', fn: exportMarkdown },
                        { label: 'Matn (.txt)',    fn: exportTxt     },
                        { label: 'PDF (chop)',     fn: exportPdf     },
                        { label: 'Word (.doc)',    fn: exportDoc     },
                      ].map(({ label, fn }) => (
                        <button key={label} type="button" onClick={fn}
                          className="w-full px-4 py-2 text-left text-[12.5px] text-white/55 hover:text-white/90 hover:bg-white/[0.05] transition-colors">
                          {label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <button
              type="button"
              onClick={handleNewConversation}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all"
              aria-label="Yangi suhbat"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Messages area — drag & drop target */}
        <div
          ref={chatAreaRef}
          className="flex-1 overflow-y-auto scroll-smooth relative"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            background: 'radial-gradient(ellipse 70% 50% at 30% 0%, rgba(99,102,241,0.05) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(124,58,237,0.04) 0%, transparent 55%)',
          }}
        >
          <div className="w-full sm:w-[90%] lg:max-w-[760px] mx-auto px-4 sm:px-0 py-8 space-y-5">

            {/* Empty state */}
            {!activeConvId && !convLoading && (
              <EmptyState
                language={language}
                onAction={async (prompt) => {
                  await handleNewConversation()
                  setTimeout(() => {
                    setInput(prompt)
                    inputRef.current?.focus()
                  }, 120)
                }}
              />
            )}

            {/* Loading skeleton */}
            {msgLoading && (
              <div className="space-y-5" aria-busy="true">
                {[[75, 55, 35], [60, 80, 45]].map((widths, i) => (
                  <div key={i} className={cn('flex gap-3 items-start', i % 2 === 1 && 'flex-row-reverse')}>
                    <div className="w-8 h-8 rounded-xl animate-pulse flex-shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    <div className={cn('flex-1 space-y-2 pt-1', i % 2 === 1 && 'items-end flex flex-col')}>
                      {widths.map((w, j) => (
                        <div key={j} className="h-3.5 rounded-lg animate-pulse" style={{ width: `${w}%`, background: 'rgba(255,255,255,0.06)', animationDelay: `${j * 80}ms` }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Messages — with content-visibility for perf on long lists */}
            {!msgLoading && (() => {
              const aiMsgs = messages.filter(m => m.role === 'assistant')
              const lastAiId = aiMsgs.at(-1)?.id
              return messages.map(msg => (
                <div key={msg.id} style={{ contentVisibility: 'auto', containIntrinsicSize: '0 120px' }}>
                  <MessageBubble
                    msg={msg}
                    userName={studentName}
                    userAvatarUrl={studentAvatarUrl}
                    isStreaming={msg.id === streamingId || msg.id === streamingMsgId}
                    onStreamComplete={msg.id === streamingId ? () => setStreamingId(null) : undefined}
                    onRegenerate={msg.role === 'assistant' ? () => void handleRegenerate(msg.id) : undefined}
                    onContinue={msg.id === lastAiId && msg.role === 'assistant' && !isStreaming
                      ? () => void handleContinue(msg.id) : undefined}
                    isLastAi={msg.id === lastAiId}
                  />
                </div>
              ))
            })()}

            {isTyping && !isStreaming && <ThinkingCard />}
            <div ref={bottomRef} aria-hidden="true" />
          </div>
        </div>

        {/* Drag & Drop overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              key="drag-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
              style={{ background: 'rgba(91,127,255,0.12)', backdropFilter: 'blur(4px)', border: '2px dashed rgba(91,127,255,0.6)', borderRadius: 20 }}
              aria-hidden="true"
            >
              <Upload className="w-10 h-10 text-brand-light mb-3" />
              <p className="text-base font-bold text-brand-light">Faylni bu yerga tashlang</p>
              <p className="text-[12px] text-brand-light/60 mt-1">Rasm, PDF, DOCX, TXT, Audio</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Premium Input Area ─────────────────────────────────────────────── */}
        {activeConvId && (
          <div
            className="px-4 py-4 flex-shrink-0"
            style={{
              background: 'rgba(13,18,37,0.90)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="max-w-3xl mx-auto">

              {/* File preview */}
              {attachedFile && filePreviewUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 mb-2.5"
                >
                  {attachedFile.type === 'application/pdf' ? (
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      <FileIcon className="w-4 h-4 text-red-400 flex-shrink-0" aria-hidden="true" />
                      <span className="text-[12px] font-medium text-red-300 truncate max-w-[160px]">{attachedFile.name}</span>
                    </div>
                  ) : (
                    <img src={filePreviewUrl} alt="Attached" className="h-14 max-w-[100px] rounded-xl object-cover" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                  )}
                  <button
                    type="button"
                    onClick={clearFile}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/15 transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                    aria-label="Faylni olib tashlash"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </motion.div>
              )}

              {/* Upload progress bar */}
              <AnimatePresence>
                {uploadProgress !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-3 mb-2.5 px-4 py-2.5 rounded-xl"
                    style={{ background: 'rgba(91,127,255,0.10)', border: '1px solid rgba(91,127,255,0.20)' }}
                  >
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg,#5B7FFF,#7C3AED)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-brand-light/70 flex-shrink-0 tabular-nums">
                      {uploadProgress}%
                    </span>
                    {uploadProgress < 100 && (
                      <button type="button" onClick={cancelUpload}
                        className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0" aria-label="Bekor qilish">
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Network error + retry */}
              <AnimatePresence>
                {netError && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-3 mb-2.5 px-4 py-2.5 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)' }}
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" aria-hidden="true" />
                    <span className="flex-1 text-[12px] text-red-400">{netError}</span>
                    <button type="button" onClick={handleRetry}
                      className="flex items-center gap-1 text-[11px] font-bold text-brand-light/70 hover:text-brand-light transition-colors flex-shrink-0">
                      <RotateCw className="w-3 h-3" aria-hidden="true" />
                      Qayta
                    </button>
                    <button type="button" onClick={() => setNetError(null)}
                      className="text-white/25 hover:text-white/55 transition-colors flex-shrink-0" aria-label="Yopish">
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Voice listening state */}
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 mb-2.5 px-4 py-2.5 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.18)' }}
                >
                  <VoiceWaveform />
                  <span className="text-[12px] text-red-400 font-semibold">
                    {language === 'ru' ? 'Слушаю…' : language === 'en' ? 'Listening…' : 'Tinglamoqda…'}
                  </span>
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className="ml-auto text-[11px] text-red-400/70 hover:text-red-400 transition-colors"
                  >
                    To&apos;xtatish
                  </button>
                </motion.div>
              )}

              {/* Main input glass card */}
              <div
                className="rounded-[20px] overflow-hidden transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  boxShadow: input.trim() || attachedFile
                    ? '0 0 0 2px rgba(91,92,246,0.25), 0 8px 32px rgba(0,0,0,0.3)'
                    : '0 4px 24px rgba(0,0,0,0.2)',
                }}
              >
                {/* Textarea row */}
                <div className="flex items-end gap-3 px-4 py-3">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      attachedFile
                        ? (language === 'ru' ? 'Задайте вопрос об этом файле…' : language === 'en' ? 'Ask about this file…' : 'Bu fayl haqida savol bering…')
                        : (language === 'ru' ? 'Задайте вопрос…  (Enter — отправить)' : language === 'en' ? 'Ask anything…  (Enter to send)' : 'Savol yozing…  (Enter — yuborish)')
                    }
                    rows={1}
                    disabled={isTyping}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 resize-none outline-none leading-6 max-h-36 disabled:opacity-50 py-0.5"
                    aria-label="AI ga savol yozing"
                  />

                  {/* Voice button */}
                  <button
                    type="button"
                    onClick={toggleVoice}
                    disabled={isTyping || !voiceSupported}
                    title={!voiceSupported ? 'Qo\'llab-quvvatlanmaydi' : isListening ? 'To\'xtatish' : 'Ovoz bilan yozish'}
                    className={cn(
                      'w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 mb-0.5 transition-all duration-150',
                      isListening
                        ? 'text-red-400 bg-red-500/20 animate-pulse'
                        : voiceSupported && !isTyping
                          ? 'text-white/30 hover:text-white/60 hover:bg-white/[0.07] cursor-pointer'
                          : 'text-white/15 cursor-not-allowed',
                    )}
                    aria-label={isListening ? 'Ovozni to\'xtatish' : 'Ovoz bilan yozish'}
                  >
                    <Mic className="w-4 h-4" aria-hidden="true" />
                  </button>

                  {/* Send button */}
                  <motion.button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={!canSend}
                    whileHover={canSend ? { scale: 1.08 } : {}}
                    whileTap={canSend ? { scale: 0.92 } : {}}
                    transition={{ duration: 0.12 }}
                    className={cn(
                      'w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 transition-all duration-150 mb-0.5',
                      !canSend && 'cursor-not-allowed',
                    )}
                    style={canSend ? {
                      background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)',
                      boxShadow: '0 4px 14px rgba(91,92,246,0.45)',
                    } : {
                      background: 'rgba(255,255,255,0.06)',
                    }}
                    aria-label={isTyping ? 'Javob kutilyapti' : 'Yuborish'}
                  >
                    {isTyping
                      ? <Loader2 className="w-4 h-4 text-white/50 animate-spin" aria-hidden="true" />
                      : <Send className="w-[15px] h-[15px]" style={{ color: canSend ? 'white' : 'rgba(255,255,255,0.2)' }} aria-hidden="true" />}
                  </motion.button>
                </div>

                {/* File picker button row */}
                <div className="flex items-center gap-0.5 px-4 pb-3">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all cursor-pointer">
                    <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                    {language === 'ru' ? 'Камера' : language === 'en' ? 'Camera' : 'Kamera'}
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={onFileInputChange} disabled={isTyping} />
                  </label>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all cursor-pointer">
                    <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    {language === 'ru' ? 'Галерея' : language === 'en' ? 'Gallery' : 'Galereya'}
                    <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onFileInputChange} disabled={isTyping} />
                  </label>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all cursor-pointer">
                    <FileIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    PDF
                    <input ref={pdfInputRef} type="file" accept="application/pdf" className="sr-only" onChange={onFileInputChange} disabled={isTyping || isStreaming} />
                  </label>
                  {/* Any file */}
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all cursor-pointer">
                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                    {language === 'ru' ? 'Файл' : language === 'en' ? 'File' : 'Fayl'}
                    <input ref={anyFileInputRef} type="file" accept=".docx,.txt,.wav,.mp3,.aac,.ogg,.flac,.webm,audio/*,text/*" className="sr-only" onChange={onFileInputChange} disabled={isTyping || isStreaming} />
                  </label>

                  {/* Stop generation */}
                  {isStreaming && (
                    <button type="button" onClick={handleStop}
                      className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
                      <Square className="w-3 h-3" aria-hidden="true" />
                      {language === 'ru' ? 'Стоп' : language === 'en' ? 'Stop' : "To'xtatish"}
                    </button>
                  )}

                  {/* Voice error */}
                  {!isStreaming && voiceError && (
                    <span className="ml-auto text-[10.5px] text-amber-400/70 truncate max-w-[160px]">{voiceError}</span>
                  )}

                  {!isStreaming && !voiceError && (
                    <p className="ml-auto text-[9.5px] text-white/15 select-none">Enter — yuborish</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions shown when no active conv + no loading */}
        {!activeConvId && !convLoading && (
          <div
            className="px-4 py-3 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {QUICK_ACTIONS.map(({ icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => void handleNewConversation()}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold text-white/40 hover:text-white/70 transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <span aria-hidden="true">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════ RIGHT: AI TEACHER PANEL ══════ */}
      <AnimatePresence>
        {rightOpen && (
          <motion.div
            key="right-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 272, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="hidden xl:block overflow-hidden flex-shrink-0"
          >
            <AITeacherPanel
              context={context}
              onPromptSelect={handlePromptSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
