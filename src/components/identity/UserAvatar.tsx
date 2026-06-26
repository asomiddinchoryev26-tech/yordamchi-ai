/**
 * UserAvatar — canonical user avatar component.
 * Supports all 3 modes: uploaded photo, gradient preset, initials.
 * NEVER shows Asomiddin's photo. This is strictly for platform users.
 *
 * Priority: uploaded → gradient → initials
 */

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { getInitials, getGradient, type UserProfile } from '@/types/profile.types'

export type UserAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface UserAvatarProps {
  /** Pass full profile for automatic mode resolution */
  profile?:   UserProfile | null
  /** Or pass individual props for direct control */
  name?:      string
  avatarUrl?: string | null
  gradient?:  string      // GradientPreset.id
  size?:      UserAvatarSize
  showStatus?: boolean
  onClick?:   () => void
  className?: string
}

const DIM: Record<UserAvatarSize, string> = {
  xs: 'w-6 h-6   text-[10px]',
  sm: 'w-8 h-8   text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
}
const DOT: Record<UserAvatarSize, string> = {
  xs: 'w-1.5 h-1.5 border',
  sm: 'w-2 h-2   border',
  md: 'w-2.5 h-2.5 border-[2px]',
  lg: 'w-3 h-3   border-2',
  xl: 'w-4 h-4   border-2',
}
const RAD: Record<UserAvatarSize, string> = {
  xs: 'rounded-md',
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
}

export function UserAvatar({
  profile,
  name,
  avatarUrl,
  gradient,
  size      = 'sm',
  showStatus = false,
  onClick,
  className,
}: UserAvatarProps) {
  // Resolve values from profile or direct props
  const resolvedName       = profile?.fullName ?? name ?? 'User'
  const resolvedAvatarUrl  = profile?.avatarUrl ?? avatarUrl ?? null
  const resolvedGradient   = profile?.gradientPreset ?? gradient ?? 'violet-blue'
  const resolvedMode       = profile?.avatarMode ?? (resolvedAvatarUrl ? 'uploaded' : 'initials')

  const [imgOk, setImgOk] = useState(!!resolvedAvatarUrl)
  useEffect(() => { setImgOk(!!resolvedAvatarUrl) }, [resolvedAvatarUrl])

  const initials = getInitials(resolvedName)
  const preset   = getGradient(resolvedGradient)
  const dim      = DIM[size]
  const rad      = RAD[size]

  const inner = () => {
    // Mode 1: Uploaded photo
    if (resolvedMode === 'uploaded' && resolvedAvatarUrl && imgOk) {
      return (
        <img
          src={resolvedAvatarUrl}
          alt={resolvedName}
          className="w-full h-full object-cover"
          onError={() => setImgOk(false)}
        />
      )
    }
    // Mode 2: Gradient preset
    if (resolvedMode === 'generated') {
      return (
        <div
          className="w-full h-full flex items-center justify-center font-bold text-white select-none"
          style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
        >
          {initials}
        </div>
      )
    }
    // Mode 3: Initials fallback
    return (
      <div
        className="w-full h-full flex items-center justify-center font-bold text-white select-none"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 50%, #6d28d9 100%)' }}
      >
        {initials}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex-shrink-0 overflow-hidden',
        dim.split(' ').slice(0, 2).join(' '),   // w-x h-x
        rad,
        'ring-1 ring-black/8 dark:ring-white/8',
        onClick && 'cursor-pointer hover:ring-2 hover:ring-violet-400 transition-all duration-150',
        className,
      )}
      style={{ fontSize: dim.split(' ')[2]?.replace('text-', '') }}
      onClick={onClick}
    >
      <div className={cn('w-full h-full', dim.split(' ')[2])}>
        {inner()}
      </div>
      {showStatus && (
        <span className={cn(
          'absolute -bottom-px -right-px z-10 rounded-full bg-emerald-400 border-white dark:border-gray-900',
          DOT[size],
        )} />
      )}
    </div>
  )
}
