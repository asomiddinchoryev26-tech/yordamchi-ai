import { useState, useRef, useEffect } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Sun, Moon, Globe, ChevronDown } from 'lucide-react'
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
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  const currentLang = LANG_OPTIONS.find(l => l.code === language)

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

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  function handleLangSelect(code: Language) {
    setLanguage(code)
    setLangOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">

      {/* ── Header ── */}
      <header className="sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to={PATHS.HOME} className="flex items-center gap-2.5 group">
            <img src={logoSrc} alt={APP_NAME} className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-gray-900 dark:text-gray-100 text-lg tracking-tight group-hover:text-blue-600 transition-colors">
              {APP_NAME}
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              to={PATHS.PRICING}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors hidden sm:block"
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
              {theme === 'dark'
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />
              }
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
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
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
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
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
