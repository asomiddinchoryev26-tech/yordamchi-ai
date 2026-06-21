import { useState, useEffect } from 'react'
import {
  Plus, Pencil, Trash2, X, AlertCircle,
  Users, Search, BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { studentService } from '@/services/student.service'
import { groupService   } from '@/services/group.service'
import type { Student, CreateStudentPayload, UpdateStudentPayload } from '@/services/student.service'
import type { GroupWithRelations } from '@/services/group.service'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'inactive'

const EMPTY_FORM = {
  full_name: '',
  email:     '',
  phone:     '',
  bio:       '',
  group_ids: [] as string[],
  status:    'active' as 'active' | 'inactive',
  password:  '',
}

// ─── Yordamchi komponentlar ───────────────────────────────────────────────────

function InitialAvatar({ name, email }: { name: string | null; email: string | null }) {
  const letter = (name ?? email ?? '?').charAt(0).toUpperCase()
  return (
    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
      {letter}
    </div>
  )
}

function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
  return (
    <span className={cn(
      'text-[11px] font-semibold px-2 py-0.5 rounded-full',
      status === 'active'
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-gray-100 text-gray-500',
    )}>
      {status === 'active' ? 'Faol' : 'Nofaol'}
    </span>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// StudentsPage
// ═════════════════════════════════════════════════════════════════════════════

export default function StudentsPage() {
  const [students,     setStudents]     = useState<Student[]>([])
  const [groups,       setGroups]       = useState<GroupWithRelations[]>([])
  const [loading,      setLoading]      = useState(true)
  const [pageError,    setPageError]    = useState<string | null>(null)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [groupFilter,  setGroupFilter]  = useState<string>('all')

  // Forma
  const [showForm,    setShowForm]    = useState(false)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [formError,   setFormError]   = useState<string | null>(null)

  // O'chirish
  const [deletingId,    setDeletingId]    = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ── Ma'lumot yuklash ──────────────────────────────────────────────────────
  useEffect(() => { void loadData() }, [])

  async function loadData() {
    try {
      setLoading(true)
      setPageError(null)
      const [studentData, groupData] = await Promise.all([
        studentService.getAll(),
        groupService.getAll(),
      ])
      setStudents(studentData)
      setGroups(groupData)
    } catch {
      setPageError("Ma'lumotlarni yuklashda xatolik. Sahifani yangilang.")
    } finally {
      setLoading(false)
    }
  }

  // ── Filtrlash ─────────────────────────────────────────────────────────────
  const activeGroups = groups.filter(g => g.status === 'active')

  const filtered = students.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || (t.full_name ?? '').toLowerCase().includes(q)
      || (t.email    ?? '').toLowerCase().includes(q)
      || (t.phone    ?? '').includes(q)
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    const matchGroup  = groupFilter  === 'all' || t.groups.some(g => g.id === groupFilter)
    return matchSearch && matchStatus && matchGroup
  })

  // ── Formani ochish ────────────────────────────────────────────────────────
  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openEdit(s: Student) {
    setEditingId(s.id)
    setForm({
      full_name: s.full_name ?? '',
      email:     s.email     ?? '',
      phone:     s.phone     ?? '',
      bio:       s.bio       ?? '',
      group_ids: s.groups.map(g => g.id),
      status:    s.status,
      password:  '',
    })
    setFormError(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setFormError(null)
  }

  // ── Guruh tanlash toggle ──────────────────────────────────────────────────
  function toggleGroup(id: string) {
    setForm(f => ({
      ...f,
      group_ids: f.group_ids.includes(id)
        ? f.group_ids.filter(g => g !== id)
        : [...f.group_ids, id],
    }))
  }

  // ── Saqlash ───────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.full_name.trim()) {
      setFormError("Ism va familiya majburiy")
      return
    }
    if (!editingId) {
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        setFormError("To'g'ri email manzil kiriting")
        return
      }
      if (form.password.length < 8) {
        setFormError("Parol kamida 8 ta belgidan iborat bo'lishi kerak")
        return
      }
    }

    setFormLoading(true)
    setFormError(null)

    try {
      if (editingId) {
        const payload: UpdateStudentPayload = {
          full_name: form.full_name.trim(),
          phone:     form.phone.trim() || null,
          bio:       form.bio.trim()   || null,
          status:    form.status,
          group_ids: form.group_ids,
        }
        await studentService.update(editingId, payload)
      } else {
        const payload: CreateStudentPayload = {
          full_name: form.full_name.trim(),
          email:     form.email.trim().toLowerCase(),
          password:  form.password,
          phone:     form.phone.trim() || undefined,
          bio:       form.bio.trim()   || undefined,
          group_ids: form.group_ids,
        }
        await studentService.create(payload)
      }
      await loadData()
      closeForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Xatolik yuz berdi")
    } finally {
      setFormLoading(false)
    }
  }

  // ── O'chirish ─────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeleteLoading(true)
    try {
      await studentService.delete(id)
      setStudents(prev => prev.filter(s => s.id !== id))
      setDeletingId(null)
    } catch {
      setPageError("O'chirishda xatolik yuz berdi.")
    } finally {
      setDeleteLoading(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  const activeCount   = students.filter(s => s.status === 'active').length
  const inactiveCount = students.filter(s => s.status === 'inactive').length

  return (
    <div className="space-y-5 pb-8">

      {/* ── Sarlavha ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Talabalar</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Yuklanmoqda...' : `${students.length} ta talaba`}
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Yangi talaba
          </button>
        )}
      </div>

      {/* ── Statistika ── */}
      {!loading && students.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 font-medium">Jami</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{students.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 font-medium">Faol</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 font-medium">Nofaol</p>
            <p className="text-2xl font-bold text-gray-400 mt-1">{inactiveCount}</p>
          </div>
        </div>
      )}

      {/* ── Xato ── */}
      {pageError && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{pageError}</p>
          <button type="button" onClick={() => setPageError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Forma ── */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">
              {editingId ? "Talabani tahrirlash" : "Yangi talaba qo'shish"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chap ustun — Shaxsiy ma'lumot */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ism va familiya <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Karimov Kamol"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email {!editingId && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="student@example.com"
                  disabled={!!editingId}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors',
                    editingId ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white',
                  )}
                />
                {editingId && (
                  <p className="text-xs text-gray-400 mt-1">Email tahrirlash uchun Supabase Dashboard'dan foydalaning</p>
                )}
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Vaqtinchalik parol <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Kamida 8 ta belgi"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Qo'shimcha ma'lumot
                </label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Talaba haqida qisqacha..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* O'ng ustun — Guruhlar va holat */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Guruhga qo'shish
                </label>
                {activeGroups.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center">
                    <BookOpen className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">
                      Faol guruh yo'q. Avval <strong>Guruhlar</strong> modulidan guruh yarating.
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl p-3 max-h-52 overflow-y-auto space-y-0.5">
                    {activeGroups.map(g => (
                      <label
                        key={g.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={form.group_ids.includes(g.id)}
                          onChange={() => toggleGroup(g.id)}
                          className="w-4 h-4 rounded accent-blue-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{g.name}</p>
                          {g.subject && (
                            <p className="text-xs text-gray-400 truncate">
                              {g.subject.icon} {g.subject.name}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Holat
                  </label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as typeof f.status }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  >
                    <option value="active">Faol</option>
                    <option value="inactive">Nofaol</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Forma xatosi */}
          {formError && (
            <div className="flex items-start gap-2 mt-4 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 whitespace-pre-line">{formError}</p>
            </div>
          )}

          {/* Tugmalar */}
          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={handleSave}
              disabled={formLoading}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {formLoading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : editingId ? 'Saqlash' : "Qo'shish"
              }
            </button>
            <button
              type="button"
              onClick={closeForm}
              disabled={formLoading}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              Bekor
            </button>
          </div>
        </div>
      )}

      {/* ── Qidiruv va filtr ── */}
      {!loading && students.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ism, email yoki telefon..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Holat filtri */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'inactive'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-2 text-xs font-semibold rounded-xl border transition-colors',
                  statusFilter === s
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300',
                )}
              >
                {s === 'all' ? 'Barchasi' : s === 'active' ? 'Faol' : 'Nofaol'}
              </button>
            ))}

            {/* Guruh filtri */}
            {activeGroups.length > 0 && (
              <select
                value={groupFilter}
                onChange={e => setGroupFilter(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                <option value="all">Barcha guruhlar</option>
                {activeGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* ── Yuklanmoqda ── */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-gray-200 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="h-6 bg-gray-100 rounded-full w-14" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Bo'sh holat ── */}
      {!loading && students.length === 0 && !pageError && (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Talabalar yo'q
          </h3>
          <p className="text-sm text-gray-400 mb-5">
            Hali hech qanday talaba qo'shilmagan
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Birinchi talabani qo'shing
          </button>
        </div>
      )}

      {/* ── Natija yo'q ── */}
      {!loading && students.length > 0 && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-sm text-gray-500">
            {search
              ? <>"<span className="font-medium">{search}</span>" bo'yicha talaba topilmadi</>
              : "Tanlangan filtr bo'yicha natija yo'q"
            }
          </p>
        </div>
      )}

      {/* ── Talabalar ro'yxati ── */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(student => (
            <div
              key={student.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <InitialAvatar name={student.full_name} email={student.email} />

                {/* Asosiy ma'lumot */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 truncate">
                      {student.full_name ?? 'Ism kiritilmagan'}
                    </span>
                    <StatusBadge status={student.status} />
                  </div>

                  <p className="text-sm text-gray-500 mt-0.5 truncate">
                    {student.email}
                  </p>

                  {student.phone && (
                    <p className="text-xs text-gray-400 mt-0.5">{student.phone}</p>
                  )}

                  {/* Guruhlar */}
                  {student.groups.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {student.groups.map(g => (
                        <span
                          key={g.id}
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
                            g.status === 'active'
                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                              : 'bg-gray-100 text-gray-500',
                          )}
                        >
                          {g.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1.5 italic">Guruhga qo'shilmagan</p>
                  )}

                  {student.bio && (
                    <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">{student.bio}</p>
                  )}
                </div>

                {/* Amallar */}
                <div className="flex-shrink-0">
                  {deletingId === student.id ? (
                    <div className="flex flex-col gap-2 items-end">
                      <p className="text-xs text-red-600 font-medium">O'chirilsinmi?</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleDelete(student.id)}
                          disabled={deleteLoading}
                          className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1"
                        >
                          {deleteLoading
                            ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : "Ha, o'chir"
                          }
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          className="px-3 py-1.5 text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          Bekor
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(student)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Tahrirlash"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(student.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
