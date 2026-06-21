import { supabase } from '@/lib/supabase'

export type SettingsMap = Record<string, string>

export const settingsService = {
  getAll: async (): Promise<SettingsMap> => {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')

    if (error) throw new Error(error.message)

    return Object.fromEntries(
      (data ?? []).map(s => [s.key, s.value ?? ''])
    )
  },

  set: async (key: string, value: string): Promise<void> => {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (error) throw new Error(error.message)
  },

  setMany: async (updates: SettingsMap): Promise<void> => {
    const rows = Object.entries(updates).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }))
    const { error } = await supabase
      .from('settings')
      .upsert(rows, { onConflict: 'key' })
    if (error) throw new Error(error.message)
  },
}
