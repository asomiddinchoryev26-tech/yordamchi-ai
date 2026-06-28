/**
 * components/layout/Sidebar.tsx
 * Sprint 4.7 Final Polish — Premium $50k SaaS sidebar
 *
 * ⚠️  ALL BUSINESS LOGIC PRESERVED ⚠️
 * Types, props, NavLink routing, AnimatePresence drawer — unchanged.
 * Only visual layer redesigned: Linear + Arc + Stripe aesthetic.
 */

import { NavLink, useLocation } from 'react-router-dom'
import type { ComponentType, ReactNode } from 'react'
import { X, LogOut, Settings } from 'lucide-react'
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

// ─── Color config — unified dark premium ──────────────────────────────────────

const COLOR_CFG: Record<SidebarColor, {
  activeText:    string
  activeBg:      string
  inactiveText:  string
  inactiveHover: string
  accentColor:   string
  accentBar:     string
}> = {
  blue: {
    activeText:    'text-[#93BBFF] font-semibold',
    activeBg:      'bg-[#5B7FFF]/10',
    inactiveText:  'text-white/40',
    inactiveHover: 'hover:text-white/72 hover:bg-white/[0.045]',
    accentColor:   '#5B7FFF',
    accentBar:     'linear-gradient(180deg, #5B7FFF, #7C3AED)',
  },
  indigo: {
    activeText:    'text-[#93BBFF] font-semibold',
    activeBg:      'bg-[#5B7FFF]/10',
    inactiveText:  'text-white/40',
    inactiveHover: 'hover:text-white/72 hover:bg-white/[0.045]',
    accentColor:   '#5B7FFF',
    accentBar:     'linear-gradient(180deg, #5B7FFF, #7C3AED)',
  },
  emerald: {
    activeText:    'text-emerald-400 font-semibold',
    activeBg:      'bg-emerald-500/10',
    inactiveText:  'text-white/40',
    inactiveHover: 'hover:text-white/72 hover:bg-white/[0.045]',
    accentColor:   '#10B981',
    accentBar:     'linear-gradient(180deg, #10B981, #059669)',
  },
  violet: {
    activeText:    'text-violet-400 font-semibold',
    activeBg:      'bg-violet-500/10',
    inactiveText:  'text-white/40',
    inactiveHover: 'hover:text-white/72 hover:bg-white/[0.045]',
    accentColor:   '#7C3AED',
    accentBar:     'linear-gradient(180deg, #7C3AED, #5B5CF6)',
  },
}

// ─── Drawer animation (PRESERVED) ────────────────────────────────────────────

const DRAWER_VARIANTS = {
  closed: { x: '-100%', opacity: 0 },
  open:   { x: 0, opacity: 1 },
}

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

