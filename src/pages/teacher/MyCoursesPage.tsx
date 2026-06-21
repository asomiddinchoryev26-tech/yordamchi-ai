import { useState, useEffect } from 'react'
import {
  Plus, Pencil, Trash2, X, AlertCircle,
  BookOpen, ChevronDown, Eye, EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { lessonService } from '@/services/lesson.service'
import { subjectService } from '@/services/subject.service'
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
  is_published: true,
}

// ═════════════════════════════════════════════════════════════════════════════

export default function TeacherCoursesPage() {
  const auth = useAuth()

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
      content:      lesson.content      ?? '',
      lesson_date:  lesson.lesson_date  ?? '',
      subject_id:   lesson.subject_id   ?? '',
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
        content:      form.content.trim() || null,
        lesson_date:  form.lesson_date    || null,
        subject_id:   form.subject_id     || null,
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

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Darslar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Guruh darslarini boshqarish</p>
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
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {pageError}
          <button type="button" onClick={() => setPageError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Guruh tanlash */}
      {groups.length === 0 && !loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Sizga biriktirilgan guruh yo'q</p>
          <p className="text-xs text-gray-400 mt-1">Administrator guruh belgilashi kerak</p>
        </div>
      ) : (
        <div className="relative max-w-xs">
          <select
            value={groupId}
            onChange={e => { setGroupId(e.target.value); setShowForm(false) }}
            className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      )}

      {/* Forma */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              {editingId ? 'Darsni tahrirlash' : 'Yangi dars qo\'shish'}
            </h2>
            <button type="button" onClick={() => setShowForm(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Dars nomi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Masalan: 1-dars: Kirish"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Sana</label>
              <input
                type="date"
                value={form.lesson_date}
                onChange={e => setForm(f => ({ ...f, lesson_date: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Fan</label>
              <select
                value={form.subject_id}
                onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">— Fan tanlanmagan —</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Dars matni / Konspekt</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Dars mazmuni, topshiriqlar, izohlar..."
                rows={5}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
              className="w-4 h-4 rounded accent-indigo-600"
            />
            <span className="text-sm text-gray-700">Darsni nashr qilish (talabalar ko'ra oladi)</span>
          </label>

          {formError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{formError}</p>
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
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
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
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bo'sh holat */}
      {!loading && groupId && lessons.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">Darslar yo'q</h3>
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
          <p className="text-xs text-gray-400 font-medium px-1">{lessons.length} ta dars</p>
          {lessons.map((lesson) => {
            const isExpanded = expandedId === lesson.id
            const subj = lesson.subject as any
            return (
              <div
                key={lesson.id}
                className={cn(
                  'bg-white rounded-xl border transition-all',
                  lesson.is_published ? 'border-gray-100' : 'border-dashed border-gray-200 opacity-75',
                )}
              >
                <div
                  className="flex items-start gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : lesson.id)}
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
                      <span className="font-semibold text-gray-900 truncate">{lesson.title}</span>
                      <span className={cn(
                        'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                        lesson.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500',
                      )}>
                        {lesson.is_published ? 'Nashr' : 'Qoralama'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {lesson.lesson_date && <span>{fmtDate(lesson.lesson_date)}</span>}
                      {subj && <span style={{ color: subj.color }}>{subj.name}</span>}
                      {lesson.content && <span className="italic">Matn mavjud</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex gap-1.5" onClick={e => e.stopPropagation()}>
                    {deletingId === lesson.id ? (
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => void handleDelete(lesson.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg">O'chir</button>
                        <button type="button" onClick={() => setDeletingId(null)}
                          className="px-2.5 py-1.5 text-xs font-semibold border border-gray-200 text-gray-600 rounded-lg">Bekor</button>
                      </div>
                    ) : (
                      <>
                        <button type="button" onClick={() => togglePublish(lesson)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Nashr holati">
                          {lesson.is_published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button type="button" onClick={() => openEdit(lesson)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Tahrirlash">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button type="button" onClick={() => setDeletingId(lesson.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="O'chirish">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Kengaytirilgan: dars matni */}
                {isExpanded && lesson.content && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {lesson.content}
                    </p>
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
