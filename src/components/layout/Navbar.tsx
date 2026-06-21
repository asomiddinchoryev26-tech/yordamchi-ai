import { Bell, Menu, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavbarProps {
  onMenuClick:          () => void
  notificationCount?:   number
  userName:             string
  userInitial:          string
  avatarGradient?:      string
  searchPlaceholder?:   string
}

export function Navbar({
  onMenuClick,
  notificationCount = 0,
  userName,
  userInitial,
  avatarGradient = 'bg-gradient-to-br from-blue-500 to-indigo-600',
  searchPlaceholder = 'Qidirish...',
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-10 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center gap-3 px-4 lg:px-6 flex-shrink-0">

      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Menyu ochish"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-sm hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <button
          type="button"
          className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          aria-label="Bildirishnomalar"
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
