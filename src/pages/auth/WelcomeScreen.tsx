/**
 * pages/auth/WelcomeScreen.tsx
 * Premium welcome / loading screen — login'dan keyin, dashboard'dan oldin ko'rsatiladi.
 *
 * YordamchiAI dizayn tili: dark AI fon, purple/blue glow, glass effekt, logotip
 * animatsiyasi (pulslovchi nur). ~1.6s ko'rsatiladi, so'ng rolga mos dashboard'ga
 * yo'naltiradi.
 *
 * ⚠️ Faqat UX qatlam — auth/rol tizimi/Supabase o'zgarmagan. Yo'naltirish manzili
 * login'dan `state.to` orqali keladi (bo'lmasa — rolga mos dashboard).
 */

import { useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { PATHS } from '@/routes/paths'
import type { UserRole } from '@/types/auth.types'
import Logo from '@/components/common/Logo'

const ROLE_HOME: Record<UserRole, string> = {
  student: PATHS.STUDENT.ROOT,
  teacher: PATHS.TEACHER.ROOT,
  admin:   PATHS.ADMIN.ROOT,
}

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]
const REDIRECT_MS = 1600

export default function WelcomeScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const target = (location.state as { to?: string } | null)?.to
    ?? (user ? ROLE_HOME[user.role] : PATHS.LOGIN)

  useEffect(() => {
    if (!user) return
    const t = setTimeout(() => navigate(target, { replace: true }), REDIRECT_MS)
    return () => clearTimeout(t)
  }, [user, target, navigate])

  // Autentifikatsiyadan o'tmagan bo'lsa (to'g'ridan-to'g'ri kirish) → login
  if (!user) return <Navigate to={PATHS.LOGIN} replace />

  return <WelcomeView name={user.name} />
}

// ─── Presentational (auth'siz — preview/qayta ishlatish uchun) ────────────────

export function WelcomeView({ name }: { name: string }) {
  const reduce = useReducedMotion()
  const { t } = useLanguage()
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden" style={{ background: '#05060F' }}>
      {/* Backdrop — radial depth + purple/blue glow orbs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, #0D1230 0%, #080B18 55%, #05060F 100%)' }} />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full blur-[130px]"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, rgba(59,130,246,0.22) 45%, transparent 72%)' }}
          animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-[110px] opacity-40"
          style={{ background: 'radial-gradient(circle,#7C3AED,transparent 70%)' }} />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-[110px] opacity-35"
          style={{ background: 'radial-gradient(circle,#3B82F6,transparent 70%)' }} />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
        className="relative flex flex-col items-center text-center"
      >
        {/* Logo + pulsing sonar rings */}
        <div className="relative flex items-center justify-center mb-8">
          {!reduce && [0, 0.6, 1.2].map((delay, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{ width: 96, height: 96, border: '1.5px solid rgba(124,58,237,0.5)' }}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay }}
              aria-hidden="true"
            />
          ))}
          <Logo showText={false} showSubtitle={false} />
        </div>

        {/* Welcome text */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
          className="text-[24px] sm:text-[30px] font-black text-white tracking-tight leading-tight"
        >
          {t.welcomeGreeting}{' '}
          <span style={{ background: 'linear-gradient(100deg,#9B7CFF 0%,#6366F1 50%,#3B82F6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {name}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-2.5 text-[14px] sm:text-[15px] text-white/50 flex items-center justify-center gap-1"
        >
          {t.welcomePreparing}
          {!reduce && (
            <span className="inline-flex">
              {[0, 0.2, 0.4].map((d, i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: d }}
                >
                  .
                </motion.span>
              ))}
            </span>
          )}
        </motion.p>

        {/* Gradient progress bar (glass) */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.35 }}
          className="mt-8 w-[240px] sm:w-[280px] h-[6px] rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg,#5B7FFF 0%,#7C3AED 50%,#22D3EE 100%)', boxShadow: '0 0 14px rgba(124,58,237,0.7)' }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: REDIRECT_MS / 1000, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
