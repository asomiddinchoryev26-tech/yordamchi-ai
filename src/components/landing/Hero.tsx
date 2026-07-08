/**
 * components/landing/Hero.tsx
 * YordamchiAI landing hero — faithful reproduction of the approved design.
 *
 * Left: premium badge · headline "AI sizning shaxsiy o'qituvchingiz." (gradient on
 * "o'qituvchingiz.") · paragraph · 3 feature chips · CTA (Bepul boshlash / Demo ko'rish).
 * Right: large 3D AI-student illustration (lazy) with 6 floating feature cards,
 * rotating orbital rings and glow. Dark premium bg with radial glows + particles.
 *
 * Framer Motion only · memoized · lazy illustration · a11y · prefers-reduced-motion.
 * Touches only this file.
 */

import { memo, useMemo, useId } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  Sparkles, Camera, LayoutGrid, GraduationCap, ArrowRight, Play,
  FileText, Mic, Brain, TrendingUp, type LucideIcon,
} from 'lucide-react'
import { PATHS } from '@/routes/paths'
import { useLanguage } from '@/contexts/LanguageContext'

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]
const PRIMARY = 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)'
const RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A16]'

// ─── Data ─────────────────────────────────────────────────────────────────────

const CHIPS: { Icon: LucideIcon; color: string; l1: string; l2: string }[] = [
  { Icon: Camera,        color: '#A78BFA', l1: 'Imtihonga', l2: 'tayyorlaydi'   },
  { Icon: LayoutGrid,    color: '#34D399', l1: 'Shaxsiy',   l2: "AI o'qituvchi" },
  { Icon: GraduationCap, color: '#60A5FA', l1: '24/7',      l2: 'doim yordam'   },
]

type FloatCard = { Icon?: LucideIcon; glyph?: string; color: string; title: string; sub?: string; style: React.CSSProperties }

const FLOATS: FloatCard[] = [
  { Icon: Camera,     color: '#A78BFA', title: 'Rasm orqali', sub: 'yechim',                    style: { top: '4%',  left: '0%'  } },
  { Icon: FileText,   color: '#60A5FA', title: 'PDF va hujjat', sub: 'tahlili',                 style: { top: '33%', left: '-5%' } },
  { Icon: Mic,        color: '#34D399', title: 'Ovozli savol', sub: 'va javob',                 style: { top: '62%', left: '1%'  } },
  { Icon: Brain,      color: '#34D399', title: 'AI tahlili',   sub: 'zaif tomonlarni aniqlaydi', style: { top: '3%',  right: '0%' } },
  { glyph: 'x²',      color: '#A78BFA', title: 'Formula va misollar', sub: 'qadam-baqadam tushuntirish', style: { top: '37%', right: '-6%' } },
  { Icon: TrendingUp, color: '#F59E0B', title: 'Rivojlanish statistikasi', sub: 'har kuni kuzatib boradi', style: { top: '66%', right: '0%' } },
]

// ─── Background: radial glows + particles ─────────────────────────────────────

const Particles = memo(function Particles({ reduce }: { reduce: boolean }) {
  const dots = useMemo(
    () => Array.from({ length: 26 }, (_, i) => ({
      x: (i * 37) % 100, y: (i * 53) % 100,
      s: 1 + (i % 3), d: (i % 7) * 0.5, dur: 3 + (i % 5),
    })),
    [],
  )
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {dots.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, background: i % 2 ? '#7C3AED' : '#3B82F6', boxShadow: `0 0 ${p.s * 3}px currentColor` }}
          animate={reduce ? { opacity: 0.3 } : { opacity: [0.15, 0.7, 0.15], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.d }}
        />
      ))}
    </div>
  )
})

// ─── Orbital rings (rotate) ───────────────────────────────────────────────────

