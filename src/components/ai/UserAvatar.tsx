/**
 * Re-export from the canonical Global Identity System.
 * This file exists only to maintain backward-compatible import paths
 * for components that import from '@/components/ai'.
 *
 * The single implementation lives in '@/components/identity/UserAvatar'.
 * Never duplicate avatar logic here.
 */

export { UserAvatar } from '@/components/identity/UserAvatar'
export type { UserAvatarSize } from '@/components/identity/UserAvatar'
