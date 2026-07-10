/**
 * components/student/StudentQRAttendance.tsx
 * QR davomat (Premium). Free foydalanuvchida qulflangan → Premium modal.
 * Premium/Education'da QR kodni kiritib (kamera-tayyor) davomat belgilaydi.
 *
 * Mavjud tizimlarga ulanadi (yangi logika yaratilmaydi):
 *   subscription.service (reja) · qrAttendance.service (skan → attendance) ·
 *   PremiumModal (AssignmentsAI). Davomat XP/tanga/badge — Achievements avtomatik.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { QrCode, ScanLine, Lock, CheckCircle2, Loader2, AlertTriangle, Zap, Camera, X } from 'lucide-react'
import jsQR from 'jsqr'
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
  const [scanning, setScanning] = useState(false)

  const videoRef  = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef    = useRef<number | null>(null)

  const checkPlan = useCallback(async () => {
    const uid = auth.user?.id
    if (!uid) return
    const plan = await subscriptionService.getPlan(uid)
    setAllowed(plan === 'premium' || plan === 'education')
  }, [auth.user?.id])

  useEffect(() => { void checkPlan() }, [checkPlan])

  const submitCode = async (value: string) => {
    const uid = auth.user?.id
    const v = value.trim().toUpperCase()
    if (!uid || !v) return
    setBusy(true); setError(null)
    const res = await qrAttendanceService.recordScan(v, uid)
    if (res.ok) { setDone(true) }
    else { setError(res.error ?? t.qrError) }
    setBusy(false)
  }
  const submit = () => void submitCode(code)

  // ── Kamera skaneri (jsQR — universal, iOS'da ham) ──
  const stopScan = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    streamRef.current?.getTracks().forEach(tr => tr.stop())
    streamRef.current = null
    setScanning(false)
  }, [])

  const startScan = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setScanning(true)
      const video = videoRef.current
      if (!video) { stopScan(); return }
      video.srcObject = stream
      await video.play()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      const tick = () => {
        if (!streamRef.current || !video.videoWidth) { rafRef.current = requestAnimationFrame(tick); return }
        canvas.width = video.videoWidth; canvas.height = video.videoHeight
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
        const img = ctx?.getImageData(0, 0, canvas.width, canvas.height)
        const found = img ? jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' }) : null
        if (found?.data) {
          stopScan()
          setCode(found.data.trim().toUpperCase())
          void submitCode(found.data)
          return
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch {
      setError(t.qrCamDenied)
      stopScan()
    }
  }, [stopScan, t.qrCamDenied]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => stopScan(), [stopScan])

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
          {/* Kamera skaneri */}
          {scanning ? (
            <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.10)' }}>
              <video ref={videoRef} playsInline muted className="w-full aspect-square object-cover bg-black" />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center" aria-hidden="true">
                <div className="w-40 h-40 rounded-2xl" style={{ border: '2px solid rgba(147,187,255,0.85)' }} />
              </div>
              <button type="button" onClick={stopScan} aria-label="stop"
                className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center bg-black/55 text-white">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
              <p className="absolute bottom-2 inset-x-0 text-center text-[12px] font-semibold text-white/85">{t.qrScanning}</p>
            </div>
          ) : (
            <button type="button" onClick={() => void startScan()} disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-[14px] font-bold disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)', boxShadow: '0 6px 20px rgba(91,127,255,0.4)' }}>
              <Camera className="w-4 h-4" aria-hidden="true" /> {t.qrScanBtn}
            </button>
          )}

          <div className="flex items-center gap-2 text-[11px] text-white/30">
            <span className="flex-1 h-px bg-white/10" /> {t.qrOrCode} <span className="flex-1 h-px bg-white/10" />
          </div>

          {/* Qo'lda kod kiritish (zaxira) */}
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
          <button type="button" onClick={() => submit()} disabled={busy || !code.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-[14px] font-bold disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <QrCode className="w-4 h-4" aria-hidden="true" />}
            {busy ? t.qrChecking : t.qrMark}
          </button>
        </div>
      )}
    </div>
  )
}
