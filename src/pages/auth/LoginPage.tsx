/**
 * pages/auth/LoginPage.tsx
 * V6 Design System — dark premium, pixel-perfect.
 *
 * ⚠️  ALL BUSINESS LOGIC PRESERVED UNCHANGED ⚠️
 * auth.login(), navigate(), location state, form state — identical.
 * Only visual layer updated to V6 dark design.
 */

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { ComponentType } from 'react'
import {
  Eye, EyeOff, Mail, Lock,
  GraduationCap, BookOpen, Shield,
  ArrowRight, Check, AlertCircle, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/routes/paths'
import type { UserRole } from '@/types/auth.types'
import logoSrc from '@/assets/images/logo.svg'
import { useLanguage } from '@/contexts/LanguageContext'
import { IllustrationImage, ILLUS } from '@/components/illustration'

// ─── Types (PRESERVED EXACTLY) ───────────────────────────────────────────────

interface RoleOption {
  value: UserRole
  icon:  ComponentType<{ className?: string }>
  labelKey: 'studentRole' | 'teacherRole' | 'adminRole'
}

const ROLES: RoleOption[] = [
  { value: 'student', icon: GraduationCap, labelKey: 'studentRole' },
  { value: 'teacher', icon: BookOpen,      labelKey: 'teacherRole'  },
  { value: 'admin',   icon: Shield,        labelKey: 'adminRole'    },
]

const ROLE_PATH: Record<UserRole, string> = {
  student: PATHS.STUDENT.ROOT,
  teacher: PATHS.TEACHER.ROOT,
  admin:   PATHS.ADMIN.ROOT,
}

const FEATURE_BULLETS = [
  "AI yordamida shaxsiy o'rganish",
  'Interaktiv darslar va testlar',
  "O'qituvchilar bilan bevosita aloqa",
  'Real vaqtda tahlil va hisobotlar',
]

// ─── V6 design tokens ─────────────────────────────────────────────────────────

const PAGE_BG  = { background: '#070B14' }
const CARD     = {
  background:           'rgba(11,15,28,0.85)',
  backdropFilter:       'blur(28px) saturate(200%)',
  WebkitBackdropFilter: 'blur(28px) saturate(200%)',
  border:               '1px solid rgba(255,255,255,0.08)',
  boxShadow:            '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
}
const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border:     '1px solid rgba(255,255,255,0.10)',
  color:      'rgba(255,255,255,0.85)',
  borderRadius: 12,
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}
const INPUT_FOCUS = {
  borderColor: 'rgba(91,127,255,0.55)',
  boxShadow:   '0 0 0 3px rgba(91,127,255,0.13)',
  background:  'rgba(255,255,255,0.07)',
}

