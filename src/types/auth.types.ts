export type UserRole = 'student' | 'teacher' | 'admin'

export interface User {
  id:             string
  email:          string
  name:           string
  role:           UserRole
  avatarUrl?:     string
  createdAt:      string
  organizationId: string | null   // null → user has not joined/created an org yet (onboarding)
}

export interface AuthState {
  user:            User | null
  token:           string | null
  isAuthenticated: boolean
  isLoading:       boolean
  error:           string | null
}

export interface LoginCredentials {
  email:    string
  password: string
}

export interface RegisterPayload extends LoginCredentials {
  name: string
  role: UserRole
}

export interface AuthTokens {
  accessToken:  string
  refreshToken: string
}
