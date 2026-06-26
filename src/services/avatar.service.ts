/**
 * Avatar Service — storage abstraction for profile photos.
 * Uploads to Supabase Storage 'avatars' bucket.
 * All avatar I/O goes through this service. Never couple UI to storage directly.
 */

import { supabase } from '@/lib/supabase'

const BUCKET      = 'avatars'
const MAX_BYTES   = 5 * 1024 * 1024   // 5 MB
const VALID_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

export interface AvatarUploadResult {
  publicUrl:   string   // cache-busted, for immediate in-memory display
  baseUrl:     string   // clean URL to persist in DB
  storagePath: string
}

export const avatarService = {

  /** Validate file before upload */
  validate(file: File | Blob): void {
    const size = file.size
    // Use actual blob type if available, default to jpeg (canvas output)
    const type = file.type || 'image/jpeg'
    if (size > MAX_BYTES)         throw new Error(`Avatar 5 MB dan kichik bo'lishi kerak`)
    if (!VALID_TYPES.has(type))   throw new Error(`Format qo'llab-quvvatlanmaydi: ${type}`)
  },

  /** Upload avatar blob to Supabase Storage, returns public URL */
  async upload(userId: string, blob: Blob): Promise<AvatarUploadResult> {
    avatarService.validate(blob)

    const storagePath = `${userId}/avatar.jpg`

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, blob, {
        contentType: 'image/jpeg',
        upsert:       true,
        cacheControl: '1',       // 1 second — forces browser to re-fetch
      })

    if (error) throw new Error(`Avatar yuklanmadi: ${error.message}`)

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
    // Base URL saved to DB — no timestamp suffix
    const baseUrl  = data.publicUrl
    // Cache-busted URL used only for immediate in-memory display
    const displayUrl = `${baseUrl}?t=${Date.now()}`

    return { publicUrl: displayUrl, storagePath, baseUrl }
  },

  /** Remove avatar from storage */
  async delete(userId: string): Promise<void> {
    await supabase.storage.from(BUCKET).remove([`${userId}/avatar.jpg`])
  },

  /** Update avatar_url in profiles table */
  async saveUrl(userId: string, url: string | null): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', userId)
    if (error) throw new Error(error.message)
  },

  /** Get signed URL for private buckets (not needed for public bucket) */
  getPublicUrl(storagePath: string): string {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
    return data.publicUrl
  },
}
