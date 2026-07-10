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

import { useState, useEffect, useRef } from 'react'
import {
  BookOpen, AlertCircle, Search, ChevronDown, Download, Loader2, Paperclip,
  Sparkles, Bookmark, BookmarkCheck, Clock, FileText, Film, Zap,
  ChevronRight, Brain, Globe, ListChecks, Eye,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { IllustrationImage, ILLUS } from '@/components/illustration'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/routes/paths'
import { lessonService } from '@/services/lesson.service'
import {
  attachmentService,
  formatFileSize,
  getVideoEmbedUrl,
  getMimeIcon,
} from '@/services/attachment.service'
import type { AttachmentRow, AttachmentWithMeta } from '@/services/attachment.service'
import { FilePreviewModal } from '@/components/materials'
import type { LessonWithDetails } from '@/services/lesson.service'
import { courseService, buildLearningStats, lessonStatus } from '@/services/course.service'
import type { StudentCourse, StudentLearningStats } from '@/services/course.service'
import { assignmentService } from '@/services/assignment.service'
import type { StudentAssignment } from '@/services/assignment.service'
import {
  LessonsHeader, LessonsToolbar, CoursesSection, TodayLessonsSection,
  AnalyticsSection, HomeworkSection,
} from '@/components/student/LessonsSections'
import type { StatusFilter, LessonStatusItem } from '@/components/student/LessonsSections'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

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
  const { t } = useLanguage()
  const AI_ACTIONS: { icon: typeof Brain; label: keyof Translations; color: string }[] = [
    { icon: Brain,     label: 'lpSummarize',    color: '#6366F1' },
    { icon: Sparkles,  label: 'lpExplainEasier', color: '#8B5CF6' },
    { icon: ListChecks,label: 'lpMakeQuiz',      color: '#22C55E' },
    { icon: Globe,     label: 'lpTranslate',     color: '#3B82F6' },
    { icon: Zap,       label: 'lpAskAIQ',        color: '#F59E0B' },
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
          <p className="text-[12px] font-black text-white/80 tracking-tight">{t.lpAIHelp}</p>
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
          <span className="text-brand-light/60 font-semibold">{lesson.title}</span> {t.lpContextNote}
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
            title={t.lpComingSoon}
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18` }}
            >
              <Icon className="w-3 h-3" style={{ color }} aria-hidden="true" />
            </div>
            <span className="text-[12px] font-medium text-white/50">{t[label]}</span>
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
  att, downloading, onDownload, onPreview,
}: {
  att: AttachmentRow
  downloading: boolean
  onDownload: () => void
  onPreview: () => void
}) {
  const { t } = useLanguage()
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 360, damping: 26 }}
      className="flex items-center gap-3 px-4 py-3 rounded-[16px] cursor-pointer group"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        willChange: 'transform',
      }}
      onClick={onPreview}
      role="button"
      tabIndex={0}
      aria-label={`${att.file_name} — ko'rish`}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPreview() } }}
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
      {/* Ko'rish (preview) */}
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onPreview() }}
        className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold rounded-xl flex-shrink-0 text-white/70 hover:text-white transition-colors"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
        aria-label={t.tdView}
      >
        <Eye className="w-3.5 h-3.5" aria-hidden="true" /> {t.tdView}
      </button>
      {/* Yuklab olish (download) */}
      <motion.button
        type="button"
        disabled={downloading}
        onClick={e => { e.stopPropagation(); onDownload() }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center justify-center w-9 h-9 rounded-xl transition-opacity disabled:opacity-50 flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg,#5B5CF6,#7C3AED)',
          boxShadow: '0 4px 12px rgba(91,92,246,0.35)',
          color: 'white',
        }}
        aria-label={t.achDownload}
        title={t.achDownload}
      >
        {downloading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          : <Download className="w-3.5 h-3.5" aria-hidden="true" />
        }
      </motion.button>
    </motion.div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Component — ALL BUSINESS LOGIC PRESERVED
// ═════════════════════════════════════════════════════════════════════════════

