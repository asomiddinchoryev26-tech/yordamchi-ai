/**
 * pages/auth/OnboardingPage.tsx
 *
 * Shown after signup when the user has no organization yet.
 *   • Create a new organization  → caller becomes its admin (create_organization RPC)
 *   • Join an existing one by code → student / teacher (join_organization RPC)
 *
 * Uses the same V6 dark-premium design language as the auth pages.
 */

import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Building2, LogIn, AlertCircle, ArrowRight, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/routes/paths'
import { LogoIcon } from '@/components/common/Logo'
import type { UserRole } from '@/types/auth.types'

const ROLE_PATH: Record<UserRole, string> = {
  student: PATHS.STUDENT.ROOT,
  teacher: PATHS.TEACHER.ROOT,
  admin:   PATHS.ADMIN.ROOT,
}

// Un-generated RPCs → loose caller
const sbRpc = supabase as unknown as {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
}

const PAGE_BG: React.CSSProperties = { background: '#070B14' }
const CARD: React.CSSProperties = {
  background: 'rgba(11,15,28,0.85)', backdropFilter: 'blur(28px) saturate(200%)', WebkitBackdropFilter: 'blur(28px) saturate(200%)',
  border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
  borderRadius: 22, padding: '2rem',
}
const INPUT: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 12, color: 'rgba(255,255,255,0.9)', fontSize: 14, padding: '11px 14px', outline: 'none',
}

