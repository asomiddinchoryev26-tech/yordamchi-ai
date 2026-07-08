import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { subjectService } from '@/services/subject.service'
import type { SubjectRow } from '@/services/subject.service'

// ─── Konstantalar ─────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#f97316', '#6366f1',
] as const

const PRESET_ICONS = [
  '📐', '🧮', '⚗️', '🌍', '📖',
  '🔬', '🎨', '🎵', '💻', '📝',
  '🌱', '🔢', '🧬', '🏛️', '🧪',
] as const

// ─── Forma boshlang'ich holati ─────────────────────────────────────────────────

const EMPTY_FORM = { name: '', description: '', color: '#3b82f6', icon: '📚' }

// ═════════════════════════════════════════════════════════════════════════════

export default function SubjectsPage() {
  const { t } = useLanguage()
  const [subjects,   setSubjects]   = useState<SubjectRow[]>([])
  const [loading,    setLoading]    = useState(true)
  const [pageError,  setPageError]  = useState<string | null>(null)

  // Forma holati
  const [showForm,   setShowForm]   = useState(false)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [formLoading,setFormLoading]= useState(false)
  const [formError,  setFormError]  = useState<string | null>(null)

  // O'chirish tasdiqi
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Fanlarni yuklash ──────────────────────────────────────────────────────
  useEffect(() => {
    void loadSubjects()
  }, [])

  async function loadSubjects() {
    try {
      setLoading(true)
      const data = await subjectService.getAll()
      setSubjects(data)
    } catch {
      setPageError("Fanlarni yuklashda xatolik. Sahifani yangilang.")
    } finally {
      setLoading(false)
    }
  }

  // ── Formani ochish ────────────────────────────────────────────────────────
  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(subject: SubjectRow) {
    setEditingId(subject.id)
    setForm({
      name:        subject.name,
      description: subject.description ?? '',
      color:       subject.color,
      icon:        subject.icon,
    })
    setFormError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setFormError(null)
  }

  // ── Saqlash ───────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.name.trim()) {
      setFormError(t.sbNameRequired)
      return
    }
    setFormLoading(true)
    setFormError(null)
    try {
      if (editingId) {
        const updated = await subjectService.update(editingId, {
          name:        form.name.trim(),
          description: form.description.trim() || null,
          color:       form.color,
          icon:        form.icon,
        })
        setSubjects(prev => prev.map(s => s.id === editingId ? updated : s))
      } else {
        const created = await subjectService.create({
          name:        form.name.trim(),
          description: form.description.trim() || null,
          color:       form.color,
          icon:        form.icon,
        })
        setSubjects(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      }
      closeForm()
    } catch {
      setFormError("Saqlashda xatolik yuz berdi. Qayta urinib ko'ring.")
    } finally {
      setFormLoading(false)
    }
  }

  // ── O'chirish ─────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    try {
      await subjectService.delete(id)
      setSubjects(prev => prev.filter(s => s.id !== id))
      setDeletingId(null)
    } catch {
      setPageError("O'chirishda xatolik yuz berdi.")
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-6">

      {/* ── Sarlavha ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.sbTitle}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {subjects.length} {t.sbCount}
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t.sbNewSubject}
          </button>
        )}
      </div>

      {/* ── Sahifa xatosi ── */}
      {pageError && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{pageError}</p>
        </div>
      )}

      {/* ── Qo'shish / Tahrirlash formasi ── */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">
              {editingId ? t.sbEditSubject : t.sbAddSubject}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.sbNameLabel} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={t.sbNamePh}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Tavsif */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.sbDescription}
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder={t.sbDescPh}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Rang */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.sbColor}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color }))}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                        form.color === color ? 'border-gray-900 scale-110' : 'border-transparent',
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Ikonka */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.sbIcon}
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {PRESET_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, icon }))}
                      className={cn(
                        'w-9 h-9 flex items-center justify-center rounded-lg text-lg border-2 transition-all hover:scale-110',
                        form.icon === icon ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300',
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ko'rinish */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: form.color + '20', border: `2px solid ${form.color}40` }}
              >
                {form.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {form.name || t.sbNamePreview}
                </p>
                <p className="text-xs text-gray-400">
                  {form.description || t.sbDescPreview}
                </p>
              </div>
            </div>

            {/* Forma xatosi */}
            {formError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            {/* Tugmalar */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={formLoading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {formLoading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : editingId ? t.admSave : t.tcAdd
                }
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                {t.fpCancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Yuklash holati ── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* ── Fanlar yo'q ── */}
      {!loading && subjects.length === 0 && !pageError && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-3">📚</div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">{t.sbEmpty}</h3>
          <p className="text-sm text-gray-400 mb-5">
            {t.sbEmptyHint}
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t.sbAddFirst}
          </button>
        </div>
      )}

      {/* ── Fan kartalar ── */}
      {!loading && subjects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {subjects.map(subject => (
            <div
              key={subject.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow group"
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{ backgroundColor: subject.color + '20', border: `2px solid ${subject.color}40` }}
              >
                {subject.icon}
              </div>

              {/* Nom va tavsif */}
              <h3 className="font-bold text-gray-900 mb-1 truncate">
                {subject.name}
              </h3>
              <p className="text-sm text-gray-400 line-clamp-2 min-h-[2.5rem]">
                {subject.description ?? t.sbNoDesc}
              </p>

              {/* Rang indikatori */}
              <div className="flex items-center gap-2 mt-3 mb-4">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: subject.color }}
                />
                <span className="text-xs text-gray-400 font-mono">{subject.color}</span>
              </div>

              {/* Amallar */}
              {deletingId === subject.id ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleDelete(subject.id)}
                    className="flex-1 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    {t.admDisable}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(null)}
                    className="flex-1 py-1.5 text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {t.fpCancel}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(subject)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    {t.tcEditT}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(subject.id)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
