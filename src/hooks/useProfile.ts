/**
 * useProfile — primary hook for accessing user profile data.
 * Use this everywhere instead of reading from useAuth() directly.
 * Provides the global user identity.
 */

export { useProfileContext as useProfile } from '@/contexts/ProfileContext'
