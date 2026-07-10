/**
 * components/ui/Input.tsx
 * Sprint 4 — Premium text input and textarea with label, hint, error states.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

// ─── Base input styles ────────────────────────────────────────────────────────

const INPUT_BASE = [
  'w-full text-sm leading-none outline-none transition-all duration-200',
  'bg-[--input-bg] text-[--input-color] placeholder:text-[--input-placeholder]',
  'border border-[--input-border] rounded-input',
  'focus:border-[--input-border-focus] focus:shadow-[--input-shadow-focus]',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  'px-3.5 py-2.5 h-10',
].join(' ')

// ─── Input ────────────────────────────────────────────────────────────────────

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:      string
  hint?:       string
  error?:      string
  leftIcon?:   React.ReactNode
  rightIcon?:  React.ReactNode
  wrapperClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leftIcon, rightIcon, className, wrapperClassName, id, ...props }, ref) => {
    const autoId = React.useId()
    const uid = id ?? autoId
    const hasError = !!error

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label
            htmlFor={uid}
            className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 leading-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none [&_svg]:w-4 [&_svg]:h-4">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={uid}
            aria-describedby={hint ? `${uid}-hint` : undefined}
            aria-invalid={hasError}
            className={cn(
              INPUT_BASE,
              leftIcon  && 'pl-9',
              rightIcon && 'pr-9',
              hasError  && 'border-[--color-error] focus:border-[--color-error] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]',
              className,
            )}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 [&_svg]:w-4 [&_svg]:h-4">
              {rightIcon}
            </span>
          )}
        </div>

        {hint && !error && (
          <p id={`${uid}-hint`} className="text-[12px] text-gray-400 dark:text-gray-500 leading-snug">
            {hint}
          </p>
        )}
        {error && (
          <p role="alert" className="text-[12px] text-error leading-snug flex items-center gap-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7.5 4.5h1v5h-1v-5zm0 6h1v1h-1v-1z" />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

// ─── Textarea ─────────────────────────────────────────────────────────────────

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:      string
  hint?:       string
  error?:      string
  wrapperClassName?: string
  /** Auto-resize to content (max 6 lines) */
  autoResize?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, wrapperClassName, id, autoResize, onChange, ...props }, ref) => {
    const autoId = React.useId()
    const uid = id ?? autoId
    const hasError = !!error

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        e.target.style.height = 'auto'
        e.target.style.height = Math.min(e.target.scrollHeight, 144) + 'px'
      }
      onChange?.(e)
    }

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label htmlFor={uid} className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 leading-none">
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={uid}
          aria-invalid={hasError}
          onChange={handleChange}
          className={cn(
            INPUT_BASE,
            'h-auto min-h-[80px] py-3 resize-y leading-relaxed',
            hasError && 'border-[--color-error] focus:border-[--color-error] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]',
            className,
          )}
          {...props}
        />

        {hint && !error && (
          <p className="text-[12px] text-gray-400 dark:text-gray-500 leading-snug">{hint}</p>
        )}
        {error && (
          <p role="alert" className="text-[12px] text-error leading-snug">
            {error}
          </p>
        )}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'

export { Input, Textarea }
