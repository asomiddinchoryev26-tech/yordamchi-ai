import type { UserRole } from './auth.types'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  bio?: string
  createdAt: string
  updatedAt: string
}

export interface UpdateProfilePayload {
  name?: string
  bio?: string
  avatarUrl?: string
}

export interface PaginatedUsers {
  data: UserProfile[]
  total: number
  page: number
  limit: number
}
