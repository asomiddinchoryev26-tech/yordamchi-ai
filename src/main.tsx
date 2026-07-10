import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Providers } from '@/app/providers'
import { router } from '@/app/router'
import { initSentry } from '@/lib/sentry'
import '@/styles/globals.css'

// Error monitoring — must run before the app renders to catch early errors.
initSentry()

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </React.StrictMode>
)
