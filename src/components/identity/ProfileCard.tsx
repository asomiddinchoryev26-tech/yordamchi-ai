/**
 * ProfileCard — compact horizontal user card.
 * Used in sidebars, comment sections, lists.
 */

import { cn } from '@/lib/utils'
import { UserAvatar, type UserAvatarSize } from './UserAvatar'
import type { UserProfile } from '@/types/profile.types'

interface ProfileCardProps {
  profile:     UserProfile
  size?:       UserAvatarSize
  showStatus?: boolean
  showEmail?:  boolean
  showRole?:   boolean
  subtitle?:   string   // override subtitle text
  onClick?:    () => void
  className?:  string
}

export function ProfileCard({
  profile,
  size      = 'sm',
  showStatus = false,
  showEmail  = false,
  showRole   = false,
  subtitle,
  onClick,
  className,
}: ProfileCardProps) {
  const sub = subtitle
    ?? (showRole  ? profile.role  : undefined)
    ?? (showEmail ? profile.email : undefined)

  return (
    <div
      className={cn(
        'flex items-center gap-3',
        onClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-xl px-2 py-1.5 -mx-2 -my-1.5 transition-colors',
        className,
      )}
      onClick={onClick}
    >
      <UserAvatar
        profile={profile}
        size={size}
        showStatus={showStatus}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-snug">
          {profile.fullName}
        </p>
        {sub && (
          <p className="text-[11px] text-gray-500 dark:text-gray-500 truncate leading-snug mt-px">
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}
