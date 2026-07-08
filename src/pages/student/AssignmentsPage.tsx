/**
 * pages/student/AssignmentsPage.tsx
 * Homework & Assignment module — student view.
 * View / filter assignments, upload & replace submissions, view score + feedback.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, Calendar, Clock, AlertTriangle, CheckCircle2, Upload,
  Paperclip, Download, RefreshCw, Loader2, FileText, Star, Filter, Sparkles,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { subjectService } from '@/services/subject.service'
import {
  assignmentService, deadlineState, formatFileSize,
  type StudentAssignment, type DeadlineState,
} from '@/services/assignment.service'
import type { SubjectRow, AssignmentAttachmentRow } from '@/types/database.types'
import {
  AssignmentsHeader, AIUsageWidget, PremiumModal, AssignmentsAnalytics, AIReviewCard,
} from '@/components/student/AssignmentsAI'
import { assignmentAIService } from '@/services/assignmentAI.service'
import { subscriptionService } from '@/services/subscription.service'
import { aiUsageService, type UsageInfo } from '@/services/aiUsage.service'
import { aiReviewService, type AIReviewResult } from '@/services/aiReview.service'
import type { AIFeature } from '@/types/lms.types'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

const GLASS = {
  background:           'rgba(11,15,28,0.82)',
  backdropFilter:       'blur(28px) saturate(200%)',
  WebkitBackdropFilter: 'blur(28px) saturate(200%)',
  border:               '1px solid rgba(255,255,255,0.08)',
} as const
const RADIUS = '22px'

const STATE_META: Record<DeadlineState | 'graded', { label: keyof Translations; color: string }> = {
  none:      { label: 'lessNoDeadline',   color: '#6366F1' },
  upcoming:  { label: 'sdUpcomingBucket', color: '#3B82F6' },
  due_today: { label: 'asgpDueToday',     color: '#F59E0B' },
  overdue:   { label: 'lessHwOverdue',    color: '#EF4444' },
  graded:    { label: 'sdGraded',         color: '#22C55E' },
}

type StateFilter = 'all' | 'upcoming' | 'due_today' | 'overdue' | 'graded'

const FILTERS: { key: StateFilter; label: keyof Translations }[] = [
  { key: 'all',       label: 'adAll'            },
  { key: 'upcoming',  label: 'sdUpcomingBucket' },
  { key: 'due_today', label: 'sdToday'          },
  { key: 'overdue',   label: 'lessHwOverdue'    },
  { key: 'graded',    label: 'sdGraded'         },
]

function fmtDeadline(iso: string | null, t: Translations): string {
  if (!iso) return t.lessNoDeadline
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('uz', {
    timeZone: 'Asia/Tashkent', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(d)
}

export default function AssignmentsPage() {
  const auth = useAuth()
  const { t } = useLanguage()
  const [items,    setItems]    = useState<StudentAssignment[]>([])
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [stateFilter,   setStateFilter]   = useState<StateFilter>('all')

  // ── AI limit / premium ────────────────────────────────────────────────────
  const studentName = auth.user?.name ?? t.adStudent
  const [usage, setUsage] = useState<Record<AIFeature, UsageInfo> | null>(null)
  const [premiumOpen, setPremiumOpen] = useState(false)

  const refreshUsage = useCallback(async () => {
    const uid = auth.user?.id
    if (!uid) return
    const plan = await subscriptionService.getPlan(uid)
    setUsage(await aiUsageService.getSummary(uid, plan))
  }, [auth.user?.id])

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [asg, subs] = await Promise.all([
        assignmentService.getStudentAssignments(),
        subjectService.getAll(),
      ])
      setItems(asg)
      setSubjects(subs)
    } catch (e) {
      console.error('[Assignments] load error:', e)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])
  useEffect(() => { void refreshUsage() }, [refreshUsage])

  // ── Analitika (mavjud ma'lumotdan hisoblanadi) ────────────────────────────
  const analytics = useMemo(() => {
    const graded = items.filter(i => i.submission?.status === 'graded')
    const completed = graded.length
    const avgScore = graded.length
      ? Math.round(graded.reduce((a, i) => a + (i.max_score > 0 ? ((i.submission?.score ?? 0) / i.max_score) * 100 : 0), 0) / graded.length)
      : 0
    const weekAgo = Date.now() - 7 * 86_400_000
    const weekly = items.filter(i => i.submission?.submitted_at && new Date(i.submission.submitted_at).getTime() > weekAgo).length
    const improvement = Math.min(20, completed * 4) // placeholder: kelajakda tarixdan hisoblanadi
    return { completed, avgScore, improvement, weekly }
  }, [items])

  const filtered = useMemo(() => {
    return items.filter(it => {
      if (subjectFilter !== 'all' && it.subject?.id !== subjectFilter) return false
      if (stateFilter === 'all') return true
      if (stateFilter === 'graded') return it.submission?.status === 'graded'
      return deadlineState(it.deadline, Boolean(it.submission)) === stateFilter
    })
  }, [items, subjectFilter, stateFilter])

  return (
    <div className="space-y-5 pb-10">
      {/* Header — title + subtitle + live Tashkent date/time */}
      <AssignmentsHeader />

      {/* AI usage widget + analytics */}
      {usage && (
        <AIUsageWidget check={usage.assignment_check} chat={usage.ai_chat} onUpgrade={() => setPremiumOpen(true)} />
      )}
      {!loading && !error && items.length > 0 && (
        <AssignmentsAnalytics
          completed={analytics.completed} avgScore={analytics.avgScore}
          improvement={analytics.improvement} weekly={analytics.weekly}
        />
      )}

      {/* Filters */}
      <div className="space-y-3" style={{ ...GLASS, borderRadius: RADIUS, padding: '16px' }}>
        <div className="flex items-center gap-2 flex-wrap" role="tablist" aria-label={t.asgpFilterAria}>
          <Filter className="w-3.5 h-3.5 text-white/30" aria-hidden="true" />
          {FILTERS.map(f => {
            const active = stateFilter === f.key
            return (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStateFilter(f.key)}
                className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                style={active
                  ? { background: 'linear-gradient(135deg, #5B7FFF, #7C3AED)', color: '#fff' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {t[f.label]}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="subjectFilter" className="text-[12px] text-white/40 font-medium">{t.asgpSubject}</label>
          <select
            id="subjectFilter"
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 rounded-xl text-[12.5px] text-white/80 outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <option value="all">{t.asgpAllSubjects}</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-28 rounded-[22px] animate-pulse"
              style={{ background: 'rgba(255,255,255,0.04)', animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="flex flex-col items-center text-center gap-3 py-12"
          style={{ ...GLASS, borderRadius: RADIUS, borderColor: 'rgba(239,68,68,0.22)' }}>
          <AlertTriangle className="w-8 h-8 text-red-400" aria-hidden="true" />
          <p className="text-[14px] font-bold text-white/85">{t.asgpLoadFail}</p>
          <button type="button" onClick={() => void load()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #5B7FFF, #7C3AED)' }}>
            <RefreshCw className="w-4 h-4" aria-hidden="true" /> {t.ebRetry}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div role="status" className="flex flex-col items-center text-center gap-2 py-14"
          style={{ ...GLASS, borderRadius: RADIUS }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <ClipboardList className="w-6 h-6 text-white/30" aria-hidden="true" />
          </div>
          <p className="text-[14px] font-bold text-white/55">
            {items.length === 0 ? t.lessNoHw : t.asgpNoMatch}
          </p>
          <p className="text-[12px] text-white/30">{t.sdAsgHint}</p>
        </div>
      ) : (
        <motion.ul
          className="space-y-3"
          initial="hidden" animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {filtered.map(it => (
            <AssignmentCard
              key={it.id}
              item={it}
              studentId={auth.user?.id ?? ''}
              studentName={studentName}
              onChanged={load}
              onLimited={() => setPremiumOpen(true)}
              onUsageChange={refreshUsage}
            />
          ))}
        </motion.ul>
      )}

      <PremiumModal open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </div>
  )
}

// ─── Single assignment card ───────────────────────────────────────────────────

function AssignmentCard({ item, studentId, studentName, onChanged, onLimited, onUsageChange }: {
  item: StudentAssignment; studentId: string; studentName: string
  onChanged: () => Promise<void>; onLimited: () => void; onUsageChange: () => void
}) {
  const { t } = useLanguage()
  const [expanded, setExpanded]     = useState(false)
  const [attachments, setAttach]    = useState<AssignmentAttachmentRow[] | null>(null)
  const [busy, setBusy]             = useState(false)
  const [uploadErr, setUploadErr]   = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── AI tekshiruv holati ─────────────────────────────────────────────────
  const [answerText, setAnswerText] = useState('')
  const [aiBusy,     setAiBusy]     = useState(false)
  const [aiReview,   setAiReview]   = useState<AIReviewResult | null>(null)
  const [aiErr,      setAiErr]      = useState<string | null>(null)
  const [aiOpen,     setAiOpen]     = useState(false)

  // Mavjud AI bahosini yuklaymiz (topshirilgan bo'lsa)
  useEffect(() => {
    const subId = item.submission?.id
    if (!subId) return
    void aiReviewService.getForSubmission(subId).then(r => {
      if (r) setAiReview({
        score: r.ai_score ?? 0, feedback: r.feedback ?? '',
        mistakes: r.mistakes ?? [], recommendations: r.recommendations ?? [], weakTopics: r.weak_topics ?? [],
      })
    })
  }, [item.submission?.id])

  const runAICheck = async () => {
    setAiErr(null)
    setAiBusy(true)
    try {
      const out = await assignmentAIService.check({
        studentId, studentName,
        title: item.title, description: item.description, maxScore: item.max_score,
        answerText, submissionId: item.submission?.id,
      })
      if (out.ok)            { setAiReview(out.result); onUsageChange() }
      else if (out.limited)  { onLimited() }
      else                   { setAiErr(out.error) }
    } finally {
      setAiBusy(false)
    }
  }

  const submitted = Boolean(item.submission)
  const graded    = item.submission?.status === 'graded'
  const state: DeadlineState | 'graded' = graded ? 'graded' : deadlineState(item.deadline, submitted)
  const meta      = STATE_META[state]
  const locked    = item.deadline ? new Date(item.deadline).getTime() < Date.now() : false
  const canSubmit = !graded && !locked

  const toggle = async () => {
    const next = !expanded
    setExpanded(next)
    if (next && attachments === null) {
      try { setAttach(await assignmentService.getAttachments(item.id)) }
      catch { setAttach([]) }
    }
  }

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !studentId) return
    setUploadErr(null)
    setBusy(true)
    try {
      await assignmentService.submitOrReplace(item.id, studentId, file)
      await onChanged()
    } catch (err) {
      setUploadErr(err instanceof Error ? err.message : t.sdLoadFailed)
    } finally {
      setBusy(false)
    }
  }

  const download = async (path: string) => {
    try { window.open(await assignmentService.getSignedUrl(path), '_blank', 'noopener') }
    catch { /* ignore */ }
  }

  return (
    <motion.li
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      style={{ ...GLASS, borderRadius: RADIUS }}
      className="p-4 sm:p-5 overflow-hidden"
    >
      <div className="flex items-start gap-3">
        {/* Subject icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{ background: `${item.subject?.color ?? '#6366F1'}1f`, border: `1px solid ${item.subject?.color ?? '#6366F1'}33` }}
          aria-hidden="true">
          {item.subject?.icon ?? '📚'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-bold text-white/90 leading-snug">{item.title}</h3>
            <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap"
              style={{ background: `${meta.color}1f`, color: meta.color, border: `1px solid ${meta.color}33` }}>
              {t[meta.label]}
            </span>
          </div>

          {item.subject && <p className="text-[11.5px] text-white/40 mt-0.5">{item.subject.name}</p>}
          {item.description && <p className="text-[12.5px] text-white/55 mt-2 leading-relaxed line-clamp-2">{item.description}</p>}

          {/* Meta row */}
          <div className="flex items-center gap-3 flex-wrap mt-2.5 text-[11.5px] text-white/45">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" /> {fmtDeadline(item.deadline, t)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" aria-hidden="true" /> {t.asgpMaxScore} {item.max_score} {t.tdBall}
            </span>
            <button type="button" onClick={toggle}
              className="inline-flex items-center gap-1.5 text-white/45 hover:text-white/75 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 rounded"
              aria-expanded={expanded}>
              <Paperclip className="w-3.5 h-3.5" aria-hidden="true" /> {t.asgpMaterials}
            </button>
          </div>

          {/* Graded result */}
          {graded && (
            <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span className="text-[13px] font-bold text-emerald-300">
                  {t.asgpGrade} {item.submission?.score ?? 0} / {item.max_score}
                </span>
              </div>
              {item.submission?.feedback && (
                <p className="text-[12px] text-white/60 mt-1.5 leading-relaxed">
                  <span className="font-semibold text-white/75">{t.asgpFeedback}</span> {item.submission.feedback}
                </p>
              )}
            </div>
          )}

          {/* Submission status + actions */}
          <div className="mt-3 flex items-center gap-2.5 flex-wrap">
            {submitted && (
              <button type="button" onClick={() => item.submission?.file_path && download(item.submission.file_path)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="truncate max-w-[160px]">{item.submission?.file_name ?? t.asgpMyWork}</span>
              </button>
            )}

            {canSubmit && (
              <>
                <input ref={fileRef} type="file" className="hidden" onChange={onPick}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*" aria-label={t.asgpPickFile} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                  style={{ background: 'linear-gradient(135deg, #5B7FFF, #7C3AED)' }}>
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Upload className="w-3.5 h-3.5" aria-hidden="true" />}
                  {submitted ? t.fpReplace : t.asgpSubmitBtn}
                </button>
              </>
            )}

            {!canSubmit && !graded && locked && (
              <span className="inline-flex items-center gap-1.5 text-[11.5px] text-red-300/80">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" /> {t.asgpDeadlinePassed}
              </span>
            )}
          </div>

          {uploadErr && (
            <p role="alert" className="text-[11.5px] text-red-400 mt-2 inline-flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> {uploadErr}
            </p>
          )}

          {/* AI tekshiruv — matnli javobni AI baholaydi (haqiqiy AI) */}
          <div className="mt-3">
            {!aiOpen && !aiReview && (
              <button type="button" onClick={() => setAiOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                style={{ background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.30)', color: '#C4B5FD' }}>
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> {t.asgpAIHelp}
              </button>
            )}

            {aiOpen && !aiReview && (
              <div className="space-y-2">
                <textarea
                  value={answerText}
                  onChange={e => setAnswerText(e.target.value)}
                  rows={4}
                  placeholder={t.asgpAIPlaceholder}
                  className="w-full px-3.5 py-3 rounded-xl text-[13px] text-white/85 placeholder:text-white/30 outline-none resize-none leading-relaxed"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
                />
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => void runAICheck()} disabled={aiBusy || !answerText.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                    style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)' }}>
                    {aiBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />}
                    {aiBusy ? t.qrChecking : t.asgpAICheckBtn}
                  </button>
                  <button type="button" onClick={() => setAiOpen(false)}
                    className="px-3 py-2 rounded-xl text-[12px] font-semibold text-white/50 hover:text-white/80 transition-colors">
                    {t.fpCancel}
                  </button>
                </div>
                {aiErr && (
                  <p role="alert" className="text-[11.5px] text-red-400 inline-flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> {aiErr}
                  </p>
                )}
              </div>
            )}

            {aiReview && (
              <>
                <AIReviewCard review={aiReview} />
                <button type="button" onClick={() => { setAiReview(null); setAiOpen(true); setAnswerText('') }}
                  className="mt-2 text-[11.5px] font-semibold text-[#93BBFF] hover:opacity-80">
                  {t.asgpRecheck}
                </button>
              </>
            )}
          </div>

          {/* Attachments */}
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }} className="overflow-hidden">
                <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {attachments === null ? (
                    <p className="text-[12px] text-white/35">{t.notifLoading}</p>
                  ) : attachments.length === 0 ? (
                    <p className="text-[12px] text-white/35">{t.asgpNoMaterials}</p>
                  ) : attachments.map(a => (
                    <button key={a.id} type="button" onClick={() => download(a.file_path)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                      style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <Download className="w-3.5 h-3.5 text-[#93BBFF] flex-shrink-0" aria-hidden="true" />
                      <span className="flex-1 text-[12px] text-white/70 truncate">{a.file_name}</span>
                      <span className="text-[10.5px] text-white/30">{formatFileSize(a.file_size)}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.li>
  )
}
