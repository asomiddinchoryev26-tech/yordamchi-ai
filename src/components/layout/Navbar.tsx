/**
 * components/layout/Navbar.tsx
 * Sprint 4.7 Phase 1 — Premium Dark Glassmorphism Topbar
 *
 * ⚠️  ALL BUSINESS LOGIC PRESERVED ⚠️
 * Props, theme toggle, language switcher, dropdown logic — unchanged.
 * Only visual styling updated to dark-only premium design.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Menu, Search, Sun, Moon, Globe, ChevronDown, Check, Command, Zap, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage, type Language } from '@/contexts/LanguageContext'

// ─── Interface (PRESERVED EXACTLY) ───────────────────────────────────────────

interface NavbarProps {
  onMenuClick:        () => void
  notificationCount?: number
  userName:           string
  userInitial:        string
  avatarGradient?:    string
  searchPlaceholder?: string
  avatarNode?:        React.ReactNode
}

const LANG_OPTIONS: { code: Language; label: string; flag: string; short: string }[] = [
  { code: 'uz', label: "O'zbek",  flag: '🇺🇿', short: 'UZ' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', short: 'RU' },
  { code: 'en', label: 'English', flag: '🇬🇧', short: 'EN' },
]

// ─── Portal Dropdown (PRESERVED EXACTLY — only glass style updated) ───────────

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

  useEffect(() => {
    if (!open || !anchorRef.current) return
    const r = anchorRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [open, anchorRef])

  useEffect(() => { if (!open) setVisible(false) }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        portalRef.current && !portalRef.current.contains(target) &&
        anchorRef.current  && !anchorRef.current.contains(target)
      ) { onClose() }
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
        background:      'rgba(10,14,27,0.96)',
        backdropFilter:  'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border:          '1px solid rgba(255,255,255,0.10)',
        borderRadius:    '16px',
        overflow:        'hidden',
        boxShadow:       '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      {children}
    </div>,
    document.body,
  )
}

// ─── Navbar (PRESERVED EXACTLY — only visual styling updated) ─────────────────

export function Navbar({
  onMenuClick,
  notificationCount = 0,
  userName,
  userInitial,
  avatarGradient = 'bg-gradient-to-br from-blue-500 to-indigo-600',
  searchPlaceholder,
  avatarNode,
}: NavbarProps) {
  // All business logic preserved:
  const { theme, setTheme }            = useTheme()
  const { language, setLanguage, t }   = useLanguage()
  const [langOpen, setLangOpen]        = useState(false)
  const langBtnRef                     = useRef<HTMLButtonElement>(null)

  const placeholder = searchPlaceholder ?? t.searchPlaceholder
  const currentLang = LANG_OPTIONS.find(l => l.code === language)
  const closeLang   = useCallback(() => setLangOpen(false), [])

  function toggleTheme() { setTheme(theme === 'dark' ? 'light' : 'dark') }
  function handleLangSelect(code: Language) { setLanguage(code); setLangOpen(false) }

  const glassBtn = [
    'w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl',
    'text-white/40 hover:text-white/80 transition-all duration-150 flex-shrink-0',
  ].join(' ')

  return (
    <header
      className="sticky top-0 z-30 h-14 sm:h-16 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:px-6 flex-shrink-0"
      style={{
        background: 'rgba(7,11,20,0.88)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuClick}
        className={cn(glassBtn, 'lg:hidden')}
        aria-label={t.openMenu}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Premium search bar */}
      <div className="flex-1 max-w-sm hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            placeholder={placeholder}
            className="w-full pl-9 pr-16 py-2 text-sm rounded-xl text-white/70 placeholder:text-white/25 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onFocus={e => {
              e.currentTarget.style.border = '1px solid rgba(91,92,246,0.45)'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,92,246,0.12), 0 4px 12px rgba(0,0,0,0.2)'
            }}
            onBlur={e => {
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'
              e.currentTarget.style.boxShadow = 'none'
            }}
            aria-label={placeholder}
          />
          {/* Keyboard shortcut hint */}
          <div
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            aria-hidden="true"
          >
            <Command className="w-2.5 h-2.5 text-white/25" />
            <span className="text-[10px] font-bold text-white/25">K</span>
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className={glassBtn}
          aria-label={theme === 'dark' ? t.lightMode : t.darkMode}
          title={theme === 'dark' ? t.lightMode : t.darkMode}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {theme === 'dark'
            ? <Sun  className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>

        {/* AI glow button */}
        <button
          type="button"
          className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl text-white font-bold text-[11px] flex-shrink-0 transition-all hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #5B7FFF, #7C3AED)',
            boxShadow: '0 0 14px rgba(91,127,255,0.55), 0 4px 12px rgba(91,127,255,0.3)',
          }}
          aria-label="AI Yordamchi"
        >
          <Zap className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Chat icon */}
        <button
          type="button"
          className={glassBtn}
          aria-label="Xabarlar"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Language switcher */}
        <div className="relative flex-shrink-0">
          <button
            ref={langBtnRef}
            type="button"
            onClick={() => setLangOpen(v => !v)}
            className={cn(
              'h-8 sm:h-9 px-2 sm:px-2.5 flex items-center gap-1 rounded-xl',
              'text-white/50 text-xs font-bold hover:text-white/80 transition-colors',
            )}
            style={{
              background: langOpen ? 'rgba(91,92,246,0.15)' : 'rgba(255,255,255,0.05)',
              border: langOpen ? '1px solid rgba(91,92,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
            }}
            aria-label={t.language}
            aria-expanded={langOpen}
            aria-haspopup="listbox"
          >
            <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
            <span>{currentLang?.short ?? 'UZ'}</span>
            <ChevronDown className={cn('w-3 h-3 transition-transform duration-200', langOpen && 'rotate-180')} aria-hidden="true" />
          </button>

          <DropdownPortal anchorRef={langBtnRef} open={langOpen} onClose={closeLang}>
            <div className="py-1.5" role="listbox" aria-label={t.language}>
              <div className="px-3 pt-1 pb-2">
                <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.12em]">{t.language}</p>
              </div>
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
                        ? 'text-brand-light'
                        : 'text-white/55 hover:text-white/80 hover:bg-white/[0.05]',
                    )}
                    style={active ? { background: 'rgba(91,92,246,0.12)' } : {}}
                  >
                    <span className="text-base leading-none flex-shrink-0">{lang.flag}</span>
                    <span className="flex-1 font-medium">{lang.label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-brand-light flex-shrink-0" aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          </DropdownPortal>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className={cn(glassBtn, 'relative')}
          aria-label={t.notifications}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-[17px] h-[17px] bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* User avatar */}
        {avatarNode ?? (
          <div
            className={cn(
              'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm cursor-pointer flex-shrink-0',
              avatarGradient,
            )}
            title={userName}
            aria-label={userName}
            style={{ boxShadow: '0 0 12px rgba(91,92,246,0.35)' }}
          >
            {userInitial}
          </div>
        )}
      </div>
    </header>
  )
}
