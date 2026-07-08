/**
 * components/landing/Navbar.tsx
 * YordamchiAI landing navbar — premium SaaS, dark-mode only.
 *
 * 80px · sticky · glassmorphism (rgba(8,10,20,.65) + blur 24px) · 1px bottom border ·
 * max-w 1440px · container px 40px. Desktop / Tablet / Mobile.
 * Left: <Logo/> → "/". Center: animated-gradient-underline nav. Right: language
 * dropdown + outline "Kirish" + primary gradient "Ro'yxatdan o'tish". Mobile/tablet:
 * hamburger → full-screen animated menu. React.memo · lazy (tree-shaken) icons · a11y.
 *
 * React + TypeScript + TailwindCSS + Framer Motion + Lucide.
 */

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Menu, X, ChevronDown, ChevronRight, ArrowRight, Globe, Check, Home, Star, Tag, Info, HelpCircle, type LucideIcon } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Language, Translations } from '@/contexts/LanguageContext'
import { PATHS } from '@/routes/paths'
import Logo from '@/components/common/Logo'

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]
const UNDERLINE = 'linear-gradient(90deg, #7C3AED 0%, #3B82F6 100%)'
const PRIMARY   = 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)'
const RING      = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080A14]'

const NAV_ITEMS: { label: keyof Translations; href: string; Icon: LucideIcon }[] = [
  { label: 'nbHome',     href: '#home',     Icon: Home },
  { label: 'nbFeatures', href: '#features', Icon: Star },
  { label: 'nbPricing',  href: '#pricing',  Icon: Tag },
  { label: 'nbAbout',    href: '#about',    Icon: Info },
  { label: 'nbFaq',      href: '#faq',      Icon: HelpCircle },
]

const LANGS: { code: Language; label: string }[] = [
  { code: 'uz', label: 'UZ' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
]

// ─── Center nav link (icon + label, gradient-underline on hover/active) ───────

const NavLink = memo(function NavLink({ href, label, Icon, active = false, onClick }: {
  href: string; label: string; Icon: LucideIcon; active?: boolean; onClick?: () => void
}) {
  return (
    <motion.a
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      initial="rest" animate={active ? 'hover' : 'rest'} whileHover="hover" whileFocus="hover"
      variants={{ rest: { color: 'rgba(255,255,255,0.58)' }, hover: { color: '#FFFFFF' } }}
      transition={{ duration: 0.2 }}
      className={`relative flex flex-col items-center gap-1 px-2.5 xl:px-3.5 py-1.5 rounded-xl ${RING}`}
    >
      <Icon className="w-[18px] h-[18px]" strokeWidth={1.9} aria-hidden="true" />
      <span className="text-[11.5px] font-medium leading-none whitespace-nowrap">{label}</span>
      <motion.span
        aria-hidden="true"
        className="absolute left-2.5 right-2.5 -bottom-1 h-[2px] rounded-full origin-center"
        style={{ background: UNDERLINE }}
        variants={{ rest: { scaleX: 0, opacity: 0 }, hover: { scaleX: 1, opacity: 1 } }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
    </motion.a>
  )
})

// ─── Auth buttons (Kirish outline · Ro'yxatdan o'tish primary) ────────────────

function AuthButtons({ loginLabel, registerLabel, onNavigate, stacked = false }: {
  loginLabel: string; registerLabel: string; onNavigate?: () => void; stacked?: boolean
}) {
  const reduce = useReducedMotion()
  return (
    <div className={stacked ? 'flex flex-col gap-3 w-full' : 'flex items-center gap-3'}>
      {/* Outline — Kirish */}
      <motion.div whileHover={reduce ? undefined : { scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} className={stacked ? 'w-full' : ''}>
        <Link
          to={PATHS.LOGIN} onClick={onNavigate}
          className={`${stacked ? 'w-full ' : ''}inline-flex items-center justify-center px-4 py-2.5 rounded-xl whitespace-nowrap text-[14px] font-semibold text-white/85 transition-colors duration-200 ${RING}`}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)' }}
          onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'rgba(124,58,237,0.55)'; el.style.background = 'rgba(124,58,237,0.10)' }}
          onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'rgba(255,255,255,0.14)'; el.style.background = 'rgba(255,255,255,0.05)' }}
        >
          {loginLabel}
        </Link>
      </motion.div>

      {/* Primary gradient — Ro'yxatdan o'tish */}
      <motion.div
        className={stacked ? 'w-full' : ''}
        whileHover={reduce ? undefined : { y: -2, scale: 1.03, boxShadow: '0 10px 30px rgba(124,58,237,0.6), 0 0 0 1px rgba(255,255,255,0.12) inset' }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
        style={{ borderRadius: 12 }}
      >
        <Link
          to={PATHS.REGISTER} onClick={onNavigate}
          className={`${stacked ? 'w-full ' : ''}group relative inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl whitespace-nowrap text-[14px] font-bold text-white overflow-hidden ${RING}`}
          style={{ background: PRIMARY, boxShadow: '0 6px 20px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.18)' }}
        >
          {/* Shimmer sweep */}
          <span
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none"
            style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)' }}
            aria-hidden="true"
          />
          <span className="relative z-10">{registerLabel}</span>
          <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </motion.div>
    </div>
  )
}

