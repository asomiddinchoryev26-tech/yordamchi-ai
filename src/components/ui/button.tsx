/**
 * components/ui/button.tsx
 * Sprint 4 — Premium button with variants.
 * Backward-compatible upgrade of the Radix/CVA scaffold.
 */

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// ─── Variants ─────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  // Base
  [
    'relative inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-semibold select-none',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-40',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
    'active:scale-[0.97]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'text-white shadow-md hover:shadow-lg hover:-translate-y-px',
          'hover:opacity-92',
        ],
        secondary: [
          'border hover:-translate-y-px',
          'text-[--btn-secondary-color] bg-[--btn-secondary-bg]',
          'border-[--btn-secondary-border]',
          'hover:bg-[--btn-secondary-hover]',
        ],
        ghost: [
          'text-[--btn-ghost-color] hover:bg-[--btn-ghost-hover]',
          'hover:text-gray-900 dark:hover:text-white',
        ],
        danger: [
          'text-white shadow-md hover:shadow-lg hover:-translate-y-px hover:opacity-92',
        ],
        outline: [
          'border-2 border-[--btn-outline-border] text-[--btn-outline-color]',
          'hover:bg-brand/8 dark:hover:bg-brand/12',
        ],
        link: [
          'text-brand dark:text-brand-light underline-offset-4 hover:underline',
          'p-0 h-auto',
        ],
        // Backward compat
        default:     ['text-white shadow hover:opacity-90'],
        destructive: ['text-white shadow-sm hover:opacity-90'],
      },
      size: {
        sm:      'h-8  px-3   text-xs   rounded-xl  gap-1.5',
        default: 'h-9  px-4   text-sm   rounded-[14px] gap-2',
        md:      'h-10 px-4   text-sm   rounded-[14px] gap-2',
        lg:      'h-12 px-6   text-[15px] rounded-btn gap-2.5',
        xl:      'h-14 px-8   text-[16px] rounded-btn gap-3',
        icon:    'h-9  w-9    text-sm   rounded-xl',
        'icon-sm':'h-8  w-8   text-sm   rounded-lg',
        'icon-lg':'h-11 w-11  text-base  rounded-[14px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

// ─── Component ────────────────────────────────────────────────────────────────

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?:    boolean
  isLoading?:  boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, style, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    // Build inline style for gradient variants
    const gradientStyle: React.CSSProperties = {}
    if (variant === 'primary' || variant === 'default') {
      gradientStyle.background = 'var(--btn-primary-bg)'
      gradientStyle.boxShadow  = 'var(--btn-primary-shadow)'
    } else if (variant === 'danger' || variant === 'destructive') {
      gradientStyle.background = 'var(--btn-danger-bg)'
      gradientStyle.boxShadow  = 'var(--btn-danger-shadow)'
    }

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        style={{ ...gradientStyle, ...style }}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="absolute inset-0 flex items-center justify-center">
              <svg
                className="animate-spin-fast w-4 h-4 opacity-80"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
            </span>
            <span className="opacity-0">{children}</span>
          </>
        ) : children}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
