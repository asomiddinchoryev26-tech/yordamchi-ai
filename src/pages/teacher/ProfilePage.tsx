import { useState, useEffect } from 'react'
import {
  Pencil, Lock, Eye, EyeOff,
  AlertCircle, CheckCircle, Phone, Calendar,
  BookOpen, Users, GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { profileService } from '@/services/profile.service'
import { supabase } from '@/lib/supabase'
import type { ProfileRow } from '@/types/database.types'

// ─── Yordamchi funksiyalar ────────────────────────────────────────────────────

const MONTHS = [
  'Yanvar','Fevral','Mart','Aprel','May','Iyun',
  'Iyul','Avgust','Sentabr','Oktyabr','Noyabr','Dekabr',
]
function fmtDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// ─── Tiplari ──────────────────────────────────────────────────────────────────

type SubjectRef = { id: string; name: string; color: string; icon: string }
type GroupRef   = {
  id:            string
  name:          string
  status:        'active' | 'inactive' | 'completed'
  capacity:      number
  enrolled_count: number
  subject:       { name: string; color: string; icon: string } | null
}

// ─── Komponent ────────────────────────────────────────────────────────────────

export default function TeacherProfilePage() {
  const auth = useAuth()

  const [profile,  setProfile]  = useState<ProfileRow | null>(null)
  const [subjects, setSubjects] = useState<SubjectRef[]>([])
  const [groups,   setGroups]   = useState<GroupRef[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  // ── Tahrirlash ────────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false)
  const [editForm,  setEditForm]  = useState({ full_name: '', phone: '', bio: '' })
  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved,     setSaved]     = useState(false)

  // ── Parol ─────────────────────────────────────────────────────────────────
  const [showPwSection, setShowPwSection] = useState(false)
  const [pwForm,   setPwForm]   = useState({ newPw: '', confirmPw: '' })
  const [showPw,   setShowPw]   = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError,  setPwError]  = useState<string | null>(null)
  const [pwSaved,  setPwSaved]  = useState(false)

  // ── Ma'lumot yuklash ──────────────────────────────────────────────────────
  useEffect(() => { void loadData() }, [])

  async function loadData() {
    if (!auth.user?.id) return
    setLoading(true)
    setError(null)

    try {
      const [profileData, subjectsRes, groupsRes] = await Promise.all([
        profileService.getById(auth.user.id),

        supabase
          .from('teacher_subjects')
          .select('subject:subjects(id, name, color, icon)')
          .eq('teacher_id', auth.user.id),

        supabase
          .from('groups')
          .select('id, name, status, capacity, subject:subjects(name, color, icon), student_groups(id)')
          .eq('teacher_id', auth.user.id)
          .order('status'),
      ])

      setProfile(profileData)
      setSubjects(
        (subjectsRes.data ?? []).map((s: any) => s.subject).filter(Boolean)
      )
      setGroups(
        (groupsRes.data ?? []).map((g: any) => ({
          id:             g.id,
          name:           g.name,
          status:         g.status,
          capacity:       g.capacity,
          enrolled_count: (g.student_groups ?? []).length,
          subject:        g.subject ?? null,
        }))
      )
    } catch {
      setError("Ma'lumotlarni yuklashda xatolik. Sahifani yangilang.")
    } finally {
      setLoading(false)
    }
  }

  // ── Tahrirlashni boshlash ─────────────────────────────────────────────────
  function startEdit() {
    if (!profile) return
    setEditForm({
      full_name: profile.full_name ?? '',
      phone:     profile.phone     ?? '',
      bio:       profile.bio       ?? '',
    })
    setSaveError(null)
    setIsEditing(true)
  }

  function cancelEdit() {
    setIsEditing(false)
    setSaveError(null)
  }

  // ── Profilni saqlash ──────────────────────────────────────────────────────
  async function handleSave() {
    if (!profile) return
    if (!editForm.full_name.trim()) {
      setSaveError('Ism va familiya majburiy')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await profileService.update(profile.id, {
        full_name: editForm.full_name.trim(),
        phone:     editForm.phone.trim() || null,
        bio:       editForm.bio.trim()   || null,
      })
      setProfile(updated)
      setIsEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Saqlashda xatolik')
    } finally {
      setSaving(false)
    }
  }

  // ── Parolni o'zgartirish ──────────────────────────────────────────────────
  async function handlePwChange() {
    if (pwForm.newPw.length < 8) {
      setPwError("Parol kamida 8 ta belgidan iborat bo'lishi kerak")
      return
    }
    if (pwForm.newPw !== pwForm.confirmPw) {
      setPwError('Parollar mos kelmadi')
      return
    }
    setPwSaving(true)
    setPwError(null)
    try {
      const { error: authErr } = await supabase.auth.updateUser({ password: pwForm.newPw })
      if (authErr) throw new Error(authErr.message)
      setPwForm({ newPw: '', confirmPw: '' })
      setShowPwSection(false)
      setPwSaved(true)
      setTimeout(() => setPwSaved(false), 4000)
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setPwSaving(false)
    }
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 pb-8">
        <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse space-y-4">
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-100 rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    )
  }

  const initial      = (profile?.full_name ?? auth.user?.name ?? 'O').charAt(0).toUpperCase()
  const activeGroups = groups.filter(g => g.status === 'active')
  const otherGroups  = groups.filter(g => g.status !== 'active')

  return (
    <div className="space-y-5 pb-8 max-w-3xl">

      {/* ── Sarlavha ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Shaxsiy ma'lumotlar va sozlamalar</p>
      </div>

      {/* ── Muvaffaqiyat xabari ── */}
      {saved && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">Profil muvaffaqiyatli yangilandi</p>
        </div>
      )}
      {pwSaved && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">Parol muvaffaqiyatli o'zgartirildi</p>
        </div>
      )}

      {/* ══ Profil kartochkasi ══ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-md">
            {initial}
          </div>

          {/* Ma'lumotlar */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                {/* Ism */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Ism va familiya <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Email (o'zgartirish mumkin emas) */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={profile?.email ?? ''}
                    disabled
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                  />
                </div>

                {/* Telefon */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="O'zingiz haqida qisqacha..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>

                {saveError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">{saveError}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                  >
                    {saving
                      ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : null
                    }
                    Saqlash
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Bekor
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">
                      {profile?.full_name ?? auth.user?.name ?? 'Ism kiritilmagan'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">{profile?.email ?? auth.user?.email}</p>
                    <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                      <GraduationCap className="w-3 h-3" />
                      O'qituvchi
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={startEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors flex-shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Tahrirlash
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {profile?.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      {profile.phone}
                    </div>
                  )}
                  {profile?.created_at && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      Qo'shilgan: {fmtDate(profile.created_at)}
                    </div>
                  )}
                  {profile?.bio && (
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed border-t border-gray-100 pt-3">
                      {profile.bio}
                    </p>
                  )}
                  {!profile?.phone && !profile?.bio && (
                    <p className="text-xs text-gray-400 italic mt-2">
                      Telefon va bio hali qo'shilmagan. <button type="button" onClick={startEdit} className="text-indigo-500 hover:underline">Tahrirlash</button>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ O'qitiladigan fanlar ══ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-indigo-600" />
          <h3 className="text-base font-bold text-gray-900">O'qitiladigan fanlar</h3>
          <span className="ml-auto text-xs text-gray-400">Admin tomonidan belgilanadi</span>
        </div>
        {subjects.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Hali fan biriktirilmagan</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subjects.map(s => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: s.color + '18', color: s.color, border: `1px solid ${s.color}30` }}
              >
                {s.icon} {s.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ══ Guruhlar ══ */}
      {groups.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-bold text-gray-900">Mening guruhlarim</h3>
            <span className="ml-auto text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {groups.length} ta guruh
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...activeGroups, ...otherGroups].map(g => (
              <div
                key={g.id}
                className={cn(
                  'rounded-xl border p-4',
                  g.status === 'active'
                    ? 'bg-indigo-50/50 border-indigo-100'
                    : 'bg-gray-50 border-gray-200',
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900 text-sm">{g.name}</p>
                  <span className={cn(
                    'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                    g.status === 'active'    ? 'bg-emerald-100 text-emerald-700' :
                    g.status === 'completed' ? 'bg-blue-100 text-blue-700'       :
                    'bg-gray-100 text-gray-500',
                  )}>
                    {g.status === 'active' ? 'Faol' : g.status === 'completed' ? 'Tugatilgan' : 'Nofaol'}
                  </span>
                </div>
                {g.subject && (
                  <p className="text-xs text-gray-500 mb-2">
                    {g.subject.icon} {g.subject.name}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  <span>
                    {g.enrolled_count} / {g.capacity} talaba
                  </span>
                  <div className="flex-1 ml-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full"
                      style={{ width: `${Math.min(100, (g.enrolled_count / g.capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ Xavfsizlik ══ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-bold text-gray-900">Xavfsizlik</h3>
          </div>
          {!showPwSection && (
            <button
              type="button"
              onClick={() => setShowPwSection(true)}
              className="text-sm text-indigo-600 font-medium hover:underline"
            >
              Parolni o'zgartirish
            </button>
          )}
        </div>

        {showPwSection && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Yangi parol</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pwForm.newPw}
                  onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                  placeholder="Kamida 8 ta belgi"
                  className="w-full px-3 py-2 pr-10 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Parolni tasdiqlash</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={pwForm.confirmPw}
                onChange={e => setPwForm(f => ({ ...f, confirmPw: e.target.value }))}
                placeholder="Parolni qayta kiriting"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>

            {pwError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{pwError}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handlePwChange}
                disabled={pwSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
              >
                {pwSaving
                  ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : null
                }
                Yangilash
              </button>
              <button
                type="button"
                onClick={() => { setShowPwSection(false); setPwError(null); setPwForm({ newPw: '', confirmPw: '' }) }}
                className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Bekor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