// ─── Language dropdown (desktop / tablet) — uses existing i18n ────────────────

function LanguageMenu({ language, setLanguage }: { language: Language; setLanguage: (l: Language) => void }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey  = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey) }
  }, [open])

  const current = LANGS.find(l => l.code === language) ?? LANGS[0]

  return (
    <div ref={ref} className="relative">
      <button
        type="button" onClick={() => setOpen(o => !o)}
        aria-haspopup="menu" aria-expanded={open} aria-label={t.nbSelectLang}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold text-white/75 hover:text-white transition-colors ${RING}`}
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
      >
        <Globe className="w-4 h-4" aria-hidden="true" />
        {current.label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="absolute right-0 mt-2 w-32 py-1.5 rounded-xl overflow-hidden z-20"
            style={{ background: 'rgba(13,16,28,0.98)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}
          >
            {LANGS.map(l => (
              <li key={l.code} role="none">
                <button
                  type="button" role="menuitemradio" aria-checked={l.code === language}
                  onClick={() => { setLanguage(l.code); setOpen(false) }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[13px] font-medium transition-colors ${l.code === language ? 'text-white' : 'text-white/70'} hover:text-white hover:bg-white/[0.06] ${RING}`}
                >
                  {l.label}
                  {l.code === language && <Check className="w-3.5 h-3.5 text-[#93BBFF]" aria-hidden="true" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

// Small inline flag (emoji flags don't render on Windows, so use SVG)
function Flag({ code }: { code: Language }) {
  const cls = 'w-[22px] h-[15px] rounded-[3px] flex-shrink-0 ring-1 ring-white/15'
  if (code === 'ru') return (
    <svg viewBox="0 0 24 16" className={cls} aria-hidden="true">
      <rect width="24" height="16" fill="#fff" />
      <rect y="5.33" width="24" height="5.34" fill="#0039A6" />
      <rect y="10.67" width="24" height="5.33" fill="#D52B1E" />
    </svg>
  )
  if (code === 'en') return (
    <svg viewBox="0 0 24 16" className={cls} aria-hidden="true">
      <rect width="24" height="16" fill="#B22234" />
      <g fill="#fff"><rect y="2.46" width="24" height="1.23" /><rect y="4.92" width="24" height="1.23" /><rect y="7.38" width="24" height="1.23" /><rect y="9.85" width="24" height="1.23" /><rect y="12.31" width="24" height="1.23" /></g>
      <rect width="10.2" height="8.62" fill="#3C3B6E" />
    </svg>
  )
  return ( // uz
    <svg viewBox="0 0 24 16" className={cls} aria-hidden="true">
      <rect width="24" height="16" fill="#fff" />
      <rect width="24" height="5" fill="#1EB4E7" />
      <rect y="11" width="24" height="5" fill="#1EB53A" />
      <circle cx="4.4" cy="2.6" r="1.7" fill="#fff" />
      <circle cx="5.1" cy="2.6" r="1.4" fill="#1EB4E7" />
    </svg>
  )
}

// Language chips row (mobile menu) — with flags + active highlight
function LanguageChips({ language, setLanguage }: { language: Language; setLanguage: (l: Language) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Til">
      {LANGS.map(l => {
        const active = l.code === language
        return (
          <button
            key={l.code} type="button" onClick={() => setLanguage(l.code)} aria-pressed={active}
            className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[13px] font-bold transition-colors ${RING}`}
            style={active
              ? { background: 'rgba(124,58,237,0.16)', border: '1px solid rgba(124,58,237,0.5)', color: '#fff' }
              : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <Flag code={l.code} />
            {l.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Mobile / tablet menu — slides in from the RIGHT ──────────────────────────

function MobileMenu({ open, onClose, loginLabel, registerLabel, language, setLanguage, activeHref }: {
  open: boolean; onClose: () => void; loginLabel: string; registerLabel: string
  language: Language; setLanguage: (l: Language) => void; activeHref: string
}) {
  const { t } = useLanguage()
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[75] min-[900px]:hidden"
            style={{ background: 'rgba(4,6,12,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            onClick={onClose} aria-hidden="true"
          />

          {/* Right-side drawer — rounded floating panel */}
          <motion.div
            className="fixed top-3 right-3 bottom-3 z-[80] w-[310px] max-w-[88vw] min-[900px]:hidden flex flex-col rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(10,12,22,0.98)', backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 0 60px rgba(124,58,237,0.22), -12px 0 40px rgba(0,0,0,0.45)',
            }}
            initial={{ x: 'calc(100% + 16px)' }} animate={{ x: 0 }} exit={{ x: 'calc(100% + 16px)' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            role="dialog" aria-modal="true" aria-label={t.nbMainMenu}
          >
            {/* Top bar */}
            <div className="h-[72px] flex items-center justify-between px-5 border-b border-white/[0.06] flex-shrink-0">
              <Logo showSubtitle={false} />
              <button
                type="button" onClick={onClose} aria-label={t.nbCloseMenu}
                className={`w-10 h-10 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors ${RING}`}
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            {/* Nav — icon + label + chevron, active section highlighted */}
            <nav className="flex-1 flex flex-col gap-1.5 px-3 py-4 overflow-y-auto" aria-label={t.nbMainMenu}>
              {NAV_ITEMS.map(item => {
                const isActive = item.href === activeHref
                return (
                  <a
                    key={item.href} href={item.href} onClick={onClose}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-colors ${RING} ${isActive ? '' : 'hover:bg-white/[0.05]'}`}
                    style={isActive
                      ? { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.42)' }
                      : { border: '1px solid transparent' }}
                  >
                    <item.Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-[#B49BFF]' : 'text-white/55'}`} strokeWidth={1.9} aria-hidden="true" />
                    <span className={`flex-1 text-[15px] font-semibold ${isActive ? 'text-white' : 'text-white/80'}`}>{t[item.label]}</span>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white/60' : 'text-white/25'}`} aria-hidden="true" />
                  </a>
                )
              })}
            </nav>

            {/* Language + auth */}
            <div className="px-3.5 pb-5 pt-4 space-y-3 flex-shrink-0 border-t border-white/[0.06]">
              <LanguageChips language={language} setLanguage={setLanguage} />
              <AuthButtons loginLabel={loginLabel} registerLabel={registerLabel} onNavigate={onClose} stacked />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Live date + time (Asia/Tashkent) — mobil/planshet, logo bilan hamburger orasida ─
const TZ = 'Asia/Tashkent'
const DATE_FMT = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' })
const TIME_FMT = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

const NavClock = memo(function NavClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div
      className="hidden min-[360px]:flex min-[900px]:hidden flex-col items-center leading-none select-none px-2.5 py-1 rounded-lg flex-shrink-0"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      aria-label="Toshkent sanasi va vaqti"
    >
      <span className="text-[10.5px] font-medium text-white/70 tabular-nums tracking-wide">{DATE_FMT.format(now).replace(/\//g, '.')}</span>
      <span className="text-[13px] font-bold text-white tabular-nums tracking-wide mt-0.5">{TIME_FMT.format(now)}</span>
    </div>
  )
})

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const { language, setLanguage, t } = useLanguage()
  const [scrolled, setScrolled]   = useState(false)
  const [open, setOpen]           = useState(false)
  const [activeHref, setActiveHref] = useState(NAV_ITEMS[0].href)
  const reduce = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll-spy: highlight the nav item whose section is in view
  useEffect(() => {
    const sections = NAV_ITEMS
      .map(i => document.getElementById(i.href.slice(1)))
      .filter((el): el is HTMLElement => el !== null)
    if (!sections.length) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveHref('#' + e.target.id) })
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
    )
    sections.forEach(s => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  const closeMenu = useCallback(() => setOpen(false), [])

  return (
    <>
      <motion.header
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: -20 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="sticky top-0 z-[70] w-full"
        style={{
          height: 80,
          background: scrolled ? 'rgba(8,10,20,0.85)' : 'rgba(8,10,20,0.65)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.45)' : 'none',
          transition: 'background 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        <div className="mx-auto max-w-[1440px] h-full px-3 md:px-4 xl:px-10 flex items-center justify-between gap-2">
          {/* Left — logo → "/" */}
          <Link to={PATHS.HOME} className={`flex-shrink-0 rounded-xl ${RING}`}>
            <Logo showSubtitle={false} />
          </Link>

          {/* Center — nav (desktop): icon + label inside a glass pill */}
          <nav
            className="hidden min-[900px]:flex items-center gap-0.5 lg:gap-1 px-1.5 py-1 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}
            aria-label={t.nbMainMenu}
          >
            {NAV_ITEMS.map(item => (
              <NavLink key={item.href} href={item.href} label={t[item.label]} Icon={item.Icon} active={item.href === activeHref} />
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Language dropdown — large desktop (kept off 900–1280 so nav fits) */}
            <div className="hidden xl:block">
              <LanguageMenu language={language} setLanguage={setLanguage} />
            </div>

            {/* Auth — desktop only */}
            <div className="hidden min-[900px]:block">
              <AuthButtons loginLabel={t.login} registerLabel={t.register} />
            </div>

            {/* Live sana + vaqt (mobil/planshet) — logo bilan hamburger orasida */}
            <NavClock />

            {/* Hamburger — tablet + mobile */}
            <button
              type="button" onClick={() => setOpen(true)}
              aria-label={t.nbOpenMenu} aria-expanded={open} aria-controls="mobile-menu"
              className={`min-[900px]:hidden w-10 h-10 flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors ${RING}`}
            >
              <Menu className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </motion.header>

      <div id="mobile-menu">
        <MobileMenu
          open={open} onClose={closeMenu}
          loginLabel={t.login} registerLabel={t.register}
          language={language} setLanguage={setLanguage}
          activeHref={activeHref}
        />
      </div>
    </>
  )
}

export default memo(Navbar)
