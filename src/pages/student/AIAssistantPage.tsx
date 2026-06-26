import { useState, useEffect, useRef, useCallback, memo } from 'react'
import {
  Send, Plus, Trash2, MessageSquare, Search,
  PanelLeftOpen, PanelLeftClose, AlertCircle, Loader2,
  Copy, Check, ThumbsUp, ThumbsDown, RefreshCw,
  Mic, SidebarClose, SidebarOpen,
  Camera, ImageIcon, FileText as FileIcon, X as XIcon,
} from 'lucide-react'
import { AITeacherPanel }   from '@/components/ai-teacher'
import { useVoiceInput }    from '@/hooks/useVoiceInput'
// Sprint 3.3 — Vision integration
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
  AIMessageCard,
  AssistantHeader,
  StreamingMessage,
  MessageFooter,
  ThinkingCard,
} from '@/components/ai'
import MarkdownContent  from '@/components/chat/MarkdownContent'
import type { AiConversationRow, AiMessageRow } from '@/services/ai-chat.service'
import type { StudentContext }                   from '@/services/ai-provider.service'

// ─── Types ────────────────────────────────────────────────────────────────────

type UIMessage = Pick<AiMessageRow, 'id' | 'role' | 'content' | 'created_at'>

// ─── Motion ease ──────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

const MSG_FADE = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.28, ease: EASE } },
}

const CONV_CONTAINER = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
}

const CONV_ITEM = {
  hidden: { opacity: 0, x: -10 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.25, ease: EASE } },
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

// ─── Quick action cards ───────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: '💻', label: 'Dasturlash',    desc: 'Kod, debugging va arxitektura', grad: 'from-blue-500 to-cyan-400',   prompt: "Python'da oddiy veb scraper yozing va kodni tushuntiring" },
  { icon: '📚', label: "O'qish",        desc: 'Darslar va tushuntirishlar',     grad: 'from-violet-500 to-purple-400', prompt: 'Murakkab mavzuni oddiy tarzda tushuntiring' },
  { icon: '🌍', label: 'Tarjima',       desc: "Ko'p tilli tarjima",             grad: 'from-emerald-500 to-teal-400',  prompt: "Quyidagi matnni o'zbek, ingliz va rus tillariga tarjima qiling:\n" },
  { icon: '📈', label: 'Biznes',        desc: 'Strategiya va rejalashtirish',    grad: 'from-orange-500 to-amber-400',  prompt: 'Startap uchun biznes reja asosiy elementlarini tushuntiring' },
  { icon: '🤖', label: 'AI maslahat',   desc: "Sun'iy intellekt haqida",         grad: 'from-pink-500 to-rose-400',     prompt: 'Asomiddin AI qanday ishlaydi va nimalarga qodir? Batafsil tushuntir' },
]

// ─── ActionBtn ───────────────────────────────────────────────────────────────

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
          ? 'text-violet-500 bg-violet-50 dark:bg-violet-900/30'
          : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60',
      )}
    >
      {children}
    </button>
  )
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