export default function LoginPage() {
  // ── Business logic (PRESERVED EXACTLY) ───────────────────────────────────
  const auth     = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t }    = useLanguage()

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [role,         setRole]         = useState<UserRole>('student')
  const [rememberMe,   setRememberMe]   = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formLoading,  setFormLoading]  = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setFormLoading(true)
    const user = await auth.login({ email, password, rememberMe })
    if (user) {
      type LocState = { from?: { pathname: string } }
      const from = (location.state as LocState | null)?.from?.pathname
      // Premium xush kelibsiz ekrani orqali → rolga mos dashboard (yoki so'ralgan sahifa)
      navigate(PATHS.WELCOME, { replace: true, state: { to: from ?? ROLE_PATH[user.role] } })
    }
    setFormLoading(false)
  }

  const fi = (field: string): React.CSSProperties => ({
    ...INPUT_STYLE,
    ...(focusedField === field ? INPUT_FOCUS : {}),
  })

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={PAGE_BG}
    >
      {/* ══ Left panel — brand + illustration ══ */}
      <div
        className="hidden lg:flex lg:w-5/12 xl:w-[45%] relative flex-col overflow-hidden flex-shrink-0"
        style={{
          background: 'linear-gradient(145deg, #0D1235 0%, #131A40 40%, #0A0E28 100%)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Ambient orbs */}
        <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full blur-[100px] opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle,#5B7FFF,transparent 70%)' }} aria-hidden="true" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-[80px] opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle,#7C3AED,transparent 70%)' }} aria-hidden="true" />

        <div className="relative z-10 flex flex-col h-full px-10 xl:px-12 py-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)', boxShadow: '0 0 20px rgba(91,127,255,0.5)' }}
            >
              <img src={logoSrc} alt="Y" className="w-7 h-7" />
            </div>
            <span className="text-[18px] font-black text-white tracking-tight">YordamchiAI</span>
          </div>

          {/* Hero text */}
          <div className="flex-1 flex flex-col justify-center">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold mb-5 self-start"
              style={{ background: 'rgba(91,127,255,0.14)', border: '1px solid rgba(91,127,255,0.28)', color: '#93BBFF' }}
            >
              <Zap className="w-3 h-3" aria-hidden="true" />
              Sun&apos;iy intellekt ta&apos;lim platformasi
            </div>

            <h1 className="text-3xl xl:text-[2.1rem] font-black text-white leading-[1.12] mb-4 tracking-tight">
              Bilim olamiga<br />
              <span style={{
                background: 'linear-gradient(135deg,#93BBFF 0%,#5B7FFF 45%,#A78BFA 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                qadam qo&apos;ying
              </span>
            </h1>
            <p className="text-[14px] text-white/42 leading-relaxed mb-8 max-w-xs">
              Zamonaviy AI texnologiyalari bilan ta&apos;lim olish, o&apos;rgatish va
              boshqarish — barchasi bir joyda.
            </p>

            {/* Feature bullets */}
            <ul className="space-y-3">
              {FEATURE_BULLETS.map(f => (
                <li key={f} className="flex items-start gap-3">
                  <div
                    className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(91,127,255,0.18)', border: '1px solid rgba(91,127,255,0.32)' }}
                  >
                    <Check className="w-3 h-3 text-[#93BBFF]" aria-hidden="true" />
                  </div>
                  <span className="text-[13px] text-white/55 leading-snug">{f}</span>
                </li>
              ))}
            </ul>

            {/* Login illustration slot */}
            <div className="mt-8 flex justify-center">
              <IllustrationImage
                src={ILLUS.LOGIN}
                alt="YordamchiAI kirish"
                width={220}
                height={240}
                glow="0 0 40px rgba(91,127,255,0.35)"
              />
            </div>
          </div>

          <p className="text-[11px] text-white/22">© 2026 YordamchiAI. {t.allRightsReserved}.</p>
        </div>
      </div>

      {/* ══ Right panel — form ══ */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Mobile header */}
        <div
          className="lg:hidden flex items-center gap-3 px-4 py-4 flex-shrink-0"
          style={{ background: 'rgba(11,15,28,0.90)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)' }}
          >
            <img src={logoSrc} alt="Y" className="w-5 h-5" />
          </div>
          <span className="text-[15px] font-black text-white">YordamchiAI</span>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-start lg:items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
          <div className="w-full max-w-sm sm:max-w-[400px]">

            {/* Card */}
            <div className="rounded-[22px] p-7 sm:p-8" style={CARD}>

              {/* Title */}
              <div className="mb-6">
                <h2 className="text-[22px] font-black text-white tracking-tight">{t.loginTitle}</h2>
                <p className="text-[13px] text-white/40 mt-1">{t.loginSubtitle}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Role selector */}
                <div>
                  <label className="block text-[12px] font-bold text-white/45 uppercase tracking-[0.12em] mb-2">
                    {t.selectRole}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map(r => {
                      const Icon   = r.icon
                      const active = role === r.value
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRole(r.value)}
                          className={cn(
                            'flex flex-col items-center gap-1.5 py-3 px-2 rounded-[12px] text-[11.5px] font-semibold transition-all duration-150 select-none',
                          )}
                          style={active ? {
                            background: 'rgba(91,127,255,0.18)',
                            border: '1.5px solid rgba(91,127,255,0.45)',
                            color: '#93BBFF',
                            boxShadow: '0 0 14px rgba(91,127,255,0.18)',
                          } : {
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.09)',
                            color: 'rgba(255,255,255,0.42)',
                          }}
                        >
                          <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                          <span className="truncate w-full text-center">{t[r.labelKey]}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-[12px] font-bold text-white/45 uppercase tracking-[0.12em] mb-1.5">
                    {t.emailLabel}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: 'rgba(255,255,255,0.28)' }} aria-hidden="true" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={e => { setEmail(e.target.value); auth.clearError() }}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder={t.emailPlaceholder}
                      autoComplete="email"
                      style={{ ...fi('email'), paddingLeft: 40, paddingRight: 14, paddingTop: 10, paddingBottom: 10, fontSize: 14 }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-[12px] font-bold text-white/45 uppercase tracking-[0.12em] mb-1.5">
                    {t.passwordLabel}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: 'rgba(255,255,255,0.28)' }} aria-hidden="true" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => { setPassword(e.target.value); auth.clearError() }}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      style={{ ...fi('password'), paddingLeft: 40, paddingRight: 44, paddingTop: 10, paddingBottom: 10, fontSize: 14 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'rgba(255,255,255,0.32)' }}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#5B7FFF] cursor-pointer"
                      style={{ accentColor: '#5B7FFF' }}
                    />
                    <span className="text-[12.5px] text-white/38 group-hover:text-white/60 transition-colors select-none">
                      {t.rememberMeLabel}
                    </span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[12.5px] font-semibold transition-colors"
                    style={{ color: '#93BBFF' }}
                  >
                    {t.forgotPasswordQuestion}
                  </Link>
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
                  className="w-full flex items-center justify-center gap-2 py-[13px] rounded-[13px] text-white text-[14px] font-bold transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                  style={{
                    background: 'linear-gradient(135deg,#5B7FFF 0%,#7C3AED 100%)',
                    boxShadow: '0 6px 24px rgba(91,127,255,0.45), inset 0 1px 0 rgba(255,255,255,0.16)',
                  }}
                >
                  {formLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  ) : (
                    <>
                      {t.login}
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />
                </div>
                <div className="relative flex justify-center">
                  <span
                    className="px-3 text-[11.5px]"
                    style={{ background: 'rgba(11,15,28,0.85)', color: 'rgba(255,255,255,0.28)' }}
                  >
                    {t.orDivider}
                  </span>
                </div>
              </div>

              <p className="text-center text-[13px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                {t.noAccount}{' '}
                <Link
                  to="/register"
                  className="font-bold transition-colors"
                  style={{ color: '#93BBFF' }}
                >
                  {t.signUpLink}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
