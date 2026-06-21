import { api } from './api'

export interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalCourses: number
  totalRevenue: number
  activeEnrollments: number
}

export interface CourseAnalytics {
  courseId: string
  views: number
  enrollments: number
  completionRate: number
  averageRating: number
}

export const analyticsService = {
  getDashboardStats: () =>
    api.get<DashboardStats>('/analytics/dashboard'),

  getCourseAnalytics: (courseId: string) =>
    api.get<CourseAnalytics>(`/analytics/courses/${courseId}`),
}
