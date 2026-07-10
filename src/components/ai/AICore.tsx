/**
 * components/ai/AICore.tsx
 *
 * YordamchiAI — Holographic AI Intelligence Core.
 * Premium 3D glass AI sphere built around the official YordamchiAI logo mark.
 *
 * Replaces the old robot/cartoon assistant character with a clean, futuristic
 * "AI teacher & learning engine" identity:
 *   • official logo = intelligence core        • neural-network connections
 *   • 3D glass sphere + specular highlight      • flowing knowledge/data particles
 *   • blue + purple energy waves                • subtle education signals (orbits)
 *
 * Apple-Vision / premium-SaaS aesthetic. Fully self-contained, responsive,
 * and reduced-motion aware. No robot, no mascot, no cartoon — brand only.
 */

import { motion, useReducedMotion } from 'framer-motion'
import { LogoIcon } from '@/components/common/Logo'

interface AICoreProps {
  /** Square footprint of the whole visual, in px. */
  size?: number
  className?: string
}

/** Outer neural-network nodes — a symmetric hexagon around the core (viewBox 0–100). */
const NODES = [
  { x: 68, y: 18.8 },
  { x: 86, y: 50 },
  { x: 68, y: 81.2 },
  { x: 32, y: 81.2 },
  { x: 14, y: 50 },
  { x: 32, y: 18.8 },
] as const

