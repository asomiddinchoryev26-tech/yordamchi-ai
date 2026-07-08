import { supabase } from '@/lib/supabase'

// ─── Shared admin user-management (via `admin-users` Edge Function) ────────────
// student.service va teacher.service o'rtasidagi takroriy Edge Function chaqiruvi
// shu yerda birlashtirilgan (DRY). Ikkalasi ham shu yordamchidan foydalanadi.

export type AdminCreateUserInput = {
  email:     string
  full_name: string
  password:  string
  phone?:    string | null
  bio?:      string | null
  role:      'teacher' | 'student'
}

const DEPLOY_HINT =
  "Foydalanuvchi yaratishda xatolik.\n" +
  "Edge Function ishga solinganmi? (supabase functions deploy admin-users)"

type CreateResp = { userId?: string; error?: string } | null
type DeleteResp = { success?: boolean; error?: string } | null

// auth.users + profiles yozuvini (to'g'ri rol + metadata bilan) yaratadi.
export async function adminCreateAuthUser(input: AdminCreateUserInput): Promise<string> {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: {
      action:    'create',
      email:     input.email,
      full_name: input.full_name,
      password:  input.password,
      phone:     input.phone ?? null,
      bio:       input.bio   ?? null,
      role:      input.role,
    },
  })

  if (error) throw new Error(DEPLOY_HINT)
  const res = data as CreateResp
  if (res?.error)  throw new Error(res.error)
  if (!res?.userId) throw new Error("Foydalanuvchi yaratildi, lekin ID qaytmadi")
  return res.userId
}

// auth.users + profiles yozuvini o'chiradi. Edge Function ishlamasa — hech
// bo'lmaganda profil o'chiriladi (auth foydalanuvchi keyin qo'lda tozalanadi).
export async function adminDeleteAuthUser(userId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: { action: 'delete', userId },
  })

  if (error) {
    const { error: dbErr } = await supabase.from('profiles').delete().eq('id', userId)
    if (dbErr) throw new Error(dbErr.message)
    return
  }
  const res = data as DeleteResp
  if (res?.error) throw new Error(res.error)
}
