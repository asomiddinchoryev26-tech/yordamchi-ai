import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Menu, Search, Sun, Moon, Globe, ChevronDown, Check } from 'lucide-react'
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
  /** Pass a <UserAvatar> node to replace the default inline avatar */
  avatarNode?:        React.ReactNode
}

const LANG_OPTIONS: { code: Language; label: string; flag: string; short: string }[] = [
  { code: 'uz', label: "O'zbek",  flag: '🇺🇿', short: 'UZ' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', short: 'RU' },
  { code: 'en', label: 'English', flag: '🇬🇧', short: 'EN' },
]

// ─── Portal Dropdown ──────────────────────────────────────────────────────────

interface DropdownPortalProps {
  anchorRef:  React.RefObject<HTMLButtonElement | null>
  open:       boolean
  onClose:    () => void
  children:   React.ReactNode
}

function DropdownPortal({ anchorRef, open, onClose, children }: DropdownPortalProps) {
  const [pos,     setPos]     = useState({ top: 0, right: 0 })
  const [visible, setVisible] = useState(false)
  const portalRef = useRef<HTMLDivElement>(null)

  // Recalculate position when opened
  useEffect(() => {
    if (!open || !anchorRef.current) return
    const r = anchorRef.current.getBoundingClientRect()
    setPos({
      top:   r.bottom + 6,
      right: window.innerWidth - r.right,
    })
    // Trigger enter animation on next paint
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [open, anchorRef])

  // Reset animation flag on close
  useEffect(() => {
    if (!open) setVisible(false)
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        portalRef.current && !portalRef.current.contains(target) &&
        anchorRef.current  && !anchorRef.current.contains(target)
      ) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose, anchorRef])

  if (!open) return null

  return createPortal(
    <div
      ref={portalRef}
      style={{
        position:        'fixed',
        top:             pos.top,
        right:           pos.right,
        zIndex:          99999,
        width:           '200px',
        opacity:         visible ? 1 : 0,
        transform:       visible ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(-6px)',
        transformOrigin: 'top right',
        transition:      'opacity 200ms cubic-bezier(.22,1,.36,1), transform 200ms cubic-bezier(.22,1,.36,1)',
        pointerEvents:   visible ? 'auto' : 'none',
      }}
      className={cn(
        'backdrop-blur-2xl',
        'bg-white/90 dark:bg-gray-900/90',
        'border border-gray-200/70 dark:border-gray-700/60',
        'rounded-2xl overflow-hidden',
        'shadow-2xl shadow-black/10 dark:shadow-black/50',
        'ring-1 ring-black/[0.04] dark:ring-white/[0.04]',
      )}
    >
      {children}
    </div>,
    document.body,
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar({
  onMenuClick,
  notificationCount = 0,
  userName,
  userInitial,
  avatarGradient = 'bg-gradient-to-br from-blue-500 to-indigo-600',
  searchPlaceholder,
  avatarNode,
}: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [langOpen, setLangOpen] = useState(false)
  const langBtnRef = useRef<HTMLButtonElement>(null)

  const placeholder  = searchPlaceholder ?? t.searchPlaceholder
  const currentLang  = LANG_OPTIONS.find(l => l.code === language)
  const closeLang    = useCallback(() => setLangOpen(false), [])

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  function handleLangSelect(code: Language) {
    setLanguage(code)
    setLangOpen(false)
  }

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 flex-shrink-0">

      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
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

      {/* Right side controls */}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          aria-label={theme === 'dark' ? t.lightMode : t.darkMode}
          title={theme === 'dark' ? t.lightMode : t.darkMode}
        >
          {theme === 'dark'
            ? <Sun  className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>

        {/* Language switcher */}
        <div className="relative flex-shrink-0">
          <button
            ref={langBtnRef}
            type="button"
            onClick={() => setLangOpen(v => !v)}
            className={cn(
              'h-8 sm:h-9 px-2 sm:px-2.5 flex items-center gap-1 rounded-xl',
              'border border-gray-200 dark:border-gray-700',
              'bg-white dark:bg-gray-800',
              'text-gray-600 dark:text-gray-300 text-xs font-bold',
              'hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
              'transition-colors',
              langOpen && 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white',
            )}
            aria-label={t.language}
            aria-expanded={langOpen}
            aria-haspopup="listbox"
          >
            <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{currentLang?.short ?? 'UZ'}</span>
            <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', langOpen && 'rotate-180')} />
          </button>

          {/* Portal dropdown — renders in document.body, never clips behind chat */}
          <DropdownPortal anchorRef={langBtnRef} open={langOpen} onClose={closeLang}>
            <div className="py-1.5" role="listbox" aria-label={t.language}>
              {/* Header */}
              <div className="px-3 pt-1 pb-2">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-[0.12em]">
                  {t.language}
                </p>
              </div>
              {/* Options */}
              {LANG_OPTIONS.map(lang => {
                const active = language === lang.code
                return (
                  <button
                    key={lang.code}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => handleLangSelect(lang.code)}
                    className={cn(
                      'w-full px-3 py-2.5 flex items-center gap-3 text-left text-sm transition-colors duration-100',
                      active
                        ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/60',
                    )}
                  >
                    <span className="text-base leading-none flex-shrink-0">{lang.flag}</span>
                    <span className="flex-1 font-medium">{lang.label}</span>
                    {active && (
                      <Check className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </DropdownPortal>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          aria-label={t.notifications}
        >
          <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-[17px] h-[17px] bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* User avatar — custom node or fallback */}
        {avatarNode ?? (
          <div
            className={cn(
              'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-sm flex-shrink-0',
              avatarGradient,
            )}
            title={userName}
            aria-label={userName}
          >
            {userInitial}
          </div>
        )}
      </div>
    </header>
  )
}
