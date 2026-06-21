// Supabase Edge Function: admin-users
// Deploy: supabase functions deploy admin-users
// Amallar: action='create' | action='delete'

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // Admin Supabase client (service role — RLS'ni chetlab o'tadi)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Chaqiruvchini tekshirish uchun user client
    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user: caller } } = await userClient.auth.getUser()
    if (!caller) return json({ error: 'Tizimga kirilmagan' }, 401)

    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'admin') return json({ error: "Ruxsat yo'q" }, 403)

    const body = await req.json()
    const { action } = body

    // ── CREATE ──────────────────────────────────────────────────────────────
    if (action === 'create') {
      const { email, full_name, password, phone, bio, role } = body

      if (!email || !full_name || !password || !role) {
        return json({ error: "Majburiy maydonlar: email, full_name, password, role" }, 400)
      }
      if (!['teacher', 'student'].includes(role)) {
        return json({ error: "Rol faqat 'teacher' yoki 'student' bo'lishi mumkin" }, 400)
      }
      if (password.length < 8) {
        return json({ error: "Parol kamida 8 ta belgidan iborat bo'lishi kerak" }, 400)
      }

      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email:          email.trim().toLowerCase(),
        password,
        email_confirm:  true,
        user_metadata:  { name: full_name.trim(), role },
      })

      if (createErr || !newUser?.user) {
        let msg = createErr?.message ?? 'Yaratishda xatolik'
        if (msg.includes('already registered') || msg.includes('already exists')) {
          msg = "Bu email allaqachon ro'yxatdan o'tgan"
        }
        return json({ error: msg }, 400)
      }

      // Profil trigger tomonidan yaratilgan — phone/bio/status bilan yangilash
      await adminClient.from('profiles').upsert({
        id:        newUser.user.id,
        full_name: full_name.trim(),
        email:     email.trim().toLowerCase(),
        role,
        phone:     phone?.trim() || null,
        bio:       bio?.trim()   || null,
        status:    'active',
      }, { onConflict: 'id' })

      return json({ userId: newUser.user.id })
    }

    // ── DELETE ──────────────────────────────────────────────────────────────
    if (action === 'delete') {
      const { userId } = body
      if (!userId) return json({ error: "userId majburiy" }, 400)

      // Avval profilni o'chir (cascade bilan bog'liq ma'lumotlar ham o'chadi)
      await adminClient.from('profiles').delete().eq('id', userId)

      // Auth foydalanuvchini o'chir
      const { error: delErr } = await adminClient.auth.admin.deleteUser(userId)
      if (delErr) return json({ error: delErr.message }, 400)

      return json({ success: true })
    }

    return json({ error: "Noto'g'ri action. 'create' yoki 'delete' bo'lishi kerak" }, 400)

  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})
