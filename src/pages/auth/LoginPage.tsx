import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { ComponentType } from 'react'
import {
  Eye, EyeOff, Mail, Lock,
  GraduationCap, BookOpen, Shield,
  ArrowRight, Check, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/routes/paths'
import type { UserRole } from '@/types/auth.types'
import logoSrc from '@/assets/images/logo.svg'
import { useLanguage } from '@/contexts/LanguageContext'

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

// Left panel feature bullets — kept static (branding panel)
const FEATURE_BULLETS = [
  "AI yordamida shaxsiy o'rganish",
  'Interaktiv darslar va testlar',
  "O'qituvchilar bilan bevosita aloqa",
  'Real vaqtda tahlil va hisobotlar',
]

export default function LoginPage() {
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

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setFormLoading(true)
    const user = await auth.login({ email, password, rememberMe })
    if (user) {
      type LocState = { from?: { pathname: string } }
      const from = (location.state as LocState | null)?.from?.pathname
      navigate(from ?? ROLE_PATH[user.role], { replace: true })
    }
    setFormLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row dark:bg-gray-950">

      {/* ══ Left panel — branding (lg+ only) ══ */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative flex-col overflow-hidden
                      bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex-shrink-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-28 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col h-full px-10 xl:px-12 py-10">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="YordamchiAI logo" className="w-10 h-10 rounded-xl shadow-lg" />
            <span className="text-xl font-bold text-white tracking-tight">YordamchiAI</span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <p className="text-blue-300 text-xs font-semibold mb-4 uppercase tracking-widest">
              Xush kelibsiz
            </p>
            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-snug mb-5">
              Bilim olamiga<br />qadam qo&apos;ying
            </h1>
            <p className="text-blue-200 text-sm xl:text-base leading-relaxed mb-10 max-w-xs">
              Zamonaviy AI texnologiyalari bilan ta&apos;lim olish, o&apos;rgatish va
              boshqarish — barchasi bir joyda.
            </p>
            <ul className="space-y-3.5">
              {FEATURE_BULLETS.map(feature => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-blue-500/30 border border-blue-400/40
                                  flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-blue-200" />
                  </div>
                  <span className="text-blue-100 text-sm leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-blue-400/70 text-xs">© 2026 YordamchiAI. {t.allRightsReserved}.</p>
        </div>
      </div>

      {/* ══ Right panel — form ══ */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-h-screen lg:min-h-0">

        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-4 shadow-md flex-shrink-0">
          <img src={logoSrc} alt="YordamchiAI logo" className="w-8 h-8 rounded-lg" />
          <span className="text-base font-bold text-white">YordamchiAI</span>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-start lg:items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
          <div className="w-full max-w-sm sm:max-w-md">

            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">{t.loginTitle}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">{t.loginSubtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

              {/* Rol tanlash */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.selectRole}
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {ROLES.map(r => {
                    const Icon   = r.icon
                    const active = role === r.value
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 sm:gap-2 py-3 sm:py-3.5 px-1 sm:px-2 rounded-xl border-2',
                          'text-xs font-semibold transition-all duration-200 select-none',
                          active
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                            : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-200 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400',
                        )}
                      >
                        <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5', active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500')} />
                        <span className="truncate w-full text-center">{t[r.labelKey]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => { setEmail(e.target.value); auth.clearError() }}
                    placeholder="sizning@email.com"
                    autoComplete="email"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                               bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100
                               placeholder:text-gray-400 dark:placeholder:text-gray-500
                               focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                               transition-colors"
                  />
                </div>
              </div>

              {/* Parol */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.passwordLabel}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => { setPassword(e.target.value); auth.clearError() }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-9 pr-11 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                               bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100
                               placeholder:text-gray-400 dark:placeholder:text-gray-500
                               focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                               transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Eslab qol + Parolni unutdim */}
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors select-none whitespace-nowrap">
                    {t.rememberMeLabel}
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors whitespace-nowrap flex-shrink-0"
                >
                  {t.forgotPasswordQuestion}
                </Link>
              </div>

              {/* Xato xabari */}
              {auth.error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400 leading-snug">{auth.error}</p>
                </div>
              )}

              {/* Kirish tugmasi */}
              <button
                type="submit"
                disabled={formLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                           bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                           text-white font-semibold text-sm
                           transition-all duration-200 shadow-md hover:shadow-lg
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {formLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {t.login}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white dark:bg-gray-900 text-xs text-gray-400 dark:text-gray-500">{t.orDivider}</span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              {t.noAccount}{' '}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                {t.signUpLink}
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}
