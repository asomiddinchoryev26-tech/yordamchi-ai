import { useState, useEffect, useRef, useCallback, memo } from 'react'
import {
  Send, Plus, Trash2, MessageSquare, Search,
  PanelLeftOpen, PanelLeftClose, AlertCircle, Loader2,
  Copy, Check, ThumbsUp, ThumbsDown, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { aiChatService }                  from '@/services/ai-chat.service'
import { aiProvider, loadStudentContext } from '@/services/ai-provider.service'
import {
  AsomiddinAvatar,
  UserAvatar,
  AIMessageCard,
  AssistantHeader,
  StreamingMessage,
  MessageFooter,
  ThinkingCard,
} from '@/components/ai'
import MarkdownContent from '@/components/chat/MarkdownContent'
import type { AiConversationRow, AiMessageRow } from '@/services/ai-chat.service'
import type { StudentContext }            from '@/services/ai-provider.service'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

type UIMessage = Pick<AiMessageRow, 'id' | 'role' | 'content' | 'created_at'>

// ─── Vaqt formatlash ─────────────────────────────────────────────────────────

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

// ─── Message action button ────────────────────────────────────────────────────

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

// ─── Xabar pufakchasi ─────────────────────────────────────────────────────────

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
  const [show,       setShow]       = useState(false)
  const [copied,     setCopied]     = useState(false)
  const [liked,      setLiked]      = useState(false)
  const [disliked,   setDisliked]   = useState(false)
  const [streamDone, setStreamDone] = useState(!isStreaming)
  const isUser = msg.role === 'user'

  useEffect(() => {
    const id = requestAnimationFrame(() => setShow(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const handleCopy    = () => { navigator.clipboard.writeText(msg.content).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const handleLike    = () => { setLiked(v => !v); setDisliked(false) }
  const handleDislike = () => { setDisliked(v => !v); setLiked(false) }
  const handleStreamComplete = useCallback(() => { setStreamDone(true); onStreamComplete?.() }, [onStreamComplete])

  const enterStyle = {
    opacity:    show ? 1 : 0,
    transform:  show ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.98)',
    transition: 'opacity 250ms cubic-bezier(.22,1,.36,1), transform 250ms cubic-bezier(.22,1,.36,1)',
    willChange: 'opacity, transform',
  }

  /* ── USER message ────────────────────────────────────────────────────────── */
  if (isUser) {
    return (
      <div className="flex items-start justify-end group/msg" style={{ ...enterStyle, gap: '10px' }}>
        <div className="flex flex-col items-end gap-1.5 min-w-0" style={{ maxWidth: 'min(85%, 580px)' }}>
          <div className="relative group/bubble w-full">
            <div className="relative bg-gradient-to-br from-blue-600 via-violet-600 to-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed break-words shadow-lg shadow-blue-500/15 overflow-hidden w-full">
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
        {/* User avatar — NEVER Asomiddin's photo */}
        <UserAvatar name={userName} avatarUrl={userAvatarUrl} showStatus />
      </div>
    )
  }

  /* ── AI message ──────────────────────────────────────────────────────────── */
  return (
    <div className="flex items-start group/msg" style={{ ...enterStyle, gap: '10px' }}>
      {/* ONE avatar — md=40px. Never duplicated inside card. */}
      <AsomiddinAvatar size="md" showStatus />

      <div className="flex-1 min-w-0 flex flex-col group/card">
        <div className="relative">
          <AIMessageCard>
            {/* Text-only header — 8px gap to content */}
            <AssistantHeader />

            {/* Content */}
            {isStreaming && !streamDone ? (
              <StreamingMessage text={msg.content} onComplete={handleStreamComplete} />
            ) : (
              <MarkdownContent text={msg.content} />
            )}
          </AIMessageCard>

          {/* Actions — hover reveal */}
          <div className="flex items-center gap-0.5 mt-1.5 opacity-0 group-hover/card:opacity-100 transition-all duration-200 translate-y-1 group-hover/card:translate-y-0">
            <ActionBtn onClick={handleCopy} title="Nusxalash">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </ActionBtn>
            <ActionBtn onClick={handleLike}    title="Yaxshi"  active={liked}>    <ThumbsUp   className="w-3.5 h-3.5" /></ActionBtn>
            <ActionBtn onClick={handleDislike} title="Yomon"   active={disliked}> <ThumbsDown className="w-3.5 h-3.5" /></ActionBtn>
            {onRegenerate && (
              <ActionBtn onClick={onRegenerate} title="Qaytadan yaratish"><RefreshCw className="w-3.5 h-3.5" /></ActionBtn>
            )}
          </div>
        </div>

        {/* Footer — 12px below content */}
        <div style={{ marginTop: '12px' }}>
          <MessageFooter visible={streamDone} />
        </div>

        <time className="text-[10px] text-gray-400 dark:text-gray-600 mt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
          {fmtTime(msg.created_at)}
        </time>
      </div>
    </div>
  )
})

// ─── Suhbat elementi ──────────────────────────────────────────────────────────

function ConvItem({
  conv, active, deleting, onSelect, onDelete,
}: {
  conv: AiConversationRow; active: boolean; deleting: boolean
  onSelect: () => void; onDelete: (e: React.MouseEvent) => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left px-3 py-2.5 rounded-xl group relative flex items-center gap-2.5 transition-all duration-150',
        active
          ? 'bg-white dark:bg-gray-800 shadow-sm border border-violet-100 dark:border-violet-900/50 text-violet-700 dark:text-violet-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200 border border-transparent',
      )}
    >
      <MessageSquare className={cn('w-3.5 h-3.5 flex-shrink-0 transition-colors', active ? 'text-violet-500' : 'text-gray-400')} />
      <span className="flex-1 text-[13px] font-medium truncate pr-7">{conv.title}</span>
      <span className="text-[10px] text-gray-400 dark:text-gray-600 flex-shrink-0 group-hover:opacity-0 transition-opacity absolute right-8">
        {fmtDate(conv.updated_at)}
      </span>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="absolute right-2 w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-40"
      >
        {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
      </button>
    </button>
  )
}

function GroupLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-[0.12em]">
      {label}
    </p>
  )
}

