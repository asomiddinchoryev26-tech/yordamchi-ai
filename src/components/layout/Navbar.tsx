import { useState, useRef, useEffect } from 'react'
import { Bell, Menu, Search, Sun, Moon, Globe, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage, type Language } from '@/contexts/LanguageContext'

interface NavbarProps {
  onMenuClick:        () => void
  notificationCount?: number
  userName:           string
  userInitial:        string
  avatarGradient?:    string
  searchPlaceholder?: string
}

const LANG_OPTIONS: { code: Language; label: string; short: string }[] = [
  { code: 'uz', label: "O'zbek", short: 'UZ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'en', label: 'English', short: 'EN' },
]

export function Navbar({
  onMenuClick,
  notificationCount = 0,
  userName,
  userInitial,
  avatarGradient = 'bg-gradient-to-br from-blue-500 to-indigo-600',
  searchPlaceholder,
}: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  const placeholder = searchPlaceholder ?? t.searchPlaceholder
  const currentLang = LANG_OPTIONS.find(l => l.code === language)

  // Close dropdown when clicking outside
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
    <header className="sticky top-0 z-10 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 px-4 lg:px-6 flex-shrink-0">

      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={t.openMenu}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-sm hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder={placeholder}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">

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

        {/* Notifications */}
        <button
          type="button"
          className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label={t.notifications}
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        <div
          className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-sm', avatarGradient)}
          title={userName}
          aria-label={userName}
        >
          {userInitial}
        </div>
      </div>
    </header>
  )
}
