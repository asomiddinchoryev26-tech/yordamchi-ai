/**
 * components/ui/index.ts
 * Sprint 4 — Design System barrel export.
 * Import everything from here: import { Button, Card, Badge } from '@/components/ui'
 */

// ── Button ────────────────────────────────────────────────────────────────────
export { Button, buttonVariants }   from './button'
export type { ButtonProps }         from './button'

// ── Card ──────────────────────────────────────────────────────────────────────
export {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  cardVariants,
} from './Card'
export type { CardProps }           from './Card'

// ── Input ─────────────────────────────────────────────────────────────────────
export { Input, Textarea }          from './Input'
export type { InputProps, TextareaProps } from './Input'

// ── Badge ─────────────────────────────────────────────────────────────────────
export { Badge, badgeVariants }     from './Badge'
export type { BadgeProps }          from './Badge'

// ── Skeleton ──────────────────────────────────────────────────────────────────
export {
  Skeleton, SkeletonText, SkeletonParagraph, SkeletonAvatar,
  SkeletonCard, SkeletonStat, SkeletonRow,
} from './Skeleton'

// ── Spinner ───────────────────────────────────────────────────────────────────
export { Spinner, SpinnerOverlay, SpinnerPage, spinnerVariants } from './Spinner'
export type { SpinnerProps }        from './Spinner'
