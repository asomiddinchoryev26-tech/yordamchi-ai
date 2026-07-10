import { useState, useRef, useEffect, Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'
import PageLoader from '@/components/common/PageLoader'
import { Sun, Moon, Globe, ChevronDown, Menu, X, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PATHS } from '@/routes/paths'
import { APP_NAME } from '@/utils/constants'
import { LogoIcon } from '@/components/common/Logo'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage, type Language } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const LANG_OPTIONS: { code: Language; label: string; short: string; flag: string }[] = [
  { code: 'uz', label: "O'zbek",  short: 'UZ', flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', short: 'RU', flag: '🇷🇺' },
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
]

export default function MainLayout() {
  const { theme, setTheme }          = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [langOpen,   setLangOpen]    = useState(false)
  const [mobileOpen, setMobileOpen]  = useState(false)
  const [isScrolled, setIsScrolled]  = useState(false)
  const langRef                      = useRef<HTMLDivElement>(null)

  const currentLang = LANG_OPTIONS.find(l => l.code === language)

  useEffect(() => { document.documentElement.lang = language }, [language])

  useEffect(() => {
    function onScroll() { setIsScrolled(window.scrollY > 8) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!langOpen) return
    function handleOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [langOpen])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  function toggleTheme() { setTheme(theme === 'dark' ? 'light' : 'dark') }

  function handleLangSelect(code: Language) {
    setLanguage(code)
    setLangOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0F172A]">

      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-brand focus:text-white focus:font-semibold focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* ══ HEADER ═══════════════════════════════════════════════════════════ */}
      <motion.header
        role="banner"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
        className={cn(
          'sticky top-0 z-50 transition-all duration-300 ease-out',
          isScrolled
            ? 'bg-white/82 dark:bg-[#0F172A]/82 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/[0.06] shadow-[0_1px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_24px_rgba(0,0,0,0.4)]'
            : 'bg-transparent',
        )}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link
            to={PATHS.HOME}
            className="flex items-center gap-2.5 flex-shrink-0 group"
            aria-label={`${APP_NAME} — Home`}
          >
            <LogoIcon className="w-8 h-8 transition-transform duration-200 group-hover:scale-105" />
            <span className="font-bold text-gray-900 dark:text-gray-50 text-[17px] tracking-tight transition-colors duration-200 group-hover:text-brand dark:group-hover:text-brand-light">
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">

            <Link
              to={PATHS.PRICING}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3.5 py-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/[0.06] transition-all duration-150"
            >
              {t.pricing}
            </Link>

            <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1.5" aria-hidden="true" />

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all duration-150"
              aria-label={theme === 'dark' ? t.lightMode : t.darkMode}
              title={theme === 'dark' ? t.lightMode : t.darkMode}
            >
              {theme === 'dark'
                ? <Sun className="w-[15px] h-[15px]" />
                : <Moon className="w-[15px] h-[15px]" />}
            </button>

            {/* Language switcher */}
            <div ref={langRef} className="relative">
              <button
                type="button"
                onClick={() => setLangOpen(v => !v)}
                className="h-9 px-2.5 flex items-center gap-1 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all duration-150 text-xs font-semibold"
                aria-label={t.language}
                aria-expanded={langOpen}
                aria-haspopup="listbox"
              >
                <span className="text-[15px] leading-none">{currentLang?.flag}</span>
                <span className="tracking-wide mx-0.5">{currentLang?.short ?? 'UZ'}</span>
                <ChevronDown className={cn('w-3 h-3 text-gray-400 transition-transform duration-200', langOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    role="listbox"
                    aria-label={t.language}
                    className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-white/[0.08] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
                    style={{ zIndex: 9999 }}
                  >
                    {LANG_OPTIONS.map(lang => (
                      <button
                        key={lang.code}
                        type="button"
                        role="option"
                        aria-selected={language === lang.code}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => handleLangSelect(lang.code)}
                        className={cn(
                          'w-full px-3 py-2.5 text-left text-sm flex items-center gap-2.5 transition-colors duration-100',
                          language === lang.code
                            ? 'bg-brand/8 text-brand dark:text-brand-light font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05]',
                        )}
                      >
                        <span className="text-base">{lang.flag}</span>
                        {lang.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1.5" aria-hidden="true" />

            <Link
              to={PATHS.LOGIN}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3.5 py-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/[0.06] transition-all duration-150"
            >
              {t.login}
            </Link>

            {/* Gradient Sign Up CTA */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="ml-1"
            >
              <Link
                to={PATHS.REGISTER}
                className="text-sm font-semibold text-white px-4 py-2 rounded-btn flex items-center gap-1.5 transition-opacity duration-150 hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)',
                  boxShadow: '0 4px 14px rgba(91, 92, 246, 0.38)',
                }}
              >
                {t.register}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </nav>

          {/* Mobile: theme + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors flex-shrink-0"
              aria-label={theme === 'dark' ? t.lightMode : t.darkMode}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(v => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors flex-shrink-0"
              aria-label={mobileOpen ? t.close : t.openMenu}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen
                  ? <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-5 h-5" /></motion.span>
                  : <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="w-5 h-5" /></motion.span>
                }
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile backdrop */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-[2px] md:hidden"
              style={{ top: '64px', zIndex: 38 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="fixed left-0 right-0 md:hidden bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border-b border-gray-100 dark:border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
              style={{ top: '64px', zIndex: 39 }}
            >
              <div className="max-w-6xl mx-auto px-5 py-5 space-y-5 overflow-y-auto max-h-[calc(100vh-80px)]">

                {/* Language switcher */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5 px-1">
                    <Globe className="w-3.5 h-3.5" /> {t.language}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {LANG_OPTIONS.map(lang => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => { setLanguage(lang.code); setMobileOpen(false) }}
                        className={cn(
                          'py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-150 flex items-center justify-center gap-1.5',
                          language === lang.code
                            ? 'border-brand bg-brand/8 text-brand dark:text-brand-light'
                            : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-brand/40',
                        )}
                      >
                        <span className="text-base">{lang.flag}</span>
                        {lang.short}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />

                <nav aria-label="Mobile navigation" className="space-y-1">
                  <Link
                    to={PATHS.PRICING}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors font-medium text-sm"
                  >
                    {t.pricing}
                  </Link>
                </nav>

                <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />

                <div className="space-y-2.5 pb-2">
                  <Link
                    to={PATHS.LOGIN}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all duration-150"
                  >
                    {t.login}
                  </Link>
                  <Link
                    to={PATHS.REGISTER}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-btn text-white font-semibold text-sm transition-opacity duration-150 hover:opacity-90"
                    style={{
                      background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)',
                      boxShadow: '0 4px 14px rgba(91, 92, 246, 0.38)',
                    }}
                  >
                    {t.register}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Page content */}
      <main id="main-content" className="flex-1 min-w-0">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Footer */}
      <footer
        role="contentinfo"
        className="border-t border-gray-100 dark:border-white/[0.06] py-8 px-4 bg-white dark:bg-[#0F172A]"
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <LogoIcon className="w-6 h-6" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{APP_NAME}</span>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 order-last sm:order-none">
            © 2026 {APP_NAME}. {t.allRightsReserved}.
          </p>
          <div className="flex gap-5 text-sm">
            <Link to="/privacy" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150">{t.privacyPolicy}</Link>
            <Link to="/terms"   className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150">{t.termsOfService}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
