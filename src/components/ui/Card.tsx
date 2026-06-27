/**
 * components/ui/Card.tsx
 * Sprint 4 — Premium card with glassmorphism, elevation and glow variants.
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ─── Variants ─────────────────────────────────────────────────────────────────

const cardVariants = cva(
  'relative overflow-hidden transition-all duration-200 ease-out',
  {
    variants: {
      variant: {
        /** Default solid card */
        default: [
          'bg-[--card-bg] border border-[--card-border]',
        ],
        /** Glassmorphism */
        glass: [
          'glass border-transparent',
        ],
        /** Elevated surface with deeper shadow */
        elevated: [
          'bg-[--card-bg] border border-[--card-border] shadow-card',
        ],
        /** Transparent with brand border */
        bordered: [
          'bg-transparent border-2 border-brand/20 dark:border-brand/15',
        ],
        /** Glowing brand accent */
        glow: [
          'bg-[--card-bg] border border-brand/25 dark:border-brand/20',
          'shadow-[0_0_24px_rgba(91,92,246,0.12),0_0_8px_rgba(91,92,246,0.06)]',
        ],
        /** Ghost — minimal */
        ghost: [
          'bg-transparent border border-transparent',
          'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]',
        ],
        /** Night — for dark premium panels */
        night: [
          'bg-night-800 border border-white/[0.06]',
        ],
      },
      padding: {
        none:  '',
        xs:    'p-3',
        sm:    'p-4',
        md:    'p-5 sm:p-6',
        lg:    'p-6 sm:p-8',
        xl:    'p-8 sm:p-10',
      },
      radius: {
        sm:   'rounded-xl',
        md:   'rounded-[18px]',
        lg:   'rounded-card',
        xl:   'rounded-modal',
        full: 'rounded-[32px]',
      },
      hoverable: {
        true:  'cursor-pointer hover:-translate-y-1 hover:shadow-float',
        false: '',
      },
    },
    defaultVariants: {
      variant:   'default',
      padding:   'md',
      radius:    'md',
      hoverable: false,
    },
  },
)

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Top gradient accent bar */
  accentColor?: string
  /** Render as a different element */
  as?: React.ElementType
}

// ─── Component ────────────────────────────────────────────────────────────────

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, radius, hoverable, accentColor, as: Tag = 'div', children, ...props }, ref) => {
    return (
      <Tag
        ref={ref}
        className={cn(cardVariants({ variant, padding, radius, hoverable }), className)}
        {...props}
      >
        {/* Top accent gradient bar */}
        {accentColor && (
          <div
            className="absolute top-0 inset-x-0 h-[2.5px] pointer-events-none"
            style={{ background: accentColor }}
            aria-hidden="true"
          />
        )}
        {children}
      </Tag>
    )
  },
)
Card.displayName = 'Card'

// ─── Sub-components (semantic) ────────────────────────────────────────────────

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5', className)} {...props} />
  ),
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-[15px] font-bold text-gray-900 dark:text-white leading-snug tracking-tight', className)} {...props} />
  ),
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-gray-500 dark:text-gray-400 leading-relaxed', className)} {...props} />
  ),
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  ),
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.06]', className)} {...props} />
  ),
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants }
