/**
 * components/student/StudentBottomNav.tsx
 * Premium mobil pastki navigatsiya (faqat talaba, faqat mobil/planshet — <lg).
 *
 * YordamchiAI dizayn tili: dark glass, purple/blue gradient, glow, rounded.
 * 5 ta bo'lim: Asosiy · Kurslar · AI (markazda, ko'tarilgan) · Statistika · Profil.
 * Mavjud marshrutlarga ulanadi (PATHS.STUDENT.*). Desktop'da yashirin — u yerda
 * doimiy sidebar navigatsiya vazifasini bajaradi.
 *
 * ⚠️ Faqat qo'shimcha UI — auth, rol, data logikasi va shared komponentlarga
 * tegilmagan. Faqat StudentLayout tomonidan render qilinadi.
 */

import { NavLink } from 'react-router-dom'
import { Home, BookOpen, BarChart3, User, type LucideIcon } from 'lucide-react'
import { LogoIcon } from '@/components/common/Logo'
import { PATHS } from '@/routes/paths'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

interface Tab {
  to:    string
  label: keyof Translations
  Icon:  LucideIcon
  end?:  boolean
}

const LEFT: Tab[] = [
  { to: PATHS.STUDENT.ROOT,         label: 'navHome',    Icon: Home,      end: true },
  { to: PATHS.STUDENT.LESSONS,      label: 'navCourses', Icon: BookOpen             },
]
const RIGHT: Tab[] = [
  { to: PATHS.STUDENT.ACHIEVEMENTS, label: 'navStats',   Icon: BarChart3            },
  { to: PATHS.STUDENT.PROFILE,      label: 'navProfile', Icon: User                 },
]

const ACTIVE = '#93BBFF'
const IDLE   = 'rgba(255,255,255,0.42)'

function TabLink({ to, label, Icon, end }: { to: string; label: string; Icon: LucideIcon; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className="relative flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B7FFF]/50"
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute -top-[7px] w-8 h-1 rounded-full"
              style={{ background: 'linear-gradient(90deg,#5B7FFF,#7C3AED)', boxShadow: '0 0 10px rgba(91,127,255,0.8)' }}
              aria-hidden="true"
            />
          )}
          <Icon className="w-[21px] h-[21px]" style={{ color: isActive ? ACTIVE : IDLE }} strokeWidth={isActive ? 2.3 : 1.9} aria-hidden="true" />
          <span className="text-[10px] font-semibold tracking-tight" style={{ color: isActive ? ACTIVE : IDLE }}>{label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function StudentBottomNav() {
  const { t } = useLanguage()
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label={t.navHome}
    >
      <div
        className="grid grid-cols-5 items-end px-2 pt-2.5 pb-2"
        style={{
          background: 'rgba(8,10,20,0.90)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.45)',
        }}
      >
        {LEFT.map(tab => <TabLink key={tab.to + tab.label} to={tab.to} label={t[tab.label]} Icon={tab.Icon} end={tab.end} />)}

        {/* Markaziy AI tugmasi — ko'tarilgan, doiraviy, kuchli neon glow */}
        <NavLink
          to={PATHS.STUDENT.AI_ASSISTANT}
          className="relative flex flex-col items-center justify-end focus-visible:outline-none"
          aria-label={t.navAI}
        >
          {({ isActive }) => (
            <>
              <span className="relative -mt-9 flex items-center justify-center" style={{ width: 64, height: 64 }}>
                {/* Powerful pulsing neon halo */}
                <span
                  className="absolute inset-0 rounded-full blur-xl pointer-events-none animate-pulse"
                  style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.9) 0%, rgba(91,127,255,0.45) 52%, transparent 72%)', transform: 'scale(1.4)' }}
                  aria-hidden="true"
                />
                {/* Elevated premium glass AI core — YordamchiAI logo mark */}
                <span
                  className="relative w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-95"
                  style={{
                    background:
                      'radial-gradient(circle at 34% 26%, rgba(255,255,255,0.16) 0%, rgba(124,58,237,0.16) 44%, rgba(59,130,246,0.10) 70%, rgba(11,15,28,0.55) 100%)',
                    border: '1px solid rgba(255,255,255,0.16)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    boxShadow: `0 12px 30px rgba(124,58,237,0.55), 0 0 22px rgba(91,127,255,0.5), 0 0 0 5px rgba(8,10,20,0.92), inset 0 1px 0 rgba(255,255,255,0.22)${isActive ? ', 0 0 0 2px rgba(160,196,255,0.85), 0 0 26px rgba(124,58,237,0.85)' : ''}`,
                  }}
                >
                  {/* subtle hologram sweep */}
                  <span
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 50% 118%, rgba(147,187,255,0.20), transparent 62%)' }}
                    aria-hidden="true"
                  />
                  {/* active soft energy pulse */}
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded-full animate-ping pointer-events-none"
                      style={{ border: '1px solid rgba(147,187,255,0.6)' }}
                      aria-hidden="true"
                    />
                  )}
                  {/* Official YordamchiAI logo = AI core (inactive + active) */}
                  <LogoIcon className="w-9 h-9 relative" />
                </span>
              </span>
              <span className="text-[10px] font-bold mt-1" style={{ color: isActive ? ACTIVE : 'rgba(255,255,255,0.55)' }}>{t.navAI}</span>
            </>
          )}
        </NavLink>

        {RIGHT.map(tab => <TabLink key={tab.to + tab.label} to={tab.to} label={t[tab.label]} Icon={tab.Icon} end={tab.end} />)}
      </div>
    </nav>
  )
}
