/**
 * components/common/Logo.tsx
 * Official YordamchiAI brand logo (source of truth: PRIMARY LOGO sheet).
 *
 * Dark circular core + neon ring (violet → indigo → cyan), glossy 3D "Y", violet
 * circuit traces (left) + cyan traces (right), strong neon glow. Wordmark:
 * "Yordamchi" (glossy white) + "AI" (purple→blue), optional subtitle.
 *
 * Inline SVG (retina-crisp) · responsive (56 / 48 / 42px) · Framer-Motion intro +
 * hover (scale 1.05 + stronger glow) · respects prefers-reduced-motion.
 *
 * Brand palette: #7C3AED · #3B82F6 · #22D3EE · #0F172A.
 * React + TypeScript + TailwindCSS + Framer Motion.
 */

import { useId } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

interface LogoProps {
  /** Show the "YordamchiAI" wordmark (default true) */
  showText?:     boolean
  /** Show the "AI SIZNING O'QITUVCHINGIZ" subtitle (default true) */
  showSubtitle?: boolean
  className?:    string
}

// ─── The circular icon (inline SVG — resolution independent) ──────────────────

function LogoMark() {
  // Unique gradient/filter ids so multiple <Logo/> instances don't clash
  const uid   = useId().replace(/:/g, '')
  const ring  = `ring-${uid}`
  const yg    = `y-${uid}`
  const core  = `core-${uid}`
  const glow  = `glow-${uid}`

  return (
    <svg viewBox="0 0 100 100" className="relative h-full w-full" aria-hidden="true" focusable="false">
      <defs>
        {/* Neon ring: violet (left) → indigo → cyan (right) */}
        <linearGradient id={ring} x1="0" y1="0.15" x2="1" y2="0.85">
          <stop offset="0%"   stopColor="#B24BF3" />
          <stop offset="50%"  stopColor="#6366F1" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
        {/* Glossy "Y" front face: light lavender → violet */}
        <linearGradient id={yg} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#EDE7FF" />
          <stop offset="42%"  stopColor="#B49BFF" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        {/* Dark core */}
        <radialGradient id={core} cx="50%" cy="40%" r="72%">
          <stop offset="0%"   stopColor="#141B33" />
          <stop offset="100%" stopColor="#080B18" />
        </radialGradient>
        {/* Neon glow */}
        <filter id={glow} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Dark core */}
      <circle cx="50" cy="50" r="43" fill={`url(#${core})`} />

      {/* Circuit traces — left (violet) */}
      <g fill="none" stroke="#A855F7" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" filter={`url(#${glow})`}>
        <path d="M40 45 L31 41" /><circle cx="29.4" cy="40.5" r="1.9" fill="#A855F7" stroke="none" />
        <path d="M37 55 L26 57 L22 53" /><circle cx="20.6" cy="52" r="1.9" fill="#A855F7" stroke="none" />
        <path d="M40 63 L33 67" /><circle cx="31.5" cy="67.6" r="1.6" fill="#A855F7" stroke="none" />
      </g>
      {/* Circuit traces — right (cyan) */}
      <g fill="none" stroke="#22D3EE" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" filter={`url(#${glow})`}>
        <path d="M60 45 L69 41" /><circle cx="70.6" cy="40.5" r="1.9" fill="#22D3EE" stroke="none" />
        <path d="M63 55 L74 57 L78 53" /><circle cx="79.4" cy="52" r="1.9" fill="#22D3EE" stroke="none" />
        <path d="M60 63 L67 67" /><circle cx="68.5" cy="67.6" r="1.6" fill="#22D3EE" stroke="none" />
      </g>

      {/* Glowing ring */}
      <circle cx="50" cy="50" r="43" fill="none" stroke={`url(#${ring})`} strokeWidth="4" filter={`url(#${glow})`} />
      <circle cx="50" cy="50" r="43" fill="none" stroke={`url(#${ring})`} strokeWidth="1.4" opacity="0.95" />

      {/* Glossy 3D "Y" */}
      <g filter={`url(#${glow})`}>
        {/* depth / side */}
        <path d="M30 27 L50 50 L70 27 M50 50 L50 76" fill="none" stroke="#5B21B6" strokeOpacity="0.55"
          strokeWidth="14.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(1.1,1.5)" />
        {/* front face */}
        <path d="M30 27 L50 50 L70 27 M50 50 L50 76" fill="none" stroke={`url(#${yg})`}
          strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
        {/* gloss highlight */}
        <path d="M32 26.5 L49 46 M50 57 L50 73" fill="none" stroke="#FFFFFF" strokeOpacity="0.5"
          strokeWidth="2.8" strokeLinecap="round" />
      </g>
    </svg>
  )
}

// ─── Icon-only logo (shared across header · sidebar · mobile nav · auth) ──────
// Transparent official mark + a subtle blue/purple premium glow — NO box/tile
// container. Size via className. Do not wrap this in a colored square anywhere.
export function LogoIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <span className={`relative inline-block leading-none flex-shrink-0 ${className}`} aria-hidden="true">
      {/* Subtle premium glow (replaces the old solid box) */}
      <span
        className="absolute inset-0 rounded-full blur-md pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.50) 0%, rgba(91,127,255,0.28) 46%, transparent 70%)', transform: 'scale(1.4)' }}
      />
      <span className="relative block w-full h-full"><LogoMark /></span>
    </span>
  )
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

export default function Logo({ showText = true, showSubtitle = true, className = '' }: LogoProps) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={`inline-flex items-center gap-3 select-none group ${className}`}
      aria-label="YordamchiAI"
      role="img"
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      whileHover={reduce ? undefined : { scale: 1.05 }}
      transition={{ duration: 0.5, ease: EASE, type: 'spring', stiffness: 300, damping: 22 }}
    >
      {/* Icon + outer glow */}
      <div className="relative flex-shrink-0 h-[42px] w-[42px] sm:h-[48px] sm:w-[48px] lg:h-[56px] lg:w-[56px]">
        <div
          className="absolute -inset-2 rounded-full blur-xl opacity-55 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.85) 0%, rgba(59,130,246,0.5) 45%, transparent 72%)' }}
          aria-hidden="true"
        />
        <LogoMark />
      </div>

      {/* Wordmark + subtitle */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-black tracking-tight text-[20px] sm:text-[23px] lg:text-[27px]">
            <span
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #CFD6EA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Yordamchi
            </span>
            <span
              style={{
                background: 'linear-gradient(115deg, #7C3AED 0%, #6366F1 55%, #3B82F6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              AI
            </span>
          </span>
          {showSubtitle && (
            <span
              className="mt-1.5 font-semibold uppercase text-[7.5px] sm:text-[8.5px] lg:text-[10px] tracking-[0.22em] whitespace-nowrap"
              style={{ color: '#9AA4C6' }}
            >
              AI sizning o&apos;qituvchingiz
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}
