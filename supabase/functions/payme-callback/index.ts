// Supabase Edge Function: payme-callback
// Payme (Paycom) Merchant API — JSON-RPC 2.0.
// Deploy: supabase functions deploy payme-callback --no-verify-jwt
//
// Kerakli secretlar (merchant kalitlari kelgach o'rnatiladi):
//   PAYME_KEY  (kassa kaliti — Basic auth: base64("Paycom:" + PAYME_KEY))
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (avtomatik mavjud)
//
// Account maydoni: Payme kabinetida `order_id` deb sozlanadi.
// Summa Payme'da tiyinda (so'm * 100).

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PAYME_KEY = Deno.env.get('PAYME_KEY') ?? ''
const TIMEOUT_MS = 12 * 60 * 60 * 1000  // 12 soat

// Payme error codes
const ERR = {
  auth:        { code: -32504, message: { uz: 'Avtorizatsiya xatosi', ru: 'Ошибка авторизации', en: 'Auth error' } },
  method:      { code: -32601, message: { uz: 'Metod topilmadi',      ru: 'Метод не найден',    en: 'Method not found' } },
  amount:      { code: -31001, message: { uz: 'Noto‘g‘ri summa',      ru: 'Неверная сумма',     en: 'Invalid amount' } },
  account:     { code: -31050, message: { uz: 'Buyurtma topilmadi',   ru: 'Заказ не найден',    en: 'Order not found' } },
  notFound:    { code: -31003, message: { uz: 'Tranzaksiya topilmadi',ru: 'Транзакция не найдена', en: 'Transaction not found' } },
  cantPerform: { code: -31008, message: { uz: 'Amalni bajarib bo‘lmaydi', ru: 'Невозможно выполнить', en: 'Unable to perform' } },
  cantCancel:  { code: -31007, message: { uz: 'Bekor qilib bo‘lmaydi',ru: 'Невозможно отменить', en: 'Unable to cancel' } },
}

function admin() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  )
}

function ok(id: unknown, result: unknown) {
  return Response.json({ jsonrpc: '2.0', id, result })
}
function fail(id: unknown, err: { code: number; message: unknown }, data?: unknown) {
  return Response.json({ jsonrpc: '2.0', id, error: { code: err.code, message: err.message, data } })
}

