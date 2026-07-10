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
      .select('role, organization_id, is_super_admin')
      .eq('id', caller.id)
      .single()

    if (callerProfile?.role !== 'admin') return json({ error: "Ruxsat yo'q" }, 403)

    const body = await req.json()
    const { action } = body

    // ── CREATE ──────────────────────────────────────────────────────────────
    if (action === 'create') {
      const { email, full_name, password, phone, bio, role, organization_id } = body

      if (!email || !full_name || !password || !role) {
        return json({ error: "Majburiy maydonlar: email, full_name, password, role" }, 400)
      }
      // Super-admin 'admin' ham yarata oladi; oddiy admin faqat teacher/student
      const allowedRoles = callerProfile.is_super_admin ? ['teacher', 'student', 'admin'] : ['teacher', 'student']
      if (!allowedRoles.includes(role)) {
        return json({ error: "Ruxsat etilmagan rol" }, 400)
      }
      if (password.length < 8) {
        return json({ error: "Parol kamida 8 ta belgidan iborat bo'lishi kerak" }, 400)
      }

      // Biriktiriladigan tashkilot: super-admin istalganini tanlaydi; oddiy admin — o'z orgi
      let targetOrg = callerProfile.organization_id
      if (callerProfile.is_super_admin && organization_id) {
        const { data: org } = await adminClient.from('organizations').select('id').eq('id', organization_id).maybeSingle()
        if (!org) return json({ error: "Tashkilot topilmadi" }, 400)
        targetOrg = organization_id
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

      // Profil trigger tomonidan yaratilgan — phone/bio/status bilan yangilash.
      // MUHIM: yangi foydalanuvchi chaqiruvchi (admin) tashkilotiga biriktiriladi,
      // aks holda u tashkilotsiz qolib, onboardingga tushib ketadi.
      // Xatolik bo'lsa: yetim (orphaned) auth foydalanuvchi qolmasligi uchun
      // yangi yaratilgan auth yozuvini bekor qilamiz (rollback).
      const { error: profileErr } = await adminClient.from('profiles').upsert({
        id:              newUser.user.id,
        full_name:       full_name.trim(),
        email:           email.trim().toLowerCase(),
        role,
        phone:           phone?.trim() || null,
        bio:             bio?.trim()   || null,
        status:          'active',
        organization_id: targetOrg,
      }, { onConflict: 'id' })

      if (profileErr) {
        await adminClient.auth.admin.deleteUser(newUser.user.id)
        return json({ error: "Profil yaratishda xatolik: " + profileErr.message }, 500)
      }

      return json({ userId: newUser.user.id })
    }

    // ── DELETE ──────────────────────────────────────────────────────────────
    if (action === 'delete') {
      const { userId } = body
      if (!userId) return json({ error: "userId majburiy" }, 400)
      if (userId === caller.id) return json({ error: "O'zingizni o'chira olmaysiz" }, 400)

      // MUHIM: tashkilotlararo o'chirishning oldini olish. Oddiy admin faqat o'z
      // tashkiloti a'zosini o'chira oladi; super-adminni hech kim o'chira olmaydi.
      const { data: target } = await adminClient.from('profiles')
        .select('organization_id, is_super_admin').eq('id', userId).single()
      if (!target) return json({ error: 'Foydalanuvchi topilmadi' }, 404)
      if (!callerProfile.is_super_admin) {
        if (target.is_super_admin) return json({ error: "Ruxsat yo'q" }, 403)
        if (target.organization_id !== callerProfile.organization_id) {
          return json({ error: "Boshqa tashkilot foydalanuvchisini o'chira olmaysiz" }, 403)
        }
      }

      // Avval profilni o'chir (cascade bilan bog'liq ma'lumotlar ham o'chadi)
      await adminClient.from('profiles').delete().eq('id', userId)

      // Auth foydalanuvchini o'chir
      const { error: delErr } = await adminClient.auth.admin.deleteUser(userId)
      if (delErr) return json({ error: delErr.message }, 400)

      return json({ success: true })
    }

    return json({ error: "Noto'g'ri action. 'create' yoki 'delete' bo'lishi kerak" }, 400)

  } catch (err) {
    // Log full detail server-side (Edge Function logs); return a generic
    // message so internal error details never reach the client.
    console.error('[admin-users] unhandled error:', err)
    return json({ error: "Server xatosi. Keyinroq qayta urinib ko'ring." }, 500)
  }
})
