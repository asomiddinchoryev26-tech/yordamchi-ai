/**
 * UserIdentityProvider — top-level provider for the global identity system.
 * Place inside <AuthProvider>. All children can call useProfile().
 *
 * Architectural note:
 * This sits between AuthProvider and the rest of the app. It reads auth state
 * and enriches it with full profile data from the database, making profile
 * available everywhere without prop drilling.
 */

export { ProfileProvider as UserIdentityProvider } from '@/contexts/ProfileContext'