function mapError(msg: string): string {
  if (msg.includes('invalid_code'))   return "Bunday kod topilmadi. Kodni tekshiring."
  if (msg.includes('already_in_org'))  return "Siz allaqachon tashkilotga a'zosiz."
  if (msg.includes('name_required'))   return "Tashkilot nomini kiriting."
  if (msg.includes('invalid_role'))    return "Rol noto'g'ri."
  if (msg.includes('seats_full'))      return "Tashkilot o'rinlari to'lgan. Administrator bilan bog'laning."
  return "Xatolik yuz berdi. Qayta urinib ko'ring."
}

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [mode,    setMode]    = useState<'create' | 'join'>(user?.role === 'admin' ? 'create' : 'join')
  const [orgName, setOrgName] = useState('')
  const [code,    setCode]    = useState('')
  const [joinRole,setJoinRole]= useState<'student' | 'teacher'>(user?.role === 'teacher' ? 'teacher' : 'student')
  const [busy,    setBusy]    = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [copied,  setCopied]  = useState(false)

  // Already has an organization (and not mid-create-success) → straight to dashboard
  if (user && user.organizationId && !createdCode) return <Navigate to={ROLE_PATH[user.role]} replace />

  async function handleCreate(e: { preventDefault(): void }) {
    e.preventDefault()
    setBusy(true); setError(null)
    const { data, error: rpcErr } = await sbRpc.rpc('create_organization', { p_name: orgName.trim() })
    if (rpcErr) { setError(mapError(rpcErr.message)); setBusy(false); return }
    // Show the join code so the admin can share it, then continue on their action.
    setCreatedCode((data as { join_code?: string } | null)?.join_code ?? '—')
    setBusy(false)
  }

  async function finishCreate() {
    await refreshUser()
    navigate(PATHS.ADMIN.ROOT, { replace: true })
  }

  async function handleJoin(e: { preventDefault(): void }) {
    e.preventDefault()
    setBusy(true); setError(null)
    const { error: rpcErr } = await sbRpc.rpc('join_organization', { p_code: code.trim().toUpperCase(), p_role: joinRole })
    if (rpcErr) { setError(mapError(rpcErr.message)); setBusy(false); return }
    await refreshUser()
    navigate(ROLE_PATH[joinRole], { replace: true })
  }

  // ── Success: organization created — show the shareable join code ───────────
  if (createdCode) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={PAGE_BG}>
        <div className="w-full max-w-sm sm:max-w-[440px]">
          <div style={CARD} className="text-center">
            <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(34,197,94,0.14)', border: '1px solid rgba(34,197,94,0.28)' }}>
              <Check className="w-8 h-8 text-emerald-400" aria-hidden="true" />
            </div>
            <h2 className="text-[20px] font-black text-white mb-2">Tashkilot yaratildi! 🎉</h2>
            <p className="text-[13px] text-white/45 mb-5 leading-relaxed">
              Quyidagi kodni <span className="text-white/70 font-semibold">o'qituvchi va talabalarga</span> ulashing —
              ular shu kod bilan tashkilotingizga qo'shiladi.
            </p>
            <div className="flex items-center justify-center gap-3 p-3.5 rounded-[14px] mb-5"
              style={{ background: 'rgba(91,127,255,0.10)', border: '1px solid rgba(91,127,255,0.28)' }}>
              <span className="text-[26px] font-black text-white tracking-[0.25em]" style={{ fontFamily: 'ui-monospace, monospace' }}>{createdCode}</span>
              <button type="button" onClick={() => { navigator.clipboard.writeText(createdCode).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className="w-9 h-9 flex items-center justify-center rounded-[10px] transition-all hover:bg-white/[0.08]" title="Nusxa olish">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/50" />}
              </button>
            </div>
            <button type="button" onClick={finishCreate}
              className="w-full flex items-center justify-center gap-2 py-[13px] rounded-[13px] text-white text-[14px] font-bold transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#5B7FFF 0%,#7C3AED 100%)', boxShadow: '0 6px 24px rgba(91,127,255,0.4)' }}>
              Boshqaruv paneliga o'tish <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={PAGE_BG}>
      <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle,#5B7FFF,transparent)' }} aria-hidden="true" />
      <div className="fixed bottom-0 right-0 w-80 h-80 rounded-full blur-[100px] opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle,#7C3AED,transparent)' }} aria-hidden="true" />

      <div className="relative w-full max-w-sm sm:max-w-[440px]">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <LogoIcon className="w-9 h-9" />
          <span className="text-[17px] font-black text-white tracking-tight">YordamchiAI</span>
        </div>

        <div style={CARD}>
          <h2 className="text-[21px] font-black text-white tracking-tight">Tashkilotni sozlang</h2>
          <p className="text-[13px] text-white/40 mt-1 mb-5">
            Boshlash uchun yangi tashkilot yarating yoki mavjudiga qo'shiling.
          </p>

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {([['create','Yangi tashkilot',Building2],['join','Qo\'shilish',LogIn]] as const).map(([m, label, Icon]) => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(null) }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-[12px] text-[13px] font-bold transition-all"
                style={mode === m
                  ? { background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)', color: '#fff', boxShadow: '0 4px 16px rgba(91,127,255,0.35)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.10)' }}>
                <Icon className="w-4 h-4" aria-hidden="true" /> {label}
              </button>
            ))}
          </div>

          {mode === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[11.5px] font-bold text-white/40 uppercase tracking-[0.12em] mb-1.5">Tashkilot nomi</label>
                <input value={orgName} onChange={e => { setOrgName(e.target.value); setError(null) }}
                  placeholder="Masalan: 1-son maktab" style={INPUT} autoFocus />
                <p className="text-[11.5px] text-white/30 mt-1.5">Siz bu tashkilotning administratori bo'lasiz.</p>
              </div>
              {error && <ErrorBox msg={error} />}
              <SubmitBtn busy={busy} disabled={!orgName.trim()} label="Tashkilot yaratish" />
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-[11.5px] font-bold text-white/40 uppercase tracking-[0.12em] mb-1.5">Tashkilot kodi</label>
                <input value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setError(null) }}
                  placeholder="Masalan: FXRUGT" maxLength={6}
                  style={{ ...INPUT, letterSpacing: '0.3em', fontWeight: 700, textAlign: 'center', fontFamily: 'ui-monospace, monospace' }} autoFocus />
                <p className="text-[11.5px] text-white/30 mt-1.5">Kodni tashkilot administratoridan oling.</p>
              </div>
              <div>
                <label className="block text-[11.5px] font-bold text-white/40 uppercase tracking-[0.12em] mb-1.5">Rolingiz</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['student','teacher'] as const).map(r => (
                    <button key={r} type="button" onClick={() => setJoinRole(r)}
                      className="py-2.5 rounded-[12px] text-[13px] font-semibold transition-all"
                      style={joinRole === r
                        ? { background: 'rgba(91,127,255,0.16)', color: '#93BBFF', border: '1px solid rgba(91,127,255,0.5)' }
                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.10)' }}>
                      {r === 'student' ? 'Talaba' : "O'qituvchi"}
                    </button>
                  ))}
                </div>
              </div>
              {error && <ErrorBox msg={error} />}
              <SubmitBtn busy={busy} disabled={code.trim().length < 4} label="Qo'shilish" />
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-[12px]" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.22)' }}>
      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-[12.5px] text-red-400 leading-snug">{msg}</p>
    </div>
  )
}

function SubmitBtn({ busy, disabled, label }: { busy: boolean; disabled: boolean; label: string }) {
  return (
    <button type="submit" disabled={busy || disabled}
      className="w-full flex items-center justify-center gap-2 py-[13px] rounded-[13px] text-white text-[14px] font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: 'linear-gradient(135deg,#5B7FFF 0%,#7C3AED 100%)', boxShadow: '0 6px 24px rgba(91,127,255,0.4)' }}>
      {busy ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
            : <>{label}<ArrowRight className="w-4 h-4" aria-hidden="true" /></>}
    </button>
  )
}
