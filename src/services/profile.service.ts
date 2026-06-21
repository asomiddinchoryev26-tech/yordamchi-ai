import { supabase } from '@/lib/supabase'
import type { ProfileRow, ProfileUpdate } from '@/types/database.types'

export type { ProfileRow, ProfileUpdate }

export const profileService = {
  // Joriy foydalanuvchining profilini olish.
  // Explicit .eq() filtri kerak: admin/teacher "read all" policysi bilan
  // filtrsiz .single() bir nechta qator qaytarishi mumkin.
  getOwn: async (): Promise<ProfileRow | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    return data
  },

  getById: async (id: string): Promise<ProfileRow | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    return data
  },

  update: async (id: string, payload: ProfileUpdate): Promise<ProfileRow> => {
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  updateAvatar: async (id: string, avatarUrl: string): Promise<ProfileRow> => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },
}
