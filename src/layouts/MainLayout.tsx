import { useState, useRef, useEffect } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Sun, Moon, Globe, ChevronDown, Menu, X, ArrowRight } from 'lucide-react'
import { PATHS } from '@/routes/paths'
import { APP_NAME } from '@/utils/constants'
import logoSrc from '@/assets/images/logo.svg'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage, type Language } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

const LANG_OPTIONS: { code: Language; label: string; short: string }[] = [
  { code: 'uz', label: "O'zbek", short: 'UZ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'en', label: 'English', short: 'EN' },
]

export default function MainLayout() {
  const { theme, setTheme }             = useTheme()
  const { language, setLanguage, t }    = useLanguage()
  const [langOpen,   setLangOpen]       = useState(false)
  const [mobileOpen, setMobileOpen]     = useState(false)
  const langRef                         = useRef<HTMLDivElement>(null)

  const currentLang = LANG_OPTIONS.find(l => l.code === language)

  // Desktop language dropdown — click-outside to close
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

  // Close mobile menu on route change (body scroll lock)
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  function handleLangSelect(code: Language) {
    setLanguage(code)
    setLangOpen(false)
  }

  function handleMobileLangSelect(code: Language) {
    setLanguage(code)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to={PATHS.HOME} className="flex items-center gap-2 flex-shrink-0 group">
            <img src={logoSrc} alt={APP_NAME} className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-gray-900 dark:text-gray-100 text-lg tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {APP_NAME}
            </span>
          </Link>

          {/* ── Desktop nav (md+) ── */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              to={PATHS.PRICING}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t.pricing}
            </Link>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label={theme === 'dark' ? t.lightMode : t.darkMode}
              title={theme === 'dark' ? t.lightMode : t.darkMode}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language switcher */}
            <div ref={langRef} className="relative">
              <button
                type="button"
                onClick={() => setLangOpen(v => !v)}
                className="h-9 px-2.5 flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs font-bold"
                aria-label={t.language}
                aria-expanded={langOpen}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{currentLang?.short ?? 'UZ'}</span>
                <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', langOpen && 'rotate-180')} />
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden" style={{ zIndex: 9999 }}>
                  {LANG_OPTIONS.map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => handleLangSelect(lang.code)}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm transition-colors',
                        language === lang.code
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                      )}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              to={PATHS.LOGIN}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t.login}
            </Link>
            <Link
              to={PATHS.REGISTER}
              className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              {t.register}
            </Link>
          </nav>

          {/* ── Mobile right side: theme + hamburger ── */}
          <div className="flex md:hidden items-center gap-2">
            {/* Theme quick-toggle (always visible on mobile) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              aria-label={theme === 'dark' ? t.lightMode : t.darkMode}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(v => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              aria-label={mobileOpen ? t.close : t.openMenu}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile drawer ─────────────────────────────────────────────── */}
        {/* Backdrop */}
        <div
          className={cn(
            'fixed inset-0 bg-black/40 md:hidden transition-opacity duration-300',
            mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          )}
          style={{ top: '64px', zIndex: 38 }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />

        {/* Drawer panel */}
        <div
          className={cn(
            'fixed left-0 right-0 md:hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-xl transition-all duration-300 ease-out overflow-hidden',
            mobileOpen ? 'max-h-[calc(100vh-64px)] opacity-100' : 'max-h-0 opacity-0',
          )}
          style={{ top: '64px', zIndex: 39 }}
        >
          <div className="max-w-6xl mx-auto px-4 py-5 space-y-4 overflow-y-auto max-h-[calc(100vh-80px)]">

            {/* Language switcher — full width 3 buttons */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> {t.language}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {LANG_OPTIONS.map(lang => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleMobileLangSelect(lang.code)}
                    className={cn(
                      'py-2.5 rounded-xl text-sm font-semibold border-2 transition-all',
                      language === lang.code
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-200 dark:hover:border-blue-700',
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 dark:bg-gray-800" />

            {/* Nav links */}
            <div className="space-y-1">
              <Link
                to={PATHS.PRICING}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                {t.pricing}
              </Link>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 dark:bg-gray-800" />

            {/* Auth buttons */}
            <div className="space-y-2.5 pb-2">
              <Link
                to={PATHS.LOGIN}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t.login}
              </Link>
              <Link
                to={PATHS.REGISTER}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-md"
              >
                {t.register} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <img src={logoSrc} alt="" className="w-6 h-6 rounded-md" aria-hidden="true" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{APP_NAME}</span>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            © 2026 {APP_NAME}. {t.allRightsReserved}.
          </p>
          <div className="flex gap-6 text-sm text-gray-400 dark:text-gray-500">
            <span>{t.privacyPolicy}</span>
            <span>{t.termsOfService}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
