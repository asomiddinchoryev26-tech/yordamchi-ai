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
  Copy, Check, ThumbsUp, ThumbsDown, RefreshCw,
  Mic, SidebarClose, SidebarOpen,
  Camera, ImageIcon, FileText as FileIcon, X as XIcon,
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
  StreamingMessage,
  MessageFooter,
  ThinkingCard,
} from '@/components/ai'
import MarkdownContent from '@/components/chat/MarkdownContent'
import type { AiConversationRow, AiMessageRow } from '@/services/ai-chat.service'
import type { StudentContext }                   from '@/services/ai-provider.service'

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
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-start p-4 rounded-[20px] text-left transition-all duration-150"
            style={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
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
  msg, onRegenerate, userName, userAvatarUrl, isStreaming, onStreamComplete,
}: {
  msg: UIMessage
  onRegenerate?:     () => void
  userName?:         string
  userAvatarUrl?:    string | null
  isStreaming?:      boolean
  onStreamComplete?: () => void
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

          {/* Content */}
          {isStreaming && !streamDone ? (
            <StreamingMessage text={msg.content} onComplete={handleStreamComplete} />
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

// ─── Premium ConvItem ─────────────────────────────────────────────────────────

function ConvItem({
  conv, active, deleting, onSelect, onDelete,
}: {
  conv: AiConversationRow; active: boolean; deleting: boolean
  onSelect: () => void; onDelete: (e: React.MouseEvent) => void
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
        <MessageSquare
          className={cn('w-3.5 h-3.5 flex-shrink-0 transition-colors', active ? 'text-brand-light' : 'text-white/25')}
          aria-hidden="true"
        />
        <span className="flex-1 text-[12.5px] font-medium truncate pr-7">{conv.title}</span>
        <span className="text-[10px] text-white/25 flex-shrink-0 group-hover:opacity-0 transition-opacity absolute right-8">
          {fmtDate(conv.updated_at)}
        </span>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="absolute right-2 w-6 h-6 flex items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/15 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-30"
          aria-label="O'chirish"
        >
          {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
        </button>
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

  // ── All state (UNCHANGED) ──────────────────────────────────────────────────
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
  const studentId        = auth.user?.id        ?? ''
  const studentName      = auth.user?.name      ?? 'Talaba'
  const studentAvatarUrl = auth.user?.avatarUrl ?? null

  // ── All effects + handlers (UNCHANGED) ────────────────────────────────────

  useEffect(() => { if (studentId) void init(); else setConvLoading(false) }, [studentId])

  async function init() {
    setConvLoading(true); setError(null)
    try {
      const [convs, ctx] = await Promise.all([
        aiChatService.getConversations(studentId),
        loadStudentContext(studentId, studentName),
      ])
      setConversations(convs); setContext(ctx)
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

  function handleFileSelect(file: File) {
    const { valid, errorCode } = validateFile(file)
    if (!valid) { setError(errorCode ?? 'Fayl noto\'g\'ri'); return }
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
    setAttachedFile(file); setFilePreviewUrl(URL.createObjectURL(file)); setError(null)
  }

  function clearFile() {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
    setAttachedFile(null); setFilePreviewUrl(null)
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFileSelect(f)
    e.target.value = ''
  }

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
    if (!activeConvId || isTyping) return

    setInput(''); setError(null)
    if (inputRef.current) inputRef.current.style.height = 'auto'

    const file = attachedFile
    if (file) clearFile()

    const displayContent = file
      ? (text ? `${text}\n📎 ${file.name}` : `📎 ${file.name}`)
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

      let aiResponse: string

      if (file) {
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
        aiResponse = await callVisionInAssistant(processed.base64, processed.mimeType, systemInstruction, question)
      } else {
        const history = [
          ...newMsgs.filter(m => !m.id.startsWith('temp')), savedUser,
        ].map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

        intelligenceService.recordUserMessage(activeConvId, text, currentCtx)

        aiResponse = await aiProvider.complete(history, currentCtx, {
          userId: studentId, conversationId: activeConvId, lastUserMessage: text,
        })
      }

      const savedAI = await aiChatService.addMessage(activeConvId, 'assistant', aiResponse)
      setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), savedUser, savedAI])
      setStreamingId(savedAI.id)
      setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, updated_at: new Date().toISOString() } : c))
      intelligenceService.recordAIResponse(activeConvId, aiResponse, displayContent, currentCtx)

    } catch {
      setError("Xabar yuborishda xatolik. Qayta urinib ko'ring.")
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
    } finally { setIsTyping(false) }
  }

  async function handleRegenerate(aiMsgId: string) {
    if (!activeConvId || isTyping) return
    const aiIdx = messages.findIndex(m => m.id === aiMsgId)
    if (aiIdx < 0) return
    const history = messages.slice(0, aiIdx).map(m => ({
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
      const aiResponse = await aiProvider.complete(history, currentCtx, {
        userId: studentId, conversationId: activeConvId, lastUserMessage: lastUserMsg,
      })
      const savedAI = await aiChatService.addMessage(activeConvId, 'assistant', aiResponse)
      setMessages(prev => [...prev.slice(0, aiIdx), savedAI])
      intelligenceService.recordAIResponse(activeConvId, aiResponse, lastUserMsg, currentCtx)
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

  const filtered = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
  const grouped  = groupConversations(filtered)

  const canSend = (input.trim().length > 0 || attachedFile !== null) && !isTyping

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
              {grouped.today.length > 0 && (
                <><GroupLabel label="Bugun" />{grouped.today.map(c => <ConvItem key={c.id} conv={c} active={c.id === activeConvId} deleting={deletingId === c.id} onSelect={() => { void selectConversation(c.id); if (window.innerWidth < 768) setSidebarOpen(false) }} onDelete={e => void handleDelete(e, c.id)} />)}</>
              )}
              {grouped.yesterday.length > 0 && (
                <><GroupLabel label="Kecha" />{grouped.yesterday.map(c => <ConvItem key={c.id} conv={c} active={c.id === activeConvId} deleting={deletingId === c.id} onSelect={() => { void selectConversation(c.id); if (window.innerWidth < 768) setSidebarOpen(false) }} onDelete={e => void handleDelete(e, c.id)} />)}</>
              )}
              {grouped.older.length > 0 && (
                <><GroupLabel label="Oldingi" />{grouped.older.map(c => <ConvItem key={c.id} conv={c} active={c.id === activeConvId} deleting={deletingId === c.id} onSelect={() => { void selectConversation(c.id); if (window.innerWidth < 768) setSidebarOpen(false) }} onDelete={e => void handleDelete(e, c.id)} />)}</>
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
              {rightOpen ? <SidebarClose className="w-4 h-4" /> : <SidebarOpen className="w-4 h-4" />}
            </button>
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

        {/* Messages area */}
        <div
          ref={chatAreaRef}
          className="flex-1 overflow-y-auto scroll-smooth"
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

            {/* Messages */}
            {!msgLoading && messages.map(msg => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                userName={studentName}
                userAvatarUrl={studentAvatarUrl}
                isStreaming={msg.id === streamingId}
                onStreamComplete={msg.id === streamingId ? () => setStreamingId(null) : undefined}
                onRegenerate={msg.role === 'assistant' ? () => void handleRegenerate(msg.id) : undefined}
              />
            ))}

            {isTyping && <ThinkingCard />}
            <div ref={bottomRef} aria-hidden="true" />
          </div>
        </div>

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
                    <input ref={pdfInputRef} type="file" accept="application/pdf" className="sr-only" onChange={onFileInputChange} disabled={isTyping} />
                  </label>

                  {/* Voice error */}
                  {voiceError && (
                    <span className="ml-auto text-[10.5px] text-amber-400/70 truncate max-w-[160px]">{voiceError}</span>
                  )}

                  {!voiceError && (
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
