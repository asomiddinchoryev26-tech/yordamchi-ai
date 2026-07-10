/**
 * lib/logger.ts
 *
 * Lightweight application logger.
 *
 * Goals:
 *   • No console noise in production builds (dev-only output).
 *   • Forward to Sentry when configured:
 *       - warnings become breadcrumbs (context for later errors)
 *       - errors become captured events (an Error object keeps its stack)
 *     Sentry no-ops safely when no DSN is set or in dev builds.
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.warn('[Scope] message', err)
 */

import * as Sentry from '@sentry/react'

const isDev = import.meta.env.DEV

const asText = (args: unknown[]): string =>
  args
    .map(a => (a instanceof Error ? a.message : typeof a === 'string' ? a : JSON.stringify(a)))
    .join(' ')

export const logger = {
  info(...args: unknown[]): void {
    if (isDev) console.info(...args)
  },
  warn(...args: unknown[]): void {
    if (isDev) console.warn(...args)
    Sentry.addBreadcrumb({ level: 'warning', message: asText(args) })
  },
  error(...args: unknown[]): void {
    if (isDev) console.error(...args)
    const err = args.find(a => a instanceof Error) as Error | undefined
    if (err) Sentry.captureException(err)
    else Sentry.captureMessage(asText(args), 'error')
  },
}
