export const PATHS = {
  HOME:            '/',
  PRICING:         '/pricing',
  LOGIN:           '/login',
  REGISTER:        '/register',
  FORGOT_PASSWORD: '/forgot-password',
  WELCOME:         '/welcome',
  ONBOARDING:      '/onboarding',

  STUDENT: {
    ROOT:         '/dashboard',
    LESSONS:      '/dashboard/lessons',
    ASSIGNMENTS:  '/dashboard/assignments',  // Migration 018 — Homework module
    ATTENDANCE:   '/dashboard/attendance',
    TESTS:        '/dashboard/tests',
    PROFILE:      '/dashboard/profile',
    ACHIEVEMENTS: '/dashboard/achievements',
    MY_PROGRESS:  '/dashboard/progress',
    CERTIFICATES: '/dashboard/certificates',
    LEADERBOARD:  '/dashboard/leaderboard',
    SETTINGS:     '/dashboard/settings',
    AI_ASSISTANT: '/dashboard/ai-assistant',
    AI_VISION:    '/dashboard/ai-vision',    // Sprint 3.2 Phase 1
  },

  TEACHER: {
    ROOT:         '/teacher',
    STUDENTS:     '/teacher/students',
    GROUPS:       '/teacher/groups',
    COURSES:      '/teacher/courses',
    ASSIGNMENTS:  '/teacher/assignments',  // Migration 018 — Homework module
    ATTENDANCE:   '/teacher/attendance',
    TESTS:        '/teacher/tests',
    PROFILE:      '/teacher/profile',
    ACHIEVEMENTS: '/teacher/achievements',
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
