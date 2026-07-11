import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import RoleRoute from './RoleRoute'
import AdminLayout from '@/layouts/AdminLayout'

// Route-based code splitting — each page ships in its own chunk (React.lazy)
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const UsersPage          = lazy(() => import('@/pages/admin/UsersPage'))
const TeachersPage       = lazy(() => import('@/pages/admin/TeachersPage'))
const StudentsPage       = lazy(() => import('@/pages/admin/StudentsPage'))
const GroupsPage         = lazy(() => import('@/pages/admin/GroupsPage'))
const LessonsPage        = lazy(() => import('@/pages/admin/LessonsPage'))
const AttendancePage     = lazy(() => import('@/pages/admin/AttendancePage'))
const TestsPage          = lazy(() => import('@/pages/admin/TestsPage'))
const ReportsPage        = lazy(() => import('@/pages/admin/ReportsPage'))
const SubjectsPage       = lazy(() => import('@/pages/admin/SubjectsPage'))
const SettingsPage       = lazy(() => import('@/pages/admin/SettingsPage'))
const AchievementsPage   = lazy(() => import('@/pages/admin/AchievementsPage'))
const AcademicPage       = lazy(() => import('@/pages/admin/AcademicPage'))

export const adminRoutes: RouteObject[] = [
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <RoleRoute allowedRoles={['admin']} />,
        children: [
          {
            path: 'admin',
            element: <AdminLayout />,
            children: [
              { index: true,        element: <AdminDashboardPage /> },
              { path: 'users',      element: <UsersPage />          },
              { path: 'teachers',   element: <TeachersPage />       },
              { path: 'students',   element: <StudentsPage />       },
              { path: 'groups',     element: <GroupsPage />         },
              { path: 'lessons',    element: <LessonsPage />        },
              { path: 'attendance', element: <AttendancePage />     },
              { path: 'tests',      element: <TestsPage />          },
              { path: 'subjects',   element: <SubjectsPage />       },
              { path: 'academic',   element: <AcademicPage />       },
              { path: 'reports',    element: <ReportsPage />        },
              { path: 'settings',      element: <SettingsPage />      },
              { path: 'achievements', element: <AchievementsPage /> },
            ],
          },
        ],
      },
    ],
  },
]
