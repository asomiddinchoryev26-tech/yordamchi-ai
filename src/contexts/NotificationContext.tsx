import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  type: NotificationType
  message: string
}

interface NotificationContextValue {
  notifications: Notification[]
  notify: (type: NotificationType, message: string) => void
  dismiss: (id: string) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const notify = useCallback(
    (type: NotificationType, message: string) => {
      const id = crypto.randomUUID()
      setNotifications(prev => [...prev, { id, type, message }])
      setTimeout(() => dismiss(id), 5000)
    },
    [dismiss]
  )

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismiss }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotification must be used inside NotificationProvider')
  return ctx
}
