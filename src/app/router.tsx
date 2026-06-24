import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import MainLayout from '@/layouts/MainLayout'
import AuthLayout from '@/layouts/AuthLayout'
import { adminRoutes } from '@/routes/adminRoutes'
import { teacherRoutes } from '@/routes/teacherRoutes'
import { studentRoutes } from '@/routes/studentRoutes'
import { PATHS } from '@/routes/paths'
import LandingPage from '@/pages/public/LandingPage'
import PricingPage from '@/pages/public/PricingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import NotFound from '@/components/common/NotFound'

export const router = createBrowserRouter([
  {

    path: PATHS.HOME,
    element: <App />,
    children: [
      // Ommaviy sahifalar — MainLayout (header + footer)
      {
        element: <MainLayout />,
        children: [
          { index: true,     element: <LandingPage /> },
          { path: 'pricing', element: <PricingPage /> },
        ],
      },

      // Autentifikatsiya sahifalari — AuthLayout
      {
        element: <AuthLayout />,
        children: [
          { path: 'login',           element: <LoginPage />          },
          { path: 'register',        element: <RegisterPage />       },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
        ],
      },

      // Himoyalangan marshrutlar (PrivateRoute + RoleRoute ichida)
      ...adminRoutes,
      ...teacherRoutes,
      ...studentRoutes,

      // 404
      { path: '*', element: <NotFound /> },
    ],
  },
])
  