const OrbitalRings = memo(function OrbitalRings({ reduce }: { reduce: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      {[
        { size: '92%', dur: 26, border: 'rgba(124,58,237,0.22)' },
        { size: '74%', dur: 20, border: 'rgba(59,130,246,0.20)' },
      ].map((r, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: r.size, height: r.size, border: `1px solid ${r.border}`, transform: 'rotateX(72deg)' }}
          animate={reduce ? undefined : { rotate: i % 2 ? -360 : 360 }}
          transition={{ duration: r.dur, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  )
})

// ─── Constellation network (glowing web behind the character) ─────────────────

const NET_NODES: [number, number][] = [
  [60, 72], [132, 46], [212, 66], [300, 54], [346, 116],
  [46, 150], [112, 196], [202, 176], [306, 200], [356, 252],
  [72, 266], [152, 312], [246, 296], [322, 332], [186, 236], [276, 132],
]
const NET_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [1, 6], [2, 7], [3, 15], [15, 8], [4, 8],
  [5, 6], [6, 7], [7, 14], [14, 8], [8, 9], [6, 10], [10, 11], [11, 14], [14, 12], [12, 8],
  [12, 13], [9, 13], [11, 12], [15, 7],
]

const Constellation = memo(function Constellation({ reduce }: { reduce: boolean }) {
  const uid  = useId().replace(/:/g, '')
  const glow = `netGlow-${uid}`
  const fade = `netFade-${uid}`
  const mask = `netMask-${uid}`
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400" fill="none" aria-hidden="true">
      <defs>
        <filter id={glow} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id={fade} cx="50%" cy="47%" r="53%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="68%" stopColor="#fff" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={mask}><rect width="400" height="400" fill={`url(#${fade})`} /></mask>
      </defs>
      <g mask={`url(#${mask})`} filter={`url(#${glow})`}>
        {/* edges */}
        {NET_EDGES.map(([a, b], i) => (
          <line
            key={`e${i}`}
            x1={NET_NODES[a][0]} y1={NET_NODES[a][1]} x2={NET_NODES[b][0]} y2={NET_NODES[b][1]}
            stroke={i % 2 ? '#5B7FFF' : '#7C3AED'} strokeWidth="0.7" strokeOpacity="0.3"
          />
        ))}
        {/* nodes */}
        {NET_NODES.map(([x, y], i) => (
          <motion.circle
            key={`n${i}`}
            cx={x} cy={y} r={1.5 + (i % 3) * 0.7}
            fill={i % 2 ? '#8B5CF6' : '#3B82F6'}
            animate={reduce ? undefined : { opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 2.6 + (i % 4) * 0.7, repeat: Infinity, ease: 'easeInOut', delay: (i % 5) * 0.35 }}
          />
        ))}
      </g>
    </svg>
  )
})

// ─── Lazy character illustration (with graceful fallback) ─────────────────────

function HeroIllustration({ className = '' }: { className?: string }) {
  // Transparent character PNG (background removed) — full raised hand, clean edges.
  return (
    <img
      src="/images/home/hero.png"
      alt="YordamchiAI — 3D AI o'qituvchi illyustratsiyasi"
      loading="lazy"
      decoding="async"
      draggable={false}
      className={`object-contain drop-shadow-[0_24px_60px_rgba(124,58,237,0.5)] ${className}`}
    />
  )
}

// ─── Floating feature card ────────────────────────────────────────────────────

function FloatingCardInner({ card, full = false }: { card: FloatCard; full?: boolean }) {
  const { Icon, glyph, color, title, sub } = card
  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl py-1.5 pl-1.5 pr-3.5 ${full ? 'w-full' : 'w-max max-w-[220px]'}`}
      style={{
        background: 'rgba(10,13,26,0.5)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      {/* Glowing circular icon orb */}
      <span
        className="relative flex items-center justify-center w-[54px] h-[54px] rounded-full flex-shrink-0"
        style={{
          background: `radial-gradient(circle at 34% 26%, #fff 0%, ${color} 30%, ${color}dd 55%, ${color}66 100%)`,
          boxShadow: `0 0 30px ${color}b3, 0 0 12px ${color}, inset 0 1px 4px rgba(255,255,255,0.55)`,
        }}
        aria-hidden="true"
      >
        {glyph
          ? <span className="text-[18px] font-black text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>{glyph}</span>
          : Icon && <Icon className="w-[24px] h-[24px] text-white" strokeWidth={2.1} style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} aria-hidden="true" />}
      </span>
      {/* Text beside the orb */}
      <span className="min-w-0">
        <span className="block text-[13.5px] font-bold text-white leading-[1.15]">{title}</span>
        {sub && <span className="block text-[11px] text-white/65 leading-[1.15] mt-0.5">{sub}</span>}
      </span>
    </div>
  )
}

