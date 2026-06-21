import { api } from './api'
import type { UserProfile, UpdateProfilePayload, PaginatedUsers } from '@/types/user.types'
import type { PaginationParams } from '@/types/api.types'

export const userService = {
  getAll: (params?: PaginationParams) => {
    const query = new URLSearchParams(params as Record<string, string>).toString()
    return api.get<PaginatedUsers>(`/users${query ? `?${query}` : ''}`)
  },

  getById: (id: string) =>
    api.get<UserProfile>(`/users/${id}`),

  updateProfile: (id: string, payload: UpdateProfilePayload) =>
    api.patch<UserProfile>(`/users/${id}`, payload),

  deleteUser: (id: string) =>
    api.delete<void>(`/users/${id}`),
}