// ─── Tezkor amallar ───────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    icon: '💻', label: 'Dasturlash',
    desc:   'Kod yozish, debugging va arxitektura',
    grad:   'from-blue-500 to-cyan-400',
    prompt: "Python'da oddiy veb scraper yozing va kodni tushuntiring",
  },
  {
    icon: '📚', label: "O'qish va ta'lim",
    desc:   'Darslar, tushuntirishlar va testlar',
    grad:   'from-violet-500 to-purple-400',
    prompt: 'Murakkab mavzuni oddiy va tushunarli tarzda tushuntiring',
  },
  {
    icon: '🌍', label: 'Tarjima',
    desc:   "Ko'p tilli tarjima va lokalizatsiya",
    grad:   'from-emerald-500 to-teal-400',
    prompt: "Quyidagi matnni o'zbek, ingliz va rus tillariga tarjima qiling:\n",
  },
  {
    icon: '📈', label: 'Biznes',
    desc:   'Strategiya, tahlil va rejalashtirish',
    grad:   'from-orange-500 to-amber-400',
    prompt: 'Startap uchun biznes reja asosiy elementlarini tushuntiring',
  },
  {
    icon: '🤖', label: 'AI maslahat',
    desc:   "Sun'iy intellekt va texnologiya",
    grad:   'from-pink-500 to-rose-400',
    prompt: 'Asomiddin AI qanday ishlaydi va nimalarga qodir? Batafsil tushuntir',
  },
]

// ═════════════════════════════════════════════════════════════════════════════

