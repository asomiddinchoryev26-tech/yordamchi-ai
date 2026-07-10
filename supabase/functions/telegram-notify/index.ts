// Supabase Edge Function: telegram-notify
// Ichki funksiya — DB triggerlar (pg_net) chaqiradi. Berilgan foydalanuvchilarга
// (agar Telegram ulangan bo'lsa va shu turdagi bildirishnoma o'chirilmagan bo'lsa)
// xabar yuboradi. Himoya: x-notify-secret header (anon/authenticated chaqira olmaydi).
// Deploy: supabase functions deploy telegram-notify --no-verify-jwt

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TOKEN         = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? ''
const NOTIFY_SECRET = Deno.env.get('TELEGRAM_NOTIFY_SECRET') ?? ''

serve(async (req: Request) => {
  if (req.headers.get('x-notify-secret') !== NOTIFY_SECRET) {
    return new Response('forbidden', { status: 403 })
  }
  if (!TOKEN) return new Response(JSON.stringify({ error: 'no_token' }), { status: 503 })

  let payload: { user_ids?: string[]; event?: string; text?: string }
  try { payload = await req.json() } catch { return new Response(JSON.stringify({ error: 'bad_json' }), { status: 400 }) }

  const userIds = Array.isArray(payload.user_ids) ? payload.user_ids : []
  const event   = payload.event ?? 'general'
  const text    = payload.text ?? ''
  if (userIds.length === 0 || !text) return new Response(JSON.stringify({ sent: 0 }), { headers: { 'Content-Type': 'application/json' } })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  )

  // Ulangan (chat_id bor) foydalanuvchilar + sozlamalar
  const { data } = await admin
    .from('telegram_links')
    .select('user_id, chat_id, prefs')
    .in('user_id', userIds)
    .not('chat_id', 'is', null)

  let sent = 0
  for (const row of (data ?? []) as { chat_id: string; prefs: Record<string, boolean> | null }[]) {
    if (row.prefs && row.prefs[event] === false) continue  // foydalanuvchi o'chirgan
    try {
      const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: row.chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      })
      if (res.ok) sent++
    } catch { /* bittasi xato bo'lsa qolganlari davom etadi */ }
  }

  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } })
})
