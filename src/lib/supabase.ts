import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl     = import.meta.env['VITE_SUPABASE_URL']     as string | undefined
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[YordamchiAI] Supabase environment variables are missing.\n\n' +
    'LOCAL DEVELOPMENT — add to your .env file:\n' +
    '  VITE_SUPABASE_URL=https://<project-ref>.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=<your-anon-key>\n\n' +
    'VERCEL PRODUCTION — add via Vercel Dashboard:\n' +
    '  Project → Settings → Environment Variables\n' +
    '  Add: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY\n' +
    '  Then redeploy.\n\n' +
    `Current values: URL="${supabaseUrl ?? '(not set)'}", KEY="${supabaseAnonKey ? '(set)' : '(not set)'}"`,
  )
}

// Database generic parametri — supabase.from('profiles') to'liq typed bo'ladi
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
