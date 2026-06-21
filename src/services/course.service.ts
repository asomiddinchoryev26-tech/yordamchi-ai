import { api } from './api'
import type { Course, Lesson, Enrollment, CreateCoursePayload } from '@/types/course.types'
import type { PaginationParams, PaginatedResponse } from '@/types/api.types'

export const courseService = {
  getAll: (params?: PaginationParams) => {
    const query = new URLSearchParams(params as Record<string, string>).toString()
    return api.get<PaginatedResponse<Course>>(`/courses${query ? `?${query}` : ''}`)
  },

  getById: (id: string) =>
    api.get<Course>(`/courses/${id}`),

  create: (payload: CreateCoursePayload) =>
    api.post<Course>('/courses', payload),

  update: (id: string, payload: Partial<CreateCoursePayload>) =>
    api.patch<Course>(`/courses/${id}`, payload),

  delete: (id: string) =>
    api.delete<void>(`/courses/${id}`),

  getLessons: (courseId: string) =>
    api.get<Lesson[]>(`/courses/${courseId}/lessons`),

  enroll: (courseId: string) =>
    api.post<Enrollment>(`/courses/${courseId}/enroll`, {}),

  getEnrollments: () =>
    api.get<Enrollment[]>('/enrollments'),
}
