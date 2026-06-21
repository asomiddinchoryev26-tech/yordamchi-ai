export const APP_NAME = 'YordamchiAI'
export const APP_VERSION = '1.0.0'

export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  PRICING: '/pricing',
  ADMIN: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/dashboard',
} as const

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
} as const
