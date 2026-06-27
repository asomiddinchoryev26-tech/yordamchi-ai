/**
 * components/ui/Spinner.tsx
 * Sprint 4 — Lightweight loading spinner.
 */

import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const spinnerVariants = cva(
  'animate-spin-fast border-2 border-current border-t-transparent rounded-full flex-shrink-0',
  {
    variants: {
      size: {
        xs:  'w-3   h-3',
        sm:  'w-4   h-4',
        md:  'w-5   h-5',
        lg:  'w-6   h-6',
        xl:  'w-8   h-8',
        '2xl':'w-10 h-10',
      },
      color: {
        brand:   'text-brand dark:text-brand-light',
        white:   'text-white',
        current: 'text-current',
        muted:   'text-gray-400 dark:text-gray-600',
      },
    },
    defaultVariants: {
      size:  'md',
      color: 'brand',
    },
  },
)

type SpinnerSize  = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
type SpinnerColor = 'brand' | 'white' | 'current' | 'muted'

export interface SpinnerProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'> {
  size?:  SpinnerSize
  color?: SpinnerColor
  label?: string
}

function Spinner({ className, size, color, label = 'Yuklanmoqda…', ...props }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn('inline-flex', className)} {...props}>
      <span className={cn(spinnerVariants({ size, color }))} />
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** Centered full-area spinner */
function SpinnerOverlay({ label }: { label?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-night-900/60 backdrop-blur-sm rounded-inherit z-10">
      <Spinner size="lg" label={label} />
    </div>
  )
}

/** Page-level loading state */
function SpinnerPage({ label }: { label?: string }) {
  return (
    <div className="min-h-[320px] flex flex-col items-center justify-center gap-3">
      <Spinner size="xl" />
      {label && <p className="text-sm text-gray-400 dark:text-gray-500">{label}</p>}
    </div>
  )
}

export { Spinner, SpinnerOverlay, SpinnerPage, spinnerVariants }
