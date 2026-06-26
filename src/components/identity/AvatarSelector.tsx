/**
 * AvatarSelector — choose between uploaded photo, gradient preset, or initials.
 * Used inside ProfileEditor to let users pick their avatar mode.
 */

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GRADIENT_PRESETS, getInitials, type UserProfile, type AvatarMode } from '@/types/profile.types'
import { UserAvatar } from './UserAvatar'
import { AvatarUploader } from './AvatarUploader'

interface AvatarSelectorProps {
  profile:       UserProfile
  onModeChange:  (mode: AvatarMode, gradientId?: string) => void
  onUpload:      (blob: Blob) => Promise<void>
  onDelete?:     () => Promise<void>
  isUploading?:  boolean
}

const TAB_OPTIONS: { id: AvatarMode; label: string }[] = [
  { id: 'uploaded',   label: 'Rasm' },
  { id: 'generated',  label: 'Rang' },
  { id: 'initials',   label: 'Harflar' },
]

export function AvatarSelector({
  profile, onModeChange, onUpload, onDelete, isUploading,
}: AvatarSelectorProps) {
  const [tab, setTab] = useState<AvatarMode>(profile.avatarMode)

  function switchTab(mode: AvatarMode) {
    setTab(mode)
    if (mode !== 'generated') onModeChange(mode)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {TAB_OPTIONS.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => switchTab(opt.id)}
            className={cn(
              'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150',
              tab === opt.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Panel: Upload */}
      {tab === 'uploaded' && (
        <AvatarUploader
          profile={profile}
          onUpload={onUpload}
          onDelete={onDelete}
          isUploading={isUploading}
        />
      )}

      {/* Panel: Gradient presets */}
      {tab === 'generated' && (
        <div className="flex flex-col items-center gap-4">
          {/* Preview */}
          <UserAvatar
            profile={{ ...profile, avatarMode: 'generated', gradientPreset: profile.gradientPreset }}
            size="xl"
          />
          {/* Grid of presets */}
          <div className="grid grid-cols-4 gap-2 w-full">
            {GRADIENT_PRESETS.map(p => {
              const active = profile.gradientPreset === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onModeChange('generated', p.id)}
                  title={p.label}
                  className={cn(
                    'relative h-10 rounded-xl transition-all duration-150',
                    'hover:scale-105 active:scale-95',
                    active && 'ring-2 ring-offset-2 ring-violet-500 dark:ring-offset-gray-900',
                  )}
                  style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                >
                  {active && (
                    <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow" />
                  )}
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-600 text-center">
            Gradient rangini tanlang
          </p>
        </div>
      )}

      {/* Panel: Initials */}
      {tab === 'initials' && (
        <div className="flex flex-col items-center gap-4">
          <UserAvatar
            profile={{ ...profile, avatarMode: 'initials' }}
            size="xl"
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Ismingizning boshlang'ich harflari:
            <span className="ml-1.5 font-bold text-gray-900 dark:text-gray-100 text-base">
              {getInitials(profile.fullName)}
            </span>
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-600 text-center">
            Ism to'liq yozilsa, harflar avtomatik yangilanadi
          </p>
        </div>
      )}
    </div>
  )
}
