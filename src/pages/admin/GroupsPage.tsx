import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, AlertCircle, Users, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'
import { groupService } from '@/services/group.service'
import { subjectService } from '@/services/subject.service'
import type { GroupWithRelations, GroupInsert } from '@/services/group.service'
import type { SubjectRow } from '@/services/subject.service'

// ─── Konstantalar ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: keyof Translations; className: string }> = {
  active:    { label: 'admActive',   className: 'bg-emerald-100 text-emerald-700' },
  inactive:  { label: 'tdInactive',  className: 'bg-gray-100 text-gray-600'      },
  completed: { label: 'tdCompleted', className: 'bg-blue-100 text-blue-700'    },
}

const EMPTY_FORM = {
  name:        '',
  subject_id:  '',
  teacher_id:  '',
  capacity:    20,
  status:      'active' as 'active' | 'inactive' | 'completed',
  start_date:  '',
  end_date:    '',
  description: '',
}

// ═════════════════════════════════════════════════════════════════════════════

export default function GroupsPage() {
  const { t } = useLanguage()
  const [groups,     setGroups]     = useState<GroupWithRelations[]>([])
  const [subjects,   setSubjects]   = useState<SubjectRow[]>([])
  const [loading,    setLoading]    = useState(true)
  const [pageError,  setPageError]  = useState<string | null>(null)
  const [search,     setSearch]     = useState('')

  // Forma holati
  const [showForm,    setShowForm]    = useState(false)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [formError,   setFormError]   = useState<string | null>(null)

  // O'chirish tasdiqi
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Yuklash ───────────────────────────────────────────────────────────────
  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [groupData, subjectData] = await Promise.all([
        groupService.getAll(),
        subjectService.getAll(),
      ])
      setGroups(groupData)
      setSubjects(subjectData)
    } catch {
      setPageError("Ma'lumotlarni yuklashda xatolik. Sahifani yangilang.")
    } finally {
      setLoading(false)
    }
  }

  // ── Qidiruv ───────────────────────────────────────────────────────────────
  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.subject?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (g.teacher?.full_name ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  // ── Formani ochish ────────────────────────────────────────────────────────
  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(group: GroupWithRelations) {
    setEditingId(group.id)
    setForm({
      name:        group.name,
      subject_id:  group.subject_id ?? '',
      teacher_id:  group.teacher_id ?? '',
      capacity:    group.capacity,
      status:      group.status,
      start_date:  group.start_date ?? '',
      end_date:    group.end_date ?? '',
      description: group.description ?? '',
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
      setFormError(t.agNameRequired)
      return
    }
    if (form.capacity < 1 || form.capacity > 200) {
      setFormError("Sig'im 1 dan 200 gacha bo'lishi kerak")
      return
    }

    setFormLoading(true)
    setFormError(null)

    const payload: GroupInsert = {
      name:        form.name.trim(),
      subject_id:  form.subject_id  || null,
      teacher_id:  form.teacher_id  || null,
      capacity:    form.capacity,
      status:      form.status,
      start_date:  form.start_date  || null,
      end_date:    form.end_date    || null,
      description: form.description.trim() || null,
    }

    try {
      if (editingId) {
        await groupService.update(editingId, payload)
        await loadData()
      } else {
        await groupService.create(payload)
        await loadData()
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
      await groupService.delete(id)
      setGroups(prev => prev.filter(g => g.id !== id))
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
          <h1 className="text-2xl font-bold text-gray-900">{t.tdGroups}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {groups.length} {t.tdGroupWord}
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t.agNewGroup}
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

      {/* ── Forma ── */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">
              {editingId ? t.agEditGroup : t.agAddGroup}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.agGroupName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={t.agNamePh}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Fan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.tcSubject}
                </label>
                <select
                  value={form.subject_id}
                  onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                >
                  <option value="">{t.tcNoSubject}</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sig'im */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.agCapacity}
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={form.capacity}
                  onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Holat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.tdColStatus}
                </label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as typeof form.status }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                >
                  <option value="active">{t.admActive}</option>
                  <option value="inactive">{t.tdInactive}</option>
                  <option value="completed">{t.tdCompleted}</option>
                </select>
              </div>

              {/* Boshlanish sanasi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.agStartDate}
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                />
              </div>

              {/* Tugash sanasi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.agEndDate}
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            {/* Tavsif */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t.sbDescription}
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder={t.agDescPh}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors resize-none"
              />
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
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
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

      {/* ── Qidiruv ── */}
      {!loading && groups.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.agSearchPh}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
          />
        </div>
      )}

      {/* ── Yuklash holati ── */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="h-6 bg-gray-100 rounded-full w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Bo'sh holat ── */}
      {!loading && groups.length === 0 && !pageError && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-violet-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">{t.agEmpty}</h3>
          <p className="text-sm text-gray-400 mb-5">
            {t.agEmptyHint}
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t.agAddFirst}
          </button>
        </div>
      )}

      {/* ── Qidiruv natijasi yo'q ── */}
      {!loading && groups.length > 0 && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-sm text-gray-500">
            "<span className="font-medium">{search}</span>" {t.agSearchNotFoundSuffix}
          </p>
        </div>
      )}

      {/* ── Guruhlar ro'yxati ── */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(group => {
            const status = STATUS_LABELS[group.status] ?? STATUS_LABELS.inactive
            const subject = group.subject
            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Fan ikonkasi yoki standart icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={subject
                      ? { backgroundColor: subject.color + '20', border: `2px solid ${subject.color}40` }
                      : { backgroundColor: '#f3f4f6', border: '2px solid #e5e7eb' }
                    }
                  >
                    {subject ? subject.icon : <Users className="w-5 h-5 text-gray-400" />}
                  </div>

                  {/* Asosiy ma'lumot */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{group.name}</h3>
                      <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', status.className)}>
                        {t[status.label]}
                      </span>
                    </div>

                    {/* Fan va o'qituvchi */}
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                      {subject && (
                        <span className="flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: subject.color }}
                          />
                          {subject.name}
                        </span>
                      )}
                      {group.teacher && (
                        <span className="text-gray-400">
                          {group.teacher.full_name ?? group.teacher.email ?? t.tdTeacher}
                        </span>
                      )}
                    </div>

                    {/* Sana va sig'im */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {group.capacity} {t.agSeats}
                      </span>
                      {group.start_date && (
                        <span>
                          {new Date(group.start_date).toLocaleDateString('uz-UZ')}
                          {group.end_date && (
                            <> — {new Date(group.end_date).toLocaleDateString('uz-UZ')}</>
                          )}
                        </span>
                      )}
                    </div>

                    {group.description && (
                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">{group.description}</p>
                    )}
                  </div>

                  {/* Amallar */}
                  <div className="flex-shrink-0">
                    {deletingId === group.id ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleDelete(group.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          {t.admDisable}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          {t.fpCancel}
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(group)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                          title={t.tcEditT}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(group.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title={t.admDisable}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
