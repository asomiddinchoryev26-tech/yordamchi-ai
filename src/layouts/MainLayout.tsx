import { useState, useRef, useEffect } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Sun, Moon, Globe, ChevronDown, Menu, X, ArrowRight } from 'lucide-react'
import { PATHS } from '@/routes/paths'
import { APP_NAME } from '@/utils/constants'
import logoSrc from '@/assets/images/logo.svg'
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

  // ── Sync <html lang> attribute with selected language ────────────────────
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  // ── Scroll detection → swap nav background ────────────────────────────────
  useEffect(() => {
    function onScroll() { setIsScrolled(window.scrollY > 8) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Desktop language dropdown — click-outside to close ───────────────────
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

  // ── Body scroll lock when mobile menu is open ─────────────────────────────
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
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">

      {/* ── Skip to main content — accessibility ──────────────────────────── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-indigo-600 focus:text-white focus:font-semibold focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* ══ HEADER ═══════════════════════════════════════════════════════════ */}
      <header
        role="banner"
        className={cn(
          'sticky top-0 z-50 transition-all duration-300 ease-out',
          isScrolled
            ? 'bg-white/96 dark:bg-gray-950/96 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-800/60 shadow-[0_1px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_16px_rgba(0,0,0,0.35)]'
            : 'bg-transparent',
        )}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <Link
            to={PATHS.HOME}
            className="flex items-center gap-2.5 flex-shrink-0 group"
            aria-label={`${APP_NAME} — Home`}
          >
            <img
              src={logoSrc}
              alt=""
              aria-hidden="true"
              className="w-8 h-8 rounded-xl transition-transform duration-200 group-hover:scale-105"
            />
            <span className="font-bold text-gray-900 dark:text-gray-50 text-[17px] tracking-tight transition-colors duration-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              {APP_NAME}
            </span>
          </Link>

          {/* ── Desktop nav (md+) ────────────────────────────────────────── */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">

            <Link
              to={PATHS.PRICING}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3.5 py-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-150"
            >
              {t.pricing}
            </Link>

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1.5" aria-hidden="true" />

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150"
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
                className="h-9 px-2.5 flex items-center gap-1 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150 text-xs font-semibold"
                aria-label={t.language}
                aria-expanded={langOpen}
                aria-haspopup="listbox"
              >
                <span className="text-[15px] leading-none">{currentLang?.flag}</span>
                <span className="tracking-wide mx-0.5">{currentLang?.short ?? 'UZ'}</span>
                <ChevronDown className={cn('w-3 h-3 text-gray-400 transition-transform duration-200', langOpen && 'rotate-180')} />
              </button>

              {langOpen && (
                <div
                  role="listbox"
                  aria-label={t.language}
                  className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden"
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
                          ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60',
                      )}
                    >
                      <span className="text-base">{lang.flag}</span>
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1.5" aria-hidden="true" />

            <Link
              to={PATHS.LOGIN}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3.5 py-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-150"
            >
              {t.login}
            </Link>

            <Link
              to={PATHS.REGISTER}
              className="ml-1 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md hover:shadow-indigo-500/25 flex items-center gap-1.5"
            >
              {t.register}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </nav>

          {/* ── Mobile: theme + hamburger ─────────────────────────────────── */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              aria-label={theme === 'dark' ? t.lightMode : t.darkMode}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(v => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              aria-label={mobileOpen ? t.close : t.openMenu}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile backdrop ───────────────────────────────────────────────── */}
        <div
          className={cn(
            'fixed inset-0 bg-black/30 backdrop-blur-[2px] md:hidden transition-opacity duration-300',
            mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          )}
          style={{ top: '64px', zIndex: 38 }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />

        {/* ── Mobile drawer panel ───────────────────────────────────────────── */}
        <div
          id="mobile-menu"
          className={cn(
            'fixed left-0 right-0 md:hidden bg-white/98 dark:bg-gray-900/98 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 shadow-2xl transition-all duration-300 ease-out overflow-hidden',
            mobileOpen ? 'max-h-[calc(100vh-64px)] opacity-100' : 'max-h-0 opacity-0',
          )}
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
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-700',
                    )}
                  >
                    <span className="text-base">{lang.flag}</span>
                    {lang.short}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800" />

            {/* Nav links */}
            <nav aria-label="Mobile navigation" className="space-y-1">
              <Link
                to={PATHS.PRICING}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-sm"
              >
                {t.pricing}
              </Link>
            </nav>

            <div className="h-px bg-gray-100 dark:bg-gray-800" />

            {/* Auth buttons */}
            <div className="space-y-2.5 pb-2">
              <Link
                to={PATHS.LOGIN}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-150"
              >
                {t.login}
              </Link>
              <Link
                to={PATHS.REGISTER}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm transition-all duration-150 shadow-md shadow-indigo-500/30"
              >
                {t.register}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Page content ──────────────────────────────────────────────────────── */}
      <main id="main-content" className="flex-1 min-w-0">
        <Outlet />
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer
        role="contentinfo"
        className="border-t border-gray-100 dark:border-gray-800 py-8 px-4 bg-white dark:bg-gray-950"
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <img src={logoSrc} alt="" className="w-6 h-6 rounded-lg" aria-hidden="true" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{APP_NAME}</span>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 order-last sm:order-none">
            © 2026 {APP_NAME}. {t.allRightsReserved}.
          </p>
          <div className="flex gap-5 text-sm">
            <Link
              to="/privacy"
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150"
            >
              {t.privacyPolicy}
            </Link>
            <Link
              to="/terms"
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150"
            >
              {t.termsOfService}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
