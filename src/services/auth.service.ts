import { api } from './api'
import type { LoginCredentials, RegisterPayload, AuthTokens, User } from '@/types/auth.types'

export const authService = {
  login: (credentials: LoginCredentials) =>
    api.post<{ tokens: AuthTokens; user: User }>('/auth/login', credentials),

  register: (payload: RegisterPayload) =>
    api.post<{ tokens: AuthTokens; user: User }>('/auth/register', payload),

  logout: () =>
    api.post<void>('/auth/logout', {}),

  refreshToken: (refreshToken: string) =>
    api.post<AuthTokens>('/auth/refresh', { refreshToken }),

  me: () =>
    api.get<User>('/auth/me'),
}
