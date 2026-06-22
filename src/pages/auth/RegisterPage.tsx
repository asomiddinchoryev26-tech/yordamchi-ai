import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/routes/paths'
import type { UserRole } from '@/types/auth.types'
import { useLanguage } from '@/contexts/LanguageContext'

const ROLE_PATH: Record<UserRole, string> = {
  student: PATHS.STUDENT.ROOT,
  teacher: PATHS.TEACHER.ROOT,
  admin:   PATHS.ADMIN.ROOT,
}

export default function RegisterPage() {
  const auth     = useAuth()
  const navigate = useNavigate()
  const { t }    = useLanguage()

  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [role,        setRole]        = useState<UserRole>('student')
  const [password,    setPassword]    = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [emailSent,   setEmailSent]   = useState(false)

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setFormLoading(true)
    auth.clearError()

    const user = await auth.register({ name, email, password, role })

    if (user) {
      navigate(ROLE_PATH[user.role], { replace: true })
    } else if (!auth.error) {
      setEmailSent(true)
    }

    setFormLoading(false)
  }

  // Email tasdiqlash xabari
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
              {t.checkEmailTitle}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              <span className="font-semibold text-gray-700 dark:text-gray-200">{email}</span>{' '}
              {t.checkEmailDesc}
            </p>
            <Link
              to={PATHS.LOGIN}
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              {t.goToLogin}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-1">{t.registerTitle}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t.registerSubtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* To'liq ism */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.fullName}
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={e => { setName(e.target.value); auth.clearError() }}
                autoComplete="name"
                placeholder={t.fullNamePlaceholder}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100
                           placeholder:text-gray-400 dark:placeholder:text-gray-500
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20
                           focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.emailLabel}
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); auth.clearError() }}
                autoComplete="email"
                placeholder="sizning@email.com"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100
                           placeholder:text-gray-400 dark:placeholder:text-gray-500
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20
                           focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Rol */}
            <div>
              <label htmlFor="reg-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.roleLabel}
              </label>
              <select
                id="reg-role"
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                <option value="student">{t.studentRole}</option>
                <option value="teacher">{t.teacherRole}</option>
              </select>
            </div>

            {/* Parol */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.passwordLabel}
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => { setPassword(e.target.value); auth.clearError() }}
                autoComplete="new-password"
                placeholder={t.minPasswordHint}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100
                           placeholder:text-gray-400 dark:placeholder:text-gray-500
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20
                           focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Xato xabari */}
            {auth.error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400 leading-snug">{auth.error}</p>
              </div>
            )}

            {/* Ro'yxatdan o'tish tugmasi */}
            <button
              type="submit"
              disabled={formLoading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold
                         transition-colors shadow-md hover:shadow-lg
                         disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {formLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t.createAccount
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
            {t.hasAccount}{' '}
            <Link to={PATHS.LOGIN} className="text-blue-600 hover:underline font-semibold">
              {t.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
