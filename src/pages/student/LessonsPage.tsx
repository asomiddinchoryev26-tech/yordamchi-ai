/**
 * pages/student/LessonsPage.tsx
 * Sprint 4.6 — Premium Course Learning Experience UI Redesign
 *
 * ⚠️  ALL BUSINESS LOGIC PRESERVED UNCHANGED ⚠️
 * All state, hooks, API calls, handlers, computed values — identical to original.
 *
 * Visual-only additions (no data-flow impact):
 *   • bookmarked  — UI bookmark toggle (not saved to DB)
 *   • estimateReadTime() — pure computation from content.length
 */

import { useState, useEffect } from 'react'
import {
  BookOpen, AlertCircle, Search, ChevronDown, Download, Loader2, Paperclip,
  Sparkles, Bookmark, BookmarkCheck, Clock, FileText, Film, Zap,
  ChevronRight, Star, Brain, Globe, ListChecks,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { IllustrationImage, ILLUS } from '@/components/illustration'
import { useAuth } from '@/hooks/useAuth'
import { lessonService } from '@/services/lesson.service'
import {
  attachmentService,
  formatFileSize,
  getVideoEmbedUrl,
  getMimeIcon,
} from '@/services/attachment.service'
import type { AttachmentRow } from '@/services/attachment.service'
import type { LessonWithDetails } from '@/services/lesson.service'

// ─── Animation constants ──────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

// ─── Original helpers (PRESERVED EXACTLY) ────────────────────────────────────

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktyabr','Noyabr','Dekabr']

function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

// ─── Visual-only helpers ──────────────────────────────────────────────────────

function estimateReadTime(content: string | null | undefined): string {
  if (!content) return '< 1 daqiqa'
  const words = content.trim().split(/\s+/).length
  const mins  = Math.ceil(words / 200)
  return `≈ ${mins} daqiqa`
}

// ─── Visual-only: Lesson skeleton ─────────────────────────────────────────────

function LessonSkeleton({ i }: { i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07, duration: 0.35, ease: EASE }}
      className="rounded-[22px] p-5 relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer pointer-events-none"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)' }}
        aria-hidden="true" />
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-2xl flex-shrink-0 animate-pulse" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <div className="flex-1 space-y-3">
          <div className="h-4 rounded-lg animate-pulse" style={{ width: '55%', background: 'rgba(255,255,255,0.08)' }} />
          <div className="h-3 rounded-lg animate-pulse" style={{ width: '35%', background: 'rgba(255,255,255,0.05)' }} />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Visual-only: AI Sidebar Panel (no AI calls, placeholders only) ───────────

