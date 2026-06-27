/**
 * components/ui/Skeleton.tsx
 * Sprint 4 — Loading skeleton with shimmer animation.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

// ─── Base Skeleton ─────────────────────────────────────────────────────────────

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Renders as a circle (avatar placeholder) */
  circle?: boolean
  /** Override the shimmer — use pulse instead */
  pulse?: boolean
}

function Skeleton({ className, circle, pulse, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden',
        'bg-gray-100 dark:bg-white/[0.06]',
        circle ? 'rounded-full' : 'rounded-xl',
        pulse ? 'animate-pulse' : '',
        className,
      )}
      {...props}
    >
      {/* Shimmer sweep */}
      {!pulse && (
        <div
          className="absolute inset-0 -translate-x-full animate-shimmer"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
          }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

// ─── Preset shapes ─────────────────────────────────────────────────────────────

/** Single line of text */
function SkeletonText({ className, width }: { className?: string; width?: string | number }) {
  return <Skeleton className={cn('h-3.5 rounded-lg', className)} style={{ width: width ?? '100%' }} />
}

/** Multi-line paragraph */
function SkeletonParagraph({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5 rounded-lg"
          style={{ width: i === lines - 1 ? '65%' : '100%' }}
        />
      ))}
    </div>
  )
}

/** Avatar circle */
function SkeletonAvatar({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Skeleton
      circle
      className={cn('flex-shrink-0', className)}
      style={{ width: size, height: size }}
    />
  )
}

/** Card placeholder */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-[18px] bg-gray-100 dark:bg-white/[0.05] border border-gray-100 dark:border-white/[0.05] p-5 space-y-4', className)}>
      {/* Header row */}
      <div className="flex items-center gap-3">
        <SkeletonAvatar size={40} />
        <div className="flex-1 space-y-2">
          <SkeletonText width="55%" />
          <SkeletonText width="35%" className="h-3" />
        </div>
      </div>
      {/* Content */}
      <SkeletonParagraph lines={3} />
      {/* Footer */}
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 w-24 rounded-xl" />
        <Skeleton className="h-8 w-16 rounded-xl" />
      </div>
    </div>
  )
}

/** Stat card placeholder */
function SkeletonStat({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-[18px] bg-gray-100 dark:bg-white/[0.05] border border-gray-100 dark:border-white/[0.05] p-5 space-y-3', className)}>
      <Skeleton className="h-10 w-10 rounded-2xl" />
      <Skeleton className="h-8 w-20 rounded-lg" />
      <SkeletonText width="70%" className="h-3" />
    </div>
  )
}

/** Table row */
function SkeletonRow({ cols = 4, className }: { cols?: number; className?: string }) {
  const widths = ['40%', '25%', '20%', '15%']
  return (
    <div className={cn('flex items-center gap-4 py-3', className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonText key={i} width={widths[i] ?? '20%'} />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonParagraph, SkeletonAvatar, SkeletonCard, SkeletonStat, SkeletonRow }
