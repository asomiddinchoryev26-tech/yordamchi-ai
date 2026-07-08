import { useState, useEffect, useRef } from 'react'
import {
  Plus, Pencil, Trash2, X, AlertCircle,
  BookOpen, ChevronDown, Eye, EyeOff,
  Paperclip, Upload, Loader2, Video, Download, ExternalLink, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { lessonService } from '@/services/lesson.service'
import { subjectService } from '@/services/subject.service'
import {
  attachmentService,
  formatFileSize,
  getVideoEmbedUrl,
  getMimeIcon,
  isPreviewable,
  validateAttachment,
} from '@/services/attachment.service'
import type { AttachmentRow, AttachmentWithMeta } from '@/services/attachment.service'
import { FilePreviewModal } from '@/components/materials'
import { supabase } from '@/lib/supabase'
import type { LessonWithDetails } from '@/services/lesson.service'
import { LessonAnalyticsCard } from '@/components/teacher/TeacherFeatures'
import type { SubjectRow } from '@/services/subject.service'
import { useLanguage } from '@/contexts/LanguageContext'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

type GroupOption = { id: string; name: string }

const MONTHS = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']
function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

const EMPTY_FORM = {
  title:        '',
  content:      '',
  lesson_date:  '',
  subject_id:   '',
  video_url:    '',
  is_published: true,
}

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip'

// ═════════════════════════════════════════════════════════════════════════════

export default function TeacherCoursesPage() {
  const auth     = useAuth()
  const { t }    = useLanguage()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [groups,    setGroups]    = useState<GroupOption[]>([])
  const [groupId,   setGroupId]   = useState('')
  const [lessons,   setLessons]   = useState<LessonWithDetails[]>([])
  const [subjects,  setSubjects]  = useState<SubjectRow[]>([])
  const [loading,   setLoading]   = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  const [showForm,    setShowForm]    = useState(false)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [formError,   setFormError]   = useState<string | null>(null)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)
  const [expandedId,  setExpandedId]  = useState<string | null>(null)

  // Attachment state
  const [attachments,       setAttachments]       = useState<Record<string, AttachmentRow[]>>({})
  const [attachmentsLoaded, setAttachmentsLoaded] = useState<Set<string>>(new Set())
  const [uploadingFor,      setUploadingFor]      = useState<string | null>(null)
  const [uploadError,       setUploadError]       = useState<string | null>(null)
  const [deletingAttId,     setDeletingAttId]     = useState<string | null>(null)
  const [downloadingId,     setDownloadingId]     = useState<string | null>(null)

  // Materials: progress / preview / replace / pending (create mode)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadingName,  setUploadingName]  = useState<string | null>(null)
  const [replacingId,    setReplacingId]    = useState<string | null>(null)
  const [pendingFiles,   setPendingFiles]   = useState<File[]>([])
  const [dragActive,     setDragActive]     = useState(false)
  const [previewAtt,     setPreviewAtt]     = useState<AttachmentWithMeta | null>(null)
  const [previewLessonId, setPreviewLessonId] = useState<string | null>(null)
  const formFileRef    = useRef<HTMLInputElement>(null)
  const replaceRef     = useRef<HTMLInputElement>(null)
  const replaceTarget  = useRef<{ lessonId: string; att: AttachmentRow } | null>(null)

  // ── Guruhlarni yuklash ────────────────────────────────────────────────────
  useEffect(() => {
    if (!auth.user?.id) return
    void loadInit()
  }, [auth.user?.id])

  async function loadInit() {
    setLoading(true)
    try {
      const [groupsRes, subjectsData] = await Promise.all([
        supabase
          .from('groups')
          .select('id, name')
          .eq('teacher_id', auth.user!.id)
          .order('name'),
        subjectService.getAll(),
      ])
      const gList = (groupsRes.data ?? []) as GroupOption[]
      setGroups(gList)
      setSubjects(subjectsData)
      if (gList.length) {
        setGroupId(gList[0].id)
      } else {
        setLoading(false)
      }
    } catch {
      setPageError(t.mpLoadErr)
      setLoading(false)
    }
  }

  // ── Guruh o'zgarganda darslarni yuklash ──────────────────────────────────
  useEffect(() => {
    if (!groupId) return
    void loadLessons()
  }, [groupId])

  // Guruh tanlangach dars formasini (materiallar bilan) darhol ko'rsatamiz —
  // yuklash bo'limi tugma bosishni talab qilmaydi.
  useEffect(() => {
    if (groupId && !editingId) openCreate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  async function loadLessons() {
    setLoading(true)
    setPageError(null)
    try {
      setLessons(await lessonService.getByGroup(groupId))
    } catch {
      setPageError(t.mpLoadErr)
    } finally {
      setLoading(false)
    }
  }

  // ── Kengaytirganda (yoki formada) biriktirmalarni yuklash ─────────────────
  async function handleExpand(lessonId: string, loadOnly = false) {
    if (!loadOnly) setExpandedId(prev => prev === lessonId ? null : lessonId)
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

  // ── Forma ─────────────────────────────────────────────────────────────────
  function resetMaterialsState() {
    setPendingFiles([])
    setUploadError(null)
    setUploadProgress(null)
    setUploadingName(null)
    setReplacingId(null)
  }

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    resetMaterialsState()
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openEdit(lesson: LessonWithDetails) {
    setEditingId(lesson.id)
    setForm({
      title:        lesson.title,
      content:      lesson.content    ?? '',
      lesson_date:  lesson.lesson_date ?? '',
      subject_id:   lesson.subject_id  ?? '',
      video_url:    lesson.video_url   ?? '',
      is_published: lesson.is_published,
    })
    setFormError(null)
    resetMaterialsState()
    setShowForm(true)
    // Mavjud materiallarni forma uchun yuklaymiz
    if (!attachmentsLoaded.has(lesson.id)) void handleExpand(lesson.id, true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSave() {
    if (!auth.user?.id || !groupId) return
    if (!form.title.trim()) {
      setFormError(t.tcNameRequired)
      return
    }

    setFormLoading(true)
    setFormError(null)
    try {
      const payload = {
        title:        form.title.trim(),
        content:      form.content.trim()   || null,
        lesson_date:  form.lesson_date       || null,
        subject_id:   form.subject_id        || null,
        video_url:    form.video_url.trim()  || null,
        is_published: form.is_published,
        group_id:     groupId,
        teacher_id:   auth.user.id,
      }
      if (editingId) {
        await lessonService.update(editingId, payload)
      } else {
        const created = await lessonService.create(payload)
        // Yangi darsda tanlangan materiallarni endi yuklaymiz
        if (pendingFiles.length > 0) {
          await uploadFilesTo(created.id, pendingFiles)
          setPendingFiles([])
        }
      }
      await loadLessons()
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.tcSaveErr)
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await lessonService.delete(id)
      setLessons(prev => prev.filter(l => l.id !== id))
      setDeletingId(null)
    } catch {
      setPageError(t.aiDeleteErr)
    }
  }

  async function togglePublish(lesson: LessonWithDetails) {
    try {
      await lessonService.update(lesson.id, { is_published: !lesson.is_published })
      setLessons(prev => prev.map(l =>
        l.id === lesson.id ? { ...l, is_published: !l.is_published } : l
      ))
    } catch {
      setPageError(t.tcStatusErr)
    }
  }

  // ── Fayl yuklash (progress bilan, ko'p fayl) ──────────────────────────────
  async function uploadFilesTo(lessonId: string, files: File[]) {
    if (!auth.user?.id || files.length === 0) return
    setUploadError(null)
    for (const file of files) {
      const invalid = validateAttachment(file)
      if (invalid) { setUploadError(invalid); continue }
      setUploadingFor(lessonId)
      setUploadingName(file.name)
      setUploadProgress(0)
      try {
        const att = await attachmentService.uploadWithProgress(
          lessonId, auth.user.id, file, setUploadProgress,
        )
        setAttachments(prev => ({
          ...prev,
          [lessonId]: [...(prev[lessonId] ?? []), att],
        }))
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : t.tcUploadErr)
      }
    }
    setUploadingFor(null)
    setUploadingName(null)
    setUploadProgress(null)
  }

  // Formada fayl tanlanganda: tahrirlashda darhol yuklaydi, yaratishda navbatga qo'yadi
  function handleFormFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList)
    setUploadError(null)
    if (editingId) {
      void uploadFilesTo(editingId, files)
    } else {
      const valid: File[] = []
      for (const f of files) {
        const invalid = validateAttachment(f)
        if (invalid) { setUploadError(invalid); continue }
        valid.push(f)
      }
      setPendingFiles(prev => [...prev, ...valid])
    }
    if (formFileRef.current) formFileRef.current.value = ''
  }

  // Materiallar markazi — ichki preview modalini ochish (instant, keyin meta bilan boyitiladi)
  async function openPreview(lessonId: string, att: AttachmentRow) {
    setPreviewLessonId(lessonId)
    setPreviewAtt({ ...att, uploader_name: null })
    try {
      const metas = await attachmentService.getForLessonWithMeta(lessonId)
      setAttachments(prev => ({ ...prev, [lessonId]: metas }))
      const found = metas.find(m => m.id === att.id)
      if (found) setPreviewAtt(found)
    } catch { /* asosiy ko'rinish qoladi */ }
  }

  // Faylni almashtirish: yangisini yuklaydi, so'ng eskisini o'chiradi
  async function handleReplace(lessonId: string, att: AttachmentRow, file: File) {
    if (!auth.user?.id) return
    const invalid = validateAttachment(file)
    if (invalid) { setUploadError(invalid); return }
    setReplacingId(att.id)
    setUploadingName(file.name)
    setUploadProgress(0)
    setUploadError(null)
    try {
      const newAtt = await attachmentService.uploadWithProgress(
        lessonId, auth.user.id, file, setUploadProgress,
      )
      await attachmentService.delete(att.id, att.file_path)
      setAttachments(prev => ({
        ...prev,
        [lessonId]: (prev[lessonId] ?? []).map(a => a.id === att.id ? newAtt : a),
      }))
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t.tcReplaceErr)
    } finally {
      setReplacingId(null)
      setUploadingName(null)
      setUploadProgress(null)
    }
  }

  async function handleAttachmentDelete(lessonId: string, attId: string, filePath: string) {
    setDeletingAttId(attId)
    try {
      await attachmentService.delete(attId, filePath)
      setAttachments(prev => ({
        ...prev,
        [lessonId]: (prev[lessonId] ?? []).filter(a => a.id !== attId),
      }))
    } catch {
      setUploadError(t.tcFileDeleteErr)
    } finally {
      setDeletingAttId(null)
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
      setUploadError(t.tcDownloadErr)
    } finally {
      setDownloadingId(null)
    }
  }

  // Bitta biriktirma qatori — forma va kengaytirilgan ro'yxatda qayta ishlatiladi
  const iconBtn = 'w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-400 transition-colors disabled:opacity-50'
  function renderAttachmentRow(lessonId: string, att: AttachmentRow) {
    return (
      <div key={att.id}
        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
        <span className="text-base flex-shrink-0">{getMimeIcon(att.mime_type)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{att.file_name}</p>
          {att.file_size && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{formatFileSize(att.file_size)}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isPreviewable(att.mime_type, att.file_name) && (
            <button type="button" onClick={() => void openPreview(lessonId, att)}
              title={t.tdView} className={cn(iconBtn, 'hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20')}>
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
          <button type="button" disabled={downloadingId === att.id} onClick={() => void handleDownload(att)}
            title={t.achDownload} className={cn(iconBtn, 'hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20')}>
            {downloadingId === att.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          </button>
          <button type="button" disabled={replacingId === att.id}
            onClick={() => { replaceTarget.current = { lessonId, att }; setUploadError(null); replaceRef.current?.click() }}
            title={t.fpReplace} className={cn(iconBtn, 'hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20')}>
            {replacingId === att.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </button>
          <button type="button" disabled={deletingAttId === att.id} onClick={() => void handleAttachmentDelete(lessonId, att.id, att.file_path)}
            title={t.admDisable} className={cn(iconBtn, 'hover:text-red-500 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20')}>
            {deletingAttId === att.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    )
  }

  // Yuklash progress ko'rsatkichi — forma va kengaytirilgan ro'yxatda ishlatiladi
  function renderUploadProgress() {
    if (uploadProgress === null) return null
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <span className="truncate max-w-[70%]">{uploadingName}</span>
          <span className="tabular-nums font-semibold">{uploadProgress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
        </div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.tdLessons}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t.tcSubtitle}</p>
        </div>
        {!showForm && groupId && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t.tcNewLesson}
          </button>
        )}
      </div>

      {pageError && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {pageError}
          <button type="button" onClick={() => setPageError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Guruh tanlash */}
      {groups.length === 0 && !loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">{t.tcNoGroup}</p>
          <p className="text-xs text-gray-400 mt-1">{t.tcNoGroupHint}</p>
        </div>
      ) : (
        <div className="relative max-w-xs">
          <select
            value={groupId}
            onChange={e => setGroupId(e.target.value)}
            className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      )}

      {/* Forma */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {editingId ? t.tcEditLesson : t.tcAddLesson}
            </h2>
            <button type="button" onClick={() => setShowForm(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sarlavha */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                {t.tcLessonName} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={t.tcLessonNamePh}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Sana */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t.tcDate}</label>
              <input
                type="date"
                value={form.lesson_date}
                onChange={e => setForm(f => ({ ...f, lesson_date: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Fan */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t.tcSubject}</label>
              <select
                value={form.subject_id}
                onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">{t.tcNoSubject}</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>

            {/* Dars matni */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                {t.tcLessonContent}
              </label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder={t.tcContentPh}
                rows={5}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Video URL */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" />
                {t.tcVideoUrl}
              </label>
              <input
                type="url"
                value={form.video_url}
                onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
                placeholder={t.videoUrlPlaceholder}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {form.video_url && getVideoEmbedUrl(form.video_url) && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                  <span>✓</span> {t.tcVideoOk}
                </p>
              )}
              {form.video_url && !getVideoEmbedUrl(form.video_url) && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                  {t.tcVideoBad}
                </p>
              )}
            </div>
          </div>

          {/* ── Dars materiallari ─────────────────────────────────────────── */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5" />
                {t.tcMaterials}
              </label>
              {editingId && (attachments[editingId]?.length ?? 0) > 0 && (
                <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                  {attachments[editingId]?.length}
                </span>
              )}
            </div>

            {/* Dropzone / tanlash tugmasi (bir nechta fayl) */}
            <input
              ref={formFileRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={e => handleFormFiles(e.target.files)}
            />
            <div
              role="button"
              tabIndex={0}
              aria-label={t.tcDropAria}
              onClick={() => { if (uploadProgress === null) { setUploadError(null); formFileRef.current?.click() } }}
              onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && uploadProgress === null) { e.preventDefault(); formFileRef.current?.click() } }}
              onDragEnter={e => { e.preventDefault(); setDragActive(true) }}
              onDragOver={e => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={e => { e.preventDefault(); setDragActive(false) }}
              onDrop={e => {
                e.preventDefault()
                setDragActive(false)
                if (uploadProgress === null) handleFormFiles(e.dataTransfer.files)
              }}
              className={cn(
                'w-full flex flex-col items-center justify-center gap-1.5 py-6 rounded-xl border-2 border-dashed transition-colors cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40',
                dragActive
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 text-gray-500 dark:text-gray-400',
                uploadProgress !== null && 'opacity-60 pointer-events-none',
              )}
            >
              <Upload className={cn('w-5 h-5 transition-transform', dragActive && 'scale-110')} />
              <span className="text-sm font-medium">
                {dragActive ? t.tcDropActive : t.tcDropIdle}
              </span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 text-center px-3">
                {t.tcDropHint}
              </span>
            </div>

            {/* Progress */}
            {renderUploadProgress()}

            {/* Upload xatoligi */}
            {uploadError && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {uploadError}
              </p>
            )}

            {/* CREATE rejim: navbatdagi fayllar (dars saqlangach yuklanadi) */}
            {!editingId && pendingFiles.length > 0 && (
              <div className="space-y-1.5">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
                    <span className="text-base flex-shrink-0">{getMimeIcon(f.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{f.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{formatFileSize(f.size)} • {t.tcUploadAfterSave}</p>
                    </div>
                    <button type="button" onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                      title={t.tcRemove} className={cn(iconBtn, 'hover:text-red-500 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20')}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* EDIT rejim: mavjud materiallar */}
            {editingId && (
              !attachmentsLoaded.has(editingId)
                ? <div className="h-9 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                : (attachments[editingId]?.length ?? 0) === 0
                  ? <p className="text-xs text-gray-400 dark:text-gray-500 italic">{t.tcNoMaterialYet}</p>
                  : <div className="space-y-1.5">
                      {(attachments[editingId] ?? []).map(att => renderAttachmentRow(editingId, att))}
                    </div>
            )}
          </div>

          {/* Almashtirish uchun yashirin input (barcha qatorlar uchun umumiy) */}
          <input
            ref={replaceRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              const t = replaceTarget.current
              if (f && t) void handleReplace(t.lessonId, t.att, f)
              if (replaceRef.current) replaceRef.current.value = ''
              replaceTarget.current = null
            }}
          />

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
              className="w-4 h-4 rounded accent-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t.tcPublish}
            </span>
          </label>

          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{formError}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={formLoading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {formLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editingId ? t.admSave : t.tcAdd}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t.fpCancel}
            </button>
          </div>
        </div>
      )}

      {/* Yuklanmoqda */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 animate-pulse flex gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bo'sh holat */}
      {!loading && groupId && lessons.length === 0 && !showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{t.tcLessonsEmpty}</h3>
          <p className="text-sm text-gray-400 mb-5">{t.tcLessonsEmptyHint}</p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t.tcAddFirst}
          </button>
        </div>
      )}

      {/* Darslar ro'yxati */}
      {!loading && lessons.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium px-1">{lessons.length} {t.tdLessonWord}</p>
          {lessons.map((lesson) => {
            const isExpanded = expandedId === lesson.id
            const subj       = lesson.subject as any
            const embedUrl   = lesson.video_url ? getVideoEmbedUrl(lesson.video_url) : null
            const lessonAtts = attachments[lesson.id] ?? []
            const attLoaded  = attachmentsLoaded.has(lesson.id)

            return (
              <div
                key={lesson.id}
                className={cn(
                  'bg-white dark:bg-gray-800 rounded-xl border transition-all',
                  lesson.is_published
                    ? 'border-gray-100 dark:border-gray-700'
                    : 'border-dashed border-gray-200 dark:border-gray-600 opacity-75',
                )}
              >
                {/* Sarlavha qatori */}
                <div
                  className="flex items-start gap-4 p-4 cursor-pointer"
                  onClick={() => void handleExpand(lesson.id)}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={subj
                      ? { backgroundColor: subj.color + '20', border: `2px solid ${subj.color}30` }
                      : { backgroundColor: '#f3f4f6', border: '2px solid #e5e7eb' }
                    }
                  >
                    {subj ? subj.icon : <BookOpen className="w-4 h-4 text-gray-400" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{lesson.title}</span>
                      <span className={cn(
                        'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                        lesson.is_published
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
                      )}>
                        {lesson.is_published ? t.tcPublished : t.tcDraft}
                      </span>
                      {embedUrl && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-0.5">
                          <Video className="w-3 h-3" /> Video
                        </span>
                      )}
                      {attLoaded && lessonAtts.length > 0 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-0.5">
                          <Paperclip className="w-3 h-3" /> {lessonAtts.length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {lesson.lesson_date && <span>{fmtDate(lesson.lesson_date)}</span>}
                      {subj && <span style={{ color: subj.color }}>{subj.name}</span>}
                      {lesson.content && <span className="italic">{t.tcHasText}</span>}
                    </div>
                  </div>

                  {/* Amallar */}
                  <div className="flex-shrink-0 flex gap-1.5" onClick={e => e.stopPropagation()}>
                    {deletingId === lesson.id ? (
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => void handleDelete(lesson.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg">
                          {t.tcDeleteShort}
                        </button>
                        <button type="button" onClick={() => setDeletingId(null)}
                          className="px-2.5 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg">
                          {t.fpCancel}
                        </button>
                      </div>
                    ) : (
                      <>
                        <button type="button" onClick={() => void togglePublish(lesson)}
                          title={t.tcPublishState}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                          {lesson.is_published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button type="button" onClick={() => openEdit(lesson)}
                          title={t.tcEditT}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button type="button" onClick={() => setDeletingId(lesson.id)}
                          title={t.admDisable}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    <ChevronDown className={cn(
                      'w-4 h-4 text-gray-400 transition-transform self-center',
                      isExpanded && 'rotate-180',
                    )} />
                  </div>
                </div>

                {/* Kengaytirilgan kontent */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-4 pb-4 pt-3 space-y-4">

                    {/* Dars ko'rish analitikasi (FREE) — kim ko'rgan / ko'rmagan */}
                    <LessonAnalyticsCard lessonId={lesson.id} groupId={groupId} title={lesson.title} />

                    {/* Dars matni */}
                    {lesson.content && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {lesson.content}
                      </p>
                    )}

                    {/* Video embed */}
                    {embedUrl && (
                      <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                        <iframe
                          src={embedUrl}
                          title={lesson.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full"
                          style={{ aspectRatio: '16/9', display: 'block' }}
                        />
                      </div>
                    )}
                    {lesson.video_url && !embedUrl && (
                      <a
                        href={lesson.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {lesson.video_url}
                      </a>
                    )}

                    {/* Biriktirmalar bo'limi */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5" />
                          {t.tcAttachments}
                          {attLoaded && lessonAtts.length > 0 && (
                            <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                              {lessonAtts.length}
                            </span>
                          )}
                        </p>

                        {/* Fayl yuklash tugmasi */}
                        <div>
                          <input
                            ref={fileRef}
                            type="file"
                            accept={ACCEPT}
                            multiple
                            className="hidden"
                            onChange={e => {
                              void uploadFilesTo(lesson.id, Array.from(e.target.files ?? []))
                              if (fileRef.current) fileRef.current.value = ''
                            }}
                          />
                          <button
                            type="button"
                            disabled={uploadingFor === lesson.id}
                            onClick={() => {
                              setUploadError(null)
                              fileRef.current?.click()
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-60"
                          >
                            {uploadingFor === lesson.id
                              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t.tcUploading}</>
                              : <><Upload className="w-3.5 h-3.5" /> {t.tcAddFile}</>
                            }
                          </button>
                        </div>
                      </div>

                      {/* Yuklash progressi */}
                      {uploadingFor === lesson.id && renderUploadProgress()}

                      {/* Upload xatoligi */}
                      {uploadError && expandedId === lesson.id && (
                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {uploadError}
                        </p>
                      )}

                      {/* Biriktirmalar ro'yxati */}
                      {!attLoaded ? (
                        <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                      ) : lessonAtts.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                          {t.tcNoFilesYet}
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {lessonAtts.map(att => renderAttachmentRow(lesson.id, att))}
                        </div>
                      )}

                      <p className="text-[10px] text-gray-300 dark:text-gray-600">
                        {t.tcFileTypesHint}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Lesson Materials Center — teacher preview + manage */}
      {previewAtt && (
        <FilePreviewModal
          attachment={previewAtt}
          canManage
          onClose={() => { setPreviewAtt(null); setPreviewLessonId(null) }}
          onChanged={() => { if (previewLessonId && previewAtt) void openPreview(previewLessonId, previewAtt) }}
          onReplace={att => {
            setPreviewAtt(null)
            if (previewLessonId) { replaceTarget.current = { lessonId: previewLessonId, att }; replaceRef.current?.click() }
          }}
          onDelete={att => {
            if (previewLessonId) void handleAttachmentDelete(previewLessonId, att.id, att.file_path)
            setPreviewAtt(null)
          }}
        />
      )}
    </div>
  )
}