function authOk(req: Request): boolean {
  if (!PAYME_KEY) return false
  const h = req.headers.get('Authorization') ?? ''
  if (!h.startsWith('Basic ')) return false
  try {
    const decoded = atob(h.slice(6))       // "Paycom:<key>"
    return decoded === `Paycom:${PAYME_KEY}`
  } catch { return false }
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  let body: { id?: unknown; method?: string; params?: Record<string, any> } = {}
  try { body = await req.json() } catch { return fail(null, ERR.method) }
  const { id, method, params = {} } = body

  if (!authOk(req)) return fail(id, ERR.auth)

  const sb = admin()

  // Account'dan buyurtmani topish
  async function findByAccount() {
    const orderId = params.account?.order_id ?? ''
    if (!orderId) return null
    const { data } = await sb.from('payment_orders').select('*').eq('id', orderId).maybeSingle()
    return data
  }
  async function findByTrans() {
    const { data } = await sb.from('payment_orders').select('*').eq('provider_trans_id', params.id).eq('provider', 'payme').maybeSingle()
    return data
  }

  switch (method) {
    // ── CheckPerformTransaction ──────────────────────────────────────────────
    case 'CheckPerformTransaction': {
      const order = await findByAccount()
      if (!order) return fail(id, ERR.account, { order_id: 'Buyurtma topilmadi' })
      if (Math.round(Number(params.amount)) !== Math.round(Number(order.amount) * 100)) return fail(id, ERR.amount)
      if (order.status !== 'pending') return fail(id, ERR.cantPerform)
      return ok(id, { allow: true })
    }

    // ── CreateTransaction ──────────────────────────────────────────────────────
    case 'CreateTransaction': {
      const order = await findByAccount()
      if (!order) return fail(id, ERR.account, { order_id: 'Buyurtma topilmadi' })
      if (Math.round(Number(params.amount)) !== Math.round(Number(order.amount) * 100)) return fail(id, ERR.amount)

      // Shu tranzaksiya allaqachon yaratilgan bo'lsa — o'shani qaytaramiz
      if (order.provider_trans_id === params.id) {
        return ok(id, { create_time: order.provider_create_time, transaction: order.id, state: order.provider_state })
      }
      // Buyurtmada boshqa faol tranzaksiya bo'lsa yoki to'langan bo'lsa
      if (order.status !== 'pending' || (order.provider_trans_id && order.provider_state === 1)) {
        return fail(id, ERR.cantPerform)
      }
      const create_time = Number(params.time) || Date.now()
      await sb.from('payment_orders').update({
        provider_trans_id: params.id, provider_create_time: create_time, provider_state: 1,
      }).eq('id', order.id)
      return ok(id, { create_time, transaction: order.id, state: 1 })
    }

    // ── PerformTransaction ─────────────────────────────────────────────────────
    case 'PerformTransaction': {
      const order = await findByTrans()
      if (!order) return fail(id, ERR.notFound)
      if (order.provider_state === 2) {
        return ok(id, { transaction: order.id, perform_time: order.provider_perform_time, state: 2 })
      }
      if (order.provider_state !== 1) return fail(id, ERR.cantPerform)
      // Timeout — 12 soatdan oshgan bo'lsa bajarilmaydi
      if (Date.now() - Number(order.provider_create_time) > TIMEOUT_MS) {
        await sb.from('payment_orders').update({ status: 'cancelled', provider_state: -1, provider_cancel_time: Date.now(), provider_reason: 4 }).eq('id', order.id)
        return fail(id, ERR.cantPerform)
      }
      await sb.rpc('apply_paid_order', { p_order: order.id, p_trans: params.id })
      const { data: updated } = await sb.from('payment_orders').select('provider_perform_time').eq('id', order.id).maybeSingle()
      return ok(id, { transaction: order.id, perform_time: updated?.provider_perform_time ?? Date.now(), state: 2 })
    }

    // ── CancelTransaction ──────────────────────────────────────────────────────
    case 'CancelTransaction': {
      const order = await findByTrans()
      if (!order) return fail(id, ERR.notFound)
      const cancel_time = order.provider_cancel_time ?? Date.now()
      if (order.provider_state === 1) {
        await sb.from('payment_orders').update({ status: 'cancelled', provider_state: -1, provider_cancel_time: cancel_time, provider_reason: Number(params.reason) || null }).eq('id', order.id)
        return ok(id, { transaction: order.id, cancel_time, state: -1 })
      }
      if (order.provider_state === 2) {
        // To'langandan keyin bekor — reja ochiq qoladi (scaffold; qo'lda ko'rib chiqiladi)
        await sb.from('payment_orders').update({ status: 'cancelled', provider_state: -2, provider_cancel_time: cancel_time, provider_reason: Number(params.reason) || null }).eq('id', order.id)
        return ok(id, { transaction: order.id, cancel_time, state: -2 })
      }
      return ok(id, { transaction: order.id, cancel_time, state: order.provider_state })
    }

    // ── CheckTransaction ───────────────────────────────────────────────────────
    case 'CheckTransaction': {
      const order = await findByTrans()
      if (!order) return fail(id, ERR.notFound)
      return ok(id, {
        create_time:  order.provider_create_time ?? 0,
        perform_time: order.provider_perform_time ?? 0,
        cancel_time:  order.provider_cancel_time ?? 0,
        transaction:  order.id,
        state:        order.provider_state,
        reason:       order.provider_reason ?? null,
      })
    }

    // ── GetStatement ───────────────────────────────────────────────────────────
    case 'GetStatement': {
      const { data } = await sb.from('payment_orders').select('*').eq('provider', 'payme')
        .gte('provider_create_time', Number(params.from) || 0)
        .lte('provider_create_time', Number(params.to) || Date.now())
      const transactions = (data ?? []).filter((o: any) => o.provider_trans_id).map((o: any) => ({
        id: o.provider_trans_id, time: o.provider_create_time, amount: Math.round(Number(o.amount) * 100),
        account: { order_id: o.id }, create_time: o.provider_create_time, perform_time: o.provider_perform_time ?? 0,
        cancel_time: o.provider_cancel_time ?? 0, transaction: o.id, state: o.provider_state, reason: o.provider_reason ?? null,
      }))
      return ok(id, { transactions })
    }

    default:
      return fail(id, ERR.method)
  }
})
