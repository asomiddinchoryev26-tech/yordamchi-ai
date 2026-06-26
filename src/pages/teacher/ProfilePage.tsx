/**
 * Teacher ProfilePage — uses the global ProfileContext.
 * Single source of truth: no duplicate state, no duplicate avatar logic.
 */

import { useState } from 'react'
import {
  User, FileText, Shield, Globe, Sun,
  CheckCircle, AlertCircle, Loader2, Eye, EyeOff,
  Camera, Trash2, Upload, BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/hooks/useProfile'
import { useLanguage } from '@/contexts/LanguageContext'
import { UserAvatar } from '@/components/identity/UserAvatar'
import { AvatarUploader } from '@/components/identity/AvatarUploader'

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls = cn(
  'w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-all duration-150',
  'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
  'text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600',
  'focus:border-indigo-400 dark:focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800/50',
)

export default function TeacherProfilePage() {
  const { profile, isLoading, isSaving, error, updateProfile, uploadAvatar, deleteAvatar, clearError } = useProfile()
  const { language, setLanguage } = useLanguage()

  const [form, setForm] = useState({ fullName: profile?.fullName ?? '', phone: profile?.phone ?? '', bio: profile?.bio ?? '' })
  const [formDirty, setFormDirty] = useState(false)
  const [saved, setSaved]         = useState(false)
  const [showUploader, setShowUploader] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [showPw,   setShowPw]     = useState(false)
  const [pwForm,   setPwForm]     = useState({ newPw: '', confirmPw: '' })
  const [showMask, setShowMask]   = useState(false)
  const [pwSaving, setPwSaving]   = useState(false)
  const [pwError,  setPwError]    = useState<string | null>(null)
  const [pwSaved,  setPwSaved]    = useState(false)

  function setField(k: keyof typeof form, v: string) { setForm(f => ({ ...f, [k]: v })); setFormDirty(true) }

  if (profile && form.fullName === '' && !formDirty) {
    setForm({ fullName: profile.fullName, phone: profile.phone ?? '', bio: profile.bio ?? '' })
  }

  async function handleSave() {
    if (!form.fullName.trim()) return
    clearError()
    await updateProfile({ fullName: form.fullName.trim(), phone: form.phone.trim() || undefined, bio: form.bio.trim() || undefined })
    setFormDirty(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  async function handleAvatarUpload(blob: Blob) { await uploadAvatar(blob); setShowUploader(false) }
  async function handleDeleteAvatar() { await deleteAvatar(); setDeleteConfirm(false) }

  async function handlePwChange() {
    if (pwForm.newPw.length < 8) { setPwError("Parol kamida 8 ta belgidan iborat bo'lishi kerak"); return }
    if (pwForm.newPw !== pwForm.confirmPw) { setPwError('Parollar mos kelmadi'); return }
    setPwSaving(true); setPwError(null)
    try {
      const { error: e } = await supabase.auth.updateUser({ password: pwForm.newPw })
      if (e) throw e
      setPwForm({ newPw: '', confirmPw: '' }); setShowPw(false); setPwSaved(true)
      setTimeout(() => setPwSaved(false), 4000)
    } catch (e) { setPwError(e instanceof Error ? e.message : 'Xatolik') }
    finally { setPwSaving(false) }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 pb-8 max-w-2xl">
        {[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800/60 animate-pulse" style={{ opacity: 1 - i * 0.2 }} />)}
      </div>
    )
  }

  const ROLE_LABELS: Record<string, string> = { student: 'Talaba', teacher: "O'qituvchi", admin: 'Administrator' }

  return (
    <div className="space-y-5 pb-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Profil</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Shaxsiy ma'lumotlar va hisob sozlamalari</p>
      </div>

      {saved   && <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"><CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" /><p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Profil muvaffaqiyatli yangilandi</p></div>}
      {pwSaved && <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"><CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" /><p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Parol muvaffaqiyatli o'zgartirildi</p></div>}
      {error   && <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"><AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" /><p className="text-sm text-red-700 dark:text-red-300">{error}</p></div>}

      {/* Avatar */}
      <Section icon={Camera} title="Avatar">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <UserAvatar name={profile?.fullName ?? ''} avatarUrl={profile?.avatarUrl} size="xl" />
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">{profile?.fullName ?? '—'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{profile?.avatarUrl ? 'Yuklangan rasm ishlatilmoqda' : 'Ismi harflari ko\'rsatilmoqda'}</p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <button type="button" onClick={() => setShowUploader(v => !v)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm">
                <Upload className="w-3.5 h-3.5" />
                {profile?.avatarUrl ? 'Almashtirish' : 'Rasm yuklash'}
              </button>
              {profile?.avatarUrl && (
                <button type="button" onClick={() => setDeleteConfirm(true)} disabled={isSaving}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" />O'chirish
                </button>
              )}
            </div>
            {deleteConfirm && (
              <div className="mt-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-2.5">Avatar o'chirilsinmi?</p>
                <div className="flex gap-2">
                  <button type="button" onClick={handleDeleteAvatar} disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Ha, o'chirish
                  </button>
                  <button type="button" onClick={() => setDeleteConfirm(false)}
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Bekor
                  </button>
                </div>
              </div>
            )}
            {showUploader && profile && (
              <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <AvatarUploader profile={profile} onUpload={handleAvatarUpload} onDelete={profile.avatarUrl ? handleDeleteAvatar : undefined} isUploading={isSaving} />
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Personal info */}
      <Section icon={User} title="Shaxsiy ma'lumotlar">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="To'liq ism *">
              <input type="text" value={form.fullName} onChange={e => setField('fullName', e.target.value)} className={inputCls} placeholder="Ism Familiya" />
            </Field>
            <Field label="Email (o'zgartirib bo'lmaydi)">
              <input type="email" value={profile?.email ?? ''} disabled className={inputCls} />
            </Field>
          </div>
          <Field label="Telefon raqami">
            <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+998 90 123 45 67" className={inputCls} />
          </Field>
          <Field label="Bio">
            <textarea value={form.bio} onChange={e => setField('bio', e.target.value)} placeholder="O'zingiz haqida qisqacha..." rows={3} maxLength={300} className={cn(inputCls, 'resize-none')} />
            <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1 text-right">{form.bio.length}/300</p>
          </Field>
          <button type="button" onClick={handleSave} disabled={isSaving || !formDirty || !form.fullName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            O'zgarishlarni saqlash
          </button>
        </div>
      </Section>

      {/* Account info */}
      <Section icon={BookOpen} title="Hisob ma'lumotlari">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Rol',      value: ROLE_LABELS[profile?.role ?? 'teacher'] ?? profile?.role ?? '—' },
            { label: 'Holat',    value: profile?.status === 'active' ? 'Faol' : 'Bloklangan' },
            { label: 'Email',    value: profile?.email ?? '—' },
            { label: 'Ro\'yxat', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('uz-UZ') : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wide mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Language */}
      <Section icon={Globe} title="Til">
        <div className="flex flex-wrap gap-2">
          {([['uz', "O'zbek 🇺🇿"], ['ru', 'Русский 🇷🇺'], ['en', 'English 🇬🇧']] as const).map(([code, label]) => (
            <button key={code} type="button" onClick={() => setLanguage(code)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150',
                language === code
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700',
              )}>
              {label}
            </button>
          ))}
        </div>
      </Section>

      {/* Bio display */}
      {profile?.bio && (
        <Section icon={FileText} title="Haqida">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{profile.bio}</p>
        </Section>
      )}

      {/* Security */}
      <Section icon={Shield} title="Xavfsizlik">
        {!showPw ? (
          <button type="button" onClick={() => setShowPw(true)} className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            <Shield className="w-4 h-4" /> Parolni o'zgartirish
          </button>
        ) : (
          <div className="space-y-3">
            <Field label="Yangi parol">
              <div className="relative">
                <input type={showMask ? 'text' : 'password'} value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} placeholder="Kamida 8 ta belgi" className={cn(inputCls, 'pr-10')} />
                <button type="button" onClick={() => setShowMask(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showMask ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <Field label="Parolni tasdiqlash">
              <input type={showMask ? 'text' : 'password'} value={pwForm.confirmPw} onChange={e => setPwForm(f => ({ ...f, confirmPw: e.target.value }))} placeholder="Parolni qayta kiriting" className={inputCls} />
            </Field>
            {pwError && <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"><AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" /><p className="text-sm text-red-700 dark:text-red-300">{pwError}</p></div>}
            <div className="flex gap-2">
              <button type="button" onClick={handlePwChange} disabled={pwSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
                {pwSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Yangilash
              </button>
              <button type="button" onClick={() => { setShowPw(false); setPwError(null); setPwForm({ newPw: '', confirmPw: '' }) }}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Bekor
              </button>
            </div>
          </div>
        )}
      </Section>

      <Section icon={Sun} title="Ko'rinish">
        <p className="text-sm text-gray-500 dark:text-gray-400">Mavzu sozlamasi Navbar'dagi 🌙/☀️ tugmasi orqali o'zgartiriladi.</p>
      </Section>
    </div>
  )
}
