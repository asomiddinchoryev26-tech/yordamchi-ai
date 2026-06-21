import { Outlet } from 'react-router-dom'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  )
}
