/**
 * pages/auth/ForgotPasswordPage.tsx
 * V6 Design System — dark premium.
 *
 * ⚠️  ALL BUSINESS LOGIC PRESERVED UNCHANGED ⚠️
 * supabase.auth.resetPasswordForEmail() call — identical.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle, Mail, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PATHS } from '@/routes/paths'
import { LogoIcon } from '@/components/common/Logo'
import { useLanguage } from '@/contexts/LanguageContext'

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

export default function ForgotPasswordPage() {
  // ── Business logic (PRESERVED EXACTLY) ───────────────────────────────────
  const { t }                           = useLanguage()
  const [email,     setEmail]           = useState('')
  const [isLoading, setIsLoading]       = useState(false)
  const [sent,      setSent]            = useState(false)
  const [error,     setError]           = useState<string | null>(null)
  const [focused,   setFocused]         = useState(false)

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error: sbError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/reset-password` },
    )

    if (sbError) {
      setError(t.error + '. ' + t.back + '.')
    } else {
      setSent(true)
    }
    setIsLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width:        '100%',
    paddingLeft:  40,
    paddingRight: 14,
    paddingTop:   10,
    paddingBottom: 10,
    fontSize:     14,
    background:   focused ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.05)',
    border:       focused ? '1px solid rgba(91,127,255,0.55)' : '1px solid rgba(255,255,255,0.10)',
    borderRadius: 12,
    color:        'rgba(255,255,255,0.85)',
    outline:      'none',
    boxShadow:    focused ? '0 0 0 3px rgba(91,127,255,0.13)' : 'none',
    transition:   'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  }

  // ── Sent confirmation ─────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={PAGE_BG}>
        <div className="fixed -top-40 -right-40 w-96 h-96 rounded-full blur-[120px] opacity-12 pointer-events-none"
          style={{ background: 'radial-gradient(circle,#5B7FFF,transparent)' }} aria-hidden="true" />

        <div className="w-full max-w-sm sm:max-w-[400px]">
          <div style={CARD} className="text-center">
            <div
              className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(91,127,255,0.14)', border: '1px solid rgba(91,127,255,0.28)' }}
            >
              <CheckCircle className="w-8 h-8" style={{ color: '#93BBFF' }} aria-hidden="true" />
            </div>
            <h2 className="text-[20px] font-black text-white mb-2">{t.emailSentTitle}</h2>
            <p className="text-[13px] mb-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.42)' }}>
              <span className="font-bold" style={{ color: 'rgba(255,255,255,0.72)' }}>{email}</span>{' '}
              {t.emailSentDesc}
            </p>
            <p className="text-[11.5px] mb-6" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {t.spamNote}
            </p>
            <Link
              to={PATHS.LOGIN}
              className="w-full flex items-center justify-center gap-2 py-[13px] rounded-[13px] text-white text-[14px] font-bold transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)',
                boxShadow: '0 6px 24px rgba(91,127,255,0.38)',
              }}
            >
              {t.goToLogin}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={PAGE_BG}>
      {/* Ambient orbs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle,#5B7FFF,transparent)' }} aria-hidden="true" />
      <div className="fixed bottom-0 right-0 w-80 h-80 rounded-full blur-[100px] opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle,#7C3AED,transparent)' }} aria-hidden="true" />

      <div className="relative w-full max-w-sm sm:max-w-[400px]">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-7">
          <LogoIcon className="w-9 h-9" />
          <span className="text-[17px] font-black text-white tracking-tight">YordamchiAI</span>
        </div>

        {/* Card */}
        <div style={CARD}>
          <div className="mb-6">
            <h2 className="text-[21px] font-black text-white tracking-tight">{t.forgotPasswordTitle}</h2>
            <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>
              {t.forgotPasswordDesc}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-[11.5px] font-bold uppercase tracking-[0.12em] mb-1.5"
                style={{ color: 'rgba(255,255,255,0.40)' }}>
                {t.emailLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.28)' }} aria-hidden="true" />
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null) }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  autoComplete="email"
                  placeholder={t.emailPlaceholder}
                  style={inputStyle}
                />
              </div>
            </div>

            {error && (
              <div
                className="flex items-start gap-2.5 p-3 rounded-[12px]"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.22)' }}
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[12.5px] text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-[13px] rounded-[13px] text-white text-[14px] font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg,#5B7FFF 0%,#7C3AED 100%)',
                boxShadow: '0 6px 24px rgba(91,127,255,0.40), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
              ) : (
                t.sendLink
              )}
            </button>
          </form>

          <div className="mt-5 flex justify-center">
            <Link
              to={PATHS.LOGIN}
              className="inline-flex items-center gap-1.5 text-[12.5px] transition-colors"
              style={{ color: 'rgba(255,255,255,0.35)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              {t.backToLogin}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
