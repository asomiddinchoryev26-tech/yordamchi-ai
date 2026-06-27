/**
 * components/ui/Badge.tsx
 * Sprint 4 — Status badges with dot indicator support.
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ─── Variants ─────────────────────────────────────────────────────────────────

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-semibold leading-none whitespace-nowrap transition-colors duration-150',
  {
    variants: {
      variant: {
        default:  'bg-[--badge-default-bg] text-[--badge-default-color]',
        brand:    'bg-brand/10 dark:bg-brand/15 text-brand dark:text-brand-light',
        success:  'bg-success/10 dark:bg-success/12 text-success dark:text-green-400',
        warning:  'bg-warning/10 dark:bg-warning/12 text-warning dark:text-amber-400',
        error:    'bg-error/10 dark:bg-error/12 text-error dark:text-red-400',
        info:     'bg-info/10 dark:bg-info/12 text-info dark:text-blue-400',
        gray:     'bg-gray-100 dark:bg-white/[0.07] text-gray-600 dark:text-gray-400',
        outline:  'border border-current bg-transparent',
        solid:    'bg-brand text-white',
        dark:     'bg-night-700 text-gray-300 border border-white/[0.06]',
      },
      size: {
        xs: 'text-[10px] px-1.5 py-0.5 rounded-lg',
        sm: 'text-[11px] px-2 py-0.5 rounded-[10px]',
        md: 'text-xs px-2.5 py-1 rounded-badge',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    },
  },
)

// ─── Dot colors ────────────────────────────────────────────────────────────────

const DOT_COLORS: Record<string, string> = {
  default: '#5B5CF6',
  brand:   '#5B5CF6',
  success: '#22C55E',
  warning: '#F59E0B',
  error:   '#EF4444',
  info:    '#3B82F6',
  gray:    '#9CA3AF',
  outline: 'currentColor',
  solid:   '#ffffff',
  dark:    '#6B7280',
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Show pulsing status dot */
  dot?: boolean
  /** Whether the dot pulses (online / active status) */
  pulse?: boolean
  /** Optional right-side close button */
  onRemove?: () => void
}

function Badge({
  className,
  variant = 'default',
  size,
  dot,
  pulse,
  onRemove,
  children,
  ...props
}: BadgeProps) {
  const dotColor = DOT_COLORS[variant ?? 'default'] ?? '#5B5CF6'

  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span className="relative flex-shrink-0" aria-hidden="true">
          <span
            className="block w-[6px] h-[6px] rounded-full"
            style={{ background: dotColor }}
          />
          {pulse && (
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-60"
              style={{ background: dotColor }}
            />
          )}
        </span>
      )}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 -mr-0.5 flex-shrink-0 hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current rounded-sm"
          aria-label="Remove"
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            <path d="M2.22 2.22a.75.75 0 011.06 0L6 4.94l2.72-2.72a.75.75 0 111.06 1.06L7.06 6l2.72 2.72a.75.75 0 11-1.06 1.06L6 7.06 3.28 9.78a.75.75 0 01-1.06-1.06L4.94 6 2.22 3.28a.75.75 0 010-1.06z" />
          </svg>
        </button>
      )}
    </span>
  )
}

export { Badge, badgeVariants }
