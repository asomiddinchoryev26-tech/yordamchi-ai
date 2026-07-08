import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import PageLoader from '@/components/common/PageLoader'

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  )
}
