/**
 * pages/auth/RegisterPage.tsx
 * V6 Design System — dark premium.
 *
 * ⚠️  ALL BUSINESS LOGIC PRESERVED UNCHANGED ⚠️
 * auth.register(), navigate(), form state — identical.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle, User, Mail, Lock, Pencil } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/routes/paths'
import type { UserRole } from '@/types/auth.types'
import { LogoIcon } from '@/components/common/Logo'
import { useLanguage } from '@/contexts/LanguageContext'
import RoleSelectionStep from './RoleSelectionStep'

// ─── Business logic constants (PRESERVED EXACTLY) ─────────────────────────────

const ROLE_PATH: Record<UserRole, string> = {
  student: PATHS.STUDENT.ROOT,
  teacher: PATHS.TEACHER.ROOT,
  admin:   PATHS.ADMIN.ROOT,
}

const ROLE_LABEL: Record<UserRole, string> = {
  student: 'Talaba',
  teacher: "O'qituvchi",
  admin:   "Ta'lim muassasasi",
}

// ─── V6 design tokens ─────────────────────────────────────────────────────────

const PAGE_BG: React.CSSProperties = { background: '#070B14' }
const CARD: React.CSSProperties = {
  background:           'rgba(11,15,28,0.85)',
  backdropFilter:       'blur(28px) saturate(200%)',
  WebkitBackdropFilter: 'blur(28px) saturate(200%)',
  border:               '1px solid rgba(255,255,255,0.08)',
  boxShadow:            '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
  borderRadius:         22,
  padding:              '2rem',
}
const INPUT_BASE: React.CSSProperties = {
  width:        '100%',
  background:   'rgba(255,255,255,0.05)',
  border:       '1px solid rgba(255,255,255,0.10)',
  borderRadius: 12,
  color:        'rgba(255,255,255,0.85)',
  fontSize:     14,
  paddingTop:   10,
  paddingBottom: 10,
  outline:      'none',
  transition:   'border-color 0.2s, box-shadow 0.2s',
}

export default function RegisterPage() {
  // ── Business logic (PRESERVED EXACTLY) ───────────────────────────────────
  const auth     = useAuth()
  const navigate = useNavigate()
  const { t }    = useLanguage()

  const [step,        setStep]        = useState<'role' | 'details'>('role')
  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [role,        setRole]        = useState<UserRole | null>(null)
  const [password,    setPassword]    = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [emailSent,   setEmailSent]   = useState(false)
  const [focusField,  setFocusField]  = useState<string | null>(null)

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!role) { setStep('role'); return }   // rol tanlanmagan bo'lsa 1-bosqichga qaytamiz
    setFormLoading(true)
    auth.clearError()
    const result = await auth.register({ name, email, password, role })
    if (result.status === 'signed-in') {
      navigate(ROLE_PATH[result.user.role], { replace: true })
    } else if (result.status === 'confirm-email') {
      setEmailSent(true)
    }
    // result.status === 'error' → auth.error is set and shown by the error banner
    setFormLoading(false)
  }

  const fi = (f: string): React.CSSProperties => ({
    ...INPUT_BASE,
    paddingLeft: 40,
    paddingRight: 14,
    ...(focusField === f ? {
      borderColor: 'rgba(91,127,255,0.55)',
      boxShadow: '0 0 0 3px rgba(91,127,255,0.13)',
      background: 'rgba(255,255,255,0.07)',
    } : {}),
  })

  // ── Email tasdiqlash xabari ───────────────────────────────────────────────
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={PAGE_BG}>
        <div className="w-full max-w-md">
          <div style={CARD}>
            <div
              className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(34,197,94,0.14)', border: '1px solid rgba(34,197,94,0.28)' }}
            >
              <CheckCircle className="w-8 h-8 text-emerald-400" aria-hidden="true" />
            </div>
            <h2 className="text-[20px] font-black text-white text-center mb-2">{t.checkEmailTitle}</h2>
            <p className="text-[13px] text-white/42 text-center mb-6 leading-relaxed">
              <span className="font-bold text-white/72">{email}</span>{' '}
              {t.checkEmailDesc}
            </p>
            <Link
              to={PATHS.LOGIN}
              className="w-full flex items-center justify-center py-[13px] rounded-[13px] text-white text-[14px] font-bold transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)',
                boxShadow: '0 6px 24px rgba(91,127,255,0.40)',
              }}
            >
              {t.goToLogin}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── 1-bosqich: premium rol tanlash ekrani ─────────────────────────────────
  if (step === 'role') {
    return (
      <RoleSelectionStep
        selected={role}
        onSelect={setRole}
        onContinue={() => setStep('details')}
      />
    )
  }

  // ── 2-bosqich: hisob ma'lumotlari ─────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={PAGE_BG}>
      {/* Ambient orbs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle,#5B7FFF,transparent)' }} aria-hidden="true" />
      <div className="fixed bottom-0 right-0 w-96 h-96 rounded-full blur-[100px] opacity-12 pointer-events-none"
        style={{ background: 'radial-gradient(circle,#7C3AED,transparent)' }} aria-hidden="true" />

      <div className="relative w-full max-w-sm sm:max-w-[400px]">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-7">
          <LogoIcon className="w-9 h-9" />
          <span className="text-[17px] font-black text-white tracking-tight">YordamchiAI</span>
        </div>

        {/* Card */}
        <div style={CARD}>
          <div className="mb-5">
            <h2 className="text-[21px] font-black text-white tracking-tight">{t.registerTitle}</h2>
            <p className="text-[13px] text-white/38 mt-0.5">{t.registerSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full name */}
            <div>
              <label htmlFor="name" className="block text-[11.5px] font-bold text-white/40 uppercase tracking-[0.12em] mb-1.5">
                {t.fullName}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.28)' }} aria-hidden="true" />
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={e => { setName(e.target.value); auth.clearError() }}
                  onFocus={() => setFocusField('name')}
                  onBlur={() => setFocusField(null)}
                  autoComplete="name"
                  placeholder={t.fullNamePlaceholder}
                  style={fi('name')}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-[11.5px] font-bold text-white/40 uppercase tracking-[0.12em] mb-1.5">
                {t.emailLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.28)' }} aria-hidden="true" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => { setEmail(e.target.value); auth.clearError() }}
                  onFocus={() => setFocusField('email')}
                  onBlur={() => setFocusField(null)}
                  autoComplete="email"
                  placeholder={t.emailPlaceholder}
                  style={fi('email')}
                />
              </div>
            </div>

            {/* Selected role — 1-bosqichda tanlangan, bu yerdan o'zgartirish mumkin */}
            <div>
              <label className="block text-[11.5px] font-bold text-white/40 uppercase tracking-[0.12em] mb-1.5">
                {t.roleLabel}
              </label>
              <div
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-[12px]"
                style={{ background: 'rgba(91,127,255,0.10)', border: '1px solid rgba(91,127,255,0.30)' }}
              >
                <span className="text-[13.5px] font-semibold text-white">{role ? ROLE_LABEL[role] : ''}</span>
                <button
                  type="button"
                  onClick={() => setStep('role')}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold transition-colors hover:opacity-80"
                  style={{ color: '#93BBFF' }}
                >
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                  O&apos;zgartirish
                </button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-[11.5px] font-bold text-white/40 uppercase tracking-[0.12em] mb-1.5">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.28)' }} aria-hidden="true" />
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => { setPassword(e.target.value); auth.clearError() }}
                  onFocus={() => setFocusField('pass')}
                  onBlur={() => setFocusField(null)}
                  autoComplete="new-password"
                  placeholder={t.minPasswordHint}
                  style={fi('pass')}
                />
              </div>
            </div>

            {/* Error */}
            {auth.error && (
              <div
                className="flex items-start gap-2.5 p-3 rounded-[12px]"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.22)' }}
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[12.5px] text-red-400 leading-snug">{auth.error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={formLoading}
              className="w-full flex items-center justify-center gap-2 py-[13px] rounded-[13px] text-white text-[14px] font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              style={{
                background: 'linear-gradient(135deg,#5B7FFF 0%,#7C3AED 100%)',
                boxShadow: '0 6px 24px rgba(91,127,255,0.40), inset 0 1px 0 rgba(255,255,255,0.16)',
              }}
            >
              {formLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
              ) : (
                t.createAccount
              )}
            </button>
          </form>

          <p className="mt-5 text-[13px] text-center" style={{ color: 'rgba(255,255,255,0.36)' }}>
            {t.hasAccount}{' '}
            <Link to={PATHS.LOGIN} className="font-bold" style={{ color: '#93BBFF' }}>
              {t.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
