/**
 * ProfilePreview — read-only profile snapshot.
 * Used in modals, tooltips, hover cards.
 */

import { Mail, Phone, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserAvatar } from './UserAvatar'
import type { UserProfile } from '@/types/profile.types'

interface ProfilePreviewProps {
  profile:   UserProfile
  className?: string
}

export function ProfilePreview({ profile, className }: ProfilePreviewProps) {
  return (
    <div className={cn(
      'flex flex-col gap-4 p-5 rounded-2xl',
      'bg-white dark:bg-gray-900',
      'border border-gray-100 dark:border-gray-800',
      'shadow-lg shadow-gray-900/8',
      className,
    )}>
      {/* Avatar + name row */}
      <div className="flex items-center gap-3">
        <UserAvatar profile={profile} size="lg" />
        <div className="min-w-0">
          <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{profile.fullName}</p>
          {profile.username && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-px">@{profile.username}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-3">
          {profile.bio}
        </p>
      )}

      {/* Info rows */}
      <div className="flex flex-col gap-1.5 text-sm">
        <InfoRow icon={<Mail className="w-3.5 h-3.5" />} value={profile.email} />
        {profile.phone && (
          <InfoRow icon={<Phone className="w-3.5 h-3.5" />} value={profile.phone} />
        )}
        <InfoRow
          icon={<Calendar className="w-3.5 h-3.5" />}
          value={`Ro'yxat: ${new Date(profile.createdAt).toLocaleDateString('uz-UZ')}`}
        />
      </div>
    </div>
  )
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
      <span className="flex-shrink-0 opacity-60">{icon}</span>
      <span className="text-sm truncate">{value}</span>
    </div>
  )
}