export function AICore({ size = 220, className }: AICoreProps) {
  const reduce = useReducedMotion()

  return (
    <div
      className={className}
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* ── Ambient blue+purple energy glow ─────────────────────────────────── */}
      <div
        style={{
          position: 'absolute', inset: '-14%', borderRadius: '50%',
          background:
            'radial-gradient(circle at 50% 46%, rgba(124,58,237,0.34) 0%, rgba(91,127,255,0.20) 38%, transparent 70%)',
          filter: 'blur(14px)', pointerEvents: 'none',
        }}
      />

      {/* ── Neural network + flowing knowledge particles (SVG) ──────────────── */}
      <svg
        viewBox="0 0 100 100"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="aicore-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor="#5B7FFF" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <radialGradient id="aicore-node" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="#C4B5FD" />
            <stop offset="100%" stopColor="#5B7FFF" />
          </radialGradient>
        </defs>

        {/* Mesh links between adjacent outer nodes */}
        {NODES.map((n, i) => {
          const m = NODES[(i + 1) % NODES.length]
          return (
            <line
              key={`mesh-${i}`}
              x1={n.x} y1={n.y} x2={m.x} y2={m.y}
              stroke="url(#aicore-line)" strokeWidth={0.4} opacity={0.18}
            />
          )
        })}

        {/* Spokes from core → each node, node dots, and flowing data packets */}
        {NODES.map((n, i) => (
          <g key={`node-${i}`}>
            <line
              x1={50} y1={50} x2={n.x} y2={n.y}
              stroke="url(#aicore-line)" strokeWidth={0.5} opacity={0.28}
            />
            {/* Outer node with soft pulse */}
            <motion.circle
              cx={n.x} cy={n.y} r={1.7}
              fill="url(#aicore-node)"
              initial={false}
              animate={reduce ? undefined : { opacity: [0.45, 1, 0.45], r: [1.5, 2.1, 1.5] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.35 }}
              style={{ filter: 'drop-shadow(0 0 2px rgba(124,58,237,0.9))' }}
            />
            {/* Flowing knowledge/data packet core → node */}
            {!reduce && (
              <motion.circle
                r={1.1} fill="#93BBFF"
                initial={false}
                animate={{ cx: [50, n.x], cy: [50, n.y], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                style={{ filter: 'drop-shadow(0 0 2px rgba(147,187,255,0.95))' }}
              />
            )}
          </g>
        ))}
      </svg>

      {/* ── Concentric energy waves ─────────────────────────────────────────── */}
      {!reduce && [0, 1, 2].map(i => (
        <motion.span
          key={`wave-${i}`}
          style={{
            position: 'absolute', left: '50%', top: '50%',
            width: size * 0.5, height: size * 0.5, marginLeft: -size * 0.25, marginTop: -size * 0.25,
            borderRadius: '50%', border: '1px solid rgba(124,58,237,0.4)', pointerEvents: 'none',
          }}
          initial={{ scale: 0.72, opacity: 0.5 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: i * 1 }}
        />
      ))}

      {/* ── Education-signal orbit rings (subtle learning/AI energy) ─────────── */}
      <motion.span
        style={{
          position: 'absolute', left: '50%', top: '50%',
          width: size * 0.82, height: size * 0.82, marginLeft: -size * 0.41, marginTop: -size * 0.41,
          borderRadius: '50%', border: '1px solid rgba(91,127,255,0.16)', pointerEvents: 'none',
        }}
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
      >
        {/* signal node riding the orbit */}
        <span style={{
          position: 'absolute', top: -3, left: '50%', width: 6, height: 6, marginLeft: -3,
          borderRadius: '50%', background: '#5B7FFF', boxShadow: '0 0 8px rgba(91,127,255,0.9)',
        }} />
      </motion.span>
      <motion.span
        style={{
          position: 'absolute', left: '50%', top: '50%',
          width: size * 0.66, height: size * 0.66, marginLeft: -size * 0.33, marginTop: -size * 0.33,
          borderRadius: '50%', border: '1px dashed rgba(124,58,237,0.22)', pointerEvents: 'none',
        }}
        animate={reduce ? undefined : { rotate: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <span style={{
          position: 'absolute', bottom: -2.5, left: '50%', width: 5, height: 5, marginLeft: -2.5,
          borderRadius: '50%', background: '#A78BFA', boxShadow: '0 0 7px rgba(167,139,250,0.9)',
        }} />
      </motion.span>

      {/* ── Premium 3D glass AI sphere + logo intelligence core ─────────────── */}
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '50%',
          width: size * 0.5, height: size * 0.5, marginLeft: -size * 0.25, marginTop: -size * 0.25,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.16) 0%, rgba(124,58,237,0.10) 42%, rgba(59,130,246,0.08) 68%, rgba(11,15,28,0.25) 100%)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow:
            'inset 0 2px 12px rgba(255,255,255,0.14), inset 0 -8px 20px rgba(59,130,246,0.12), 0 8px 40px rgba(124,58,237,0.4)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        animate={reduce ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* specular highlight */}
        <span style={{
          position: 'absolute', top: '14%', left: '20%', width: '34%', height: '24%',
          borderRadius: '50%', background: 'rgba(255,255,255,0.35)', filter: 'blur(6px)', pointerEvents: 'none',
        }} />
        {/* Official logo mark = AI intelligence core */}
        <LogoIcon className="w-[62%] h-[62%] relative" />
      </motion.div>

      {/* ── Floating knowledge particles ────────────────────────────────────── */}
      {!reduce && [
        { x: '12%', y: '22%', d: 0.0, s: 4 },
        { x: '84%', y: '30%', d: 0.7, s: 3 },
        { x: '78%', y: '76%', d: 1.3, s: 5 },
        { x: '18%', y: '72%', d: 0.4, s: 3 },
        { x: '50%', y: '8%',  d: 1.0, s: 3 },
      ].map((p, i) => (
        <motion.span
          key={`particle-${i}`}
          style={{
            position: 'absolute', left: p.x, top: p.y, width: p.s, height: p.s,
            borderRadius: '50%', background: i % 2 ? '#93BBFF' : '#C4B5FD',
            boxShadow: '0 0 6px rgba(147,187,255,0.8)', pointerEvents: 'none',
          }}
          animate={{ y: [0, -10, 0], opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: p.d }}
        />
      ))}
    </div>
  )
}

export default AICore
