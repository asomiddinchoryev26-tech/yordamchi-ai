import { Component, type ReactNode } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

// Funksional fallback — class komponent hook ishlatolmaydi, shuning uchun tarjima shu yerda
function DefaultErrorFallback({ message, onRetry }: { message?: string; onRetry: () => void }) {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h2 className="text-2xl font-semibold mb-2">{t.ebTitle}</h2>
      <p className="text-muted-foreground mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {t.ebRetry}
      </button>
    </div>
  )
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <DefaultErrorFallback
            message={this.state.error?.message}
            onRetry={() => this.setState({ hasError: false })}
          />
        )
      )
    }

    return this.props.children
  }
}
