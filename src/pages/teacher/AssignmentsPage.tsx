/**
 * pages/teacher/AssignmentsPage.tsx
 * Homework & Assignment module — teacher view.
 * Create / edit / delete / publish assignments, attach files, assign to groups,
 * review submissions and grade them.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, Plus, Pencil, Trash2, Send, Users, Calendar, Star,
  Paperclip, Download, X, Loader2, AlertTriangle, RefreshCw, CheckCircle2,
  FileText, Upload,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/lib/logger'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'
import { groupService } from '@/services/group.service'
import { subjectService } from '@/services/subject.service'
import {
  assignmentService, formatFileSize,
  type TeacherAssignment, type CreateAssignmentPayload,
} from '@/services/assignment.service'
import type {
  GroupRow, SubjectRow, AssignmentAttachmentRow, AssignmentSubmissionRow,
} from '@/types/database.types'

const GLASS = {
  background:           'rgba(11,15,28,0.82)',
  backdropFilter:       'blur(28px) saturate(200%)',
  WebkitBackdropFilter: 'blur(28px) saturate(200%)',
  border:               '1px solid rgba(255,255,255,0.08)',
} as const
const RADIUS = '22px'

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function fromLocalInput(v: string): string | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}
function fmtDate(iso: string | null, t: Translations): string {
  if (!iso) return t.lessNoDeadline
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—'
    : new Intl.DateTimeFormat('uz', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d)
}

export default function TeacherAssignmentsPage() {
  const auth = useAuth()
  const { t } = useLanguage()
  const teacherId = auth.user?.id ?? ''

  const [items,    setItems]    = useState<TeacherAssignment[]>([])
  const [groups,   setGroups]   = useState<GroupRow[]>([])
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)

  const [editing,  setEditing]  = useState<TeacherAssignment | 'new' | null>(null)
  const [grading,  setGrading]  = useState<TeacherAssignment | null>(null)

  const load = useCallback(async () => {
    if (!teacherId) return
    setLoading(true)
    setError(false)
    try {
      const [asg, grp, subs] = await Promise.all([
        assignmentService.getTeacherAssignments(teacherId),
        groupService.getAll(),
        subjectService.getAll(),
      ])
      setItems(asg)
      setGroups(grp.filter(g => g.teacher_id === teacherId))
      setSubjects(subs)
    } catch (e) {
      logger.error('[TeacherAssignments] load error:', e)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [teacherId])

  useEffect(() => { void load() }, [load])

  const onDelete = async (id: string) => {
    if (!window.confirm(t.tapConfirmDelete)) return
    try { await assignmentService.remove(id); await load() }
    catch (e) { logger.error(e) }
  }

  const onPublish = async (a: TeacherAssignment) => {
    try { await assignmentService.update(a.id, { status: 'published' }); await load() }
    catch (e) { logger.error(e) }
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(91,127,255,0.15)', border: '1px solid rgba(91,127,255,0.25)' }}>
            <ClipboardList className="w-5 h-5 text-[#93BBFF]" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-[22px] font-black text-white tracking-tight">{t.achAssignments}</h1>
            <p className="text-[13px] text-white/45">{t.tapSubtitle}</p>
          </div>
        </div>
        <button type="button" onClick={() => setEditing('new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          style={{ background: 'linear-gradient(135deg, #5B7FFF, #7C3AED)', boxShadow: '0 6px 20px rgba(91,127,255,0.35)' }}>
          <Plus className="w-4 h-4" aria-hidden="true" /> {t.tapNew}
        </button>
      </header>

      {/* Body */}
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-24 rounded-[22px] animate-pulse"
              style={{ background: 'rgba(255,255,255,0.04)', animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="flex flex-col items-center text-center gap-3 py-12"
          style={{ ...GLASS, borderRadius: RADIUS, borderColor: 'rgba(239,68,68,0.22)' }}>
          <AlertTriangle className="w-8 h-8 text-red-400" aria-hidden="true" />
          <p className="text-[14px] font-bold text-white/85">Yuklab bo&apos;lmadi</p>
          <button type="button" onClick={() => void load()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #5B7FFF, #7C3AED)' }}>
            <RefreshCw className="w-4 h-4" aria-hidden="true" /> Qayta urinish
          </button>
        </div>
      ) : items.length === 0 ? (
        <div role="status" className="flex flex-col items-center text-center gap-2 py-14"
          style={{ ...GLASS, borderRadius: RADIUS }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <ClipboardList className="w-6 h-6 text-white/30" aria-hidden="true" />
          </div>
          <p className="text-[14px] font-bold text-white/55">{t.tapEmpty}</p>
          <button type="button" onClick={() => setEditing('new')}
            className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #5B7FFF, #7C3AED)' }}>
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Birinchisini yarating
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map(a => (
            <li key={a.id} style={{ ...GLASS, borderRadius: RADIUS }} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[15px] font-bold text-white/90">{a.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={a.status === 'published'
                        ? { background: 'rgba(34,197,94,0.15)', color: '#86efac', border: '1px solid rgba(34,197,94,0.25)' }
                        : { background: 'rgba(245,158,11,0.14)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.22)' }}>
                      {a.status === 'published' ? t.ttPublished : t.tcDraft}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap mt-2 text-[11.5px] text-white/45">
                    {a.subject && <span>{a.subject.icon} {a.subject.name}</span>}
                    <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" aria-hidden="true" /> {fmtDate(a.deadline, t)}</span>
                    <span className="inline-flex items-center gap-1.5"><Star className="w-3.5 h-3.5" aria-hidden="true" /> {a.max_score} ball</span>
                    <span className="inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5" aria-hidden="true" /> {a.group_ids.length} guruh</span>
                    <span className="inline-flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" aria-hidden="true" /> {a.submission_count} {t.tapSubmittedCount}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {a.status === 'draft' && (
                    <button type="button" onClick={() => void onPublish(a)} title={t.ttPublishAction}
                      className="p-2 rounded-lg text-emerald-300 hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
                      <Send className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                  <button type="button" onClick={() => setGrading(a)} title={t.tapViewWorks}
                    className="p-2 rounded-lg text-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => setEditing(a)} title={t.tcEditT}
                    className="p-2 rounded-lg text-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => void onDelete(a.id)} title={t.admDisable}
                    className="p-2 rounded-lg text-red-300 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {editing && (
          <AssignmentFormModal
            teacherId={teacherId}
            groups={groups}
            subjects={subjects}
            initial={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={async () => { setEditing(null); await load() }}
          />
        )}
        {grading && (
          <SubmissionsModal
            assignment={grading}
            graderId={teacherId}
            onClose={() => setGrading(null)}
            onGraded={load}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Create / Edit modal ──────────────────────────────────────────────────────

function AssignmentFormModal({ teacherId, groups, subjects, initial, onClose, onSaved }: {
  teacherId: string
  groups:    GroupRow[]
  subjects:  SubjectRow[]
  initial:   TeacherAssignment | null
  onClose:   () => void
  onSaved:   () => Promise<void>
}) {
  const { t } = useLanguage()
  const [title, setTitle]         = useState(initial?.title ?? '')
  const [description, setDesc]    = useState(initial?.description ?? '')
  const [subjectId, setSubjectId] = useState(initial?.subject_id ?? '')
  const [deadline, setDeadline]   = useState(toLocalInput(initial?.deadline ?? null))
  const [maxScore, setMaxScore]   = useState(initial?.max_score ?? 100)
  const [groupIds, setGroupIds]   = useState<string[]>(initial?.group_ids ?? [])
  const [attachments, setAttach]  = useState<AssignmentAttachmentRow[]>([])
  const [saving, setSaving]       = useState(false)
  const [err, setErr]             = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initial) void assignmentService.getAttachments(initial.id).then(setAttach).catch(() => {})
  }, [initial])

  const toggleGroup = (id: string) =>
    setGroupIds(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])

  const save = async (status: 'draft' | 'published') => {
    setErr(null)
    setSaving(true)
    try {
      const payload: CreateAssignmentPayload = {
        title, description: description || null, subject_id: subjectId || null,
        deadline: fromLocalInput(deadline), max_score: Number(maxScore) || 100,
        status, group_ids: groupIds,
      }
      if (initial) await assignmentService.update(initial.id, payload)
      else         await assignmentService.create(teacherId, payload)
      await onSaved()
    } catch (e) {
      logger.error('[TeacherAssignments] save failed:', e)
      setErr(t.tcSaveErr)
    } finally {
      setSaving(false)
    }
  }

  const onAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !initial) return
    setErr(null)
    try {
      const row = await assignmentService.uploadAttachment(initial.id, teacherId, file)
      setAttach(prev => [...prev, row])
    } catch (e2) { setErr(e2 instanceof Error ? e2.message : t.tcUploadErr) }
  }

  const removeAttach = async (a: AssignmentAttachmentRow) => {
    try { await assignmentService.deleteAttachment(a.id, a.file_path); setAttach(prev => prev.filter(x => x.id !== a.id)) }
    catch { /* ignore */ }
  }

  return (
    <ModalShell title={initial ? t.tapEdit : t.tapNew} onClose={onClose}>
      <div className="space-y-3.5">
        <Field label={t.tapTitleField}>
          <input value={title} onChange={e => setTitle(e.target.value)} maxLength={200}
            className="modal-input" placeholder={t.tapTitlePh} />
        </Field>

        <Field label={t.ttDesc}>
          <textarea value={description} onChange={e => setDesc(e.target.value)} rows={3}
            className="modal-input resize-none" placeholder={t.tapDescPh} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={t.tcSubject}>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="modal-input">
              <option value="">{t.tapNotSelected}</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label={t.tapMaxScore}>
            <input type="number" min={1} max={1000} value={maxScore}
              onChange={e => setMaxScore(Number(e.target.value))} className="modal-input" />
          </Field>
        </div>

        <Field label={t.tapDeadline}>
          <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="modal-input" />
        </Field>

        <Field label={t.tapGroupsField}>
          {groups.length === 0 ? (
            <p className="text-[12px] text-white/40">{t.tapNoGroups}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {groups.map(g => (
                <label key={g.id} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer text-[12.5px] text-white/70"
                  style={{ background: groupIds.includes(g.id) ? 'rgba(91,127,255,0.14)' : 'rgba(255,255,255,0.04)', border: `1px solid ${groupIds.includes(g.id) ? 'rgba(91,127,255,0.35)' : 'rgba(255,255,255,0.07)'}` }}>
                  <input type="checkbox" checked={groupIds.includes(g.id)} onChange={() => toggleGroup(g.id)} className="accent-[#5B7FFF]" />
                  <span className="truncate">{g.name}</span>
                </label>
              ))}
            </div>
          )}
        </Field>

        {/* Attachments (only after the assignment exists) */}
        <Field label={t.tapAttachedFiles}>
          {!initial ? (
            <p className="text-[11.5px] text-white/35">{t.tapAttachAfterSave}</p>
          ) : (
            <div className="space-y-2">
              {attachments.map(a => (
                <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <Paperclip className="w-3.5 h-3.5 text-white/40" aria-hidden="true" />
                  <span className="flex-1 text-[12px] text-white/70 truncate">{a.file_name}</span>
                  <span className="text-[10.5px] text-white/30">{formatFileSize(a.file_size)}</span>
                  <button type="button" onClick={() => void removeAttach(a)} className="p-1 text-red-300 hover:bg-red-500/10 rounded" aria-label={t.admDisable}>
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
              <input ref={fileRef} type="file" className="hidden" onChange={onAttach}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*" aria-label={t.tapAttachFile} />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold text-white/70 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <Upload className="w-3.5 h-3.5" aria-hidden="true" /> {t.tcAddFile}
              </button>
            </div>
          )}
        </Field>

        {err && <p role="alert" className="text-[12px] text-red-400 inline-flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> {err}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white/60 hover:text-white/90">
            {t.aiCancel}
          </button>
          <button type="button" disabled={saving} onClick={() => void save('draft')}
            className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-white/80 disabled:opacity-60"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : t.tcDraft}
          </button>
          <button type="button" disabled={saving} onClick={() => void save('published')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #5B7FFF, #7C3AED)' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <><Send className="w-4 h-4" aria-hidden="true" /> {t.ttPublishAction}</>}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

// ─── Submissions / grading modal ──────────────────────────────────────────────

function SubmissionsModal({ assignment, graderId, onClose, onGraded }: {
  assignment: TeacherAssignment; graderId: string; onClose: () => void; onGraded: () => Promise<void>
}) {
  const { t } = useLanguage()
  const [subs, setSubs]   = useState<AssignmentSubmissionRow[] | null>(null)
  const [busyId, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    try { setSubs(await assignmentService.getSubmissions(assignment.id)) }
    catch { setSubs([]) }
  }, [assignment.id])
  useEffect(() => { void load() }, [load])

  const download = async (path: string | null) => {
    if (!path) return
    try { window.open(await assignmentService.getSignedUrl(path), '_blank', 'noopener') } catch { /* ignore */ }
  }

  const grade = async (s: AssignmentSubmissionRow, score: number, feedback: string) => {
    setBusy(s.id)
    try {
      await assignmentService.gradeSubmission(s.id, graderId, score, feedback || null, assignment.max_score)
      await load(); await onGraded()
    } catch (e) { logger.error(e) } finally { setBusy(null) }
  }

  return (
    <ModalShell title={`Ishlar — ${assignment.title}`} onClose={onClose}>
      {subs === null ? (
        <p className="text-[13px] text-white/40 py-6 text-center">Yuklanmoqda…</p>
      ) : subs.length === 0 ? (
        <p role="status" className="text-[13px] text-white/40 py-8 text-center">{t.ttNoSubmissions}</p>
      ) : (
        <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {subs.map(s => (
            <SubmissionRow key={s.id} sub={s} maxScore={assignment.max_score}
              busy={busyId === s.id} onDownload={() => download(s.file_path)} onGrade={grade} />
          ))}
        </ul>
      )}
    </ModalShell>
  )
}

function SubmissionRow({ sub, maxScore, busy, onDownload, onGrade }: {
  sub: AssignmentSubmissionRow; maxScore: number; busy: boolean
  onDownload: () => void
  onGrade: (s: AssignmentSubmissionRow, score: number, feedback: string) => Promise<void>
}) {
  const { t } = useLanguage()
  const [score, setScore]       = useState<number>(sub.score ?? 0)
  const [feedback, setFeedback] = useState(sub.feedback ?? '')

  return (
    <li className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" onClick={onDownload} disabled={!sub.file_path}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white/75 disabled:opacity-40"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="truncate max-w-[180px]">{sub.file_name ?? t.tcNoFilesYet}</span>
        </button>
        {sub.status === 'graded' && (
          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#86efac' }}>
            {t.sdGraded}
          </span>
        )}
      </div>
      <div className="flex items-end gap-2 mt-2.5 flex-wrap">
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] text-white/40">{t.ttScore} (0–{maxScore})</span>
          <input type="number" min={0} max={maxScore} value={score} onChange={e => setScore(Number(e.target.value))}
            className="w-20 px-2.5 py-1.5 rounded-lg text-[13px] text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }} />
        </label>
        <input value={feedback} onChange={e => setFeedback(e.target.value)} placeholder={t.taNotePh}
          className="flex-1 min-w-[140px] px-3 py-1.5 rounded-lg text-[12.5px] text-white outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }} />
        <button type="button" disabled={busy} onClick={() => void onGrade(sub, score, feedback)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-bold text-white disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #5B7FFF, #7C3AED)' }}>
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
          {t.admSave}
        </button>
      </div>
    </li>
  )
}

// ─── Small shared bits ────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11.5px] font-semibold text-white/55 mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const { t } = useLanguage()
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      role="dialog" aria-modal="true" aria-label={title}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.div
        initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6"
        style={{ ...GLASS, borderRadius: RADIUS }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-black text-white">{title}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-white/50 hover:bg-white/10" aria-label={t.fpClose}>
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </motion.div>
      <style>{`
        .modal-input {
          width: 100%; padding: 9px 12px; border-radius: 12px; font-size: 13px;
          color: #fff; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12); outline: none;
        }
        .modal-input:focus { border-color: rgba(91,127,255,0.5); }
      `}</style>
    </motion.div>
  )
}
