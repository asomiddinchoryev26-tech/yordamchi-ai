import { Link } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'

export default function NotFound() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">{t.nf404Title}</h2>
      <p className="text-muted-foreground mb-8">
        {t.nf404Desc}
      </p>
      <Link
        to="/"
        className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {t.nfGoHome}
      </Link>
    </div>
  )
}
