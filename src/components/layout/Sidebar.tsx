import { NavLink } from 'react-router-dom'
import type { ComponentType, ReactNode } from 'react'
import { X, LogOut, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import logoSrc from '@/assets/images/logo.svg'
import { useLanguage } from '@/contexts/LanguageContext'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface SidebarNavItem {
  label:  string
  to:     string
  icon:   ComponentType<{ className?: string }>
  badge?: number
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
  /** Pass a <UserAvatar> node to replace the default inline avatar */
  avatarNode?:  ReactNode
  summaryCard?: ReactNode
  onLogout?:    () => void
}

// ─── Color config ─────────────────────────────────────────────────────────────

const COLOR_CFG: Record<SidebarColor, { active: string; inactive: string }> = {
  blue: {
    active:   'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
  },
  indigo: {
    active:   'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-semibold',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
  },
  emerald: {
    active:   'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
  },
  violet: {
    active:   'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 font-semibold',
    inactive: 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({
  isOpen,
  onClose,
  navSections,
  baseRoute,
  color = 'blue',
  userName,
  userRole,
  userInitial,
  avatarNode,
  summaryCard,
  onLogout,
}: SidebarProps) {
  const cfg = COLOR_CFG[color]
  const { t } = useLanguage()

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 z-20 lg:hidden transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700 flex flex-col',
        'transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:static lg:inset-auto',
      )}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 sm:px-5 h-14 sm:h-16 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <img src={logoSrc} alt="YordamchiAI" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shadow-sm flex-shrink-0" />
          <span className="font-bold text-gray-900 dark:text-gray-100 tracking-tight truncate">YordamchiAI</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto lg:hidden text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 sm:px-3 py-4 overflow-y-auto space-y-4 sm:space-y-5">
          {navSections.map((section, i) => (
            <div key={i}>
              {section.title && (
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 mb-1.5">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === baseRoute}
                      onClick={onClose}
                      className={({ isActive }) => cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                        isActive ? cfg.active : cfg.inactive,
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Summary card */}
        {summaryCard !== undefined && (
          <div className="px-2.5 sm:px-3 pb-3">{summaryCard}</div>
        )}

        {/* User profile / logout */}
        <div className="px-2.5 sm:px-3 py-3 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            {/* Avatar: custom node or fallback */}
            {avatarNode ?? (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {userInitial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">{userName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userRole}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onLogout?.()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 group transition-colors text-left"
          >
            <LogOut className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 group-hover:text-red-500 transition-colors flex-shrink-0" />
            <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-red-500 transition-colors font-medium">
              Chiqish
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 ml-auto" />
          </button>
        </div>
      </aside>
    </>
  )
}
