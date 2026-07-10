/**
 * components/admin/OrgBillingCard.tsx
 *
 * Per-organization billing widget for org admins:
 *   • shows the organization's current plan (+ expiry)
 *   • lets the admin request an upgrade (submit_org_payment → pending)
 *   • shows a pending request awaiting platform approval
 */

import { useState, useEffect } from 'react'
import { Crown, Check, Loader2, Clock, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { paymentGatewayService } from '@/services/paymentGateway.service'

type Plan = { key: string; name: string; price_uzs: string }

// loose caller — organizations/plans/payments + RPCs aren't in the generated types
const sb = supabase as unknown as {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
  from: (t: string) => any
}

const fmtPrice = (uzs: string) => {
  const n = Number(uzs)
  return n === 0 ? 'Bepul' : `${n.toLocaleString('uz-UZ')} so'm/oy`
}

export function OrgBillingCard() {
  const auth = useAuth()
  const [plan,     setPlan]     = useState('free')
  const [expiry,   setExpiry]   = useState<string | null>(null)
  const [plans,    setPlans]    = useState<Plan[]>([])
  const [pending,  setPending]  = useState<{ plan_type: string } | null>(null)
  const [chosen,   setChosen]   = useState<string | null>(null)
  const [receipt,  setReceipt]  = useState('')
  const [uploading,setUploading]= useState(false)
  const [busy,     setBusy]     = useState(false)
  const [err,      setErr]      = useState<string | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !auth.user?.id) return
    setUploading(true); setErr(null)
    const ext  = file.name.split('.').pop() || 'jpg'
    const path = `${auth.user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('receipts').upload(path, file, { upsert: true })
    if (error) { setErr('Chekni yuklashda xatolik.'); setUploading(false); return }
    setReceipt(supabase.storage.from('receipts').getPublicUrl(path).data.publicUrl)
    setUploading(false)
  }

  useEffect(() => { void load() }, [])

  async function load() {
    try {
      const { data: p }   = await sb.rpc('my_org_plan')
      setPlan(typeof p === 'string' ? p : 'free')
      const { data: org } = await sb.from('organizations').select('plan_expires_at').limit(1).maybeSingle()
      setExpiry(org?.plan_expires_at ?? null)
      const { data: pl }  = await sb.from('plans').select('key, name, price_uzs').order('sort_order')
      setPlans((pl ?? []) as Plan[])
      const { data: pay } = await sb.from('payments').select('plan_type, status').eq('status', 'pending').limit(1).maybeSingle()
      setPending(pay ?? null)
    } catch { /* ignore */ }
  }

  async function submit() {
    if (!chosen) return
    setBusy(true); setErr(null)
    const { error } = await sb.rpc('submit_org_payment', { p_plan: chosen, p_receipt_url: receipt.trim() })
    if (error) { setErr("So'rov yuborilmadi. Qayta urinib ko'ring."); setBusy(false); return }
    setChosen(''); setReceipt(''); setBusy(false); void load()
  }

  // Click / Payme shlyuzi orqali to'lash — buyurtma ochib checkout'ga yo'naltiradi
  async function payVia(provider: 'click' | 'payme') {
    if (!chosen || (chosen !== 'premium' && chosen !== 'pro')) return
    setBusy(true); setErr(null)
    try { await paymentGatewayService.startCheckout(chosen, provider) }
    catch { setErr("To'lovni boshlashda xatolik."); setBusy(false) }
  }
  const hasGateway = paymentGatewayService.isConfigured('click') || paymentGatewayService.isConfigured('payme')

  const isPaid  = plan !== 'free'
  const upgrades = plans.filter(p => p.key !== 'free' && p.key !== plan)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: isPaid ? 'linear-gradient(135deg,#F59E0B,#F97316)' : '#f3f4f6' }}>
            <Crown className={isPaid ? 'w-5 h-5 text-white' : 'w-5 h-5 text-gray-400'} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Tashkilot rejasi</p>
            <p className="text-xs text-gray-500">
              <span className="font-semibold uppercase" style={{ color: isPaid ? '#F59E0B' : '#6b7280' }}>{plan}</span>
              {isPaid && expiry && <> · {new Date(expiry).toLocaleDateString('uz-UZ')} gacha</>}
            </p>
          </div>
        </div>
      </div>

      {pending ? (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            <b className="uppercase">{pending.plan_type}</b> rejaga so'rov yuborildi — tasdiqlanishi kutilmoqda.
          </p>
        </div>
      ) : chosen ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            <b className="uppercase">{chosen}</b> rejaga o'tish uchun to'lov usulini tanlang.
          </p>

          {/* Click / Payme shlyuzi (merchant kalitlari o'rnatilgan bo'lsa) */}
          {hasGateway && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {paymentGatewayService.isConfigured('click') && (
                  <button type="button" onClick={() => void payVia('click')} disabled={busy}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00A6E9] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Click orqali to'lash
                  </button>
                )}
                {paymentGatewayService.isConfigured('payme') && (
                  <button type="button" onClick={() => void payVia('payme')} disabled={busy}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#33CCCC] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Payme orqali to'lash
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <span className="flex-1 h-px bg-gray-200" /> yoki chek yuklang <span className="flex-1 h-px bg-gray-200" />
              </div>
            </>
          )}

          <label className="flex items-center justify-center gap-2 w-full px-3.5 py-3 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-colors">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : receipt ? <Check className="w-4 h-4 text-emerald-500" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Yuklanmoqda…' : receipt ? 'Chek yuklandi ✓' : "To'lov chekini yuklash (rasm)"}
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setChosen(null)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Bekor</button>
            <button type="button" onClick={submit} disabled={busy}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "So'rov yuborish"}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {upgrades.map(p => (
            <button key={p.key} type="button" onClick={() => { setChosen(p.key); setErr(null) }}
              className="flex items-center justify-between gap-2 p-3.5 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors text-left">
              <div>
                <p className="text-sm font-bold text-gray-900 capitalize">{p.name}</p>
                <p className="text-xs text-gray-500">{fmtPrice(p.price_uzs)}</p>
              </div>
              <Check className="w-4 h-4 text-blue-500" />
            </button>
          ))}
          {upgrades.length === 0 && (
            <p className="text-sm text-gray-400 col-span-full">Siz eng yuqori rejadasiz. 🎉</p>
          )}
        </div>
      )}
    </div>
  )
}
