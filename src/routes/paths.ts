export const PATHS = {
  HOME:            '/',
  PRICING:         '/pricing',
  LOGIN:           '/login',
  REGISTER:        '/register',
  FORGOT_PASSWORD: '/forgot-password',

  STUDENT: {
    ROOT:       '/dashboard',
    LESSONS:    '/dashboard/lessons',
    ATTENDANCE: '/dashboard/attendance',
    TESTS:      '/dashboard/tests',
    PROFILE:    '/dashboard/profile',
  },

  TEACHER: {
    ROOT:       '/teacher',
    STUDENTS:   '/teacher/students',
    GROUPS:     '/teacher/groups',
    COURSES:    '/teacher/courses',
    ATTENDANCE: '/teacher/attendance',
    TESTS:      '/teacher/tests',
    PROFILE:    '/teacher/profile',
  },

  ADMIN: {
    ROOT:         '/admin',
    USERS:        '/admin/users',
    TEACHERS:     '/admin/teachers',
    STUDENTS:     '/admin/students',
    GROUPS:       '/admin/groups',
    LESSONS:      '/admin/lessons',
    ATTENDANCE:   '/admin/attendance',
    TESTS:        '/admin/tests',
    SUBJECTS:     '/admin/subjects',
    REPORTS:      '/admin/reports',
    SETTINGS:     '/admin/settings',
    ACHIEVEMENTS: '/admin/achievements',
  },
} as const
