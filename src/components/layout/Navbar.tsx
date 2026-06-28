/**
 * components/layout/Navbar.tsx
 * Sprint 4.7 Final Polish — Premium topbar (Linear + Arc aesthetic)
 *
 * ⚠️  ALL BUSINESS LOGIC PRESERVED ⚠️
 * Props, theme toggle, language switcher, DropdownPortal — unchanged.
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

// ─── Portal Dropdown (PRESERVED EXACTLY) ─────────────────────────────────────

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
    setPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
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
        position: 'fixed', top: pos.top, right: pos.right, zIndex: 99999, width: 210,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.93) translateY(-8px)',
        transformOrigin: 'top right',
        transition: 'opacity 180ms cubic-bezier(.22,1,.36,1), transform 180ms cubic-bezier(.22,1,.36,1)',
        pointerEvents: visible ? 'auto' : 'none',
        background: 'rgba(8,12,24,0.97)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
      }}
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
  const { theme, setTheme }          = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [langOpen, setLangOpen]      = useState(false)
  const langBtnRef                   = useRef<HTMLButtonElement>(null)

  const placeholder = searchPlaceholder ?? t.searchPlaceholder
  const currentLang = LANG_OPTIONS.find(l => l.code === language)
  const closeLang   = useCallback(() => setLangOpen(false), [])

  function toggleTheme() { setTheme(theme === 'dark' ? 'light' : 'dark') }
  function handleLangSelect(code: Language) { setLanguage(code); setLangOpen(false) }

  // ── Shared glass button style ─────────────────────────────────────────────
  const glassBtn = 'flex items-center justify-center rounded-[10px] text-white/38 hover:text-white/75 hover:bg-white/[0.055] transition-all duration-150 flex-shrink-0'

  return (
    <header
      className="sticky top-0 z-30 h-[56px] flex items-center gap-2 sm:gap-3 px-3 sm:px-5 lg:px-6 flex-shrink-0"
      style={{
        background: 'rgba(6,9,18,0.92)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        borderBottom: '1px solid rgba(255,255,255,0.055)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.035)',
      }}
    >
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuClick}
        className={cn(glassBtn, 'lg:hidden w-8 h-8 sm:w-9 sm:h-9')}
        aria-label={t.openMenu}
      >
        <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {/* ── Premium Search Bar (Linear × Arc style) ─────────────────────────── */}
      <div className="flex-1 max-w-[400px] hidden sm:block">
        <label className="relative flex items-center group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] pointer-events-none transition-colors duration-200"
            style={{ color: 'rgba(255,255,255,0.28)' }}
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder={placeholder}
            className="w-full pl-[34px] pr-[72px] py-[7px] text-[13px] font-medium outline-none transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              color: 'rgba(255,255,255,0.72)',
            }}
            onFocus={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
              e.currentTarget.style.border = '1px solid rgba(91,127,255,0.50)'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,127,255,0.13), 0 4px 16px rgba(0,0,0,0.25)'
            }}
            onBlur={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'
              e.currentTarget.style.boxShadow = 'none'
            }}
            aria-label={placeholder}
          />
          {/* ⌘K badge */}
          <div
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-[3px] px-1.5 py-[3px] rounded-[6px] pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)' }}
            aria-hidden="true"
          >
            <Command className="w-[9px] h-[9px]" style={{ color: 'rgba(255,255,255,0.28)' }} />
            <span className="text-[9.5px] font-bold" style={{ color: 'rgba(255,255,255,0.28)' }}>K</span>
          </div>
        </label>
      </div>

      {/* ── Right controls ────────────────────────────────────────────────────── */}
      <div className="ml-auto flex items-center gap-1.5">

        {/* AI glow button */}
        <button
          type="button"
          className="hidden sm:flex items-center justify-center gap-1.5 h-8 px-3 rounded-[10px] text-white text-[12px] font-bold flex-shrink-0 transition-all duration-150 hover:opacity-88 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #5B7FFF 0%, #7C3AED 100%)',
            boxShadow: '0 0 18px rgba(91,127,255,0.48), 0 4px 10px rgba(91,127,255,0.22), inset 0 1px 0 rgba(255,255,255,0.18)',
          }}
          aria-label="AI Yordamchi"
        >
          <Zap className="w-[13px] h-[13px]" aria-hidden="true" />
          <span className="hidden md:inline">AI</span>
        </button>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 mx-0.5" style={{ background: 'rgba(255,255,255,0.07)' }} aria-hidden="true" />

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className={cn(glassBtn, 'w-8 h-8 sm:w-9 sm:h-9')}
          aria-label={theme === 'dark' ? t.lightMode : t.darkMode}
          title={theme === 'dark' ? t.lightMode : t.darkMode}
        >
          {theme === 'dark'
            ? <Sun  className="w-[15px] h-[15px]" />
            : <Moon className="w-[15px] h-[15px]" />}
        </button>

        {/* Chat */}
        <button
          type="button"
          className={cn(glassBtn, 'w-8 h-8 sm:w-9 sm:h-9')}
          aria-label="Xabarlar"
        >
          <MessageSquare className="w-[15px] h-[15px]" aria-hidden="true" />
        </button>

        {/* Language switcher */}
        <div className="relative flex-shrink-0">
          <button
            ref={langBtnRef}
            type="button"
            onClick={() => setLangOpen(v => !v)}
            className={cn(
              'h-8 sm:h-9 px-2 sm:px-2.5 flex items-center gap-1 rounded-[10px]',
              'text-white/45 text-[11.5px] font-bold hover:text-white/75 transition-all duration-150',
            )}
            style={{
              background: langOpen ? 'rgba(91,127,255,0.14)' : 'rgba(255,255,255,0.05)',
              border: langOpen ? '1px solid rgba(91,127,255,0.32)' : '1px solid rgba(255,255,255,0.08)',
            }}
            aria-label={t.language}
            aria-expanded={langOpen}
            aria-haspopup="listbox"
          >
            <Globe className="w-[12px] h-[12px] sm:w-[13px] sm:h-[13px]" aria-hidden="true" />
            <span>{currentLang?.short ?? 'UZ'}</span>
            <ChevronDown className={cn('w-[10px] h-[10px] transition-transform duration-200', langOpen && 'rotate-180')} aria-hidden="true" />
          </button>

          <DropdownPortal anchorRef={langBtnRef} open={langOpen} onClose={closeLang}>
            <div className="py-2" role="listbox" aria-label={t.language}>
              <div className="px-3 pt-0.5 pb-2">
                <p className="text-[9.5px] font-black text-white/22 uppercase tracking-[0.15em]">{t.language}</p>
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
                      'w-full px-3 py-2.5 flex items-center gap-3 text-left text-[13px] transition-colors duration-100',
                      active ? 'text-[#93BBFF]' : 'text-white/52 hover:text-white/78 hover:bg-white/[0.05]',
                    )}
                    style={active ? { background: 'rgba(91,127,255,0.12)' } : {}}
                  >
                    <span className="text-[15px] leading-none flex-shrink-0">{lang.flag}</span>
                    <span className="flex-1 font-medium">{lang.label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-[#93BBFF] flex-shrink-0" aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          </DropdownPortal>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className={cn(glassBtn, 'w-8 h-8 sm:w-9 sm:h-9 relative')}
          aria-label={t.notifications}
        >
          <Bell className="w-[15px] h-[15px]" aria-hidden="true" />
          {notificationCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center leading-none"
              style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }}
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* User avatar */}
        {avatarNode ?? (
          <div
            className={cn(
              'w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] flex items-center justify-center text-white font-black text-sm cursor-pointer flex-shrink-0 transition-all hover:opacity-85',
              avatarGradient,
            )}
            title={userName}
            aria-label={userName}
            style={{ boxShadow: '0 0 14px rgba(91,127,255,0.35)' }}
          >
            {userInitial}
          </div>
        )}
      </div>
    </header>
  )
}
