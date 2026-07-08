/**
 * ProfileContext — Global Identity Store
 * Single source of truth for the authenticated user's profile.
 * Every page reads from here. Never duplicate user state.
 *
 * Data flow:
 *   AuthContext (id, name, role, email, avatarUrl)
 *     └─ ProfileContext (enriches with bio, phone, preferences, avatar config)
 *          └─ useProfile() hook → all UI components
 */

import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  buildDefaultProfile, getGradient,
  type UserProfile, type UserProfileUpdate,
} from '@/types/profile.types'
import { avatarService } from '@/services/avatar.service'

// ─── Context shape ────────────────────────────────────────────────────────────

interface ProfileContextValue {
  profile:         UserProfile | null
  isLoading:       boolean
  isSaving:        boolean
  error:           string | null
  updateProfile:   (updates: UserProfileUpdate) => Promise<void>
  uploadAvatar:    (blob: Blob) => Promise<void>
  deleteAvatar:    () => Promise<void>
  refreshProfile:  () => Promise<void>
  clearError:      () => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ProfileProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const [profile,   setProfile]   = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving,  setIsSaving]  = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // ── Fetch extended profile from Supabase ──────────────────────────────────
  // Stabilize: only re-fetch when the user id actually changes
  const userId    = auth.user?.id
  const userName  = auth.user?.name
  const userEmail = auth.user?.email
  const userRole  = auth.user?.role
  const userAvUrl = auth.user?.avatarUrl
  const userCreAt = auth.user?.createdAt

  const fetchProfile = useCallback(async () => {
    if (!userId) { setProfile(null); setIsLoading(false); return }

    setIsLoading(true)
    setError(null)
    try {
      const { data, error: dbErr } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url, phone, bio, status, created_at')
        .eq('id', userId)
        .single()

      const base = buildDefaultProfile(
        userId,
        userEmail ?? '',
        data?.full_name ?? userName ?? '',
        userRole ?? 'student',
        data?.created_at ?? userCreAt ?? new Date().toISOString(),
        data?.avatar_url ?? userAvUrl ?? null,
      )

      if (dbErr || !data) { setProfile(base); return }

      // Add cache-buster to avatar URL on load so browser always fetches fresh image
      const rawAvatarUrl = data.avatar_url ?? null
      const avatarUrl = rawAvatarUrl
        ? `${rawAvatarUrl.split('?')[0]}?t=${Date.now()}`
        : null

      setProfile({
        ...base,
        fullName:   data.full_name  ?? userName  ?? '',
        email:      data.email      ?? userEmail ?? '',
        phone:      data.phone      ?? null,
        bio:        data.bio        ?? null,
        avatarUrl,
        avatarMode: rawAvatarUrl ? 'uploaded' : 'initials',
        status:     data.status === 'inactive' ? 'inactive' : 'active',
        createdAt:  data.created_at,
      })
    } catch {
      setError("Profil ma'lumotlarini yuklashda xatolik")
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  useEffect(() => { void fetchProfile() }, [fetchProfile])

  // ── Update profile fields ─────────────────────────────────────────────────
  const updateProfile = useCallback(async (updates: UserProfileUpdate) => {
    if (!profile) return
    setIsSaving(true)
    setError(null)
    try {
      const dbUpdates: Record<string, unknown> = {}
      if (updates.fullName !== undefined) dbUpdates.full_name  = updates.fullName
      if (updates.phone    !== undefined) dbUpdates.phone      = updates.phone
      if (updates.bio      !== undefined) dbUpdates.bio        = updates.bio
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl

      if (Object.keys(dbUpdates).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: dbErr } = await (supabase.from('profiles') as any)
          .update(dbUpdates)
          .eq('id', profile.id)
        if (dbErr) throw new Error((dbErr as { message: string }).message)
      }

      setProfile(prev => {
        if (!prev) return null
        return {
          ...prev,
          fullName:  updates.fullName  ?? prev.fullName,
          username:  updates.username  !== undefined ? updates.username  : prev.username,
          phone:     updates.phone     !== undefined ? updates.phone     : prev.phone,
          bio:       updates.bio       !== undefined ? updates.bio       : prev.bio,
          avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : prev.avatarUrl,
          avatarMode: updates.avatarMode ?? prev.avatarMode,
          gradientPreset: updates.gradientPreset ?? prev.gradientPreset,
          preferences: updates.preferences
            ? { ...prev.preferences, ...updates.preferences }
            : prev.preferences,
        }
      })
    } catch (e) {
      console.error('[Profile] update failed:', e)
      setError('Xatolik yuz berdi')
    } finally {
      setIsSaving(false)
    }
  }, [profile])

  // ── Upload avatar ─────────────────────────────────────────────────────────
  const uploadAvatar = useCallback(async (blob: Blob) => {
    if (!profile) return
    setIsSaving(true)
    setError(null)
    try {
      const { publicUrl, baseUrl } = await avatarService.upload(profile.id, blob)
      // Save clean URL to DB (no timestamp suffix — avoids stale cache on reload)
      await avatarService.saveUrl(profile.id, baseUrl)
      // Use cache-busted URL for immediate in-memory display
      setProfile(prev => prev ? { ...prev, avatarUrl: publicUrl, avatarMode: 'uploaded' } : null)
    } catch (e) {
      console.error('[Profile] avatar upload failed:', e)
      setError('Avatar yuklanmadi')
    } finally {
      setIsSaving(false)
    }
  }, [profile])

  // ── Delete avatar ─────────────────────────────────────────────────────────
  const deleteAvatar = useCallback(async () => {
    if (!profile) return
    setIsSaving(true)
    setError(null)
    try {
      await avatarService.delete(profile.id)
      await avatarService.saveUrl(profile.id, null)
      setProfile(prev => prev ? { ...prev, avatarUrl: null, avatarMode: 'initials' } : null)
    } catch (e) {
      console.error('[Profile] avatar delete failed:', e)
      setError('Avatar o\'chirilmadi')
    } finally {
      setIsSaving(false)
    }
  }, [profile])

  const value: ProfileContextValue = {
    profile,
    isLoading,
    isSaving,
    error,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    refreshProfile: fetchProfile,
    clearError: () => setError(null),
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProfileContext(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfileContext must be used inside <ProfileProvider>')
  return ctx
}

// Exported separately for use in non-AI pages
export { getGradient }
