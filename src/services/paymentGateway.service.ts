/**
 * services/paymentGateway.service.ts
 * Click / Payme to'lov shlyuzi (karkas). Buyurtma DB'da ochiladi (create_payment_order),
 * so'ng foydalanuvchi provayder checkout sahifasiga yo'naltiriladi. To'lov tasdiqlanishi
 * edge-funksiyalar orqali keladi (click-callback / payme-callback) → apply_paid_order.
 *
 * Merchant identifikatorlari Vite env'dan olinadi (kalitlar kelgach .env'ga qo'yiladi):
 *   VITE_CLICK_SERVICE_ID, VITE_CLICK_MERCHANT_ID, VITE_PAYME_MERCHANT_ID
 * Sozlanmagan bo'lsa — isConfigured() false, UI tugmani ko'rsatmaydi.
 */

import { supabase } from '@/lib/supabase'

const sbRpc = supabase as unknown as {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>
}

export type GatewayProvider = 'click' | 'payme'

const env = import.meta.env as unknown as Record<string, string | undefined>
const CLICK_SERVICE_ID  = env.VITE_CLICK_SERVICE_ID
const CLICK_MERCHANT_ID = env.VITE_CLICK_MERCHANT_ID
const PAYME_MERCHANT_ID = env.VITE_PAYME_MERCHANT_ID

function returnUrl(): string {
  return `${window.location.origin}/dashboard`
}

export const paymentGatewayService = {
  /** Provayder ishga tayyor (merchant identifikatorlari o'rnatilgan)mi? */
  isConfigured(provider: GatewayProvider): boolean {
    return provider === 'click'
      ? Boolean(CLICK_SERVICE_ID && CLICK_MERCHANT_ID)
      : Boolean(PAYME_MERCHANT_ID)
  },

  /** DB'da pending buyurtma ochadi. Qaytadi: { order_id, amount }. */
  createOrder: async (plan: 'premium' | 'pro', provider: GatewayProvider): Promise<{ order_id: string; amount: number }> => {
    const { data, error } = await sbRpc.rpc('create_payment_order', { p_plan: plan, p_provider: provider })
    if (error || !data) throw new Error(error?.message ?? 'order_failed')
    return data as { order_id: string; amount: number }
  },

  /** Click checkout URL (summa so'mda). */
  clickUrl(orderId: string, amount: number): string {
    const ret = encodeURIComponent(returnUrl())
    return `https://my.click.uz/services/pay?service_id=${CLICK_SERVICE_ID}&merchant_id=${CLICK_MERCHANT_ID}` +
      `&amount=${amount}&transaction_param=${orderId}&return_url=${ret}`
  },

  /** Payme checkout URL (summa tiyinda, base64 kodlangan parametrlar). */
  paymeUrl(orderId: string, amount: number): string {
    const tiyin = Math.round(amount * 100)
    const raw = `m=${PAYME_MERCHANT_ID};ac.order_id=${orderId};a=${tiyin};c=${returnUrl()}`
    return `https://checkout.paycom.uz/${btoa(raw)}`
  },

  /** Buyurtma ochib, provayder checkout sahifasiga yo'naltiradi. */
  startCheckout: async (plan: 'premium' | 'pro', provider: GatewayProvider): Promise<void> => {
    const { order_id, amount } = await paymentGatewayService.createOrder(plan, provider)
    window.location.href = provider === 'click'
      ? paymentGatewayService.clickUrl(order_id, amount)
      : paymentGatewayService.paymeUrl(order_id, amount)
  },
}
