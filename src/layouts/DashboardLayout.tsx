import { Outlet } from 'react-router-dom'

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex bg-secondary">
      <aside className="w-64 bg-card border-r border-border flex-shrink-0 hidden md:block" />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex-shrink-0" />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
