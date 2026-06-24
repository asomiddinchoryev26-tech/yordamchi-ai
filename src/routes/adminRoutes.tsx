import type { RouteObject } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import RoleRoute from './RoleRoute'
import AdminLayout from '@/layouts/AdminLayout'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import UsersPage from '@/pages/admin/UsersPage'
import TeachersPage from '@/pages/admin/TeachersPage'
import StudentsPage from '@/pages/admin/StudentsPage'
import GroupsPage from '@/pages/admin/GroupsPage'
import LessonsPage from '@/pages/admin/LessonsPage'
import AttendancePage from '@/pages/admin/AttendancePage'
import TestsPage from '@/pages/admin/TestsPage'
import ReportsPage from '@/pages/admin/ReportsPage'
import SubjectsPage from '@/pages/admin/SubjectsPage'
import SettingsPage from '@/pages/admin/SettingsPage'
import AchievementsPage from '@/pages/admin/AchievementsPage'

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