const MessageBubble = memo(function MessageBubble({
  msg, onRegenerate, userName, userAvatarUrl, isStreaming, onStreamComplete,
}: {
  msg: UIMessage
  onRegenerate?:    () => void
  userName?:        string
  userAvatarUrl?:   string | null
  isStreaming?:     boolean
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
        className="flex items-start justify-end gap-2.5 group/msg"
      >
        <div className="flex flex-col items-end gap-1.5 min-w-0" style={{ maxWidth: 'min(85%, 580px)' }}>
          <div className="relative group/bubble w-full">
            <div className="relative bg-gradient-to-br from-[#5B5CF6] via-violet-600 to-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed break-words shadow-lg shadow-violet-500/20 overflow-hidden w-full">
              <div className="absolute inset-0 bg-gradient-to-b from-white/8 to-transparent pointer-events-none" />
              <span className="relative">{msg.content}</span>
            </div>
            <div className="flex justify-end mt-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-200">
              <ActionBtn onClick={handleCopy} title="Nusxalash">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </ActionBtn>
            </div>
          </div>
          <time className="text-[10px] text-gray-400 dark:text-gray-600 px-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
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
        <div className="relative">
          <AIMessageCard>
            <AssistantHeader />
            {isStreaming && !streamDone ? (
              <StreamingMessage text={msg.content} onComplete={handleStreamComplete} />
            ) : (
              <MarkdownContent text={msg.content} />
            )}
          </AIMessageCard>

          <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover/card:opacity-100 transition-all duration-200 translate-y-1 group-hover/card:translate-y-0">
            <ActionBtn onClick={handleCopy} title="Nusxalash">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </ActionBtn>
            <ActionBtn onClick={handleLike}    title="Yaxshi"   active={liked}>    <ThumbsUp   className="w-3.5 h-3.5" /></ActionBtn>
            <ActionBtn onClick={handleDislike} title="Yomon"    active={disliked}> <ThumbsDown className="w-3.5 h-3.5" /></ActionBtn>
            {onRegenerate && (
              <ActionBtn onClick={onRegenerate} title="Qaytadan yaratish"><RefreshCw className="w-3.5 h-3.5" /></ActionBtn>
            )}
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          <MessageFooter visible={streamDone} />
        </div>
        <time className="text-[10px] text-gray-400 dark:text-gray-600 mt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
          {fmtTime(msg.created_at)}
        </time>
      </div>
    </motion.div>
  )
})

// ─── ConvItem ─────────────────────────────────────────────────────────────────

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
          'w-full text-left px-3 py-2.5 rounded-xl group relative flex items-center gap-2.5 transition-all duration-150',
          active
            ? 'bg-white dark:bg-gray-800 shadow-sm border border-brand/20 dark:border-brand/30 text-brand dark:text-brand-light'
            : 'text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200 border border-transparent',
        )}
      >
        <MessageSquare className={cn('w-3.5 h-3.5 flex-shrink-0 transition-colors', active ? 'text-brand' : 'text-gray-400')} aria-hidden="true" />
        <span className="flex-1 text-[13px] font-medium truncate pr-7">{conv.title}</span>
        <span className="text-[10px] text-gray-400 dark:text-gray-600 flex-shrink-0 group-hover:opacity-0 transition-opacity absolute right-8">
          {fmtDate(conv.updated_at)}
        </span>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="absolute right-2 w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-40"
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
    <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-[0.12em]">
      {label}
    </p>
  )
}

// ═════════════════════════════════════════════════════════════════════════════

