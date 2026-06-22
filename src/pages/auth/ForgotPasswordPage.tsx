import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PATHS } from '@/routes/paths'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ForgotPasswordPage() {
  const { t }                           = useLanguage()
  const [email,     setEmail]           = useState('')
  const [isLoading, setIsLoading]       = useState(false)
  const [sent,      setSent]            = useState(false)
  const [error,     setError]           = useState<string | null>(null)

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

  // ── Muvaffaqiyatli yuborildi ──
  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
              {t.emailSentTitle}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
              <span className="font-semibold text-gray-700 dark:text-gray-200">{email}</span>{' '}
              {t.emailSentDesc}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
              {t.spamNote}
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

  // ── Forma ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">{t.forgotPasswordTitle}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            {t.forgotPasswordDesc}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.emailLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(null) }}
                  autoComplete="email"
                  placeholder="sizning@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100
                             placeholder:text-gray-400 dark:placeholder:text-gray-500
                             focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t.sendLink
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-center">
            <Link
              to={PATHS.LOGIN}
              className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
            >
              {t.backToLogin}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
