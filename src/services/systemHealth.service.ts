/**
 * services/systemHealth.service.ts
 * Super Admin tizim holati monitori (read-only). Yengil tekshiruvlar — mavjud
 * ma'lumotni buzmaydi.
 */

import { supabase } from '@/lib/supabase'

export type HealthStatus = 'up' | 'down' | 'unknown'
export type HealthItem = { key: string; label: string; status: HealthStatus }
export type SystemHealth = { items: HealthItem[]; lastBackup: string | null }

export const systemHealthService = {
  check: async (): Promise<SystemHealth> => {
    // DB / Supabase — yengil so'rov
    let db: HealthStatus = 'unknown'
    try {
      const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
      db = error ? 'down' : 'up'
    } catch { db = 'down' }

    // Storage — bucketlar ro'yxati
    let storage: HealthStatus = 'unknown'
    try {
      const { error } = await supabase.storage.listBuckets()
      storage = error ? 'down' : 'up'
    } catch { storage = 'down' }

    // AI xizmati — Edge Function URL sozlanganmi (yengil, chaqiruvsiz)
    const aiConfigured = Boolean(import.meta.env['VITE_SUPABASE_URL'])
    const ai: HealthStatus = aiConfigured ? 'up' : 'unknown'

    // To'lov — hali integratsiya qilinmagan
    const payment: HealthStatus = 'unknown'

    return {
      items: [
        { key: 'database', label: "Ma'lumotlar bazasi", status: db },
        { key: 'supabase', label: 'Supabase ulanishi',  status: db },
        { key: 'storage',  label: 'Storage',             status: storage },
        { key: 'ai',       label: 'AI xizmati',          status: ai },
        { key: 'payment',  label: "To'lov xizmati",      status: payment },
      ],
      lastBackup: null, // Supabase avtomatik backup — panel orqali ko'rinadi
    }
  },
}
