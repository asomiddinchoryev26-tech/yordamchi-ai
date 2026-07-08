/**
 * services/payment.service.ts
 * Qo'lda to'lov (card transfer + chek yuklash) — foydalanuvchi tomoni.
 *
 * Oqim: foydalanuvchi karta orqali pul o'tkazadi → chek rasmini yuklaydi →
 * `payments` jadvaliga status='pending' bilan yozadi → admin tasdiqlaydi
 * (approve_payment RPC) → premium aktivlashadi.
 *
 * XAVFSIZLIK: foydalanuvchi faqat status='pending' yoza oladi (RLS — 027).
 * O'zini premium qila OLMAYDI — bu faqat admin approve_payment orqali.
 */

import { supabase } from '@/lib/supabase'
import type { PaymentRow, PlanKey } from '@/types/lms.types'

const sb = supabase as unknown as { from: (t: string) => any }

const RECEIPTS_BUCKET = 'receipts'
const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
const MAX_BYTES   = 8 * 1024 * 1024   // 8 MB

export type SubmitPaymentInput = {
  userId:  string
  plan:    Exclude<PlanKey, 'free'>
  amount:  number
  receipt: File
  note?:   string
}

export const paymentService = {
  /** Chekni yuklaydi va 'pending' to'lov yozuvini yaratadi. */
  submitManualPayment: async (input: SubmitPaymentInput): Promise<void> => {
    const { userId, plan, amount, receipt, note } = input

    if (!VALID_TYPES.includes(receipt.type)) {
      throw new Error('Chek JPG, PNG, WebP yoki PDF bo\'lishi kerak')
    }
    if (receipt.size > MAX_BYTES) {
      throw new Error('Chek 8 MB dan kichik bo\'lishi kerak')
    }

    // 1) Chekni yuklash (receipts/{userId}/{timestamp}.{ext})
    const ext  = receipt.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .upload(path, receipt, { contentType: receipt.type, upsert: false })
    if (upErr) throw new Error('Chekni yuklab bo\'lmadi. Qayta urinib ko\'ring.')

    const { data: pub } = supabase.storage.from(RECEIPTS_BUCKET).getPublicUrl(path)

    // 2) 'pending' to'lov yozuvi (RLS: faqat pending, o'z user_id)
    const { error: insErr } = await sb.from('payments').insert({
      user_id:     userId,
      amount,
      currency:    'UZS',
      provider:    'card',
      status:      'pending',
      plan_type:   plan,
      receipt_url: pub?.publicUrl ?? null,
      metadata:    note ? { note } : {},
    })
    if (insErr) throw new Error('To\'lovni yuborib bo\'lmadi. Qayta urinib ko\'ring.')
  },

  /** Foydalanuvchining o'z to'lovlari (tarix/holat). */
  listMyPayments: async (userId: string): Promise<PaymentRow[]> => {
    try {
      const { data } = await sb.from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return (data ?? []) as PaymentRow[]
    } catch {
      return []
    }
  },
}
