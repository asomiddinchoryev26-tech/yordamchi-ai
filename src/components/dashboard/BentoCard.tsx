import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BentoCardProps {
  children:      ReactNode
  className?:    string
  /** Adds a 2.5px gradient line at the top of the card */
  accentClass?:  string
  /** Enables the hover lift + border-glow effect */
  hoverable?:    boolean
  /** Gradient background variant */
  gradient?:     boolean
  gradientStyle?: React.CSSProperties
  /** Remove padding for custom content */
  noPadding?:    boolean
  onClick?:      () => void
}

export function BentoCard({
  children,
  className,
  accentClass,
  hoverable = true,
  gradient,
  gradientStyle,
  noPadding,
  onClick,
}: BentoCardProps) {
  const base =
    'relative rounded-[24px] border border-gray-100 dark:border-white/[0.07] overflow-hidden'
  const bg   = gradient
    ? ''
    : 'bg-white dark:bg-gray-900/80'
  const pad  = noPadding ? '' : 'p-5 sm:p-6'

  return (
    <motion.div
      onClick={onClick}
      className={cn(base, bg, pad, onClick && 'cursor-pointer', className)}
      style={{
        boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        ...(gradient ? gradientStyle : {}),
      }}
      whileHover={hoverable ? {
        y: -4,
        boxShadow: '0 8px 32px rgba(91,92,246,0.1), 0 2px 8px rgba(0,0,0,0.06)',
      } : undefined}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {/* Optional gradient top accent */}
      {accentClass && (
        <div className={cn('absolute top-0 inset-x-0 h-[2.5px]', accentClass)} aria-hidden="true" />
      )}
      {children}
    </motion.div>
  )
}
