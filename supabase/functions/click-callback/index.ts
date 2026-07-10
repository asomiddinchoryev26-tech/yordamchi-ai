// Supabase Edge Function: click-callback
// Click Merchant SHOP API — Prepare (action=0) + Complete (action=1).
// Deploy: supabase functions deploy click-callback --no-verify-jwt
//
// Kerakli secretlar (merchant kalitlari kelgach o'rnatiladi):
//   CLICK_SERVICE_ID, CLICK_SECRET_KEY
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (avtomatik mavjud)
//
// Click bu endpoint'ni ikki marta chaqiradi: avval Prepare, keyin Complete.
// sign_string = md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id
//                    [+ merchant_prepare_id (complete)] + amount + action + sign_time)

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto }       from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const SERVICE_ID = Deno.env.get('CLICK_SERVICE_ID') ?? ''
const SECRET_KEY = Deno.env.get('CLICK_SECRET_KEY') ?? ''

// Click error codes
const E_OK          = 0
const E_SIGN        = -1
const E_AMOUNT      = -2
const E_ACTION      = -3
const E_ALREADY     = -4
const E_NOT_FOUND   = -5
const E_TRANS_NF    = -6
const E_CANCELLED   = -9

function admin() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  )
}

async function md5(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('MD5', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function num(v: unknown): number { return Number(String(v ?? '')) }

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  // Click form-encoded yuboradi
  let p: Record<string, string> = {}
  try {
    const ct = req.headers.get('content-type') ?? ''
    if (ct.includes('application/json')) {
      p = await req.json()
    } else {
      const form = await req.formData()
      for (const [k, v] of form.entries()) p[k] = String(v)
    }
  } catch {
    return Response.json({ error: E_ACTION, error_note: 'Bad request' })
  }

  // Konfiguratsiya tekshiruvi — kalitlarsiz hech narsani tasdiqlmaymiz
  if (!SERVICE_ID || !SECRET_KEY) {
    return Response.json({ error: E_SIGN, error_note: 'Gateway not configured' })
  }

  const action    = num(p.action)
  const orderId   = p.merchant_trans_id ?? ''
  const prepareId = p.merchant_prepare_id ?? ''

  // ── Signature ────────────────────────────────────────────────────────────
  const base = p.click_trans_id + p.service_id + SECRET_KEY + p.merchant_trans_id +
    (action === 1 ? prepareId : '') + p.amount + p.action + p.sign_time
  const expected = await md5(base)
  if (expected !== (p.sign_string ?? '').toLowerCase()) {
    return Response.json({ error: E_SIGN, error_note: 'SIGN CHECK FAILED' })
  }

  const sb = admin()
  const { data: order } = await sb.from('payment_orders').select('*').eq('id', orderId).maybeSingle()
  if (!order) return Response.json({ error: E_NOT_FOUND, error_note: 'Order not found' })
  if (Math.round(num(p.amount)) !== Math.round(num(order.amount))) {
    return Response.json({ error: E_AMOUNT, error_note: 'Incorrect amount' })
  }
  if (order.status === 'cancelled') return Response.json({ error: E_CANCELLED, error_note: 'Cancelled' })

  // ── Prepare (action = 0) ───────────────────────────────────────────────────
  if (action === 0) {
    if (order.status === 'paid') return Response.json({ error: E_ALREADY, error_note: 'Already paid' })
    await sb.from('payment_orders').update({
      provider_state: 1,
      provider_trans_id: p.click_trans_id,
      provider_create_time: Date.now(),
    }).eq('id', orderId)
    return Response.json({
      click_trans_id:     p.click_trans_id,
      merchant_trans_id:  orderId,
      merchant_prepare_id: orderId,
      error:              E_OK,
      error_note:         'Success',
    })
  }

  // ── Complete (action = 1) ──────────────────────────────────────────────────
  if (action === 1) {
    if (num(p.error) < 0) {
      await sb.from('payment_orders').update({
        status: 'cancelled', provider_state: -1, provider_cancel_time: Date.now(), provider_reason: num(p.error),
      }).eq('id', orderId)
      return Response.json({ error: E_CANCELLED, error_note: 'Cancelled by Click' })
    }
    if (order.status === 'paid') return Response.json({ error: E_ALREADY, error_note: 'Already paid' })
    if (order.provider_state !== 1) return Response.json({ error: E_TRANS_NF, error_note: 'Transaction not found' })

    await sb.rpc('apply_paid_order', { p_order: orderId, p_trans: p.click_trans_id })
    return Response.json({
      click_trans_id:    p.click_trans_id,
      merchant_trans_id: orderId,
      merchant_confirm_id: orderId,
      error:             E_OK,
      error_note:        'Success',
    })
  }

  return Response.json({ error: E_ACTION, error_note: 'Action not found' })
})
