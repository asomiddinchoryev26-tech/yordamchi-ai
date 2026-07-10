import { useState, useEffect } from 'react'
import { Save, AlertCircle, CheckCircle, Settings, Lock, Loader2 } from 'lucide-react'
import { settingsService } from '@/services/settings.service'
import type { SettingsMap } from '@/services/settings.service'
import { supabase } from '@/lib/supabase'
import { TelegramLinkCard } from '@/components/common/TelegramLinkCard'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

// ── Parolni o'zgartirish (o'z-o'ziga xizmat — har qanday admin, super-admin ham) ──
function ChangePasswordCard() {
  const { t } = useLanguage()
  const [newPw,   setNewPw]   = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy,    setBusy]    = useState(false)
  const [err,     setErr]     = useState<string | null>(null)
  const [done,    setDone]    = useState(false)

  async function submit() {
    setErr(null); setDone(false)
    if (newPw.length < 8)     { setErr(t.asPwShort); return }
    if (newPw !== confirm)    { setErr(t.asPwMismatch); return }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setBusy(false)
    if (error) { setErr(t.asPwErr); return }
    setNewPw(''); setConfirm(''); setDone(true)
    setTimeout(() => setDone(false), 4000)
  }

  const INP = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors'
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-emerald-600" />
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{t.asSecurity}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input type="password" value={newPw}   onChange={e => setNewPw(e.target.value)}   placeholder={t.asNewPw}     className={INP} autoComplete="new-password" />
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={t.asConfirmPw} className={INP} autoComplete="new-password" />
      </div>
      {err  && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {err}</p>}
      {done && <p className="text-sm text-emerald-600 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> {t.asPwChanged}</p>}
      <button type="button" onClick={() => void submit()} disabled={busy || !newPw || !confirm}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl disabled:opacity-50">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} {t.asPwChange}
      </button>
    </div>
  )
}

const SETTING_FIELDS: { key: string; labelKey: keyof Translations; placeholder: string; phKey?: keyof Translations; type: 'text' | 'textarea' | 'email' | 'number'; required: boolean }[] = [
  {
    key:         'org_name',
    labelKey:    'asOrgName',
    placeholder: 'YordamchiAI',
    type:        'text',
    required:    true,
  },
  {
    key:         'org_description',
    labelKey:    'asOrgDesc',
    placeholder: '',
    phKey:       'asOrgDescPh',
    type:        'textarea',
    required:    false,
  },
  {
    key:         'support_email',
    labelKey:    'asSupportEmail',
    placeholder: 'support@example.uz',
    type:        'email',
    required:    false,
  },
  {
    key:         'max_group_size',
    labelKey:    'asMaxGroup',
    placeholder: '30',
    type:        'number',
    required:    false,
  },
]

export default function AdminSettingsPage() {
  const { t } = useLanguage()
  const [settings,  setSettings]  = useState<SettingsMap>({})
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [saved,     setSaved]     = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only load; load() is intentionally unmemoized
  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setSettings(await settingsService.getAll())
    } catch {
      setError(t.mpLoadErr)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!settings['org_name']?.trim()) {
      setError(t.asOrgNameReq)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await settingsService.setMany(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError(t.tcSaveErr)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="space-y-4 pb-8 max-w-2xl">
      <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-4 animate-pulse">
        {[1,2,3,4].map(i => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/4" />
            <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-5 pb-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.asTitle}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t.asSubtitle}</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">{t.asSaved}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Asosiy sozlamalar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4 text-emerald-600" />
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{t.asGeneral}</h2>
        </div>

        {SETTING_FIELDS.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
              {t[field.labelKey]}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={settings[field.key] ?? ''}
                onChange={e => handleChange(field.key, e.target.value)}
                placeholder={field.phKey ? t[field.phKey] : field.placeholder}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            ) : (
              <input
                type={field.type}
                value={settings[field.key] ?? ''}
                onChange={e => handleChange(field.key, e.target.value)}
                placeholder={field.phKey ? t[field.phKey] : field.placeholder}
                min={field.type === 'number' ? 1 : undefined}
                max={field.type === 'number' ? 200 : undefined}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            )}
          </div>
        ))}
      </div>

      {/* Tizim ma'lumotlari (read-only) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">{t.asSystemInfo}</h2>
        <div className="space-y-3 text-sm">
          {[
            { label: t.asPlatform,   value: 'YordamchiAI LMS' },
            { label: t.asVersion,    value: 'v1.0.0' },
            { label: 'Backend',      value: 'Supabase (PostgreSQL)' },
            { label: 'Frontend',     value: 'React 19 + Vite + TypeScript' },
            { label: 'UI framework', value: 'Tailwind CSS v4' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Xavfsizlik — parolni o'zgartirish */}
      <ChangePasswordCard />

      {/* Telegram bildirishnoma */}
      <TelegramLinkCard />

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-2xl shadow-sm transition-colors disabled:opacity-60"
      >
        {saving
          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <Save className="w-4 h-4" />
        }
        {t.admSave}
      </button>
    </div>
  )
}
