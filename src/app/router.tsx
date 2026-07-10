import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import MainLayout from '@/layouts/MainLayout'
import AuthLayout from '@/layouts/AuthLayout'
import PrivateRoute from '@/routes/PrivateRoute'
import { adminRoutes } from '@/routes/adminRoutes'
import { teacherRoutes } from '@/routes/teacherRoutes'
import { studentRoutes } from '@/routes/studentRoutes'
import { PATHS } from '@/routes/paths'
import NotFound from '@/components/common/NotFound'

// Route-based code splitting for public & auth pages (React.lazy)
const LandingPage        = lazy(() => import('@/pages/public/LandingPage'))
const PricingPage        = lazy(() => import('@/pages/public/PricingPage'))
const LoginPage          = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage       = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const WelcomeScreen      = lazy(() => import('@/pages/auth/WelcomeScreen'))
const OnboardingPage     = lazy(() => import('@/pages/auth/OnboardingPage'))
export const router = createBrowserRouter([
  {
    path: PATHS.HOME,
    element: <App />,
    children: [
      // Landing — o'zi-yetarli premium sahifa (o'z Navbar'ini render qiladi)
      { index: true, element: <LandingPage /> },

      // Boshqa ommaviy sahifalar — MainLayout (header + footer)
      {
        element: <MainLayout />,
        children: [
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

      // Xush kelibsiz / yuklanish ekrani — login'dan keyin, dashboard'dan oldin
      {
        element: <PrivateRoute />,
        children: [
          { path: 'welcome',    element: <WelcomeScreen /> },
          { path: 'onboarding', element: <OnboardingPage /> },
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
  