export default function AIAssistantPage() {
  const auth           = useAuth()
  const { language }   = useLanguage()
  const shouldReduce   = useReducedMotion()

  const [conversations, setConversations] = useState<AiConversationRow[]>([])
  const [activeConvId,  setActiveConvId]  = useState<string | null>(null)
  const [messages,      setMessages]      = useState<UIMessage[]>([])
  const [input,         setInput]         = useState('')
  const [isTyping,      setIsTyping]      = useState(false)
  const [convLoading,   setConvLoading]   = useState(true)
  const [msgLoading,    setMsgLoading]    = useState(false)
  const [sidebarOpen,   setSidebarOpen]   = useState(true)
  const [rightOpen,     setRightOpen]     = useState(true)  // right panel
  const [context,       setContext]       = useState<StudentContext | null>(null)
  const [error,         setError]         = useState<string | null>(null)
  const [deletingId,    setDeletingId]    = useState<string | null>(null)
  const [search,        setSearch]        = useState('')
  const [streamingId,   setStreamingId]   = useState<string | null>(null)

  // Sprint 3.3: file attachment state
  const [attachedFile,   setAttachedFile]   = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const [voiceError,     setVoiceError]     = useState<string | null>(null)

  // Sprint 3.3: Voice input
  const { isListening, isSupported: voiceSupported, toggle: toggleVoice } = useVoiceInput({
    language,
    onResult: (transcript) => {
      setInput(prev => (prev ? prev + ' ' : '') + transcript)
      setVoiceError(null)
      setTimeout(() => inputRef.current?.focus(), 60)
    },
    onInterim: (_partial) => { /* optional: could show partial in a tooltip */ },
  })

  const bottomRef    = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLTextAreaElement>(null)
  const chatAreaRef  = useRef<HTMLDivElement>(null)
  const cameraInputRef  = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef     = useRef<HTMLInputElement>(null)
  const studentId        = auth.user?.id        ?? ''
  const studentName      = auth.user?.name      ?? 'Talaba'
  const studentAvatarUrl = auth.user?.avatarUrl ?? null

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
      // No greeting — user types their first question directly
      setTimeout(() => inputRef.current?.focus(), 80)
    } catch { setError("Yangi suhbat yaratishda xatolik") }
  }

  // ── Sprint 3.3: File attachment helpers ─────────────────────────────────────

  function handleFileSelect(file: File) {
    const { valid, errorCode } = validateFile(file)
    if (!valid) { setError(errorCode ?? 'Fayl noto\'g\'ri'); return }
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
    setAttachedFile(file)
    setFilePreviewUrl(URL.createObjectURL(file))
    setError(null)
  }

  function clearFile() {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
    setAttachedFile(null)
    setFilePreviewUrl(null)
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

  // ─────────────────────────────────────────────────────────────────────────────

  async function handleSend() {
    const text = input.trim()
    if (!text && !attachedFile) return   // allow send if file attached without text
    if (!activeConvId || isTyping) return

    setInput(''); setError(null)
    if (inputRef.current) inputRef.current.style.height = 'auto'

    // Capture file before clearing (async work happens after)
    const file = attachedFile
    if (file) clearFile()

    // Build user-facing content (text + optional file name indicator)
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
        // ── Sprint 3.3: Vision path ────────────────────────────────────────
        const processed = await processImage(file)
        const profile   = intelligenceService.getProfile(currentCtx, studentId)
        const { systemInstruction } = buildVisionChatPrompt(
          processed, profile,
          (language === 'uz' || language === 'ru' || language === 'en') ? language : 'uz',
        )
        const question = text || (
          language === 'ru' ? 'Проанализируйте и объясните это изображение'
          : language === 'en' ? 'Analyze and explain this image'
          : 'Bu rasmni tahlil qiling va tushuntiring'
        )
        aiResponse = await callVisionInAssistant(processed.base64, processed.mimeType, systemInstruction, question)
      } else {
        // ── Sprint 3.1: Text path ──────────────────────────────────────────
        const history = [
          ...newMsgs.filter(m => !m.id.startsWith('temp')), savedUser,
        ].map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

        intelligenceService.recordUserMessage(activeConvId, text, currentCtx)

        aiResponse = await aiProvider.complete(history, currentCtx, {
          userId:          studentId,
          conversationId:  activeConvId,
          lastUserMessage: text,
        })
      }

      const savedAI = await aiChatService.addMessage(activeConvId, 'assistant', aiResponse)
      setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), savedUser, savedAI])
      setStreamingId(savedAI.id)
      setConversations(prev =>
        prev.map(c => c.id === activeConvId ? { ...c, updated_at: new Date().toISOString() } : c),
      )

      intelligenceService.recordAIResponse(activeConvId, aiResponse, displayContent, currentCtx)

    } catch {
      setError("Xabar yuborishda xatolik. Qayta urinib ko'ring.")
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
    } finally { setIsTyping(false) }
  }

  async function handleRegenerate(aiMsgId: string) {
    if (!activeConvId || isTyping) return
    const aiIdx  = messages.findIndex(m => m.id === aiMsgId)
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
        userId:          studentId,
        conversationId:  activeConvId,
        lastUserMessage: lastUserMsg,
      })
      const savedAI = await aiChatService.addMessage(activeConvId, 'assistant', aiResponse)
      setMessages(prev => [...prev.slice(0, aiIdx), savedAI])

      // Sprint 3.1: Record regenerated response
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

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-5rem)] -mt-3 -mx-3 sm:-mt-4 sm:-mx-4 lg:-mt-6 lg:-mx-6 overflow-hidden rounded-none sm:rounded-2xl border border-gray-200/70 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-xl shadow-gray-900/5 dark:shadow-none">

      {/* Mobile backdrop for left sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="left-backdrop"
            className="fixed inset-0 bg-black/25 backdrop-blur-[3px] z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ════════════ LEFT: CHAT HISTORY ════════════ */}
      <aside
        className={cn(
          'flex-shrink-0 flex flex-col',
          'bg-gray-50/95 dark:bg-[#0F172A]',
          'border-r border-gray-100/80 dark:border-white/[0.06]',
          'transition-all duration-300 ease-in-out',
          'md:relative',
          'max-md:fixed max-md:left-0 max-md:top-0 max-md:bottom-0 max-md:z-50',
          sidebarOpen
            ? 'w-[272px] max-md:shadow-2xl max-md:shadow-black/30 max-md:translate-x-0'
            : 'max-md:w-[272px] max-md:-translate-x-full md:w-0 md:overflow-hidden',
        )}
        aria-label="Chat history"
      >
        {/* Brand + New chat */}
        <div className="p-4 flex-shrink-0 space-y-3 border-b border-gray-100/70 dark:border-white/[0.06]">
          <div className="flex items-center gap-3 px-1">
            <AsomiddinAvatar size="sm" />
            <div>
              <p className="text-[13px] font-black text-gray-900 dark:text-white tracking-tight leading-none">
                Asomiddin AI
              </p>
              <p className="text-[9px] text-gray-400 dark:text-gray-600 mt-1 leading-none">
                Powered by Gemini 2.5 Flash
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={handleNewConversation}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white text-[13px] font-semibold rounded-xl shadow-md transition-opacity hover:opacity-92 active:opacity-80"
            style={{ background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)', boxShadow: '0 4px 12px rgba(91,92,246,0.35)' }}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Yangi suhbat
          </motion.button>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-1 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="w-full bg-white dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none focus:border-brand/40 dark:focus:border-brand/50 transition-all"
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
                  className="h-9 rounded-xl animate-pulse bg-gray-200/60 dark:bg-white/[0.05]"
                  style={{ width: `${w}%`, opacity: 1 - i * 0.12 }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center mb-3">
                <MessageSquare className="w-4.5 h-4.5 text-gray-300 dark:text-gray-600" aria-hidden="true" />
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 leading-relaxed">
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

        {/* User profile bottom */}
        <div className="p-3 border-t border-gray-100/70 dark:border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/60 dark:hover:bg-white/[0.04] transition-colors">
            <UserAvatar name={studentName} avatarUrl={studentAvatarUrl} showStatus />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 truncate leading-none mb-1">
                {studentName}
              </p>
              <p className="text-[9px] text-brand dark:text-brand-light font-medium truncate leading-none">
                YordamchiAI Student
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ════════════ CENTER: CHAT ════════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Frosted glass header */}
        <header className="h-14 border-b border-gray-100/80 dark:border-white/[0.06] flex items-center gap-3 px-4 flex-shrink-0 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-10">
          {/* Left panel toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen(o => !o)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all duration-150"
            aria-label={sidebarOpen ? 'Suhbatlar panelini yopish' : 'Suhbatlar panelini ochish'}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <AsomiddinAvatar showStatus />
            <div>
              <p className="text-sm font-black text-gray-900 dark:text-white tracking-tight leading-none">
                Asomiddin AI
              </p>
              <p className="text-[10px] text-emerald-500 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                Gemini 2.5 Flash
              </p>
            </div>
          </div>

          {/* Right side: error + right panel toggle + user */}
          <div className="ml-auto flex items-center gap-2">
            {error && (
              <div className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/40 px-3 py-1.5 rounded-lg max-w-[160px] sm:max-w-xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{error}</span>
              </div>
            )}
            {/* Right panel toggle — hidden on small screens */}
            <button
              type="button"
              onClick={() => setRightOpen(o => !o)}
              className="hidden xl:flex w-8 h-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all duration-150"
              aria-label={rightOpen ? 'Kontekst panelini yopish' : 'Kontekst panelini ochish'}
            >
              {rightOpen ? <SidebarClose className="w-4 h-4" /> : <SidebarOpen className="w-4 h-4" />}
            </button>
            <UserAvatar name={studentName} avatarUrl={studentAvatarUrl} showStatus />
          </div>
        </header>

        {/* Messages area */}
        <div
          ref={chatAreaRef}
          className="flex-1 overflow-y-auto scroll-smooth"
          style={{
            background: [
              'radial-gradient(ellipse 70% 50% at 30% 0%, rgba(91,92,246,0.05) 0%, transparent 65%)',
              'radial-gradient(ellipse 50% 40% at 80% 100%, rgba(124,58,237,0.04) 0%, transparent 55%)',
            ].join(','),
          }}
        >
          <div className="w-full sm:w-[90%] lg:max-w-[760px] mx-auto px-4 sm:px-0 py-8 space-y-5">

            {/* ── Welcome Screen ─────────────────────────────────────────────── */}
            {!activeConvId && !convLoading && (
              <motion.div
                className="flex flex-col items-center justify-center min-h-[58vh] text-center relative"
                initial={shouldReduce ? false : { opacity: 0 }}
                animate={shouldReduce ? false : { opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Dot-grid pattern */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(91,92,246,0.2) 1px, transparent 1px)',
                    backgroundSize:  '28px 28px',
                    maskImage:        'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 80%)',
                    WebkitMaskImage:  'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 80%)',
                  }}
                  aria-hidden="true"
                />

                {/* AI avatar with glow */}
                <motion.div
                  className="relative mb-6 z-10"
                  initial={shouldReduce ? false : { scale: 0.8, opacity: 0 }}
                  animate={shouldReduce ? false : { scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
                >
                  <AsomiddinAvatar size="xl" showStatus />
                  <div
                    className="absolute -inset-6 rounded-[2.5rem] -z-10 pointer-events-none"
                    style={{
                      background: 'radial-gradient(ellipse, rgba(91,92,246,0.15) 0%, rgba(124,58,237,0.08) 40%, transparent 70%)',
                      filter: 'blur(16px)',
                    }}
                    aria-hidden="true"
                  />
                </motion.div>

                {/* Text */}
                <motion.div
                  className="z-10 mb-10"
                  initial={shouldReduce ? false : { opacity: 0, y: 16 }}
                  animate={shouldReduce ? false : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
                >
                  <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                    Asomiddin AI
                  </h1>
                  <p className="text-base text-gray-500 dark:text-gray-400 font-medium mb-3">
                    {language === 'ru' ? 'Ваш ИИ-ассистент для учёбы' : language === 'en' ? 'Your AI study assistant' : "Ta'lim uchun AI yordamchingiz"}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto leading-relaxed">
                    {language === 'ru'
                      ? 'Задавайте вопросы по урокам, тестам и заданиям'
                      : language === 'en'
                        ? 'Ask questions about lessons, tests and assignments'
                        : "Darslar, testlar va vazifalar bo'yicha savol bering"}
                  </p>
                </motion.div>

                {/* Start chat CTA */}
                <motion.div
                  initial={shouldReduce ? false : { opacity: 0, y: 16 }}
                  animate={shouldReduce ? false : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
                >
                  <motion.button
                    type="button"
                    onClick={handleNewConversation}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="z-10 flex items-center gap-2 px-8 py-3.5 text-white font-bold text-sm rounded-2xl mb-12 shadow-xl hover:opacity-92 transition-opacity"
                    style={{
                      background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)',
                      boxShadow: '0 12px 32px rgba(91,92,246,0.38)',
                    }}
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    {language === 'ru' ? 'Начать разговор' : language === 'en' ? 'Start a conversation' : 'Suhbat boshlash'}
                  </motion.button>
                </motion.div>

                {/* Quick action cards */}
                <motion.div
                  className="z-10 w-full max-w-xl"
                  initial={shouldReduce ? false : { opacity: 0, y: 20 }}
                  animate={shouldReduce ? false : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: EASE }}
                >
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.18em] mb-5">
                    Tezkor amallar
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {QUICK_ACTIONS.map(({ icon, label, desc, grad, prompt }) => (
                      <motion.button
                        key={label}
                        type="button"
                        onClick={async () => {
                          const conv = await aiChatService.createConversation(studentId)
                          setConversations(prev => [conv, ...prev])
                          setActiveConvId(conv.id)
                          setMessages([])
                          setInput(prompt)
                          setTimeout(() => inputRef.current?.focus(), 60)
                        }}
                        whileHover={{ y: -4, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="group relative text-left overflow-hidden bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.07] rounded-2xl p-4"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                      >
                        <div className={cn('absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300', grad)} aria-hidden="true" />
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 shadow-md bg-gradient-to-br transition-transform duration-300 group-hover:scale-110', grad)}>
                          {icon}
                        </div>
                        <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200 mb-1 leading-snug">{label}</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-snug">{desc}</p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Loading skeleton */}
            {msgLoading && (
              <div className="space-y-5" aria-label="Xabarlar yuklanmoqda" aria-busy="true">
                {[[75, 55, 35], [60, 80, 45]].map((widths, i) => (
                  <div key={i} className={cn('flex gap-3 items-start', i % 2 === 1 && 'flex-row-reverse')}>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 animate-pulse flex-shrink-0 mt-0.5" />
                    <div className={cn('flex-1 space-y-2 pt-1', i % 2 === 1 && 'items-end flex flex-col')}>
                      {widths.map((w, j) => (
                        <div key={j} className="h-3.5 bg-gray-200 dark:bg-gray-800/60 rounded-lg animate-pulse" style={{ width: `${w}%`, animationDelay: `${j * 80}ms` }} />
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
            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Input bar ──────────────────────────────────────────────────────── */}
        {activeConvId && (
          <div className="border-t border-gray-100/80 dark:border-white/[0.06] bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md px-4 py-4 flex-shrink-0">
            <div className="max-w-3xl mx-auto">
              {/* Sprint 3.3: File attachment area */}
              {attachedFile && filePreviewUrl && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  {attachedFile.type === 'application/pdf' ? (
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/[0.05] border border-gray-200/60 dark:border-white/[0.08] rounded-xl px-3 py-2">
                      <FileIcon className="w-4 h-4 text-red-500 flex-shrink-0" aria-hidden="true" />
                      <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{attachedFile.name}</span>
                    </div>
                  ) : (
                    <img src={filePreviewUrl} alt="Attached" className="h-16 max-w-[120px] rounded-xl object-cover border border-gray-200/60 dark:border-white/[0.08] shadow-sm" />
                  )}
                  <button
                    type="button"
                    onClick={clearFile}
                    className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    aria-label="Faylni olib tashlash"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Input container with gradient focus ring */}
              <div
                className={cn(
                  'rounded-2xl border bg-white dark:bg-white/[0.05] shadow-sm transition-all duration-200',
                  'focus-within:shadow-[0_0_0_2px_rgba(91,92,246,0.25)] focus-within:border-brand/40 dark:focus-within:border-brand/40',
                  attachedFile
                    ? 'border-brand/30 dark:border-brand/25'
                    : 'border-gray-200/80 dark:border-white/[0.09]',
                )}
              >
                {/* Input row */}
                <div className="flex items-end gap-3 px-4 py-3">
                {/* Textarea */}
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    attachedFile
                      ? (language === 'ru' ? 'Задайте вопрос об этом файле (или оставьте пустым)…'
                        : language === 'en' ? 'Ask a question about this file (or leave empty)…'
                        : 'Bu haqida savol bering yoki bo\'sh qoldiring…')
                      : (language === 'ru' ? 'Задайте вопрос или прикрепите файл…'
                        : language === 'en' ? 'Ask anything or attach a file…'
                        : 'Savol bering yoki fayl biriktiring…')
                  }
                  rows={1}
                  disabled={isTyping}
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-none outline-none leading-6 max-h-36 disabled:opacity-50 py-0.5"
                  aria-label="AI ga savol yozing"
                />

                {/* Voice input (functional) */}
                <button
                  type="button"
                  onClick={toggleVoice}
                  disabled={isTyping || !voiceSupported}
                  title={
                    !voiceSupported
                      ? 'Brauzer ovozni qo\'llab-quvvatlamaydi'
                      : isListening
                        ? 'To\'xtatish (yozish tayyor)'
                        : 'Ovoz bilan yozish'
                  }
                  aria-label={isListening ? 'Ovozni to\'xtatish' : 'Ovoz bilan yozish'}
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 mb-0.5 transition-all duration-150',
                    isListening
                      ? 'text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse'
                      : voiceSupported && !isTyping
                        ? 'text-gray-400 hover:text-brand dark:hover:text-brand-light hover:bg-brand/8 dark:hover:bg-brand/12 cursor-pointer'
                        : 'text-gray-200 dark:text-gray-700 cursor-not-allowed',
                  )}
                >
                  <Mic className="w-4 h-4" aria-hidden="true" />
                </button>

                {/* Send button */}
                <motion.button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={(!input.trim() && !attachedFile) || isTyping}
                  whileHover={(input.trim() || attachedFile) && !isTyping ? { scale: 1.08 } : {}}
                  whileTap={(input.trim() || attachedFile) && !isTyping ? { scale: 0.93 } : {}}
                  transition={{ duration: 0.12 }}
                  className={cn(
                    'w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 transition-all duration-200 mb-0.5',
                    (input.trim() || attachedFile) && !isTyping
                      ? 'text-white shadow-md hover:shadow-lg'
                      : 'bg-gray-100/80 dark:bg-white/[0.06] text-gray-400 dark:text-gray-500 cursor-not-allowed',
                  )}
                  style={(input.trim() || attachedFile) && !isTyping ? {
                    background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)',
                    boxShadow: '0 4px 12px rgba(91,92,246,0.4)',
                  } : {}}
                  aria-label={isTyping ? 'Javob kutilyapti' : 'Yuborish'}
                >
                  {isTyping
                    ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    : <Send className="w-[15px] h-[15px]" aria-hidden="true" />}
                </motion.button>
                </div>{/* end input row */}

                {/* Sprint 3.3: File picker buttons */}
                <div className="flex items-center gap-0.5 px-4 pb-2.5">
                  {/* Camera */}
                  <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-gray-400 dark:text-gray-500 hover:text-brand dark:hover:text-brand-light hover:bg-brand/5 dark:hover:bg-brand/8 transition-all duration-150 cursor-pointer">
                    <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                    {language === 'ru' ? 'Камера' : language === 'en' ? 'Camera' : 'Kamera'}
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={onFileInputChange} disabled={isTyping} />
                  </label>
                  {/* Gallery */}
                  <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-gray-400 dark:text-gray-500 hover:text-brand dark:hover:text-brand-light hover:bg-brand/5 dark:hover:bg-brand/8 transition-all duration-150 cursor-pointer">
                    <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    {language === 'ru' ? 'Галерея' : language === 'en' ? 'Gallery' : 'Galereya'}
                    <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onFileInputChange} disabled={isTyping} />
                  </label>
                  {/* PDF */}
                  <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-gray-400 dark:text-gray-500 hover:text-brand dark:hover:text-brand-light hover:bg-brand/5 dark:hover:bg-brand/8 transition-all duration-150 cursor-pointer">
                    <FileIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    PDF
                    <input ref={pdfInputRef} type="file" accept="application/pdf" className="sr-only" onChange={onFileInputChange} disabled={isTyping} />
                  </label>
                </div>
              </div>{/* end input container */}

              {/* Voice feedback */}
              {isListening && (
                <p className="text-center text-[11px] text-red-500 dark:text-red-400 mt-1.5 animate-pulse">
                  🎙 {language === 'ru' ? 'Слушаю…' : language === 'en' ? 'Listening…' : 'Tinglamoqda…'}
                </p>
              )}
              {voiceError && (
                <p className="text-center text-[11px] text-amber-600 dark:text-amber-400 mt-1.5">{voiceError}</p>
              )}
              {!isListening && !voiceError && (
                <p className="text-center text-[10px] text-gray-300 dark:text-gray-700 mt-2.5 select-none tracking-wide">
                  Asomiddin AI · Gemini 2.5 Flash · Enter — yuborish
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ════════════ RIGHT: CONTEXT PANEL ════════════ */}
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
