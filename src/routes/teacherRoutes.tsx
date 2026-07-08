import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import RoleRoute from './RoleRoute'
import TeacherLayout from '@/layouts/TeacherLayout'

// Route-based code splitting — each page ships in its own chunk (React.lazy)
const TeacherDashboardPage   = lazy(() => import('@/pages/teacher/TeacherDashboardPage'))
const StudentsPage           = lazy(() => import('@/pages/teacher/StudentsPage'))
const GroupsPage             = lazy(() => import('@/pages/teacher/GroupsPage'))
const MyCoursesPage          = lazy(() => import('@/pages/teacher/MyCoursesPage'))
const CreateCoursePage       = lazy(() => import('@/pages/teacher/CreateCoursePage'))
const TeacherAssignmentsPage = lazy(() => import('@/pages/teacher/AssignmentsPage'))
const AttendancePage         = lazy(() => import('@/pages/teacher/AttendancePage'))
const TestsPage              = lazy(() => import('@/pages/teacher/TestsPage'))
const ProfilePage            = lazy(() => import('@/pages/teacher/ProfilePage'))
const AchievementsPage       = lazy(() => import('@/pages/teacher/AchievementsPage'))

export const teacherRoutes: RouteObject[] = [
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <RoleRoute allowedRoles={['teacher']} />,
        children: [
          {
            path: 'teacher',
            element: <TeacherLayout />,
            children: [
              { index: true,          element: <TeacherDashboardPage /> },
              { path: 'students',     element: <StudentsPage />         },
              { path: 'groups',       element: <GroupsPage />           },
              { path: 'courses',      element: <MyCoursesPage />        },
              { path: 'courses/new',  element: <CreateCoursePage />     },
              { path: 'assignments',  element: <TeacherAssignmentsPage /> },
              { path: 'attendance',   element: <AttendancePage />       },
              { path: 'tests',        element: <TestsPage />            },
              { path: 'achievements', element: <AchievementsPage />    },
              { path: 'profile',      element: <ProfilePage />          },
            ],
          },
        ],
      },
    ],
  },
]
