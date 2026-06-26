import { useState, useEffect, useRef } from 'react'
import {
  Plus, Pencil, Trash2, X, AlertCircle,
  BookOpen, ChevronDown, Eye, EyeOff,
  Paperclip, Upload, Loader2, Video, Download, ExternalLink,
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
} from '@/services/attachment.service'
import type { AttachmentRow } from '@/services/attachment.service'
import { supabase } from '@/lib/supabase'
import type { LessonWithDetails } from '@/services/lesson.service'
import type { SubjectRow } from '@/services/subject.service'

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

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'

// ═════════════════════════════════════════════════════════════════════════════

export default function TeacherCoursesPage() {
  const auth     = useAuth()
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
      setPageError("Ma'lumotlarni yuklashda xatolik")
      setLoading(false)
    }
  }

  // ── Guruh o'zgarganda darslarni yuklash ──────────────────────────────────
  useEffect(() => {
    if (!groupId) return
    void loadLessons()
  }, [groupId])

  async function loadLessons() {
    setLoading(true)
    setPageError(null)
    try {
      setLessons(await lessonService.getByGroup(groupId))
    } catch {
      setPageError("Darslarni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }

  // ── Kengaytirganda biriktirmalarni yuklash ────────────────────────────────
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

  // ── Forma ─────────────────────────────────────────────────────────────────
  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
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
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSave() {
    if (!auth.user?.id || !groupId) return
    if (!form.title.trim()) {
      setFormError("Dars nomi majburiy")
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
        await lessonService.create(payload)
      }
      await loadLessons()
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Saqlashda xatolik')
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
      setPageError("O'chirishda xatolik")
    }
  }

  async function togglePublish(lesson: LessonWithDetails) {
    try {
      await lessonService.update(lesson.id, { is_published: !lesson.is_published })
      setLessons(prev => prev.map(l =>
        l.id === lesson.id ? { ...l, is_published: !l.is_published } : l
      ))
    } catch {
      setPageError("Holat o'zgartirishda xatolik")
    }
  }

  // ── Fayl yuklash ──────────────────────────────────────────────────────────
  async function handleFileUpload(lessonId: string, file: File) {
    if (!auth.user?.id) return
    setUploadingFor(lessonId)
    setUploadError(null)
    try {
      const att = await attachmentService.upload(lessonId, auth.user.id, file)
      setAttachments(prev => ({
        ...prev,
        [lessonId]: [...(prev[lessonId] ?? []), att],
      }))
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Yuklashda xatolik")
    } finally {
      setUploadingFor(null)
      if (fileRef.current) fileRef.current.value = ''
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
      setUploadError("Faylni o'chirishda xatolik")
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
      setUploadError("Yuklab olishda xatolik")
    } finally {
      setDownloadingId(null)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Darslar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Guruh darslarini boshqarish</p>
        </div>
        {!showForm && groupId && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Yangi dars
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
          <p className="text-sm text-gray-400">Sizga biriktirilgan guruh yo'q</p>
          <p className="text-xs text-gray-400 mt-1">Administrator guruh belgilashi kerak</p>
        </div>
      ) : (
        <div className="relative max-w-xs">
          <select
            value={groupId}
            onChange={e => { setGroupId(e.target.value); setShowForm(false) }}
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
              {editingId ? 'Darsni tahrirlash' : 'Yangi dars qo\'shish'}
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
                Dars nomi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Masalan: 1-dars: Kirish"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Sana */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Sana</label>
              <input
                type="date"
                value={form.lesson_date}
                onChange={e => setForm(f => ({ ...f, lesson_date: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Fan */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Fan</label>
              <select
                value={form.subject_id}
                onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">— Fan tanlanmagan —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>

            {/* Dars matni */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Dars matni / Konspekt
              </label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Dars mazmuni, topshiriqlar, izohlar..."
                rows={5}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Video URL */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" />
                Video havolasi (YouTube yoki Vimeo)
              </label>
              <input
                type="url"
                value={form.video_url}
                onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=... yoki https://vimeo.com/..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {form.video_url && getVideoEmbedUrl(form.video_url) && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                  <span>✓</span> Video havola tanildi
                </p>
              )}
              {form.video_url && !getVideoEmbedUrl(form.video_url) && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">
                  Faqat YouTube va Vimeo havolalari qo'llab-quvvatlanadi
                </p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
              className="w-4 h-4 rounded accent-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Darsni nashr qilish (talabalar ko'ra oladi)
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
              {editingId ? 'Saqlash' : "Qo'shish"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Bekor
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
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Darslar yo'q</h3>
          <p className="text-sm text-gray-400 mb-5">Ushbu guruh uchun hali dars qo'shilmagan</p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Birinchi darsni qo'shing
          </button>
        </div>
      )}

      {/* Darslar ro'yxati */}
      {!loading && lessons.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium px-1">{lessons.length} ta dars</p>
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
                        {lesson.is_published ? 'Nashr' : 'Qoralama'}
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
                      {lesson.content && <span className="italic">Matn mavjud</span>}
                    </div>
                  </div>

                  {/* Amallar */}
                  <div className="flex-shrink-0 flex gap-1.5" onClick={e => e.stopPropagation()}>
                    {deletingId === lesson.id ? (
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => void handleDelete(lesson.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg">
                          O'chir
                        </button>
                        <button type="button" onClick={() => setDeletingId(null)}
                          className="px-2.5 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg">
                          Bekor
                        </button>
                      </div>
                    ) : (
                      <>
                        <button type="button" onClick={() => void togglePublish(lesson)}
                          title="Nashr holati"
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                          {lesson.is_published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button type="button" onClick={() => openEdit(lesson)}
                          title="Tahrirlash"
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button type="button" onClick={() => setDeletingId(lesson.id)}
                          title="O'chirish"
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
                          Fayl biriktirmalar
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
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0]
                              if (f) void handleFileUpload(lesson.id, f)
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
                              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Yuklanmoqda...</>
                              : <><Upload className="w-3.5 h-3.5" /> Fayl qo'shish</>
                            }
                          </button>
                        </div>
                      </div>

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
                          Hali fayl qo'shilmagan
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {lessonAtts.map(att => (
                            <div
                              key={att.id}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700"
                            >
                              <span className="text-base flex-shrink-0">{getMimeIcon(att.mime_type)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {att.file_name}
                                </p>
                                {att.file_size && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {formatFileSize(att.file_size)}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  type="button"
                                  disabled={downloadingId === att.id}
                                  onClick={() => void handleDownload(att)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors disabled:opacity-50"
                                  title="Yuklab olish"
                                >
                                  {downloadingId === att.id
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Download className="w-3.5 h-3.5" />
                                  }
                                </button>
                                <button
                                  type="button"
                                  disabled={deletingAttId === att.id}
                                  onClick={() => void handleAttachmentDelete(lesson.id, att.id, att.file_path)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                  title="O'chirish"
                                >
                                  {deletingAttId === att.id
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Trash2 className="w-3.5 h-3.5" />
                                  }
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-[10px] text-gray-300 dark:text-gray-600">
                        PDF, rasm, Word, Excel, PowerPoint, TXT • Maks. 50 MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
