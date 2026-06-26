/**
 * AsomiddinAvatar — canonical AI avatar. ALWAYS /asomiddin.jpg. NEVER for users.
 *
 * Size scale (aligned to spec):
 *   xs  = 24px  — sidebar nav icon
 *   sm  = 36px  — app header
 *   md  = 40px  — AI messages (default)
 *   lg  = 56px  — medium contexts
 *   xl  = 72px  — welcome screen
 */

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { NEON_RING, AVATAR_SRC } from './config'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZE: Record<AvatarSize, { dim: string; blur: string; pad: string; glow: string; dot: string; blurPx: string; opacity: number }> = {
  xs: {
    dim:     'w-6 h-6',
    blur:    '-inset-[2px]',
    pad:     '1.5px',
    glow:    '0 0 4px rgba(124,58,237,.7), 0 0 10px rgba(124,58,237,.3)',
    dot:     'w-2 h-2 border',
    blurPx:  '4px',
    opacity: 0.5,
  },
  sm: {
    dim:     'w-9 h-9',
    blur:    '-inset-[3px]',
    pad:     '2px',
    glow:    '0 0 6px rgba(124,58,237,.8), 0 0 14px rgba(124,58,237,.4)',
    dot:     'w-2.5 h-2.5 border-[2px]',
    blurPx:  '6px',
    opacity: 0.55,
  },
  md: {
    dim:     'w-10 h-10',
    blur:    '-inset-[3px]',
    pad:     '2.5px',
    glow:    '0 0 8px rgba(124,58,237,.85), 0 0 18px rgba(124,58,237,.45)',
    dot:     'w-2.5 h-2.5 border-[2px]',
    blurPx:  '6px',
    opacity: 0.55,
  },
  lg: {
    dim:     'w-14 h-14',
    blur:    '-inset-1.5',
    pad:     '3px',
    glow:    '0 0 16px rgba(124,58,237,.9), 0 0 32px rgba(124,58,237,.5), 0 0 48px rgba(59,130,246,.2)',
    dot:     'w-3 h-3 border-2',
    blurPx:  '10px',
    opacity: 0.6,
  },
  xl: {
    dim:     'w-[72px] h-[72px]',
    blur:    '-inset-3',
    pad:     '3.5px',
    glow:    '0 0 24px rgba(124,58,237,.95), 0 0 48px rgba(124,58,237,.6), 0 0 72px rgba(59,130,246,.35)',
    dot:     'w-4 h-4 border-[3px]',
    blurPx:  '14px',
    opacity: 0.65,
  },
}

interface AsomiddinAvatarProps {
  size?:       AvatarSize
  showStatus?: boolean
}

export function AsomiddinAvatar({ size = 'md', showStatus = false }: AsomiddinAvatarProps) {
  const [imgOk, setImgOk] = useState(true)

  useEffect(() => {
    const p = new window.Image()
    p.onload  = () => { if (p.naturalWidth > 0) setImgOk(true) }
    p.onerror = () => setImgOk(false)
    p.src     = AVATAR_SRC
  }, [])

  const s      = SIZE[size]
  const radius = size === 'xl' ? 'rounded-3xl' : 'rounded-full'

  return (
    <div className={cn('group relative flex-shrink-0', s.dim)}>
      {/* Neon pulse glow */}
      <div
        className={cn('absolute pointer-events-none animate-pulse', radius, s.blur)}
        style={{ background: NEON_RING, filter: `blur(${s.blurPx})`, opacity: s.opacity }}
      />
      {/* Gradient border ring */}
      <div
        className={cn('relative w-full h-full transition-transform duration-300 ease-out group-hover:scale-105', radius)}
        style={{ padding: s.pad, background: NEON_RING, boxShadow: s.glow }}
      >
        <div className={cn('w-full h-full overflow-hidden', radius)}>
          {imgOk ? (
            <img
              src={AVATAR_SRC}
              alt="Asomiddin AI"
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 15%' }}
              onError={() => setImgOk(false)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center font-black text-white select-none text-xs"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed,#2563eb)' }}
            >
              AI
            </div>
          )}
        </div>
      </div>
      {/* Online dot */}
      {showStatus && (
        <span className={cn(
          'absolute -bottom-0.5 -right-0.5 z-10 rounded-full bg-emerald-400 border-white dark:border-gray-900 shadow-[0_0_8px_rgba(52,211,153,.9)]',
          s.dot,
        )}>
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
        </span>
      )}
    </div>
  )
}

/**
 * AsomiddinAIMenuIcon — sidebar-compatible icon (24px).
 * Accepts `className` from sidebar system but renders the photo.
 */
export function AsomiddinAIMenuIcon(_: { className?: string }) {
  const [imgOk, setImgOk] = useState(true)
  useEffect(() => {
    const p = new window.Image()
    p.onload  = () => { if (p.naturalWidth > 0) setImgOk(true) }
    p.onerror = () => setImgOk(false)
    p.src     = AVATAR_SRC
  }, [])

  return (
    <span
      className="inline-flex w-6 h-6 rounded-full overflow-hidden flex-shrink-0"
      style={{
        boxShadow:  '0 0 0 1.5px rgba(139,92,246,.5), 0 0 6px rgba(139,92,246,.3)',
        minWidth:   '24px',
        minHeight:  '24px',
      }}
    >
      {imgOk ? (
        <img
          src={AVATAR_SRC}
          alt="Asomiddin AI"
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 15%' }}
          onError={() => setImgOk(false)}
        />
      ) : (
        <span className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-700 text-white text-[7px] font-black">
          AI
        </span>
      )}
    </span>
  )
}