function AISidebar({ lesson }: { lesson: LessonWithDetails }) {
  const AI_ACTIONS = [
    { icon: Brain,     label: 'Darsni umumlashtirish',   color: '#6366F1' },
    { icon: Sparkles,  label: 'Osonroq tushuntirish',    color: '#8B5CF6' },
    { icon: ListChecks,label: 'Quiz yaratish',            color: '#22C55E' },
    { icon: Globe,     label: 'Tarjima qilish',          color: '#3B82F6' },
    { icon: Zap,       label: 'AI ga savol berish',      color: '#F59E0B' },
  ]

  return (
    <div
      className="rounded-[20px] overflow-hidden flex-shrink-0"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#5B5CF6,#7C3AED)', boxShadow: '0 0 10px rgba(91,92,246,0.4)' }}
        >
          <Brain className="w-3.5 h-3.5 text-white" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[12px] font-black text-white/80 tracking-tight">AI Yordam</p>
          <p className="text-[9px] text-white/30">Gemini 2.5 Flash</p>
        </div>
        <span
          className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#C4B5FD', border: '1px solid rgba(99,102,241,0.3)' }}
        >
          Beta
        </span>
      </div>

      {/* Context note */}
      <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-[11px] text-white/35 leading-snug">
          <span className="text-brand-light/60 font-semibold">{lesson.title}</span> darsi kontekstida yordam beradi
        </p>
      </div>

      {/* Action buttons */}
      <div className="p-3 space-y-1.5">
        {AI_ACTIONS.map(({ icon: Icon, label, color }) => (
          <button
            key={label}
            type="button"
            disabled
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all cursor-not-allowed opacity-60"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            title="Tez orada ishga tushadi"
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18` }}
            >
              <Icon className="w-3 h-3" style={{ color }} aria-hidden="true" />
            </div>
            <span className="text-[12px] font-medium text-white/50">{label}</span>
            <ChevronRight className="w-3 h-3 text-white/20 ml-auto" aria-hidden="true" />
          </button>
        ))}

        <div
          className="mt-2 px-3 py-2 rounded-xl text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}
        >
          <p className="text-[10px] text-white/25">Sprint 4.7 da to&apos;liq AI integratsiyasi</p>
        </div>
      </div>
    </div>
  )
}

// ─── Visual-only: Premium video player wrapper ────────────────────────────────

function VideoPlayer({ embedUrl, title }: { embedUrl: string; title: string }) {
  return (
    <div className="rounded-[20px] overflow-hidden" style={{
      border: '1px solid rgba(255,255,255,0.12)',
      boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
    }}>
      {/* Cinema chrome */}
      <div
        className="h-9 flex items-center justify-between px-4"
        style={{ background: '#0A0A0F', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" aria-hidden="true" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" aria-hidden="true" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-1.5">
          <Film className="w-3 h-3 text-white/30" aria-hidden="true" />
          <span className="text-[10px] text-white/30 font-medium truncate max-w-[200px]">{title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
          <span className="text-[10px] text-white/30 font-bold">LIVE</span>
        </div>
      </div>

      {/* iframe — unchanged business logic */}
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full"
        style={{ aspectRatio: '16/9', display: 'block', background: '#000' }}
      />
    </div>
  )
}

// ─── Visual-only: Premium attachment card ─────────────────────────────────────

function AttachmentCard({
  att, downloading, onDownload,
}: {
  att: AttachmentRow
  downloading: boolean
  onDownload: () => void
}) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 360, damping: 26 }}
      className="flex items-center gap-3 px-4 py-3 rounded-[16px]"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        willChange: 'transform',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {getMimeIcon(att.mime_type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-white/80 truncate">{att.file_name}</p>
        {att.file_size && (
          <p className="text-[11px] text-white/30 mt-0.5">{formatFileSize(att.file_size)}</p>
        )}
      </div>
      <motion.button
        type="button"
        disabled={downloading}
        onClick={onDownload}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold rounded-xl transition-opacity disabled:opacity-50 flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg,#5B5CF6,#7C3AED)',
          boxShadow: '0 4px 12px rgba(91,92,246,0.35)',
          color: 'white',
        }}
      >
        {downloading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          : <Download className="w-3.5 h-3.5" aria-hidden="true" />
        }
        Yuklab olish
      </motion.button>
    </motion.div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Component — ALL BUSINESS LOGIC PRESERVED
// ═════════════════════════════════════════════════════════════════════════════

export default function StudentLessonsPage() {
  const auth = useAuth()

  // ── Original state (PRESERVED EXACTLY) ───────────────────────────────────
  const [lessons,     setLessons]     = useState<LessonWithDetails[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [search,      setSearch]      = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [expandedId,  setExpandedId]  = useState<string | null>(null)
  const [attachments,       setAttachments]       = useState<Record<string, AttachmentRow[]>>({})
  const [attachmentsLoaded, setAttachmentsLoaded] = useState<Set<string>>(new Set())
  const [downloadingId,     setDownloadingId]     = useState<string | null>(null)

  // ── Visual-only state ─────────────────────────────────────────────────────
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set())

  // ── Original effects + handlers (PRESERVED EXACTLY) ──────────────────────

  useEffect(() => {
    if (!auth.user?.id) return
    void load()
  }, [auth.user?.id])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setLessons(await lessonService.getForStudent(auth.user!.id))
    } catch {
      setError("Darslarni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }

  async function handleExpand(lessonId: string) {
    setExpandedId(prev => prev === lessonId ? null : lessonId)
    if (!attachmentsLoaded.has(lessonId)) {
      try {
        const data = await attachmentService.getForLesson(lessonId)
        setAttachments(prev => ({ ...prev, [lessonId]: data }))
        setAttachmentsLoaded(prev => new Set(prev).add(lessonId))
      } catch {
        setAttachments(prev => ({ ...prev, [lessonId]: [] }))
        setAttachmentsLoaded(prev => new Set(prev).add(lessonId))
      }
    }
  }

  async function handleDownload(att: AttachmentRow) {
    setDownloadingId(att.id)
    try {
      const url = await attachmentService.getSignedUrl(att.file_path)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      // Download URL generation failed — silent fail
    } finally {
      setDownloadingId(null)
    }
  }

  // ── Original computed values (PRESERVED EXACTLY) ──────────────────────────

  const uniqueGroupsMap = new Map<string, string>()
  lessons.forEach(l => {
    const grp = l.group as any
    if (grp?.id) uniqueGroupsMap.set(grp.id as string, (grp.name ?? grp.id) as string)
  })
  const uniqueGroups = Array.from(uniqueGroupsMap.entries()).map(([id, name]) => ({ id, name }))

  const filtered = lessons.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || l.title.toLowerCase().includes(q)
      || (l.content ?? '').toLowerCase().includes(q)
    const matchGroup = groupFilter === 'all' || (l.group as any)?.id === groupFilter
    return matchSearch && matchGroup
  })

  // ── Visual-only: bookmark toggle ──────────────────────────────────────────
  function toggleBookmark(id: string) {
    setBookmarked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── RENDER — Premium dark design ─────────────────────────────────────────

  if (loading) return (
    <div className="space-y-4 pb-8 max-w-3xl">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 rounded-xl animate-pulse" style={{ width: '180px', background: 'rgba(255,255,255,0.07)' }} />
        <div className="h-4 rounded-lg animate-pulse" style={{ width: '100px', background: 'rgba(255,255,255,0.04)' }} />
      </div>
      {[1,2,3].map(i => <LessonSkeleton key={i} i={i} />)}
    </div>
  )

  return (
    <div className="space-y-5 pb-8 max-w-3xl">

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="flex items-start justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#5B5CF6,#7C3AED)', boxShadow: '0 0 20px rgba(91,92,246,0.4)' }}
          >
            <BookOpen className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Darslarim</h1>
            <p className="text-[12px] text-white/35 mt-0.5">
              {`${lessons.length} ta dars`}
              {bookmarked.size > 0 && <span className="ml-2 text-brand-light/60">· {bookmarked.size} ta xatcho'p</span>}
            </p>
          </div>
        </div>

        {/* Stats badges (visual only) */}
        {lessons.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold"
              style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', color: '#86efac' }}
            >
              <Star className="w-3 h-3" aria-hidden="true" />
              {filtered.length}
            </div>
          </div>
        )}
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

      {/* Search + filter (original logic, premium dark UI) */}
      {lessons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35, ease: EASE }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Dars nomi bo'yicha qidirish..."
              className="w-full pl-9 pr-4 py-2.5 text-sm text-white/70 placeholder:text-white/25 outline-none transition-all rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={e => { e.currentTarget.style.border = '1px solid rgba(91,92,246,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,92,246,0.12)' }}
              onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>

          {uniqueGroups.length > 1 && (
            <div className="relative">
              <select
                value={groupFilter}
                onChange={e => setGroupFilter(e.target.value)}
                className="appearance-none px-3 py-2.5 pr-9 rounded-xl text-sm text-white/60 outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <option value="all">Barcha guruhlar</option>
                {uniqueGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" aria-hidden="true" />
            </div>
          )}
        </motion.div>
      )}

      {/* Empty state — no lessons */}
      {lessons.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="rounded-[28px] p-14 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="mx-auto mb-4 flex items-center justify-center"
            aria-hidden="true"
          >
            <IllustrationImage
              src={ILLUS.EMPTY_STATE}
              alt="Darslar yo'q"
              width={120}
              height={120}
              glow="0 0 24px rgba(99,102,241,0.3)"
              fallback={
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <BookOpen className="w-7 h-7 text-brand-light/50" />
                </div>
              }
            />
          </motion.div>
          <p className="text-sm font-semibold text-white/40 mb-1">Darslar yo&apos;q</p>
          <p className="text-xs text-white/20">O&apos;qituvchi dars qo&apos;shgach bu yerda ko&apos;rinadi</p>
        </motion.div>
      )}

      {/* Empty search results */}
      {lessons.length > 0 && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-[22px] p-10 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Search className="w-7 h-7 text-white/20 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm text-white/35">Qidiruv natijalari topilmadi</p>
        </motion.div>
      )}

      {/* Lesson list */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((lesson, idx) => {
            const isExpanded = expandedId === lesson.id
            const subj       = lesson.subject as any
            const grp        = lesson.group  as any
            const embedUrl   = lesson.video_url ? getVideoEmbedUrl(lesson.video_url) : null
            const lessonAtts = attachments[lesson.id] ?? []
            const attLoaded  = attachmentsLoaded.has(lesson.id)
            const hasContent = !!lesson.content || !!embedUrl || !!lesson.video_url
            const isBookmarked = bookmarked.has(lesson.id)

            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 0.35), duration: 0.35, ease: EASE }}
                className="rounded-[22px] overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: isExpanded
                    ? '1px solid rgba(91,92,246,0.25)'
                    : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: isExpanded
                    ? '0 0 0 1px rgba(91,92,246,0.1), 0 8px 32px rgba(0,0,0,0.3)'
                    : '0 2px 12px rgba(0,0,0,0.2)',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                {/* Lesson header button (PRESERVED: onClick={handleExpand}) */}
                <button
                  type="button"
                  onClick={() => void handleExpand(lesson.id)}
                  className="w-full text-left flex items-start gap-4 p-5"
                >
                  {/* Subject icon */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 shadow-md"
                    style={subj
                      ? { background: subj.color + '20', border: `1.5px solid ${subj.color}40` }
                      : { background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)' }
                    }
                  >
                    {subj ? subj.icon : <BookOpen className="w-5 h-5 text-white/40" aria-hidden="true" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white/85 text-[14.5px]">{lesson.title}</span>
                      {!hasContent && (
                        <span className="text-[10px] text-white/25 italic">Kontent yo&apos;q</span>
                      )}
                      {embedUrl && (
                        <span
                          className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }}
                        >
                          <Film className="w-2.5 h-2.5" aria-hidden="true" />
                          Video
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {grp  && <span className="text-[11px] font-semibold text-brand-light/70">{grp.name}</span>}
                      {subj && <span className="text-[11px] font-medium" style={{ color: subj.color }}>{subj.name}</span>}
                      {lesson.lesson_date && <span className="text-[11px] text-white/30">{fmtDate(lesson.lesson_date)}</span>}
                      {lesson.content && (
                        <span className="text-[10px] text-white/25 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" aria-hidden="true" />
                          {estimateReadTime(lesson.content)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side: bookmark + chevron */}
                  <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                    {/* Bookmark toggle (visual only) */}
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); toggleBookmark(lesson.id) }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                      style={isBookmarked
                        ? { background: 'rgba(251,191,36,0.2)', color: '#FCD34D' }
                        : { color: 'rgba(255,255,255,0.2)' }
                      }
                      aria-label={isBookmarked ? "Xatcho'pni olib tashlash" : "Xatcho'pga qo'shish"}
                    >
                      {isBookmarked
                        ? <BookmarkCheck className="w-4 h-4" aria-hidden="true" />
                        : <Bookmark className="w-4 h-4" aria-hidden="true" />
                      }
                    </button>

                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: EASE }}
                    >
                      <ChevronDown className="w-4 h-4 text-white/30" aria-hidden="true" />
                    </motion.div>
                  </div>
                </button>

                {/* Expanded content (PRESERVED: original condition) */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <div
                        className="px-5 pb-5 space-y-5"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '20px' }}
                      >
                        {/* Main content + AI sidebar grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-4">

                          {/* Left: video + content + attachments */}
                          <div className="space-y-5 min-w-0">
                            {/* Video player */}
                            {embedUrl && (
                              <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, ease: EASE }}
                              >
                                <VideoPlayer embedUrl={embedUrl} title={lesson.title} />
                              </motion.div>
                            )}

                            {/* Lesson text content */}
                            {lesson.content && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1, duration: 0.35 }}
                                className="rounded-[18px] p-5"
                                style={{
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid rgba(255,255,255,0.06)',
                                }}
                              >
                                {/* Content header */}
                                <div className="flex items-center gap-2 mb-3">
                                  <FileText className="w-3.5 h-3.5 text-white/30" aria-hidden="true" />
                                  <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider">Dars matni</span>
                                  <div
                                    className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full"
                                    style={{ background: 'rgba(99,102,241,0.12)', color: '#C4B5FD' }}
                                  >
                                    {estimateReadTime(lesson.content)}
                                  </div>
                                </div>
                                <p className="text-sm text-white/65 whitespace-pre-wrap leading-[1.85] tracking-wide">
                                  {lesson.content}
                                </p>
                              </motion.div>
                            )}

                            {/* Attachments (PRESERVED: original data logic) */}
                            {!attLoaded ? (
                              <div className="flex items-center gap-2 text-xs text-white/30 py-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                                Materiallar yuklanmoqda...
                              </div>
                            ) : lessonAtts.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15, duration: 0.35 }}
                                className="space-y-2.5"
                              >
                                <div className="flex items-center gap-2">
                                  <Paperclip className="w-3.5 h-3.5 text-white/30" aria-hidden="true" />
                                  <p className="text-[10.5px] font-bold text-white/30 uppercase tracking-wider">
                                    Dars materiallari ({lessonAtts.length})
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  {lessonAtts.map(att => (
                                    <AttachmentCard
                                      key={att.id}
                                      att={att}
                                      downloading={downloadingId === att.id}
                                      onDownload={() => void handleDownload(att)}
                                    />
                                  ))}
                                </div>
                              </motion.div>
                            )}

                            {/* No content (PRESERVED: original empty condition) */}
                            {!lesson.content && !embedUrl && !lesson.video_url && attLoaded && lessonAtts.length === 0 && (
                              <div
                                className="rounded-[16px] px-4 py-5 text-center"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}
                              >
                                <p className="text-sm text-white/25 italic">Bu dars uchun kontent qo&apos;shilmagan</p>
                              </div>
                            )}
                          </div>

                          {/* Right: AI sidebar (visual-only) */}
                          <div className="hidden xl:block">
                            <AISidebar lesson={lesson} />
                          </div>
                        </div>

                        {/* Mobile AI sidebar (hidden on xl) */}
                        <div className="xl:hidden">
                          <AISidebar lesson={lesson} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
