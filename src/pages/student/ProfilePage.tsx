import { useState } from 'react'
import {
  User, FileText, Shield, Globe, Sun,
  CheckCircle, AlertCircle, Loader2, Eye, EyeOff,
  Camera, Trash2, Upload, GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/hooks/useProfile'
import { useLanguage } from '@/contexts/LanguageContext'
import { UserAvatar } from '@/components/identity/UserAvatar'
import { AvatarUploader } from '@/components/identity/AvatarUploader'

// ─── Reusable Section Card ────────────────────────────────────────────────────

function Section({
  icon: Icon, title, children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <Icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls = cn(
  'w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-all duration-150',
  'border-gray-200 dark:border-gray-700',
  'bg-white dark:bg-gray-800',
  'text-gray-900 dark:text-gray-100',
  'placeholder:text-gray-400 dark:placeholder:text-gray-600',
  'focus:border-violet-400 dark:focus:border-violet-600 focus:ring-2 focus:ring-violet-500/10',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800/50',
)

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentProfilePage() {
  const { profile, isLoading, isSaving, error, updateProfile, uploadAvatar, deleteAvatar, clearError } = useProfile()
  const { language, setLanguage, t } = useLanguage()

  // Form state synced from profile
  const [form, setForm] = useState({
    fullName: profile?.fullName ?? '',
    phone:    profile?.phone    ?? '',
    bio:      profile?.bio      ?? '',
  })
  const [formDirty, setFormDirty] = useState(false)
  const [saved,     setSaved]     = useState(false)

  // Avatar section
  const [showUploader, setShowUploader] = useState(false)
  const [avatarConfirm, setAvatarConfirm] = useState<'delete' | null>(null)

  // Password section
  const [showPw,   setShowPw]   = useState(false)
  const [pwForm,   setPwForm]   = useState({ newPw: '', confirmPw: '' })
  const [showMask, setShowMask] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError,  setPwError]  = useState<string | null>(null)
  const [pwSaved,  setPwSaved]  = useState(false)

  function setField(k: keyof typeof form, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    setFormDirty(true)
  }

  // Sync form if profile loads for first time
  if (profile && form.fullName === '' && !formDirty) {
    setForm({ fullName: profile.fullName, phone: profile.phone ?? '', bio: profile.bio ?? '' })
  }

  async function handleSave() {
    if (!form.fullName.trim()) return
    clearError()
    await updateProfile({
      fullName: form.fullName.trim(),
      phone:    form.phone.trim()  || undefined,
      bio:      form.bio.trim()    || undefined,
    })
    setFormDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleAvatarUpload(blob: Blob) {
    await uploadAvatar(blob)
    setShowUploader(false)
  }

  async function handleDeleteAvatar() {
    await deleteAvatar()
    setAvatarConfirm(null)
  }

  async function handlePwChange() {
    if (pwForm.newPw.length < 8) { setPwError("Parol kamida 8 ta belgidan iborat bo'lishi kerak"); return }
    if (pwForm.newPw !== pwForm.confirmPw) { setPwError(t.pfPwMismatch); return }
    setPwSaving(true); setPwError(null)
    try {
      const { error: e } = await supabase.auth.updateUser({ password: pwForm.newPw })
      if (e) throw e
      setPwForm({ newPw: '', confirmPw: '' })
      setShowPw(false); setPwSaved(true)
      setTimeout(() => setPwSaved(false), 4000)
    } catch (e) {
      setPwError(e instanceof Error ? e.message : t.pfError)
    } finally { setPwSaving(false) }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4 pb-8 max-w-2xl">
        {[1,2,3].map(i => (
          <div key={i} className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800/60 animate-pulse" style={{ opacity: 1 - i * 0.2 }} />
        ))}
      </div>
    )
  }

  const ROLE_LABELS: Record<string, string> = {
    student: t.adStudent, teacher: t.tdTeacher, admin: t.pfAdministrator,
  }

  return (
    <div className="space-y-5 pb-10 max-w-2xl">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{t.pfTitle}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t.pfSubtitle}</p>
      </div>

      {/* Global feedback */}
      {saved && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">{t.pfUpdated}</p>
        </div>
      )}
      {pwSaved && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">{t.pfPwChanged}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* ── Avatar ─────────────────────────────────────────────────────────── */}
      <Section icon={Camera} title="Avatar">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Preview */}
          <div className="flex-shrink-0">
            <UserAvatar
              name={profile?.fullName ?? t.adUserWord}
              avatarUrl={profile?.avatarUrl}
              size="xl"
            />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
              {profile?.fullName ?? '—'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {profile?.avatarUrl ? t.pfAvatarUsing : t.pfAvatarInitials}
            </p>

            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => setShowUploader(v => !v)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                {profile?.avatarUrl ? t.fpReplace : t.pfUploadPhoto}
              </button>
              {profile?.avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarConfirm('delete')}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t.admDisable}
                </button>
              )}
            </div>

            {/* Delete confirm */}
            {avatarConfirm === 'delete' && (
              <div className="mt-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-2.5">{t.pfAvatarDeleteQ}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {t.pfYesDelete}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarConfirm(null)}
                    className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {t.fpCancel}
                  </button>
                </div>
              </div>
            )}

            {/* Uploader */}
            {showUploader && profile && (
              <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <AvatarUploader
                  profile={profile}
                  onUpload={handleAvatarUpload}
                  onDelete={profile.avatarUrl ? handleDeleteAvatar : undefined}
                  isUploading={isSaving}
                />
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* ── Personal Information ────────────────────────────────────────────── */}
      <Section icon={User} title={t.pfPersonalInfo}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t.pfFullName}>
              <input
                type="text"
                value={form.fullName}
                onChange={e => setField('fullName', e.target.value)}
                className={inputCls}
                placeholder={t.pfFullNamePh}
              />
            </Field>
            <Field label={t.pfEmailNoChange}>
              <input
                type="email"
                value={profile?.email ?? ''}
                disabled
                className={inputCls}
              />
            </Field>
          </div>

          <Field label={t.pfPhone}>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setField('phone', e.target.value)}
              placeholder="+998 90 123 45 67"
              className={inputCls}
            />
          </Field>

          <Field label="Bio">
            <textarea
              value={form.bio}
              onChange={e => setField('bio', e.target.value)}
              placeholder={t.pfBioPh}
              rows={3}
              maxLength={300}
              className={cn(inputCls, 'resize-none leading-relaxed')}
            />
            <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1 text-right">
              {form.bio.length}/300
            </p>
          </Field>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !formDirty || !form.fullName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {t.pfSaveChanges}
          </button>
        </div>
      </Section>

      {/* ── Account info (read-only) ────────────────────────────────────────── */}
      <Section icon={GraduationCap} title={t.pfAccountInfo}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: t.adRole,       value: ROLE_LABELS[profile?.role ?? 'student'] ?? profile?.role ?? '—' },
            { label: t.tdColStatus,  value: profile?.status === 'active' ? t.admActive : t.pfBlocked },
            { label: 'Email',        value: profile?.email ?? '—' },
            { label: t.pfRegistered, value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('uz-UZ') : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-wide mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{value}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Language ────────────────────────────────────────────────────────── */}
      <Section icon={Globe} title={t.pfLanguage}>
        <div className="flex flex-wrap gap-2">
          {([['uz', "O'zbek 🇺🇿"], ['ru', 'Русский 🇷🇺'], ['en', 'English 🇬🇧']] as const).map(([code, label]) => (
            <button
              key={code}
              type="button"
              onClick={() => setLanguage(code)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150',
                language === code
                  ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/20'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-violet-300 dark:hover:border-violet-700',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      {/* ── About / Bio display ──────────────────────────────────────────────── */}
      {profile?.bio && (
        <Section icon={FileText} title={t.pfAbout}>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{profile.bio}</p>
        </Section>
      )}

      {/* ── Security ────────────────────────────────────────────────────────── */}
      <Section icon={Shield} title={t.pfSecurity}>
        {!showPw ? (
          <button
            type="button"
            onClick={() => setShowPw(true)}
            className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400 font-semibold hover:underline"
          >
            <Shield className="w-4 h-4" />
            {t.pfChangePw}
          </button>
        ) : (
          <div className="space-y-3">
            <Field label={t.pfNewPw}>
              <div className="relative">
                <input
                  type={showMask ? 'text' : 'password'}
                  value={pwForm.newPw}
                  onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                  placeholder={t.pfPwMin}
                  className={cn(inputCls, 'pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowMask(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showMask ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <Field label={t.pfConfirmPw}>
              <input
                type={showMask ? 'text' : 'password'}
                value={pwForm.confirmPw}
                onChange={e => setPwForm(f => ({ ...f, confirmPw: e.target.value }))}
                placeholder={t.pfPwRepeat}
                className={inputCls}
              />
            </Field>

            {pwError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{pwError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePwChange}
                disabled={pwSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
              >
                {pwSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {t.tfRefresh}
              </button>
              <button
                type="button"
                onClick={() => { setShowPw(false); setPwError(null); setPwForm({ newPw: '', confirmPw: '' }) }}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t.fpCancel}
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* ── Appearance placeholder ───────────────────────────────────────────── */}
      <Section icon={Sun} title={t.pfAppearance}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.pfThemeNote}
        </p>
      </Section>

    </div>
  )
}