export default function AIAssistantPage() {
  const auth = useAuth()

  const [conversations, setConversations] = useState<AiConversationRow[]>([])
  const [activeConvId,  setActiveConvId]  = useState<string | null>(null)
  const [messages,      setMessages]      = useState<UIMessage[]>([])
  const [input,         setInput]         = useState('')
  const [isTyping,      setIsTyping]      = useState(false)
  const [convLoading,   setConvLoading]   = useState(true)
  const [msgLoading,    setMsgLoading]    = useState(false)
  const [sidebarOpen,   setSidebarOpen]   = useState(true)
  const [context,       setContext]       = useState<StudentContext | null>(null)
  const [error,         setError]         = useState<string | null>(null)
  const [deletingId,    setDeletingId]    = useState<string | null>(null)
  const [search,        setSearch]        = useState('')
  const [streamingId,   setStreamingId]   = useState<string | null>(null)

  const bottomRef   = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLTextAreaElement>(null)
  const studentId       = auth.user?.id        ?? ''
  const studentName     = auth.user?.name      ?? 'Talaba'
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
      await sendAIGreeting(conv.id)
    } catch { setError("Yangi suhbat yaratishda xatolik") }
  }

  async function sendAIGreeting(convId: string) {
    if (!context) return
    setIsTyping(true)
    try {
      const greeting = await aiProvider.complete([], context)
      const saved    = await aiChatService.addMessage(convId, 'assistant', greeting)
      setMessages([saved]); setStreamingId(saved.id)
      const title = 'Suhbat — ' + new Date().toLocaleDateString('uz-UZ')
      void aiChatService.updateTitle(convId, title)
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, title } : c))
    } catch { /* greeting xatosi suhbatni bloklamas */ }
    finally   { setIsTyping(false) }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || !activeConvId || isTyping) return

    setInput(''); setError(null)
    if (inputRef.current) inputRef.current.style.height = 'auto'

    const tempMsg: UIMessage = {
      id: `temp-${Date.now()}`, role: 'user', content: text, created_at: new Date().toISOString(),
    }
    const newMsgs = [...messages, tempMsg]
    setMessages(newMsgs)

    try {
      const savedUser = await aiChatService.addMessage(activeConvId, 'user', text)

      if (messages.filter(m => m.role === 'user').length === 0) {
        const title = text.slice(0, 40) + (text.length > 40 ? '…' : '')
        void aiChatService.updateTitle(activeConvId, title)
        setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, title } : c))
      }

      setIsTyping(true)
      const history = [
        ...newMsgs.filter(m => !m.id.startsWith('temp')), savedUser,
      ].map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      const aiResponse = await aiProvider.complete(history, context ?? {
        studentName, groups: [], recentLessons: [],
        testStats: { passed: 0, total: 0, avgPct: 0 }, attPct: null, attTotal: 0,
      })

      const savedAI = await aiChatService.addMessage(activeConvId, 'assistant', aiResponse)
      setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), savedUser, savedAI])
      setStreamingId(savedAI.id)
      setConversations(prev =>
        prev.map(c => c.id === activeConvId ? { ...c, updated_at: new Date().toISOString() } : c)
      )
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
      const aiResponse = await aiProvider.complete(history, context ?? {
        studentName, groups: [], recentLessons: [],
        testStats: { passed: 0, total: 0, avgPct: 0 }, attPct: null, attTotal: 0,
      })
      const savedAI = await aiChatService.addMessage(activeConvId, 'assistant', aiResponse)
      setMessages(prev => [...prev.slice(0, aiIdx), savedAI])
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

  const chatAreaRef = useRef<HTMLDivElement>(null)
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

  const filtered = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
  const groups   = groupConversations(filtered)

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-5rem)] -mt-3 -mx-3 sm:-mt-4 sm:-mx-4 lg:-mt-6 lg:-mx-6 overflow-hidden rounded-none sm:rounded-2xl border border-gray-200/70 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-xl shadow-gray-900/5 dark:shadow-none">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/25 backdrop-blur-[3px] z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ════════════ SIDEBAR ════════════ */}
      <aside className={cn(
        'flex-shrink-0 flex flex-col',
        'bg-gray-50/95 dark:bg-[#0f0f13]',
        'border-r border-gray-100/80 dark:border-gray-800/60',
        'transition-all duration-300 ease-in-out',
        'md:relative',
        'max-md:fixed max-md:left-0 max-md:top-0 max-md:bottom-0 max-md:z-50',
        sidebarOpen
          ? 'w-72 max-md:shadow-2xl max-md:shadow-black/30 max-md:translate-x-0'
          : 'max-md:w-72 max-md:-translate-x-full md:w-0 md:overflow-hidden',
      )}>

        {/* Brand + Yangi suhbat */}
        <div className="p-4 flex-shrink-0 space-y-3 border-b border-gray-100/70 dark:border-gray-800/50">
          {/* Logo */}
          <div className="flex items-center gap-3 px-1">
            <AsomiddinAvatar size="sm" />
            <div>
              <p className="text-[13px] font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none">
                Asomiddin AI
              </p>
              <p className="text-[9px] text-gray-400 dark:text-gray-600 mt-1 leading-none">
                Powered by Gemini 2.5 Flash
              </p>
            </div>
          </div>

          {/* Yangi suhbat tugmasi */}
          <button
            type="button"
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-[13px] font-semibold rounded-xl transition-all duration-200 shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/30 active:scale-[0.97]"
          >
            <Plus className="w-3.5 h-3.5" />
            Yangi suhbat
          </button>
        </div>

        {/* Qidiruv */}
        <div className="px-3 pt-3 pb-1 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="w-full bg-white dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-700/40 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none focus:border-violet-300 dark:focus:border-violet-700/60 focus:bg-white dark:focus:bg-gray-800/60 transition-all"
            />
          </div>
        </div>

        {/* Suhbatlar */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {convLoading ? (
            <div className="space-y-1.5 p-2 pt-4">
              {[100, 85, 70, 90, 60].map((w, i) => (
                <div
                  key={i}
                  className="h-9 rounded-xl animate-pulse bg-gray-200/60 dark:bg-gray-800/40"
                  style={{ width: `${w}%`, opacity: 1 - i * 0.12 }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center mb-3">
                <MessageSquare className="w-4.5 h-4.5 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 leading-relaxed">
                {search ? `"${search}" topilmadi` : "Hali suhbat yo'q"}
              </p>
            </div>
          ) : (
            <>
              {groups.today.length > 0 && (
                <><GroupLabel label="Bugun" />{groups.today.map(c => renderConvItem(c))}</>
              )}
              {groups.yesterday.length > 0 && (
                <><GroupLabel label="Kecha" />{groups.yesterday.map(c => renderConvItem(c))}</>
              )}
              {groups.older.length > 0 && (
                <><GroupLabel label="Oldingi" />{groups.older.map(c => renderConvItem(c))}</>
              )}
            </>
          )}
        </div>

        {/* Foydalanuvchi profili */}
        <div className="p-3 border-t border-gray-100/70 dark:border-gray-800/50 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/60 dark:hover:bg-gray-800/40 transition-colors">
            <UserAvatar name={studentName} avatarUrl={studentAvatarUrl} showStatus />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 truncate leading-none mb-1">
                {studentName}
              </p>
              <p className="text-[9px] text-violet-500 dark:text-violet-400 font-medium truncate leading-none">
                AI Developer • Vibe Coding • No-Code
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ════════════ CHAT ════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header — frosted glass */}
        <header className="h-14 border-b border-gray-100/80 dark:border-gray-800/60 flex items-center gap-3 px-4 flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10">
          {/* Sidebar toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen(o => !o)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-all duration-150"
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <AsomiddinAvatar showStatus />
            <div>
              <p className="text-sm font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none">
                Asomiddin AI
              </p>
              <p className="text-[10px] text-emerald-500 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Powered by Gemini 2.5 Flash
              </p>
            </div>
          </div>

          {/* Right: xato + user avatar */}
          <div className="ml-auto flex items-center gap-3">
            {error && (
              <div className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/40 px-3 py-1.5 rounded-lg max-w-[200px] sm:max-w-xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{error}</span>
              </div>
            )}
            <UserAvatar name={studentName} avatarUrl={studentAvatarUrl} showStatus />
          </div>
        </header>

        {/* Xabarlar maydoni */}
        <div
          ref={chatAreaRef}
          className="flex-1 overflow-y-auto scroll-smooth"
          style={{
            background: [
              'radial-gradient(ellipse 70% 50% at 30% 0%, rgba(139,92,246,0.06) 0%, transparent 65%)',
              'radial-gradient(ellipse 50% 40% at 80% 100%, rgba(59,130,246,0.05) 0%, transparent 55%)',
            ].join(','),
          }}
        >
          <div className="w-full sm:w-[90%] lg:max-w-[760px] mx-auto px-4 sm:px-0 py-8 space-y-5">

            {/* ── Welcome Screen ─────────────────────────────── */}
            {!activeConvId && !convLoading && (
              <div
                className="flex flex-col items-center justify-center min-h-[58vh] text-center relative"
              >
                {/* Dekorativ nuqtalar */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.2) 1px, transparent 1px)',
                    backgroundSize:  '28px 28px',
                    maskImage:        'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 80%)',
                    WebkitMaskImage:  'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 80%)',
                  }}
                />

                {/* AI Avatar — real photo */}
                <div className="relative mb-6 z-10">
                  <AsomiddinAvatar size="xl" showStatus />
                  <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-violet-500/15 to-indigo-500/15 blur-2xl -z-10" />
                </div>

                {/* Matnlar */}
                <div className="z-10 mb-10">
                  <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2">
                    Asomiddin AI
                  </h1>
                  <p className="text-base text-gray-600 dark:text-gray-400 font-medium mb-3">
                    Sun'iy intellekt yordamchingiz
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto leading-relaxed">
                    Dasturlash, tarjima, matematika, biznes va kundalik vazifalarda yordam beraman.
                  </p>
                </div>

                {/* Yangi suhbat */}
                <button
                  type="button"
                  onClick={handleNewConversation}
                  className="z-10 flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl transition-all duration-200 shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/35 hover:-translate-y-0.5 active:translate-y-0 active:shadow-lg mb-12"
                >
                  <Plus className="w-4 h-4" />
                  Suhbat boshlash
                </button>

                {/* Quick action cards */}
                <div className="z-10 w-full max-w-xl">
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.18em] mb-5">
                    Tezkor amallar
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {QUICK_ACTIONS.map(({ icon, label, desc, grad, prompt }) => (
                      <button
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
                        className="group relative text-left overflow-hidden bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/40 hover:border-transparent rounded-2xl p-4 transition-all duration-300 hover:shadow-xl hover:shadow-gray-900/10 dark:hover:shadow-black/30 hover:-translate-y-1.5 active:translate-y-0 active:shadow-md"
                      >
                        {/* Gradient highlight on hover */}
                        <div className={cn('absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300', grad)} />
                        {/* Subtle glow */}
                        <div className={cn('absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-0 group-hover:opacity-10 transition-opacity -translate-y-6 translate-x-6 bg-gradient-to-br', grad)} />

                        {/* Icon */}
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 shadow-md bg-gradient-to-br transition-transform duration-300 group-hover:scale-110',
                          grad,
                        )}>
                          {icon}
                        </div>

                        <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors mb-1 leading-snug">
                          {label}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-snug">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {msgLoading && (
              <div className="space-y-5">
                {[
                  [75, 55, 35],
                  [60, 80, 45],
                ].map((widths, i) => (
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

            {/* Xabarlar */}
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

        {/* Input */}
        {activeConvId && (
          <div className="border-t border-gray-100/80 dark:border-gray-800/60 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-4 py-4 flex-shrink-0">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-3 bg-white dark:bg-gray-800/70 border border-gray-200/80 dark:border-gray-700/50 rounded-2xl px-4 py-3 shadow-sm hover:border-gray-300/80 dark:hover:border-gray-600/60 focus-within:border-violet-300 dark:focus-within:border-violet-700/70 focus-within:shadow-md focus-within:shadow-violet-500/8 transition-all duration-200">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Xabar yozing…  (Enter — yuborish, Shift+Enter — yangi qator)"
                  rows={1}
                  disabled={isTyping}
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-none outline-none leading-6 max-h-36 disabled:opacity-50 py-0.5"
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || isTyping}
                  className={cn(
                    'w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 transition-all duration-200 mb-0.5',
                    input.trim() && !isTyping
                      ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30 hover:shadow-lg hover:shadow-violet-500/35 hover:scale-105 active:scale-95'
                      : 'bg-gray-100/80 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 cursor-not-allowed',
                  )}
                >
                  {isTyping
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-[15px] h-[15px]" />}
                </button>
              </div>
              <p className="text-center text-[10px] text-gray-300 dark:text-gray-700 mt-2.5 select-none tracking-wide">
                Asomiddin AI · Gemini 2.5 Flash
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // ── Yordamchi: ConvItem render ────────────────────────────────────────────
  function renderConvItem(c: AiConversationRow) {
    return (
      <ConvItem
        key={c.id}
        conv={c}
        active={c.id === activeConvId}
        deleting={deletingId === c.id}
        onSelect={() => {
          void selectConversation(c.id)
          if (window.innerWidth < 768) setSidebarOpen(false)
        }}
        onDelete={e => void handleDelete(e, c.id)}
      />
    )
  }
}
