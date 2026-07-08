/**
 * components/student/StudentQRAttendance.tsx
 * QR davomat (Premium). Free foydalanuvchida qulflangan → Premium modal.
 * Premium/Education'da QR kodni kiritib (kamera-tayyor) davomat belgilaydi.
 *
 * Mavjud tizimlarga ulanadi (yangi logika yaratilmaydi):
 *   subscription.service (reja) · qrAttendance.service (skan → attendance) ·
 *   PremiumModal (AssignmentsAI). Davomat XP/tanga/badge — Achievements avtomatik.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { QrCode, ScanLine, Lock, CheckCircle2, Loader2, AlertTriangle, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { subscriptionService } from '@/services/subscription.service'
import { qrAttendanceService } from '@/services/qrAttendance.service'
import { PremiumModal } from '@/components/student/AssignmentsAI'
import { useLanguage } from '@/contexts/LanguageContext'

const GLASS = {
  background: 'rgba(11,15,28,0.82)', backdropFilter: 'blur(28px) saturate(200%)',
  WebkitBackdropFilter: 'blur(28px) saturate(200%)', border: '1px solid rgba(255,255,255,0.08)',
} as const

export default function StudentQRAttendance() {
  const auth = useAuth()
  const { t } = useLanguage()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [code, setCode]       = useState('')
  const [busy, setBusy]       = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [premiumOpen, setPremiumOpen] = useState(false)

  const checkPlan = useCallback(async () => {
    const uid = auth.user?.id
    if (!uid) return
    const plan = await subscriptionService.getPlan(uid)
    setAllowed(plan === 'premium' || plan === 'education')
  }, [auth.user?.id])

  useEffect(() => { void checkPlan() }, [checkPlan])

  const submit = async () => {
    const uid = auth.user?.id
    if (!uid || !code.trim()) return
    setBusy(true); setError(null)
    const res = await qrAttendanceService.recordScan(code.trim(), uid)
    if (res.ok) { setDone(true) }
    else { setError(res.error ?? t.qrError) }
    setBusy(false)
  }

  // ── Free: qulflangan ──
  if (allowed === false) {
    return (
      <>
        <div className="rounded-[22px] p-6 text-center relative overflow-hidden" style={{ ...GLASS, border: '1px solid rgba(124,58,237,0.25)' }}>
          <div className="absolute -top-16 -right-12 w-40 h-40 rounded-full blur-[70px] opacity-40" style={{ background: '#7C3AED' }} aria-hidden="true" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
              <Lock className="w-6 h-6 text-[#C4B5FD]" aria-hidden="true" />
            </div>
            <h3 className="text-[16px] font-black text-white">{t.qrLockedTitle}</h3>
            <p className="text-[13px] text-white/55 mt-1.5 max-w-xs mx-auto leading-relaxed">{t.qrLockedDesc}</p>
            <button type="button" onClick={() => setPremiumOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-[13px] text-white text-[13.5px] font-bold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)', boxShadow: '0 6px 20px rgba(91,127,255,0.4)' }}>
              <Zap className="w-4 h-4" aria-hidden="true" /> {t.pmCta}
            </button>
          </div>
        </div>
        <PremiumModal open={premiumOpen} onClose={() => setPremiumOpen(false)} />
      </>
    )
  }

  // ── Premium: skaner (kod kiritish, kamera-tayyor) ──
  return (
    <div className="rounded-[22px] p-6" style={GLASS}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)', boxShadow: '0 0 18px rgba(91,127,255,0.4)' }}>
          <QrCode className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-white">{t.qrTitle}</h3>
          <p className="text-[12px] text-white/45">{t.qrSubtitle}</p>
        </div>
      </div>

      {done ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="rounded-[16px] p-5 text-center" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.28)' }}>
          <CheckCircle2 className="w-9 h-9 text-emerald-400 mx-auto mb-2" aria-hidden="true" />
          <p className="text-[15px] font-black text-emerald-300">{t.qrDone}</p>
          <p className="text-[12px] text-white/50 mt-1">{t.qrRewarded}</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <ScanLine className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" aria-hidden="true" />
            <input
              value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setError(null) }}
              placeholder={t.qrPlaceholder} maxLength={12}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-[15px] font-bold tracking-widest text-white/90 placeholder:text-white/25 placeholder:font-normal placeholder:tracking-normal outline-none uppercase"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
            />
          </div>
          {error && (
            <p role="alert" className="text-[12px] text-red-400 inline-flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> {error}
            </p>
          )}
          <button type="button" onClick={() => void submit()} disabled={busy || !code.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-[14px] font-bold disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)', boxShadow: '0 6px 20px rgba(91,127,255,0.4)' }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <QrCode className="w-4 h-4" aria-hidden="true" />}
            {busy ? t.qrChecking : t.qrMark}
          </button>
          <p className="text-[10.5px] text-white/25 text-center">{t.qrCameraSoon}</p>
        </div>
      )}
    </div>
  )
}