// ─── Feature chip (left) ──────────────────────────────────────────────────────

function FeatureChip({ Icon, color, l1, l2 }: { Icon: LucideIcon; color: string; l1: string; l2: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <span className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
        style={{ background: `${color}1f`, border: `1px solid ${color}33` }}>
        <Icon className="w-[18px] h-[18px]" style={{ color }} strokeWidth={1.9} aria-hidden="true" />
      </span>
      <span className="text-center text-[11.5px] font-semibold leading-[1.2] tracking-tight text-white/75 whitespace-nowrap">{l1}<br />{l2}</span>
    </div>
  )
}

// ─── Right visual (character + floating cards + rings) ────────────────────────

const CARD_V: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: (i: number) => ({ opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE, delay: 0.4 + i * 0.08 } }),
}

function HeroVisual({ reduce }: { reduce: boolean }) {
  return (
    <div className="relative w-full">
      {/* Desktop: character + floating cards + rings */}
      <div className="relative hidden min-[900px]:block aspect-square max-w-[560px] mx-auto">
        {/* central aura glow (behind everything) */}
        <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-[64%] h-[64%] rounded-full blur-[44px]"
          style={{ background: 'radial-gradient(circle, rgba(91,127,255,0.4) 0%, rgba(124,58,237,0.18) 45%, transparent 70%)' }} aria-hidden="true" />
        {/* glowing constellation network */}
        <Constellation reduce={reduce} />
        <OrbitalRings reduce={reduce} />
        {/* base platform glow */}
        <div className="absolute left-1/2 bottom-[8%] -translate-x-1/2 w-2/3 h-16 rounded-[100%] blur-2xl"
          style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.55), transparent 70%)' }} aria-hidden="true" />
        {/* character */}
        <motion.div
          className="absolute inset-0 flex items-end justify-center pb-[6%]"
          animate={reduce ? undefined : { y: [0, -14, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <HeroIllustration className="h-[86%] w-auto" />
        </motion.div>
        {/* floating cards */}
        {FLOATS.map((card, i) => (
          <motion.div
            key={card.title} className="absolute z-10" style={card.style}
            custom={i} variants={CARD_V} initial="hidden" animate="show"
          >
            <motion.div animate={reduce ? undefined : { y: [0, i % 2 ? 10 : -10, 0] }}
              transition={{ duration: 4 + (i % 3), repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}>
              <FloatingCardInner card={card} />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Tablet / mobile: character centered + cards as 2-col grid (no overlap) */}
      <div className="min-[900px]:hidden flex flex-col items-center gap-8">
        <div className="relative w-[260px] sm:w-[340px] aspect-square">
          <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 w-[64%] h-[64%] rounded-full blur-[38px]"
            style={{ background: 'radial-gradient(circle, rgba(91,127,255,0.38) 0%, rgba(124,58,237,0.16) 45%, transparent 70%)' }} aria-hidden="true" />
          <Constellation reduce={reduce} />
          <OrbitalRings reduce={reduce} />
          <div className="absolute left-1/2 bottom-[8%] -translate-x-1/2 w-2/3 h-12 rounded-[100%] blur-2xl"
            style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.5), transparent 70%)' }} aria-hidden="true" />
          <motion.div className="absolute inset-0 flex items-end justify-center"
            animate={reduce ? undefined : { y: [0, -10, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}>
            <HeroIllustration className="h-[88%] w-auto" />
          </motion.div>
        </div>
        <ul className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 w-full">
          {FLOATS.map(card => (
            <li key={card.title}><FloatingCardInner card={card} full /></li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

const STAGGER: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }
const UP: Variants = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }

function Hero() {
  const reduce = Boolean(useReducedMotion())
  const { t } = useLanguage()

  return (
    <section
      id="home"
      aria-label="AI sizning shaxsiy o'qituvchingiz"
      className="relative overflow-hidden scroll-mt-20"
      style={{ background: 'radial-gradient(ellipse 90% 70% at 25% 0%, #17103A 0%, #0A0A16 55%)' }}
    >
      {/* Radial glows */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 left-[10%] w-[560px] h-[560px] rounded-full blur-[140px] opacity-25" style={{ background: 'radial-gradient(circle,#7C3AED,transparent 60%)' }} />
        <div className="absolute top-1/3 right-[6%] w-[520px] h-[520px] rounded-full blur-[140px] opacity-20" style={{ background: 'radial-gradient(circle,#3B82F6,transparent 60%)' }} />
      </div>
      <Particles reduce={reduce} />

      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10 py-14 sm:py-16 lg:py-20 grid min-[900px]:grid-cols-2 gap-12 min-[900px]:gap-8 items-center">

        {/* ── LEFT ─────────────────────────────────────────────────────────── */}
        <motion.div className="flex flex-col items-center min-[900px]:items-start text-center min-[900px]:text-left" variants={STAGGER} initial="hidden" animate="show">
          {/* Badge */}
          <motion.div variants={UP}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}>
            <Sparkles className="w-3.5 h-3.5 text-[#C4B5FD]" aria-hidden="true" />
            <span className="text-[12px] font-semibold text-white/75">{t.heroBadge}</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={UP} className="mt-5 font-black tracking-tight leading-[1.05] text-[40px] sm:text-[52px] lg:text-[60px] text-white">
            AI sizning<br />shaxsiy<br />
            <span style={{ background: 'linear-gradient(100deg,#9B7CFF 0%,#6366F1 50%,#3B82F6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              o&apos;qituvchingiz.
            </span>
          </motion.h1>

          {/* Paragraph */}
          <motion.p variants={UP} className="mt-5 max-w-md text-[15px] leading-relaxed text-white/55">
            {t.heroSubtitle}
          </motion.p>

          {/* Feature chips — stack on very narrow screens, 3-col from sm */}
          <motion.div variants={UP} className="mt-7 grid grid-cols-1 min-[420px]:grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-md">
            {CHIPS.map(c => <FeatureChip key={c.l1} {...c} />)}
          </motion.div>

          {/* CTA buttons */}
          <motion.div variants={UP} className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <motion.div whileHover={reduce ? undefined : { y: -2, scale: 1.03, boxShadow: '0 12px 34px rgba(124,58,237,0.6)' }} whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20 }} className="w-full sm:w-auto" style={{ borderRadius: 14 }}>
              <Link to={PATHS.REGISTER}
                className={`group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-[14px] text-[15px] font-bold text-white overflow-hidden relative ${RING}`}
                style={{ background: PRIMARY, boxShadow: '0 8px 24px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.18)' }}>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"
                  style={{ background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.25) 50%,transparent 70%)' }} aria-hidden="true" />
                <span className="relative z-10">{t.heroCtaPrimary}</span>
                <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </motion.div>

            <motion.button
              type="button" whileHover={reduce ? undefined : { y: -2, scale: 1.03 }} whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-[14px] text-[15px] font-semibold text-white/85 ${RING}`}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)' }}>
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              {t.heroCtaSecondary}
            </motion.button>
          </motion.div>
        </motion.div>

        {/* ── RIGHT ────────────────────────────────────────────────────────── */}
        <motion.div initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}>
          <HeroVisual reduce={reduce} />
        </motion.div>
      </div>
    </section>
  )
}

export default memo(Hero)
