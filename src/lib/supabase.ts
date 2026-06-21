import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl     = import.meta.env['VITE_SUPABASE_URL']     as string
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[YordamchiAI] Supabase sozlanmagan.\n' +
    "Iltimos, .env faylida quyidagilarni to'ldiring:\n" +
    '  VITE_SUPABASE_URL=https://your-project-id.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=your-anon-key-here',
  )
}

// Database generic parametri — supabase.from('profiles') to'liq typed bo'ladi
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
