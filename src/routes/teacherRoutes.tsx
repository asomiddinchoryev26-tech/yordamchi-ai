import type { RouteObject } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import RoleRoute from './RoleRoute'
import TeacherLayout from '@/layouts/TeacherLayout'
import TeacherDashboardPage from '@/pages/teacher/TeacherDashboardPage'
import StudentsPage from '@/pages/teacher/StudentsPage'
import GroupsPage from '@/pages/teacher/GroupsPage'
import MyCoursesPage from '@/pages/teacher/MyCoursesPage'
import CreateCoursePage from '@/pages/teacher/CreateCoursePage'
import AttendancePage from '@/pages/teacher/AttendancePage'
import TestsPage from '@/pages/teacher/TestsPage'
import ProfilePage from '@/pages/teacher/ProfilePage'
import AchievementsPage from '@/pages/teacher/AchievementsPage'

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