export default function StudentLessonsPage() {
  const auth     = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const lessonsListRef = useRef<HTMLDivElement>(null)

  // ── Original state (PRESERVED EXACTLY) ───────────────────────────────────
  const [lessons,     setLessons]     = useState<LessonWithDetails[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [search,      setSearch]      = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedId,  setExpandedId]  = useState<string | null>(null)
  const [attachments,       setAttachments]       = useState<Record<string, AttachmentWithMeta[]>>({})
  const [attachmentsLoaded, setAttachmentsLoaded] = useState<Set<string>>(new Set())
  const [downloadingId,     setDownloadingId]     = useState<string | null>(null)
  const [previewAtt,        setPreviewAtt]        = useState<AttachmentWithMeta | null>(null)
  const [previewLessonId,   setPreviewLessonId]   = useState<string | null>(null)

  // ── Visual-only state ─────────────────────────────────────────────────────
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set())

  // ── LMS bo'limlari (kurslar / topshiriqlar / statistika) ─────────────────
  const [courses,     setCourses]     = useState<StudentCourse[]>([])
  const [assignments, setAssignments] = useState<StudentAssignment[]>([])
  const [stats,       setStats]       = useState<StudentLearningStats | null>(null)
  const [sectionsLoading, setSectionsLoading] = useState(true)

  // ── Original effects + handlers (PRESERVED EXACTLY) ──────────────────────

  useEffect(() => {
    if (!auth.user?.id) return
    void load()
    void loadSections()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load()/loadSections() unmemoized by design; re-run only on user id change
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

  // Kurslar + topshiriqlar + o'quv statistikasi (mavjud Supabase jadvallaridan)
  async function loadSections() {
    setSectionsLoading(true)
    try {
      const [courseList, assignmentList] = await Promise.all([
        courseService.getStudentCourses(auth.user!.id),
        assignmentService.getStudentAssignments().catch(() => [] as StudentAssignment[]),
      ])
      setCourses(courseList)
      setAssignments(assignmentList)
      setStats(buildLearningStats(courseList))
    } catch {
      // Bo'limlar yuklanmasa — asosiy dars ro'yxati baribir ishlaydi
      setStats(buildLearningStats([]))
    } finally {
      setSectionsLoading(false)
    }
  }

  async function handleExpand(lessonId: string) {
    setExpandedId(prev => prev === lessonId ? null : lessonId)
    if (!attachmentsLoaded.has(lessonId)) {
      await reloadAttachments(lessonId)
      setAttachmentsLoaded(prev => new Set(prev).add(lessonId))
    }
  }

  async function reloadAttachments(lessonId: string) {
    try {
      const data = await attachmentService.getForLessonWithMeta(lessonId)
      setAttachments(prev => ({ ...prev, [lessonId]: data }))
    } catch {
      setAttachments(prev => ({ ...prev, [lessonId]: prev[lessonId] ?? [] }))
    }
  }

  function openPreview(lessonId: string, att: AttachmentWithMeta) {
    setPreviewLessonId(lessonId)
    setPreviewAtt(att)
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

  // ── Derived: status filtering + section data + navigation helpers ─────────

  const FILTER_TO_STATUS = { all: null, active: 'in_progress', completed: 'completed', locked: 'locked' } as const

  const filtered = lessons.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || l.title.toLowerCase().includes(q)
      || (l.content ?? '').toLowerCase().includes(q)
    const want = FILTER_TO_STATUS[statusFilter]
    const matchStatus = want === null || lessonStatus(l.lesson_date) === want
    return matchSearch && matchStatus
  })

  const statusItems: LessonStatusItem[] = lessons.map(l => {
    const subj = l.subject as any
    const grp  = l.group  as any
    return {
      id: l.id, title: l.title,
      subjectName: subj?.name ?? grp?.name ?? null,
      color: subj?.color ?? '#5B7FFF',
      icon:  subj?.icon  ?? '📘',
      status: lessonStatus(l.lesson_date),
      dateLabel: l.lesson_date ? fmtDate(l.lesson_date) : 'Sanasi belgilanmagan',
    }
  })

  const STATUS_ORDER = { in_progress: 0, locked: 1, completed: 2 } as const
  const todayItems = [...statusItems].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]).slice(0, 8)
  const continueItem =
    statusItems.find(s => s.status === 'in_progress')
    ?? statusItems.find(s => s.status === 'completed')
    ?? statusItems.find(s => s.status === 'locked')
    ?? null

  // Darsni ochib, ro'yxatdagi joyiga scroll qiladi (kurs / dars kartalaridan)
  async function openLesson(lessonId: string) {
    setExpandedId(lessonId)
    if (!attachmentsLoaded.has(lessonId)) {
      await reloadAttachments(lessonId)
      setAttachmentsLoaded(prev => new Set(prev).add(lessonId))
    }
    requestAnimationFrame(() => {
      document.getElementById(`lesson-${lessonId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  // Kurs "Davom etish" — shu guruhning eng dolzarb darsini ochadi
  function continueCourse(courseId: string) {
    const inGroup = lessons.filter(l => (l.group as any)?.id === courseId)
    const target  = inGroup.find(l => lessonStatus(l.lesson_date) === 'in_progress') ?? inGroup[0]
    if (target) void openLesson(target.id)
    else lessonsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ── Visual-only: bookmark toggle ──────────────────────────────────────────
  function toggleBookmark(id: string) {
    setBookmarked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // ── RENDER — Premium dark design ─────────────────────────────────────────

  if (loading) return (
    <div className="space-y-4 pb-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 rounded-xl animate-pulse" style={{ width: '180px', background: 'rgba(255,255,255,0.07)' }} />
        <div className="h-4 rounded-lg animate-pulse" style={{ width: '100px', background: 'rgba(255,255,255,0.04)' }} />
      </div>
      {[1,2,3].map(i => <LessonSkeleton key={i} i={i} />)}
    </div>
  )

  return (
    <div className="space-y-5 pb-8">

      {/* 1. Header — title + subtitle + live Tashkent date/time */}
      <LessonsHeader />

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

      {/* 2. My Courses — progress, teacher, completed/total, "Davom etish" */}
      <CoursesSection courses={courses} loading={sectionsLoading} onContinue={continueCourse} />

      {/* 3. Today's Lessons — status: Bajarildi / Jarayonda / Qulflangan */}
      <TodayLessonsSection items={todayItems} continueItem={continueItem} onOpen={id => void openLesson(id)} />

      {/* 4. Learning Analytics — haftalik faollik, ketma-ket kunlar, darslar, soatlar */}
      <AnalyticsSection stats={stats} loading={sectionsLoading} />

      {/* 5. Homework — topshiriqlar, muddat, holat */}
      <HomeworkSection
        assignments={assignments}
        loading={sectionsLoading}
        onViewAll={() => navigate(PATHS.STUDENT.ASSIGNMENTS)}
      />

      {/* 6. All lessons — search + status filter tabs (list/detail below) */}
      {lessons.length > 0 && (
        <div className="pt-1 space-y-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[9px] flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}>
              <BookOpen className="w-4 h-4 text-[#C4B5FD]" aria-hidden="true" />
            </div>
            <h2 className="text-[15px] font-bold text-white/85 tracking-tight">{t.lpAllLessons}</h2>
            <span className="ml-auto text-[11px] font-semibold text-white/35">{filtered.length} / {lessons.length}</span>
          </div>
          <LessonsToolbar search={search} onSearch={setSearch} filter={statusFilter} onFilter={setStatusFilter} />
        </div>
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
          <p className="text-sm text-white/35">{t.lpNoResults}</p>
        </motion.div>
      )}

      {/* Lesson list */}
      {filtered.length > 0 && (
        <div ref={lessonsListRef} className="space-y-3 scroll-mt-4">
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
                id={`lesson-${lesson.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 0.35), duration: 0.35, ease: EASE }}
                className="rounded-[22px] overflow-hidden scroll-mt-4"
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
                                  <span className="text-[10px] font-bold text-white/25 uppercase tracking-wider">{t.lpLessonText}</span>
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
                                      onPreview={() => openPreview(lesson.id, att)}
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

      {/* Lesson Materials Center — instant preview (student: view-only) */}
      <AnimatePresence>
        {previewAtt && (
          <FilePreviewModal
            attachment={previewAtt}
            onClose={() => { setPreviewAtt(null); setPreviewLessonId(null) }}
            onChanged={() => { if (previewLessonId) void reloadAttachments(previewLessonId) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
