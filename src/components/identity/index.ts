/**
 * Global Identity System — barrel export
 *
 * Import everything from here. Single import path for all identity UI.
 *
 * Usage:
 *   import { UserAvatar, AvatarUploader, useProfile } from '@/components/identity'
 */

// ─── Components ───────────────────────────────────────────────────────────────
export { UserAvatar }           from './UserAvatar'
export { AvatarCropper }        from './AvatarCropper'
export { AvatarUploader }       from './AvatarUploader'
export { UserIdentityProvider } from './UserIdentityProvider'

// ─── Types ────────────────────────────────────────────────────────────────────
export type { UserAvatarSize }  from './UserAvatar'
export type {
  UserProfile,
  UserProfileUpdate,
  AvatarMode,
  AvatarConfig,
  GradientPreset,
  UserPreferences,
  SocialLinks,
  NotificationSettings,
} from '@/types/profile.types'

export {
  GRADIENT_PRESETS,
  getInitials,
  getGradient,
  buildDefaultProfile,
} from '@/types/profile.types'

// ─── Context / Hook ───────────────────────────────────────────────────────────
export { useProfile }           from '@/hooks/useProfile'
export { ProfileProvider }      from '@/contexts/ProfileContext'
