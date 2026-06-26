import type { RouteObject } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import RoleRoute from './RoleRoute'
import StudentLayout from '@/layouts/StudentLayout'
import StudentDashboardPage from '@/pages/student/StudentDashboardPage'
import LessonsPage from '@/pages/student/LessonsPage'
import AttendancePage from '@/pages/student/AttendancePage'
import TestsPage from '@/pages/student/TestsPage'
import ProfilePage from '@/pages/student/ProfilePage'
import AchievementsPage from '@/pages/student/AchievementsPage'
import AIAssistantPage from '@/pages/student/AIAssistantPage'
// AIVisionPage removed from routing (Sprint 3.3 — merged into AI Assistant)

export const studentRoutes: RouteObject[] = [
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <RoleRoute allowedRoles={['student']} />,
        children: [
          {
            path: 'dashboard',
            element: <StudentLayout />,
            children: [
              { index: true,            element: <StudentDashboardPage /> },
              { path: 'lessons',        element: <LessonsPage />          },
              { path: 'attendance',     element: <AttendancePage />       },
              { path: 'tests',          element: <TestsPage />            },
              { path: 'profile',        element: <ProfilePage />          },
              { path: 'achievements',   element: <AchievementsPage />     },
              { path: 'ai-assistant',   element: <AIAssistantPage />      },
              // ai-vision route removed — functionality lives in AI Assistant
            ],
          },
        ],
      },
    ],
  },
]
