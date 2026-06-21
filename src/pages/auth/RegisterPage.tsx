import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/routes/paths'
import type { UserRole } from '@/types/auth.types'

const ROLE_PATH: Record<UserRole, string> = {
  student: PATHS.STUDENT.ROOT,
  teacher: PATHS.TEACHER.ROOT,
  admin:   PATHS.ADMIN.ROOT,
}

export default function RegisterPage() {
  const auth     = useAuth()
  const navigate = useNavigate()

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
      // Email tasdiqsiz — avtomatik login bo'ldi
      navigate(ROLE_PATH[user.role], { replace: true })
    } else if (!auth.error) {
      // Xato yo'q, lekin user yo'q → email tasdiqlash kerak
      setEmailSent(true)
    }

    setFormLoading(false)
  }

  // Email tasdiqlash xabari
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Emailingizni tekshiring
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              <span className="font-semibold text-gray-700">{email}</span> manziliga
              tasdiqlash havolasi yuborildi. Havolani bosib ro&apos;yxatni yakunlang.
            </p>
            <Link
              to={PATHS.LOGIN}
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              Kirishga o&apos;tish
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Ro&apos;yxatdan o&apos;tish</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* To'liq ism */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                To&apos;liq ism
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={e => { setName(e.target.value); auth.clearError() }}
                autoComplete="name"
                placeholder="Ism Familiya"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900
                           placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                           focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email manzil
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); auth.clearError() }}
                autoComplete="email"
                placeholder="sizning@email.com"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900
                           placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                           focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Rol */}
            <div>
              <label htmlFor="reg-role" className="block text-sm font-medium text-gray-700 mb-1.5">
                Rol
              </label>
              <select
                id="reg-role"
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900
                           focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                <option value="student">Talaba</option>
                <option value="teacher">O&apos;qituvchi</option>
              </select>
            </div>

            {/* Parol */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Parol
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => { setPassword(e.target.value); auth.clearError() }}
                autoComplete="new-password"
                placeholder="Kamida 6 ta belgi"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900
                           placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                           focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Xato xabari */}
            {auth.error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 leading-snug">{auth.error}</p>
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
                'Hisob yaratish'
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-gray-500">
            Hisobingiz bormi?{' '}
            <Link to={PATHS.LOGIN} className="text-blue-600 hover:underline font-semibold">
              Kirish
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
