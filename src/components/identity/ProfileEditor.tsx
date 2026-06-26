/**
 * ProfileEditor — full profile editing form.
 * Renders AvatarSelector + all editable fields.
 * Reads from and writes to ProfileContext (via props for flexibility).
 */

import { useState, type FormEvent } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AvatarSelector } from './AvatarSelector'
import type { UserProfile, UserProfileUpdate, AvatarMode } from '@/types/profile.types'

interface ProfileEditorProps {
  profile:       UserProfile
  isSaving?:     boolean
  isUploading?:  boolean
  error?:        string | null
  onSave:        (updates: UserProfileUpdate) => Promise<void>
  onUpload:      (blob: Blob) => Promise<void>
  onDeleteAvatar?: () => Promise<void>
  onAvatarMode?: (mode: AvatarMode, gradientId?: string) => void
}

export function ProfileEditor({
  profile,
  isSaving,
  isUploading,
  error,
  onSave,
  onUpload,
  onDeleteAvatar,
  onAvatarMode,
}: ProfileEditorProps) {
  const [form, setForm] = useState({
    fullName: profile.fullName,
    username: profile.username ?? '',
    phone:    profile.phone    ?? '',
    bio:      profile.bio      ?? '',
  })
  const [dirty, setDirty] = useState(false)

  function set(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setDirty(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await onSave({
      fullName: form.fullName.trim(),
      username: form.username.trim() || undefined,
      phone:    form.phone.trim()    || undefined,
      bio:      form.bio.trim()      || undefined,
    })
    setDirty(false)
  }

  const inputCls = cn(
    'w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-all duration-150',
    'border-gray-200 dark:border-gray-700',
    'bg-white dark:bg-gray-800/60',
    'text-gray-900 dark:text-gray-100',
    'placeholder:text-gray-400 dark:placeholder:text-gray-600',
    'focus:border-violet-400 dark:focus:border-violet-600 focus:ring-2 focus:ring-violet-500/15',
  )
  const labelCls = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Avatar section */}
      <section>
        <p className={labelCls}>Avatar</p>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-5 bg-gray-50/50 dark:bg-gray-800/30">
          <AvatarSelector
            profile={profile}
            onModeChange={(mode, gradientId) => {
              onAvatarMode?.(mode, gradientId)
            }}
            onUpload={onUpload}
            onDelete={onDeleteAvatar}
            isUploading={isUploading}
          />
        </div>
      </section>

      {/* Personal info */}
      <section className="flex flex-col gap-4">
        <p className={labelCls}>Shaxsiy ma'lumotlar</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            To'liq ism <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={e => set('fullName', e.target.value)}
            placeholder="Ism Familiya"
            required
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Foydalanuvchi nomi
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">@</span>
            <input
              type="text"
              value={form.username}
              onChange={e => set('username', e.target.value.replace(/[^a-z0-9_.]/gi, ''))}
              placeholder="username"
              className={cn(inputCls, 'pl-8')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Telefon raqami
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="+998 90 123 45 67"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bio
          </label>
          <textarea
            value={form.bio}
            onChange={e => set('bio', e.target.value)}
            placeholder="O'zingiz haqingizda qisqacha..."
            rows={3}
            maxLength={300}
            className={cn(inputCls, 'resize-none leading-relaxed')}
          />
          <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1 text-right">
            {form.bio.length}/300
          </p>
        </div>
      </section>

      {/* Read-only info */}
      <section className="flex flex-col gap-3">
        <p className={labelCls}>Tizim ma'lumotlari</p>
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 p-4 space-y-2">
          <Row label="Email"    value={profile.email} />
          <Row label="Rol"      value={profile.role}  />
          <Row label="Holat"    value={profile.status === 'active' ? 'Faol' : 'Bloklangan'} />
          <Row label="Ro'yxat"  value={new Date(profile.createdAt).toLocaleDateString('uz-UZ')} />
        </div>
      </section>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Save */}
      <button
        type="submit"
        disabled={isSaving || !dirty}
        className={cn(
          'flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-150',
          'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25',
          'hover:opacity-90 active:scale-95',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        )}
      >
        {isSaving
          ? <><Loader2 className="w-4 h-4 animate-spin" />Saqlanmoqda…</>
          : <><Save className="w-4 h-4" />O'zgarishlarni saqlash</>}
      </button>
    </form>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500 dark:text-gray-500">{label}</span>
      <span className="text-gray-900 dark:text-gray-100 font-medium">{value}</span>
    </div>
  )
}
