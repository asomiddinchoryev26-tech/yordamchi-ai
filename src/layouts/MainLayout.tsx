import { Link, Outlet } from 'react-router-dom'
import { PATHS } from '@/routes/paths'
import { APP_NAME } from '@/utils/constants'
import logoSrc from '@/assets/images/logo.svg'

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to={PATHS.HOME} className="flex items-center gap-2.5 group">
            <img src={logoSrc} alt={APP_NAME} className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-gray-900 text-lg tracking-tight group-hover:text-blue-600 transition-colors">
              {APP_NAME}
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-5">
            <Link
              to={PATHS.PRICING}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:block"
            >
              Narxlar
            </Link>
            <Link
              to={PATHS.LOGIN}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Kirish
            </Link>
            <Link
              to={PATHS.REGISTER}
              className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              Ro'yxatdan o'tish
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8 px-4 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoSrc} alt="" className="w-6 h-6 rounded-md" aria-hidden="true" />
            <span className="text-sm font-semibold text-gray-700">{APP_NAME}</span>
          </div>
          <p className="text-sm text-gray-400">
            © 2026 {APP_NAME}. Barcha huquqlar himoyalangan.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <span>Maxfiylik siyosati</span>
            <span>Foydalanish shartlari</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