// ─── Nav Item — Linear/Arc style active indicator ─────────────────────────────

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
        'relative flex items-center gap-3 px-3 py-[9px] rounded-[12px] text-[13px] transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand/40 group',
        isActive
          ? cn(cfg.activeText, cfg.activeBg)
          : cn(cfg.inactiveText, cfg.inactiveHover),
      )}
    >
      {/* Sliding bg pill */}
      {isActive && (
        <motion.div
          layoutId="sidebar-bg-pill"
          className="absolute inset-0 rounded-[12px] pointer-events-none"
          style={{ background: `${cfg.accentColor}0E`, boxShadow: `inset 0 0 0 1px ${cfg.accentColor}20` }}
          transition={{ duration: 0.22, ease: EASE }}
          aria-hidden="true"
        />
      )}

      {/* Left accent bar — the LINEAR signature */}
      {isActive && (
        <motion.div
          layoutId="sidebar-accent-bar"
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full pointer-events-none"
          style={{ width: 3, height: 20, background: cfg.accentBar }}
          transition={{ duration: 0.22, ease: EASE }}
          aria-hidden="true"
        />
      )}

      {/* Icon */}
      <Icon
        className={cn(
          'w-4 h-4 flex-shrink-0 relative z-10 transition-all duration-150',
          isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-80',
        )}
        aria-hidden="true"
      />

      <span className="flex-1 truncate relative z-10 font-medium">{item.label}</span>

      {/* Badge */}
      {item.badge !== undefined && item.badge > 0 && (
        <span
          className="relative z-10 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 flex-shrink-0"
          aria-label={`${item.badge} notifications`}
        >
          {item.badge > 9 ? '9+' : item.badge}
        </span>
      )}

      {/* Tag — glass chip */}
      {item.tag && (
        <span
          className="relative z-10 text-[8.5px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded-[5px]"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.28)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
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
  const cfg   = COLOR_CFG[color]
  const { t } = useLanguage()

  const sidebarPanel = (
    <aside
      className="h-full w-[260px] flex flex-col"
      style={{
        background: 'rgba(6,9,18,0.98)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        borderRight: '1px solid rgba(255,255,255,0.055)',
        boxShadow: '4px 0 40px rgba(0,0,0,0.4)',
      }}
    >
      {/* ── Logo header ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5 h-[64px] flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}
      >
        {/* Brand mark */}
        <div
          className="w-[34px] h-[34px] rounded-[10px] overflow-hidden flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #5B7FFF 0%, #7C3AED 100%)',
            boxShadow: '0 0 20px rgba(91,127,255,0.50), 0 4px 12px rgba(91,127,255,0.25)',
          }}
        >
          <img src={logoSrc} alt="" className="w-5 h-5" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className="text-[14.5px] font-black text-white tracking-tight leading-none">YordamchiAI</p>
          <div
            className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded-[5px] text-[9.5px] font-bold"
            style={{ background: 'rgba(91,127,255,0.16)', color: '#93BBFF', border: '1px solid rgba(91,127,255,0.24)' }}
          >
            {userRole}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="ml-auto lg:hidden w-7 h-7 flex items-center justify-center rounded-[8px] text-white/28 hover:text-white/65 hover:bg-white/[0.07] transition-all flex-shrink-0"
          aria-label={t.close}
        >
          <X className="w-[15px] h-[15px]" />
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────────── */}
      <nav
        className="flex-1 px-3 py-3 overflow-y-auto"
        style={{ scrollbarWidth: 'none' }}
        aria-label="Sidebar navigation"
      >
        <div className="space-y-5">
          {navSections.map((section, si) => (
            <div key={si}>
              {section.title && (
                <p
                  className="text-[9px] font-black uppercase tracking-[0.22em] px-3 pb-2"
                  style={{ color: 'rgba(255,255,255,0.18)' }}
                >
                  {section.title}
                </p>
              )}
              <div className="space-y-[2px]">
                {section.items.map(item => (
                  <NavItem
                    key={item.to + item.label}
                    item={item}
                    baseRoute={baseRoute}
                    cfg={cfg}
                    onClose={onClose}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* ── Summary card (injected from parent) ──────────────────────────────── */}
      {summaryCard && (
        <div className="px-3 pb-2">{summaryCard}</div>
      )}

      {/* ── User footer ──────────────────────────────────────────────────────── */}
      <div
        className="px-3 pt-3 pb-4 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.055)' }}
      >
        {/* User card */}
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] mb-1 group transition-all duration-150 hover:bg-white/[0.04]"
        >
          {avatarNode ?? (
            <div
              className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white font-black text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #5B7FFF, #7C3AED)' }}
            >
              {userInitial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold text-white/78 truncate leading-tight">{userName}</p>
            <p className="text-[10px] text-white/32 truncate mt-0.5">{userRole}</p>
          </div>
          {/* Settings icon — appears on hover */}
          <button
            type="button"
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white/22 hover:text-white/60 hover:bg-white/[0.06] transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
            aria-label="Sozlamalar"
          >
            <Settings className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={() => onLogout?.()}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] text-[12.5px] font-medium text-white/28 transition-all duration-150 group hover:bg-red-500/[0.10] hover:text-red-400"
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0 transition-colors" aria-hidden="true" />
          <span>{t.logout}</span>
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Mobile: animated drawer + backdrop (PRESERVED EXACTLY) */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-20 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              aria-hidden="true"
            />
            <motion.div
              key="drawer"
              className="fixed inset-y-0 left-0 z-30 lg:hidden"
              variants={DRAWER_VARIANTS}
              initial="closed" animate="open" exit="closed"
              transition={{ duration: 0.28, ease: EASE }}
            >
              {sidebarPanel}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop: static sidebar (PRESERVED EXACTLY) */}
      <div className="hidden lg:flex lg:flex-shrink-0" style={{ width: 260 }}>
        {sidebarPanel}
      </div>
    </>
  )
}
