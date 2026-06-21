import { useState, useEffect } from 'react'
import { Save, AlertCircle, CheckCircle, Settings } from 'lucide-react'
import { settingsService } from '@/services/settings.service'
import type { SettingsMap } from '@/services/settings.service'

const SETTING_FIELDS = [
  {
    key:         'org_name',
    label:       'Tashkilot nomi',
    placeholder: 'YordamchiAI',
    type:        'text' as const,
    required:    true,
  },
  {
    key:         'org_description',
    label:       'Tashkilot tavsifi',
    placeholder: 'Online ta\'lim platformasi',
    type:        'textarea' as const,
    required:    false,
  },
  {
    key:         'support_email',
    label:       'Yordam email manzili',
    placeholder: 'support@example.uz',
    type:        'email' as const,
    required:    false,
  },
  {
    key:         'max_group_size',
    label:       'Guruhda maksimal talabalar soni',
    placeholder: '30',
    type:        'number' as const,
    required:    false,
  },
]

export default function AdminSettingsPage() {
  const [settings,  setSettings]  = useState<SettingsMap>({})
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [saved,     setSaved]     = useState(false)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setSettings(await settingsService.getAll())
    } catch {
      setError("Sozlamalarni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }

  function handleChange(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!settings['org_name']?.trim()) {
      setError("Tashkilot nomi majburiy")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await settingsService.setMany(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError("Saqlashda xatolik yuz berdi")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="space-y-4 pb-8 max-w-2xl">
      <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 animate-pulse">
        {[1,2,3,4].map(i => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/4" />
            <div className="h-10 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-5 pb-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sozlamalar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tizim konfiguratsiyasi</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">Sozlamalar muvaffaqiyatli saqlandi</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Asosiy sozlamalar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4 text-emerald-600" />
          <h2 className="text-base font-bold text-gray-900">Umumiy sozlamalar</h2>
        </div>

        {SETTING_FIELDS.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={settings[field.key] ?? ''}
                onChange={e => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            ) : (
              <input
                type={field.type}
                value={settings[field.key] ?? ''}
                onChange={e => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                min={field.type === 'number' ? 1 : undefined}
                max={field.type === 'number' ? 200 : undefined}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            )}
          </div>
        ))}
      </div>

      {/* Tizim ma'lumotlari (read-only) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4">Tizim ma'lumotlari</h2>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Platforma',    value: 'YordamchiAI LMS' },
            { label: 'Versiya',      value: 'v1.0.0' },
            { label: 'Backend',      value: 'Supabase (PostgreSQL)' },
            { label: 'Frontend',     value: 'React 19 + Vite + TypeScript' },
            { label: 'UI framework', value: 'Tailwind CSS v4' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-gray-500">{row.label}</span>
              <span className="font-medium text-gray-900">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

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
        Saqlash
      </button>
    </div>
  )
}
