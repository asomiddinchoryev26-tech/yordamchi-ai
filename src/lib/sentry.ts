/**
 * lib/sentry.ts
 *
 * Error-monitoring bootstrap. Call `initSentry()` once, as early as possible.
 *
 * Behaviour:
 *   • No DSN set (`VITE_SENTRY_DSN`)  → no-op (safe for forks / local dev).
 *   • DSN set, dev build             → initialized but disabled (console only).
 *   • DSN set, production build       → events are sent to Sentry.
 *
 * The SDK installs global handlers for uncaught errors and unhandled promise
 * rejections automatically. Application-level errors are forwarded via the
 * `logger` in `@/lib/logger`.
 */

import * as Sentry from '@sentry/react'

export function initSentry(): void {
  const dsn = import.meta.env['VITE_SENTRY_DSN'] as string | undefined
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    enabled: import.meta.env.PROD, // send only from production builds
    sendDefaultPii: false,         // privacy: no PII attached by default
  })
}
