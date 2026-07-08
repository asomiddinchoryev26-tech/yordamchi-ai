/**
 * components/student/AssignmentsAI.tsx
 * Topshiriqlar sahifasi uchun AI bo'limlari: header+soat, AI limit widgeti,
 * Premium modal, AI baho kartasi, analitika qatori.
 * YordamchiAI dizayn tili (dark glass, blue/purple gradient, glow).
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, CalendarClock, Sparkles, Brain, Lightbulb, AlertTriangle,
  CheckCircle2, X, Rocket, CreditCard, Zap, TrendingUp, BarChart3, Target,
  Loader2, Upload,
} from 'lucide-react'
import type { UsageInfo } from '@/services/aiUsage.service'
import type { AIReviewResult } from '@/services/aiReview.service'
import { paymentService } from '@/services/payment.service'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

// Qo'lda to'lov — karta raqami (admin sozlaydi). Real integratsiya (Click/Payme) keyingi bosqich.
const TRANSFER_CARD  = '8600 0304 1234 5678'
// Reja narxlari (plans katalogiga mos — 027)
const PLAN_AMOUNT: Record<'premium' | 'pro', number> = { premium: 49000, pro: 99000 }

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]
const GLASS = {
  background: 'rgba(11,15,28,0.82)',
  backdropFilter: 'blur(28px) saturate(200%)',
  WebkitBackdropFilter: 'blur(28px) saturate(200%)',
  border: '1px solid rgba(255,255,255,0.08)',
} as const

// ── Live Tashkent clock ───────────────────────────────────────────────────────
function snap() {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date())
  const g = (t: string) => p.find(x => x.type === t)?.value ?? '00'
  const h = g('hour') === '24' ? '00' : g('hour')
  return { date: `${g('day')}.${g('month')}.${g('year')}`, time: `${h}:${g('minute')}:${g('second')}` }
}
function useClock() {
  const [s, setS] = useState(snap)
  useEffect(() => { const id = setInterval(() => setS(snap()), 1000); return () => clearInterval(id) }, [])
  return s
}

// ═══ Header ═══════════════════════════════════════════════════════════════════

export function AssignmentsHeader() {
  const { date, time } = useClock()
  const { t } = useLanguage()
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#5B5CF6,#7C3AED)', boxShadow: '0 0 20px rgba(91,92,246,0.4)' }}>
          <ClipboardList className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-[22px] font-black text-white tracking-tight">{t.asgTitle}</h1>
          <p className="text-[12.5px] text-white/45 mt-0.5">{t.asgSubtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold text-white/70"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <CalendarClock className="w-3.5 h-3.5 text-white/40" aria-hidden="true" />{date}
        </div>
        <div className="inline-flex items-center px-3 py-1.5 rounded-xl text-[13px] font-bold tabular-nums"
          style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.22)', color: '#C7D2FE', textShadow: '0 0 12px rgba(165,180,252,0.5)' }}>
          {time}
        </div>
      </div>
    </header>
  )
}

// ═══ AI usage widget ═══════════════════════════════════════════════════════════

function UsageMeter({ label, info, color, onUpgrade }: {
  label: string; info: UsageInfo; color: string; onUpgrade: () => void
}) {
  const { t } = useLanguage()
  const pct    = info.limit > 0 ? Math.min(100, (info.used / info.limit) * 100) : 0
  const nearOut = info.remaining <= Math.max(1, Math.round(info.limit * 0.15))
  return (
    <div className="flex-1 min-w-[150px]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11.5px] font-semibold text-white/60">{label}</span>
        <span className="text-[11.5px] font-bold tabular-nums" style={{ color: nearOut ? '#F59E0B' : color }}>
          {info.remaining}/{info.limit} {t.achLeft}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <motion.div className="h-full rounded-full"
          style={{ background: nearOut ? 'linear-gradient(90deg,#F59E0B,#EF4444)' : `linear-gradient(90deg,${color},#7C3AED)` }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: EASE }} />
      </div>
      {info.remaining === 0 && (
        <button type="button" onClick={onUpgrade} className="mt-1.5 text-[10.5px] font-bold text-[#F59E0B] hover:opacity-80">
          {t.asgLimitOver}
        </button>
      )}
    </div>
  )
}

export function AIUsageWidget({ check, chat, onUpgrade }: {
  check: UsageInfo; chat: UsageInfo; onUpgrade: () => void
}) {
  const { t } = useLanguage()
  return (
    <div className="rounded-[20px] p-4" style={GLASS}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-[9px] flex items-center justify-center"
          style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}>
          <Sparkles className="w-4 h-4 text-[#C4B5FD]" aria-hidden="true" />
        </div>
        <h2 className="text-[13.5px] font-bold text-white/85">{t.asgAICapabilities}</h2>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <UsageMeter label={t.asgAICheck} info={check} color="#5B7FFF" onUpgrade={onUpgrade} />
        <UsageMeter label={t.asgAIChat}  info={chat}  color="#22D3EE" onUpgrade={onUpgrade} />
      </div>
    </div>
  )
}

// ═══ Premium modal ═════════════════════════════════════════════════════════════

const PAY: { name: string; color: string; Icon?: typeof CreditCard; labelKey?: keyof Translations }[] = [
  { name: 'Payme', color: '#00CFCA' },
  { name: 'Click', color: '#00A0E3' },
  { name: 'Karta', color: '#7C3AED', Icon: CreditCard, labelKey: 'pmCard' },
]

export function PremiumModal({ open, onClose, initialPlan }: { open: boolean; onClose: () => void; initialPlan?: 'premium' | 'pro' }) {
  const { t } = useLanguage()
  const auth = useAuth()
  const feats = [t.pmF1, t.pmF2, t.pmF3]

  const [mode, setMode]   = useState<'info' | 'pay' | 'done' | 'pending'>('info')
  const [plan, setPlan]   = useState<'premium' | 'pro'>(initialPlan ?? 'premium')
  const [file, setFile]   = useState<File | null>(null)
  const [busy, setBusy]   = useState(false)
  const [err,  setErr]    = useState<string | null>(null)

  // Ochilganda holatni tiklash + to'lov holatini kuzatish (pending bo'lsa ko'rsatamiz)
  useEffect(() => {
    if (!open) { setMode('info'); setFile(null); setErr(null); setBusy(false); return }
    setPlan(initialPlan ?? 'premium')
    const uid = auth.user?.id
    if (!uid) return
    void paymentService.listMyPayments(uid).then(list => {
      if (list.some(p => p.status === 'pending')) setMode('pending')
    })
  }, [open, initialPlan, auth.user?.id])

  const submitPayment = async () => {
    if (!auth.user?.id || !file) { setErr(t.pmReceiptRequired); return }
    setBusy(true); setErr(null)
    try {
      await paymentService.submitManualPayment({
        userId: auth.user.id, plan, amount: PLAN_AMOUNT[plan], receipt: file,
      })
      setMode('done')
    } catch (e) {
      setErr(e instanceof Error ? e.message : t.pmPayError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div className="absolute inset-0" style={{ background: 'rgba(4,6,12,0.7)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden="true" />
          <motion.div
            role="dialog" aria-modal="true"
            className="relative w-full max-w-md rounded-[24px] p-6 overflow-hidden"
            style={{ ...GLASS, border: '1px solid rgba(124,58,237,0.35)', boxShadow: '0 0 60px rgba(124,58,237,0.3)' }}
            initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.28, ease: EASE }}
          >
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-[70px] opacity-40" style={{ background: '#7C3AED' }} aria-hidden="true" />
            <button type="button" onClick={onClose} aria-label={t.asgClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="relative">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)', boxShadow: '0 8px 24px rgba(124,58,237,0.5)' }}>
                <Rocket className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-[19px] font-black text-white tracking-tight">
                {mode === 'done' ? t.pmPaySuccess : mode === 'pending' ? t.pmPendingTitle : mode === 'pay' ? t.pmPayTitle : t.pmTitle}
              </h3>

              {/* ── VIEW: info ── */}
              {mode === 'info' && (<>
                <p className="text-[13.5px] text-white/55 mt-1.5 leading-relaxed">{t.pmDesc}</p>
                <ul className="mt-4 space-y-2">
                  {feats.map(f => (
                    <li key={f} className="flex items-center gap-2 text-[12.5px] text-white/70">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />{f}
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => setMode('pay')}
                  className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-[14px] text-white text-[14px] font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)', boxShadow: '0 6px 24px rgba(91,127,255,0.45)' }}>
                  <Zap className="w-4 h-4" aria-hidden="true" /> {t.pmCta}
                </button>
                <p className="text-[10.5px] text-white/30 text-center mt-3 mb-2">{t.pmPayMethods}</p>
                <div className="grid grid-cols-3 gap-2">
                  {PAY.map(p => (
                    <div key={p.name} className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11.5px] font-bold text-white/70"
                      style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${p.color}40` }}>
                      {p.Icon ? <p.Icon className="w-3.5 h-3.5" aria-hidden="true" /> : null}{p.labelKey ? t[p.labelKey] : p.name}
                    </div>
                  ))}
                </div>
              </>)}

              {/* ── VIEW: pay (qo'lda to'lov — karta + chek yuklash) ── */}
              {mode === 'pay' && (<>
                <p className="text-[13px] text-white/55 mt-1.5 leading-relaxed">{t.pmPayHint}</p>

                {/* Reja tanlash — Premium / Pro */}
                <p className="text-[11px] font-medium text-white/50 mt-4 mb-1.5">{t.pmChoosePlan}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['premium', 'pro'] as const).map(pk => (
                    <button key={pk} type="button" onClick={() => setPlan(pk)}
                      className="py-2.5 rounded-xl text-[12.5px] font-bold transition-all"
                      style={plan === pk
                        ? { background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)', color: '#fff', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }
                        : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}>
                      {pk === 'pro' ? 'Pro' : 'Premium'}
                      <span className="block text-[10px] font-medium opacity-70 mt-0.5">{PLAN_AMOUNT[pk].toLocaleString()} UZS</span>
                    </button>
                  ))}
                </div>

                <div className="mt-3 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.3)' }}>
                  <p className="text-[10.5px] text-white/40 uppercase tracking-wide">{t.pmCardTransfer}</p>
                  <p className="text-[18px] font-black text-white tracking-widest tabular-nums mt-1">{TRANSFER_CARD}</p>
                  <p className="text-[12.5px] text-emerald-400 font-bold mt-2">{PLAN_AMOUNT[plan].toLocaleString()} UZS / {t.pmPerMonth}</p>
                </div>

                <label className="mt-4 block cursor-pointer">
                  <span className="text-[11px] font-medium text-white/50">{t.pmUploadReceipt}</span>
                  <div className="mt-1.5 flex items-center gap-2 py-3 px-3 rounded-xl text-[12.5px] text-white/70 transition-colors hover:bg-white/[0.06]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.2)' }}>
                    <Upload className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span className="truncate">{file ? file.name : t.pmSelectReceipt}</span>
                  </div>
                  <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden"
                    onChange={e => { setFile(e.target.files?.[0] ?? null); setErr(null) }} />
                </label>

                {err && <p className="text-[11.5px] text-red-400 mt-2">{err}</p>}

                <button type="button" onClick={() => void submitPayment()} disabled={busy || !file}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-[14px] text-white text-[14px] font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)', boxShadow: '0 6px 24px rgba(91,127,255,0.45)' }}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <CreditCard className="w-4 h-4" aria-hidden="true" />}
                  {t.pmSubmitPayment}
                </button>
                <button type="button" onClick={() => setMode('info')} className="mt-2 w-full py-2 text-[12px] text-white/40 hover:text-white/70 transition-colors">
                  {t.pmBack}
                </button>
              </>)}

              {/* ── VIEW: done ── */}
              {mode === 'done' && (
                <div className="mt-3 text-center">
                  <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: 'rgba(16,185,129,0.15)' }}>
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" aria-hidden="true" />
                  </div>
                  <p className="text-[13px] text-white/60 leading-relaxed">{t.pmPaySuccessDesc}</p>
                  <button type="button" onClick={onClose}
                    className="mt-5 w-full py-3 rounded-[14px] text-white text-[14px] font-bold hover:opacity-90 active:scale-[0.98] transition-all"
                    style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)' }}>
                    {t.asgClose}
                  </button>
                </div>
              )}

              {/* ── VIEW: pending (to'lov holati kuzatuvi) ── */}
              {mode === 'pending' && (
                <div className="mt-3 text-center">
                  <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: 'rgba(245,158,11,0.15)' }}>
                    <Loader2 className="w-7 h-7 text-amber-400 animate-spin" aria-hidden="true" />
                  </div>
                  <p className="text-[13px] text-white/60 leading-relaxed">{t.pmPendingDesc}</p>
                  <button type="button" onClick={onClose}
                    className="mt-5 w-full py-3 rounded-[14px] text-white text-[14px] font-bold hover:opacity-90 active:scale-[0.98] transition-all"
                    style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)' }}>
                    {t.asgClose}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ═══ AI review card ════════════════════════════════════════════════════════════

function scoreColor(s: number) { return s >= 80 ? '#22C55E' : s >= 55 ? '#F59E0B' : '#EF4444' }

export function AIReviewCard({ review }: { review: AIReviewResult }) {
  const c = scoreColor(review.score)
  const { t } = useLanguage()
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}
      className="mt-3 rounded-[16px] p-4"
      style={{ background: 'linear-gradient(135deg, rgba(91,127,255,0.08), rgba(124,58,237,0.10))', border: '1px solid rgba(124,58,237,0.25)' }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)' }}>
          <Brain className="w-4 h-4 text-[#C4B5FD]" aria-hidden="true" />
        </div>
        <span className="text-[12px] font-bold text-white/80">{t.arAIScore}</span>
        <span className="ml-auto text-[22px] font-black tabular-nums" style={{ color: c }}>{review.score}%</span>
      </div>

      {review.feedback && (
        <div className="mb-2.5">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/35 mb-1">{t.achAIAnalysis}</p>
          <p className="text-[12.5px] text-white/70 leading-relaxed">{review.feedback}</p>
        </div>
      )}

      <ReviewList label={t.arMistakes} Icon={AlertTriangle} color="#EF4444" items={review.mistakes} />
      <ReviewList label={t.achAIRec} Icon={Lightbulb} color="#F59E0B" items={review.recommendations} />
      <ReviewList label={t.arWeakTopics} Icon={Target} color="#A78BFA" items={review.weakTopics} />
    </motion.div>
  )
}

function ReviewList({ label, Icon, color, items }: {
  label: string; Icon: typeof Brain; color: string; items: string[]
}) {
  if (!items.length) return null
  return (
    <div className="mt-2.5">
      <p className="text-[10.5px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ color }}>
        <Icon className="w-3 h-3" aria-hidden="true" />{label}
      </p>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-[12px] text-white/60 leading-snug pl-3 relative">
            <span className="absolute left-0 top-1.5 w-1 h-1 rounded-full" style={{ background: color }} aria-hidden="true" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ═══ Analytics row ═════════════════════════════════════════════════════════════

export function AssignmentsAnalytics({ completed, avgScore, improvement, weekly }: {
  completed: number; avgScore: number; improvement: number; weekly: number
}) {
  const { t } = useLanguage()
  const cards: { label: string; value: string; Icon: typeof Brain; color: string }[] = [
    { label: t.lessCompleted,   value: String(completed),        Icon: CheckCircle2, color: '#22C55E' },
    { label: t.anAvgScore,      value: `${avgScore}%`,           Icon: BarChart3,    color: '#5B7FFF' },
    { label: t.anImprovement,   value: `${improvement > 0 ? '+' : ''}${improvement}%`, Icon: TrendingUp, color: '#A78BFA' },
    { label: t.anWeekly,        value: String(weekly),           Icon: Target,       color: '#22D3EE' },
  ]
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {cards.map(c => (
        <div key={c.label} className="rounded-[16px] p-3.5" style={GLASS}>
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center"
              style={{ background: `${c.color}18`, border: `1px solid ${c.color}30` }}>
              <c.Icon className="w-4 h-4" style={{ color: c.color }} aria-hidden="true" />
            </div>
            <span className="text-[18px] font-black tabular-nums" style={{ color: c.color }}>{c.value}</span>
          </div>
          <p className="text-[11px] text-white/40 font-medium mt-2.5">{c.label}</p>
        </div>
      ))}
    </div>
  )
}
