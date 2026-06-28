/**
 * components/illustration/IllustrationImage.tsx
 *
 * Lazy-loaded illustration wrapper.
 * Drop PNG files into public/illustrations/ → they appear automatically.
 * If a file is missing, the `fallback` is rendered instead.
 *
 * PNG naming convention (place in public/illustrations/):
 *   hero-student.png       — Dashboard Hero right side
 *   ai-chat.png            — AI Yordamchi empty state
 *   loading.png            — AI thinking / loading states
 *   empty-state.png        — Generic empty state (no courses / tests / history)
 *   success.png            — Test/lesson completion success
 *   achievement.png        — Achievement unlocked
 *   error.png              — Network / server error
 *   login.png              — Login / Register page
 *   premium.png            — Premium upgrade page
 *   onboarding-1.png       — Onboarding step 1
 *   onboarding-2.png       — Onboarding step 2
 *   onboarding-3.png       — Onboarding step 3
 */

import { useState, type ReactNode, type CSSProperties } from 'react'

interface IllustrationImageProps {
  /** Path relative to public root, e.g. "/illustrations/hero-student.png" */
  src:        string
  alt:        string
  className?: string
  style?:     CSSProperties
  /** Rendered when image fails to load (file not yet uploaded) */
  fallback?:  ReactNode
  /** Width applied to the img element */
  width?:     number | string
  /** Height applied to the img element */
  height?:    number | string
  /** Extra CSS drop-shadow for the illustration glow */
  glow?:      string
}

export function IllustrationImage({
  src, alt, className, style, fallback,
  width, height, glow,
}: IllustrationImageProps) {
  const [loaded, setLoaded]   = useState(false)
  const [hasError, setError]  = useState(false)

  if (hasError) {
    return fallback ? <>{fallback}</> : null
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      draggable={false}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      className={className}
      style={{
        objectFit:  'contain',
        opacity:    loaded ? 1 : 0,
        transition: 'opacity 0.4s ease',
        filter:     glow ? `drop-shadow(${glow})` : undefined,
        ...style,
      }}
    />
  )
}

// ─── Shimmer placeholder (shows while image loads) ────────────────────────────

export function IllustrationShimmer({ width = 280, height = 340 }: { width?: number; height?: number }) {
  return (
    <div
      className="animate-pulse rounded-[28px] flex-shrink-0"
      style={{
        width, height,
        background: 'linear-gradient(135deg, rgba(91,127,255,0.06), rgba(124,58,237,0.08))',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      aria-hidden="true"
    />
  )
}
