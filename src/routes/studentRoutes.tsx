import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import RoleRoute from './RoleRoute'
import StudentLayout from '@/layouts/StudentLayout'

// Route-based code splitting — each page ships in its own chunk (React.lazy)
const StudentDashboardPage = lazy(() => import('@/pages/student/StudentDashboardPage'))
const LessonsPage          = lazy(() => import('@/pages/student/LessonsPage'))
const AssignmentsPage      = lazy(() => import('@/pages/student/AssignmentsPage'))
const AttendancePage       = lazy(() => import('@/pages/student/AttendancePage'))
const TestsPage            = lazy(() => import('@/pages/student/TestsPage'))
const ProfilePage          = lazy(() => import('@/pages/student/ProfilePage'))
const AchievementsPage     = lazy(() => import('@/pages/student/AchievementsPage'))
const MyProgressPage       = lazy(() => import('@/pages/student/MyProgressPage'))
const CertificatesPage     = lazy(() => import('@/pages/student/CertificatesPage'))
const LeaderboardPage      = lazy(() => import('@/pages/student/LeaderboardPage'))
const AIAssistantPage      = lazy(() => import('@/pages/student/AIAssistantPage'))
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
              { path: 'assignments',    element: <AssignmentsPage />      },
              { path: 'attendance',     element: <AttendancePage />       },
              { path: 'tests',          element: <TestsPage />            },
              { path: 'profile',        element: <ProfilePage />          },
              { path: 'achievements',   element: <AchievementsPage />     },
              { path: 'progress',       element: <MyProgressPage />       },
              { path: 'certificates',   element: <CertificatesPage />     },
              { path: 'leaderboard',    element: <LeaderboardPage />      },
              { path: 'ai-assistant',   element: <AIAssistantPage />      },
              // ai-vision route removed — functionality lives in AI Assistant
            ],
          },
        ],
      },
    ],
  },
]
