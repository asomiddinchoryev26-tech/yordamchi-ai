import { useState, useEffect } from 'react'
import {
  Pencil, Lock, Eye, EyeOff,
  AlertCircle, CheckCircle, Phone, Calendar,
  Users, GraduationCap,
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

type EnrolledGroup = {
  enrolled_at: string
  group: {
    id:      string
    name:    string
    status:  'active' | 'inactive' | 'completed'
    subject: { name: string; color: string; icon: string } | null
  } | null
}

// ─── Komponent ────────────────────────────────────────────────────────────────

export default function StudentProfilePage() {
  const auth = useAuth()

  const [profile,  setProfile]  = useState<ProfileRow | null>(null)
  const [groups,   setGroups]   = useState<EnrolledGroup[]>([])
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
      const [profileData, groupsRes] = await Promise.all([
        profileService.getById(auth.user.id),

        supabase
          .from('student_groups')
          .select('enrolled_at, group:groups(id, name, status, subject:subjects(name, color, icon))')
          .eq('student_id', auth.user.id)
          .order('enrolled_at', { ascending: false }),
      ])

      setProfile(profileData)
      setGroups((groupsRes.data ?? []) as EnrolledGroup[])
    } catch {
      setError("Ma'lumotlarni yuklashda xatolik. Sahifani yangilang.")
    } finally {
      setLoading(false)
    }
  }

  // ── Tahrirlash ────────────────────────────────────────────────────────────
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

  // ── Parol ─────────────────────────────────────────────────────────────────
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
        <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
        <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
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

  const initial      = (profile?.full_name ?? auth.user?.name ?? 'T').charAt(0).toUpperCase()
  const activeGroups = groups.filter(g => g.group?.status === 'active')

  return (
    <div className="space-y-5 pb-8 max-w-3xl">

      {/* ── Sarlavha ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Shaxsiy ma'lumotlar va sozlamalar</p>
      </div>

      {/* ── Muvaffaqiyat xabarlari ── */}
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
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-md">
            {initial}
          </div>

          {/* Ma'lumotlar */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Ism va familiya <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={profile?.email ?? ''}
                    disabled
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="O'zingiz haqida qisqacha..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
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
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
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
                    <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      <GraduationCap className="w-3 h-3" />
                      Talaba
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={startEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors flex-shrink-0"
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
                      Telefon va bio hali qo'shilmagan.{' '}
                      <button type="button" onClick={startEdit} className="text-blue-500 hover:underline">
                        Tahrirlash
                      </button>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ Mening guruhlarim ══ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-blue-600" />
          <h3 className="text-base font-bold text-gray-900">Mening guruhlarim</h3>
          {groups.length > 0 && (
            <span className="ml-auto text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {activeGroups.length} faol
            </span>
          )}
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Hali hech qanday guruhga qo'shilmagan</p>
            <p className="text-xs text-gray-400 mt-1">Administrator guruhga qo'shsa, bu yerda ko'rinadi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((enrollment, idx) => {
              const g = enrollment.group
              if (!g) return null
              return (
                <div
                  key={`${g.id}-${idx}`}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl border',
                    g.status === 'active'
                      ? 'bg-blue-50/50 border-blue-100'
                      : 'bg-gray-50 border-gray-200',
                  )}
                >
                  {/* Guruh ikonkasi */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={g.subject
                      ? { backgroundColor: g.subject.color + '20', border: `2px solid ${g.subject.color}30` }
                      : { backgroundColor: '#f3f4f6', border: '2px solid #e5e7eb' }
                    }
                  >
                    {g.subject ? g.subject.icon : <Users className="w-5 h-5 text-gray-400" />}
                  </div>

                  {/* Guruh ma'lumoti */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
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
                      <p className="text-xs text-gray-500 mt-0.5">{g.subject.name}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Qo'shilgan: {fmtDate(enrollment.enrolled_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ══ Xavfsizlik ══ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-gray-900">Xavfsizlik</h3>
          </div>
          {!showPwSection && (
            <button
              type="button"
              onClick={() => setShowPwSection(true)}
              className="text-sm text-blue-600 font-medium hover:underline"
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
                  className="w-full px-3 py-2 pr-10 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
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
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
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
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
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
