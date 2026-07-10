// Supabase Edge Function: telegram-webhook
// Telegram → bu funksiyaga har update yuboradi. /start <kod> kelsa — hisobни bog'laydi.
// Xavfsizlik: Telegram X-Telegram-Bot-Api-Secret-Token header'ini tekshiramiz.
// Deploy: supabase functions deploy telegram-webhook --no-verify-jwt

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TOKEN          = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? ''
const WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') ?? ''

async function tg(method: string, body: unknown) {
  return fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

serve(async (req: Request) => {
  // Faqat Telegram'дан (secret_token header)
  if (WEBHOOK_SECRET && req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== WEBHOOK_SECRET) {
    return new Response('forbidden', { status: 403 })
  }

  let update: any
  try { update = await req.json() } catch { return new Response('ok') }

  const msg = update?.message
  if (!msg?.text) return new Response('ok')

  const chatId   = String(msg.chat.id)
  const username = msg.from?.username ?? null
  const text     = String(msg.text).trim()

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  )

  if (text.startsWith('/start')) {
    const code = text.split(/\s+/)[1] ?? ''  // "/start <kod>"
    if (code) {
      const { data, error } = await admin
        .from('telegram_links')
        .update({ chat_id: chatId, tg_username: username, linked_at: new Date().toISOString(), link_code: null })
        .eq('link_code', code)
        .select('user_id')
      if (!error && data && data.length > 0) {
        await tg('sendMessage', {
          chat_id: chatId,
          text: '✅ <b>Muvaffaqiyatli ulandi!</b>\n\nEndi YordamchiAI muhim bildirishnomalarni shu yerga yuboradi. Sozlamalardan istalgan turini o‘chirishingiz mumkin.',
          parse_mode: 'HTML',
        })
      } else {
        await tg('sendMessage', {
          chat_id: chatId,
          text: '⚠️ Kod eskirgan yoki noto‘g‘ri.\nIlovada Sozlamalar → «Telegramni ulash» tugmasini qayta bosing.',
        })
      }
    } else {
      await tg('sendMessage', {
        chat_id: chatId,
        text: 'Salom! 👋\nBog‘lash uchun YordamchiAI ilovasida Sozlamalar → «Telegramni ulash» tugmasini bosing.',
      })
    }
  }

  return new Response('ok')
})
