/**
 * components/layout/Sidebar.tsx
 * Sprint 4.7 Phase 1 — Premium Dark Glassmorphism Sidebar
 *
 * ⚠️  ALL BUSINESS LOGIC PRESERVED ⚠️
 * Types, props, NavLink routing, event handlers — unchanged.
 * Only visual styling updated to dark-only premium design.
 */

import { NavLink, useLocation } from 'react-router-dom'
import type { ComponentType, ReactNode } from 'react'
import { X, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import logoSrc from '@/assets/images/logo.svg'
import { useLanguage } from '@/contexts/LanguageContext'

// ─── Public types (PRESERVED EXACTLY) ────────────────────────────────────────

export interface SidebarNavItem {
  label:     string
  to:        string
  icon:      ComponentType<{ className?: string }>
  badge?:    number
  tag?:      string
}

export interface SidebarNavSection {
  title?: string
  items:  SidebarNavItem[]
}

type SidebarColor = 'blue' | 'indigo' | 'emerald' | 'violet'

export interface SidebarProps {
  isOpen:       boolean
  onClose:      () => void
  navSections:  SidebarNavSection[]
  baseRoute:    string
  color?:       SidebarColor
  userName:     string
  userRole:     string
  userInitial:  string
  avatarNode?:  ReactNode
  summaryCard?: ReactNode
  onLogout?:    () => void
}

// ─── Color config — dark-only premium values ──────────────────────────────────

const COLOR_CFG: Record<SidebarColor, {
  activeText:    string
  activeBg:      string
  inactiveText:  string
  inactiveHover: string
  accentColor:   string
}> = {
  blue: {
    activeText:    'text-[#A5B4FC] font-semibold',
    activeBg:      'bg-[#5B5CF6]/15',
    inactiveText:  'text-white/45',
    inactiveHover: 'hover:bg-white/[0.06] hover:text-white/80',
    accentColor:   '#5B5CF6',
  },
  indigo: {
    activeText:    'text-[#A5B4FC] font-semibold',
    activeBg:      'bg-[#5B5CF6]/15',
    inactiveText:  'text-white/45',
    inactiveHover: 'hover:bg-white/[0.06] hover:text-white/80',
    accentColor:   '#5B5CF6',
  },
  emerald: {
    activeText:    'text-emerald-400 font-semibold',
    activeBg:      'bg-emerald-500/12',
    inactiveText:  'text-white/45',
    inactiveHover: 'hover:bg-white/[0.06] hover:text-white/80',
    accentColor:   '#10B981',
  },
  violet: {
    activeText:    'text-violet-400 font-semibold',
    activeBg:      'bg-violet-500/12',
    inactiveText:  'text-white/45',
    inactiveHover: 'hover:bg-white/[0.06] hover:text-white/80',
    accentColor:   '#7C3AED',
  },
}

// ─── Drawer animation (PRESERVED EXACTLY) ────────────────────────────────────

const DRAWER_VARIANTS = {
  closed: { x: '-100%', opacity: 0 },
  open:   { x: 0, opacity: 1 },
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({
  item, baseRoute, cfg, onClose,
}: {
  item:      SidebarNavItem
  baseRoute: string
  cfg:       (typeof COLOR_CFG)[SidebarColor]
  onClose:   () => void
}) {
  const location = useLocation()
  const isActive = item.to === baseRoute
    ? location.pathname === item.to
    : location.pathname.startsWith(item.to)
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      end={item.to === baseRoute}
      onClick={onClose}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
        isActive ? cn(cfg.activeText, cfg.activeBg) : cn(cfg.inactiveText, cfg.inactiveHover),
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ background: `${cfg.accentColor}18`, boxShadow: `inset 0 0 0 1px ${cfg.accentColor}25` }}
          transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
          aria-hidden="true"
        />
      )}

      <Icon
        className={cn('w-4 h-4 flex-shrink-0 relative z-10', isActive && 'drop-shadow-sm')}
        aria-hidden="true"
      />
      <span className="flex-1 truncate relative z-10">{item.label}</span>

      {item.badge !== undefined && item.badge > 0 && (
        <span
          className="relative z-10 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 flex-shrink-0"
          aria-label={`${item.badge} notifications`}
        >
          {item.badge > 9 ? '9+' : item.badge}
        </span>
      )}

      {item.tag && (
        <span className="relative z-10 text-[9px] font-bold text-white/25 bg-white/[0.07] px-1.5 py-0.5 rounded-md flex-shrink-0 border border-white/[0.08]">
          {item.tag}
        </span>
      )}
    </NavLink>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar({
  isOpen, onClose, navSections, baseRoute,
  color = 'blue', userName, userRole, userInitial, avatarNode, summaryCard, onLogout,
}: SidebarProps) {
  const cfg    = COLOR_CFG[color]
  const { t }  = useLanguage()

  const sidebarPanel = (
    <aside
      className="h-full w-64 flex flex-col"
      style={{
        background: 'rgba(7,11,20,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 h-16 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg,#5B5CF6,#7C3AED)',
            boxShadow: '0 0 16px rgba(91,92,246,0.45)',
          }}
        >
          <img src={logoSrc} alt="YordamchiAI" className="w-6 h-6" />
        </div>
        <span className="font-black text-[15px] text-white tracking-tight truncate">
          YordamchiAI
        </span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto lg:hidden w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.07] transition-colors flex-shrink-0"
          aria-label={t.close}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 px-3 py-4 overflow-y-auto space-y-5"
        aria-label="Sidebar navigation"
      >
        {navSections.map((section, si) => (
          <div key={si}>
            {section.title && (
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.15em] px-3 mb-2">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavItem
                  key={item.to}
                  item={item}
                  baseRoute={baseRoute}
                  cfg={cfg}
                  onClose={onClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Summary card */}
      {summaryCard && (
        <div className="px-3 pb-3">{summaryCard}</div>
      )}

      {/* User profile + logout */}
      <div
        className="px-3 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl mb-1 transition-colors hover:bg-white/[0.05]">
          {avatarNode ?? (
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #5B5CF6, #7C3AED)' }}
            >
              {userInitial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white/80 truncate leading-tight">{userName}</p>
            <p className="text-xs text-white/35 truncate">{userRole}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onLogout?.()}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/35 hover:bg-red-500/12 hover:text-red-400 transition-all duration-150 group"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="font-medium">{t.logout}</span>
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Mobile: animated drawer + backdrop (PRESERVED) */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-20 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              aria-hidden="true"
            />
            <motion.div
              key="drawer"
              className="fixed inset-y-0 left-0 z-30 lg:hidden"
              variants={DRAWER_VARIANTS}
              initial="closed"
              animate="open"
              exit="closed"
              transition={{ duration: 0.28, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              {sidebarPanel}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop: static sidebar (PRESERVED) */}
      <div className="hidden lg:flex lg:flex-shrink-0" style={{ width: 256 }}>
        {sidebarPanel}
      </div>
    </>
  )
}
