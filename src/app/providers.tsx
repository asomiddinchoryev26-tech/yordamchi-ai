import type { ReactNode } from 'react'
import { AuthProvider }           from '@/contexts/AuthContext'
import { ThemeProvider }          from '@/contexts/ThemeContext'
import { NotificationProvider }   from '@/contexts/NotificationContext'
import { LanguageProvider }       from '@/contexts/LanguageContext'
import { UserIdentityProvider }   from '@/components/identity'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          {/* UserIdentityProvider sits inside AuthProvider so it can read auth state */}
          <UserIdentityProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </UserIdentityProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
