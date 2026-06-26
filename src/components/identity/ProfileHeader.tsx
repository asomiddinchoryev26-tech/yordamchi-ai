/**
 * ProfileHeader — large identity header for profile pages.
 * Shows avatar, name, role, email, bio, and edit trigger.
 */

import { Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserAvatar } from './UserAvatar'
import type { UserProfile } from '@/types/profile.types'

const ROLE_LABELS: Record<string, string> = {
  student: 'Talaba',
  teacher: "O'qituvchi",
  admin:   'Administrator',
}
const ROLE_COLORS: Record<string, string> = {
  student: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  teacher: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300',
  admin:   'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
}

interface ProfileHeaderProps {
  profile:   UserProfile
  onEdit?:   () => void
  className?: string
}

export function ProfileHeader({ profile, onEdit, className }: ProfileHeaderProps) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800',
      'shadow-sm',
      className,
    )}>
      {/* Background gradient band */}
      <div
        className="h-24 w-full"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #06b6d4 100%)' }}
      />

      {/* Content */}
      <div className="px-5 pb-5">
        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="ring-4 ring-white dark:ring-gray-900 rounded-2xl overflow-hidden shadow-lg">
            <UserAvatar profile={profile} size="xl" />
          </div>

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:opacity-80 transition-opacity shadow-sm"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Tahrirlash
            </button>
          )}
        </div>

        {/* Identity */}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              {profile.fullName}
            </h2>
            <span className={cn(
              'text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide',
              ROLE_COLORS[profile.role] ?? ROLE_COLORS.student,
            )}>
              {ROLE_LABELS[profile.role] ?? profile.role}
            </span>
          </div>

          {profile.username && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">@{profile.username}</p>
          )}

          <p className="text-sm text-gray-500 dark:text-gray-500 mb-3">{profile.email}</p>

          {profile.bio && (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
