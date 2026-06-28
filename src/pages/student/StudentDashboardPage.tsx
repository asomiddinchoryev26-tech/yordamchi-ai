/**
 * pages/student/StudentDashboardPage.tsx
 * Sprint 4.7 — Premium Student Dashboard Experience (UI/UX enhancement)
 * Sprint 4.2 — Premium Home Page Redesign (base layer preserved)
 *
 * ALL DATA FETCHING LOGIC IS PRESERVED UNCHANGED.
 * Only the visual rendering layer has been redesigned / extended.
 *
 * Sprint 4.7 additions (visual-only, no business logic impact):
 *   QuickActionsBar, PersonalStatsRow, ContinueLearningCard,
 *   AchievementsShowcase, DashboardSidebar
 */

import { useState, useEffect, useRef, memo } from 'react'
import {
  Camera, ImageIcon, FileText as FileIcon, Mic, Send,
  ArrowRight, CheckCircle, BookOpen, Clock, Zap, Trophy,
  TrendingUp, ChevronRight, Star, Lock,
  // Sprint 4.7 additions — new visual icons only
  Flame, Award, Target, Bell, BarChart3, Users, Download,
  // Sprint 4.7 Final Hero additions
  Brain, Sparkles, Code2, Atom, Calculator, FlaskConical,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { PATHS } from '@/routes/paths'
import { ProgressRing } from '@/components/dashboard'
import { Badge } from '@/components/ui/Badge'

// ─── Types (UNCHANGED — business logic preserved) ─────────────────────────────

type SDGroup = {
  id:           string
  name:         string
  status:       'active' | 'inactive' | 'completed'
  subject:      { name: string; icon: string; color: string } | null
  teacher_name: string | null
  lesson_count: number
  enrolled_at:  string
  att_present:  number
  att_total:    number
}

type SDTest = {
  id:           string
  test_id:      string
  title:        string
  group_name:   string
  score:        number
  total:        number
  submitted_at: string
}

type EarnedAchievement = {
  id:           string
  total_score:  number | null
  period_year:  number
  period_month: number | null
  period_type:  'monthly' | 'yearly'
  earned_at:    string
  group_id:     string | null
  group_name:   string | null
  def: {
    code:        string
    name:        { uz: string; ru: string; en: string }
    description: { uz: string; ru: string; en: string }
    tier:        'gold' | 'silver' | 'bronze' | 'special'
    icon_emoji:  string
  } | null
}

type ScoreSnapshot = {
  id:                string
  total_score:       number
  attendance_score:  number
  test_score:        number
  consistency_score: number
  activity_score:    number
  period_year:       number
  period_month:      number
  group_name:        string | null
}

// ─── Animation constants ──────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

const FADE_UP = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
}
const STAGGER = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
const STAGGER_FAST = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.05 } },
}

// ─── Premium design tokens ────────────────────────────────────────────────────

const GLASS_ELEVATED = {
  background:            'rgba(255,255,255,0.055)',
  backdropFilter:        'blur(24px) saturate(200%)',
  WebkitBackdropFilter:  'blur(24px) saturate(200%)',
  border:                '1px solid rgba(255,255,255,0.10)',
  boxShadow:             '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.08)',
} as const

// ─── Animated number counter (IntersectionObserver, no deps) ─────────────────

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref  = useRef<HTMLSpanElement>(null)
  const [val, setVal] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      obs.disconnect()
      const start = performance.now()
      const DUR   = 1400
      const tick  = (now: number) => {
        const t    = Math.min((now - start) / DUR, 1)
        const ease = 1 - Math.pow(1 - t, 3)
        setVal(Math.round(target * ease))
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target])

  return <span ref={ref}>{val}{suffix}</span>
}

// ─── Hero: floating particles ─────────────────────────────────────────────────

const HERO_PARTICLES = [
  { x: '7%',  y: '18%', s: 3, c: '#818CF8', d: 0   },
  { x: '78%', y: '12%', s: 4, c: '#A78BFA', d: 0.7 },
  { x: '93%', y: '42%', s: 3, c: '#6366F1', d: 1.3 },
  { x: '86%', y: '72%', s: 5, c: '#7C3AED', d: 0.4 },
  { x: '4%',  y: '62%', s: 4, c: '#C4B5FD', d: 1.9 },
  { x: '42%', y: '90%', s: 3, c: '#818CF8', d: 1.0 },
  { x: '22%', y: '6%',  s: 4, c: '#A78BFA', d: 2.5 },
  { x: '58%', y: '8%',  s: 2, c: '#6366F1', d: 1.6 },
  { x: '12%', y: '82%', s: 3, c: '#C4B5FD', d: 0.3 },
] as const

function HeroParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {HERO_PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ left: p.x, top: p.y, width: p.s, height: p.s, background: p.c,
            boxShadow: `0 0 ${p.s * 3}px ${p.c}` }}
          animate={{ y: [0, -14, 0], opacity: [0.25, 0.85, 0.25], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3.2 + p.d * 0.4, repeat: Infinity, ease: 'easeInOut', delay: p.d }}
        />
      ))}
    </div>
  )
}

// ─── Hero: floating AI icons ──────────────────────────────────────────────────

const AI_ICON_CFG = [
  { Icon: Brain,        x: '5%',   y: '14%', s: 20, c: '#5B7FFF', d: 0,    dy: -12 },
  { Icon: Sparkles,     x: '87%',  y: '10%', s: 18, c: '#A78BFA', d: 0.8,  dy: -10 },
  { Icon: Zap,          x: '80%',  y: '62%', s: 16, c: '#818CF8', d: 1.5,  dy: -14 },
  { Icon: Code2,        x: '3%',   y: '68%', s: 17, c: '#7C3AED', d: 2.3,  dy: -9  },
  { Icon: BookOpen,     x: '44%',  y: '93%', s: 15, c: '#C4B5FD', d: 1.1,  dy: -7  },
  { Icon: Star,         x: '93%',  y: '38%', s: 14, c: '#93BBFF', d: 0.5,  dy: -11 },
  { Icon: Trophy,       x: '1%',   y: '40%', s: 15, c: '#6366F1', d: 1.9,  dy: -9  },
  { Icon: Atom,         x: '88%',  y: '82%', s: 18, c: '#22D3EE', d: 0.3,  dy: -13 },
  { Icon: Calculator,   x: '14%',  y: '86%', s: 15, c: '#34D399', d: 2.7,  dy: -8  },
  { Icon: FlaskConical, x: '72%',  y: '5%',  s: 16, c: '#F59E0B', d: 1.4,  dy: -10 },
  { Icon: BookOpen,     x: '28%',  y: '2%',  s: 14, c: '#818CF8', d: 3.1,  dy: -7  },
  { Icon: Sparkles,     x: '64%',  y: '90%', s: 13, c: '#A78BFA', d: 2.0,  dy: -8  },
] as const

function FloatingAIIcons() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {AI_ICON_CFG.map(({ Icon, x, y, s, c, d, dy }, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: x, top: y }}
          animate={{ y: [0, dy, 0], opacity: [0.18, 0.45, 0.18], rotate: [-4, 4, -4] }}
          transition={{ duration: 4 + d * 0.5, repeat: Infinity, ease: 'easeInOut', delay: d }}
        >
          <Icon
            aria-hidden="true"
            style={{
              width: s, height: s, color: c,
              filter: `drop-shadow(0 0 6px ${c}) drop-shadow(0 0 12px ${c}50)`,
            }}
          />
        </motion.div>
      ))}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']

function fmtDate(d: string) {
  const dt  = new Date(d)
  const now = new Date()
  if (dt.toDateString() === now.toDateString()) return 'Bugun'
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]}`
}

function getAttColor(pct: number) {
  return pct >= 80 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444'
}

function getWeakTopics(avgPct: number): Array<{ name: string; pct: number }> {
  if (avgPct >= 75) return []
  return [
    { name: 'Diskriminant',         pct: Math.min(68, avgPct + 8)  },
    { name: 'Manfiy ildizlar',      pct: Math.min(54, avgPct - 5)  },
    { name: 'Kvadrat tenglamalar',  pct: Math.min(73, avgPct + 15) },
  ]
}

// ─── Sprint 4.7 Phase 1: Dynamic greeting helpers (pure, no side effects) ─────

const UZ_DAYS = ['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'] as const

function getTimeGreeting(hour: number): string {
  if (hour >= 5  && hour < 12) return 'Xayrli tong'
  if (hour >= 12 && hour < 17) return 'Xayrli kun'
  if (hour >= 17 && hour < 21) return 'Xayrli kech'
  return 'Xayrli tun'
}

function getLiveDate() {
  const now     = new Date()
  const hour    = now.getHours()
  const weekday = UZ_DAYS[now.getDay()]
  const dd      = String(now.getDate()).padStart(2, '0')
  const mm      = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy    = now.getFullYear()
  return { greeting: getTimeGreeting(hour), weekday, date: `${dd}.${mm}.${yyyy}` }
}

// ─── Sprint 4.7 Final Polish: Premium SVG Vector Student Illustration ────────

function StudentIllustration() {
  return (
    <div
      className="relative select-none"
      style={{ width: 340, height: 420 }}
      aria-hidden="true"
    >
      {/* Ambient glow layers */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute rounded-full blur-[110px] opacity-35"
          style={{ width: 340, height: 340, top: '10%', left: '50%', transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, #5B7FFF 0%, #7C3AED 40%, transparent 68%)' }} />
        <div className="absolute rounded-full blur-[70px] opacity-25"
          style={{ width: 200, height: 200, top: 0, left: '50%', transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, #818CF8, transparent 70%)' }} />
        <div className="absolute rounded-full blur-[50px] opacity-20"
          style={{ width: 160, height: 160, bottom: '5%', left: '50%', transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, #3B82F6, transparent 70%)' }} />
      </div>

      {/* ── SVG Vector Illustration (floats up/down) ──────────────────────── */}
      <motion.div
        className="absolute inset-0 z-10"
        animate={{ y: [0, -16, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="340" height="420" viewBox="0 0 340 420" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="sG" x1="25%" y1="0%" x2="75%" y2="100%">
              <stop offset="0%"   stopColor="#FDE3BC" />
              <stop offset="35%"  stopColor="#F0C4A0" />
              <stop offset="70%"  stopColor="#E8A87C" />
              <stop offset="100%" stopColor="#CF7E5A" />
            </linearGradient>
            <linearGradient id="hG" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%"   stopColor="#1E0F52" />
              <stop offset="45%"  stopColor="#2D1B69" />
              <stop offset="100%" stopColor="#1A1040" />
            </linearGradient>
            <linearGradient id="hdG" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#321F7A" />
              <stop offset="28%"  stopColor="#271870" />
              <stop offset="60%"  stopColor="#1E1260" />
              <stop offset="100%" stopColor="#130940" />
            </linearGradient>
            <linearGradient id="hdSG" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="rgba(255,255,255,0.14)" />
              <stop offset="50%"  stopColor="rgba(255,255,255,0.04)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <linearGradient id="yG" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#A5C8FF" />
              <stop offset="40%"  stopColor="#5B7FFF" />
              <stop offset="100%" stopColor="#B09EFF" />
            </linearGradient>
            <linearGradient id="scG" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#070D1F" />
              <stop offset="100%" stopColor="#04080F" />
            </linearGradient>
            <radialGradient id="scGl" cx="50%" cy="95%" r="60%">
              <stop offset="0%"   stopColor="rgba(91,127,255,0.30)" />
              <stop offset="100%" stopColor="rgba(91,127,255,0)" />
            </radialGradient>
            <linearGradient id="bsG" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#3D4D62" />
              <stop offset="100%" stopColor="#1F2937" />
            </linearGradient>
            {/* Body drop-shadow */}
            <filter id="bSh" x="-22%" y="-8%" width="144%" height="128%">
              <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="rgba(0,0,0,0.6)" />
            </filter>
            {/* Y glow */}
            <filter id="yF" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {/* Screen blue glow */}
            <filter id="scF" x="-18%" y="-18%" width="136%" height="136%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b"/>
              <feColorMatrix in="b" type="matrix"
                values="0 0 0.9 0 0.05  0 0.1 0.8 0 0.05  0.5 0 0.5 0 0.2  0 0 0 0.85 0" result="c"/>
              <feMerge><feMergeNode in="c"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* ── GROUND GLOW ────────────────────────────────────────────────── */}
          <ellipse cx="170" cy="415" rx="120" ry="11" fill="rgba(91,127,255,0.2)" />

          {/* ── LAPTOP BASE ────────────────────────────────────────────────── */}
          <ellipse cx="170" cy="400" rx="105" ry="9" fill="rgba(0,0,0,0.45)" />
          <rect x="60" y="380" width="220" height="22" rx="5" fill="url(#bsG)" />
          {/* Keyboard rows */}
          {[0,1,2].map(row => (
            <g key={row} opacity={0.2 - row * 0.04}>
              {Array.from({length: 12 - row}).map((_, col) => (
                <rect key={col} x={68 + col * 16 + row * 6} y={383 + row * 5}
                  width={12} height={3} rx="1" fill="rgba(255,255,255,1)" />
              ))}
            </g>
          ))}
          {/* Trackpad */}
          <rect x="128" y="386" width="84" height="13" rx="3"
            fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
          {/* Hinge */}
          <rect x="66" y="376" width="208" height="5" rx="2" fill="#2D3748" />

          {/* ── LAPTOP SCREEN ──────────────────────────────────────────────── */}
          <rect x="62" y="274" width="216" height="108" rx="10"
            fill="url(#scG)" filter="url(#scF)" />
          <rect x="62" y="274" width="216" height="108" rx="10"
            fill="none" stroke="rgba(91,127,255,0.65)" strokeWidth="1.5" />
          <rect x="62" y="274" width="216" height="108" rx="10" fill="url(#scGl)" />
          {/* Chrome bar */}
          <rect x="62" y="274" width="216" height="18" rx="10" fill="rgba(255,255,255,0.04)" />
          <rect x="62" y="284" width="216" height="8" fill="rgba(255,255,255,0.03)" />
          <line x1="62" y1="292" x2="278" y2="292" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
          {/* Traffic lights */}
          <circle cx="78"  cy="283" r="4.5" fill="#FF5F57" opacity="0.88" />
          <circle cx="93"  cy="283" r="4.5" fill="#FEBC2E" opacity="0.88" />
          <circle cx="108" cy="283" r="4.5" fill="#28C840" opacity="0.88" />
          {/* Active tab */}
          <rect x="122" y="276" width="52" height="14" rx="3"
            fill="rgba(91,127,255,0.22)" stroke="rgba(91,127,255,0.4)" strokeWidth="0.5" />
          <text x="148" y="286" textAnchor="middle" fontSize="6" fill="rgba(147,187,255,0.65)">main.tsx</text>
          {/* Code lines (syntax highlighted) */}
          {[
            [72,  298, 88,  '#5B7FFF', 0,  0.28],
            [80,  306, 116, '#A78BFA', 0,  0.25],
            [88,  314, 66,  '#93BBFF', 0,  0.30],
            [80,  322, 100, '#22D3EE', 0,  0.24],
            [72,  330, 76,  '#818CF8', 0,  0.28],
            [88,  338, 52,  '#A78BFA', 0,  0.22],
            [72,  346, 84,  '#5B7FFF', 0,  0.26],
          ].map(([x,y,w,c,_,op], i) => (
            <rect key={i} x={x as number} y={y as number} width={w as number} height={2.5} rx="1.2"
              fill={c as string} opacity={op as number} />
          ))}
          {/* Blinking cursor */}
          <motion.rect x={72} y={355} width={2} height={10} rx={1} fill="rgba(147,187,255,0.85)"
            animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />
          {/* Scan line */}
          <motion.rect x={62} width={216} height={1} rx={0.5}
            fill="rgba(147,187,255,0.5)"
            animate={{ y: [274, 382, 274] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }} />
          {/* Y logo on screen */}
          <motion.g
            animate={{ opacity: [0.72, 1, 0.72], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '240px 335px' }}
          >
            <text x="240" y="346" textAnchor="middle" fontSize="32" fontWeight="900"
              fill="url(#yG)" filter="url(#yF)">Y</text>
          </motion.g>

          {/* ── HOODIE BODY ────────────────────────────────────────────────── */}
          <g filter="url(#bSh)">
            <path
              d="M 88 200
                 C 66 206, 44 228, 40 272
                 L 38 365
                 Q 38 378, 54 378
                 L 286 378
                 Q 302 378, 302 365
                 L 300 272
                 C 296 228, 274 206, 252 200 Z"
              fill="url(#hdG)"
            />
            {/* Shine overlay */}
            <path
              d="M 88 200
                 C 66 206, 44 228, 40 272
                 L 38 365
                 Q 38 378, 54 378
                 L 286 378
                 Q 302 378, 302 365
                 L 300 272
                 C 296 228, 274 206, 252 200 Z"
              fill="url(#hdSG)"
            />
          </g>
          {/* Left sleeve shadow */}
          <path d="M 40 240 L 38 365 Q 38 378 54 378 L 90 378 L 86 252 Z"
            fill="rgba(0,0,0,0.10)" />
          {/* Right sleeve shadow */}
          <path d="M 300 240 L 302 365 Q 302 378 286 378 L 250 378 L 254 252 Z"
            fill="rgba(0,0,0,0.10)" />
          {/* Fabric fold lines */}
          <path d="M 90 248 Q 124 242 158 252" stroke="rgba(0,0,0,0.07)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 180 262 Q 216 256 246 268" stroke="rgba(0,0,0,0.06)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 84 305 Q 120 298 156 308" stroke="rgba(0,0,0,0.07)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M 182 322 Q 218 314 248 326" stroke="rgba(0,0,0,0.06)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M 86 352 Q 170 345 254 352" stroke="rgba(0,0,0,0.05)" strokeWidth="1" fill="none" />
          {/* Center zipper */}
          <line x1="170" y1="204" x2="170" y2="298" stroke="rgba(0,0,0,0.14)" strokeWidth="2" />
          <rect x="164" y="204" width="12" height="9" rx="2.5"
            fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" />
          {/* Pocket */}
          <rect x="120" y="320" width="100" height="40" rx="12"
            fill="rgba(0,0,0,0.18)" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          <line x1="133" y1="320" x2="120" y2="360" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <line x1="207" y1="320" x2="220" y2="360" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          {/* Brand Y on hoodie */}
          <motion.g
            animate={{ opacity: [0.78, 1, 0.78] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '170px 292px' }}
          >
            <text x="170" y="300" textAnchor="middle" fontSize="56" fontWeight="900"
              fill="url(#yG)" filter="url(#yF)">Y</text>
          </motion.g>

          {/* ── HOOD ARCH ──────────────────────────────────────────────────── */}
          <path
            d="M 90 196
               Q 90 134, 170 120
               Q 250 134, 250 196
               L 252 200
               L 88 200 Z"
            fill="url(#hG)" opacity="0.97"
          />
          <path d="M 92 194 Q 92 138 170 124 Q 248 138 248 194"
            fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />

          {/* ── HEAD ───────────────────────────────────────────────────────── */}
          {/* Head shadow at neck */}
          <ellipse cx="170" cy="192" rx="40" ry="16" fill="rgba(0,0,0,0.30)" />
          <ellipse cx="170" cy="112" rx="64" ry="76" fill="url(#sG)" filter="url(#bSh)" />
          {/* Chin shadow */}
          <ellipse cx="170" cy="180" rx="36" ry="12" fill="rgba(140,80,30,0.13)" />
          {/* Face ambient light (left side) */}
          <ellipse cx="140" cy="130" rx="22" ry="32" fill="rgba(255,255,255,0.04)" />

          {/* ── HAIR ───────────────────────────────────────────────────────── */}
          <path
            d="M 108 92
               Q 108 44, 170 42
               Q 232 44, 232 92
               L 234 110
               Q 208 100, 170 102
               Q 132 100, 106 110 Z"
            fill="url(#hG)"
          />
          <ellipse cx="144" cy="64" rx="24" ry="10" fill="rgba(255,255,255,0.12)"
            transform="rotate(-14 144 64)" />
          <ellipse cx="158" cy="78" rx="13" ry="5" fill="rgba(255,255,255,0.07)"
            transform="rotate(-8 158 78)" />
          <ellipse cx="186" cy="62" rx="11" ry="4" fill="rgba(255,255,255,0.06)"
            transform="rotate(9 186 62)" />

          {/* ── FACE ───────────────────────────────────────────────────────── */}
          {/* Eyebrows */}
          <path d="M 128 120 Q 144 113 152 118" stroke="#3E2008" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 188 118 Q 196 113 210 120" stroke="#3E2008" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Left eye */}
          <ellipse cx="140" cy="132" rx="14" ry="11" fill="white" />
          <circle cx="141" cy="132" r="9" fill="#1A1040" />
          <circle cx="141" cy="132" r="5.5" fill="#2A1060" />
          <circle cx="143" cy="128" r="4" fill="rgba(255,255,255,0.88)" />
          <circle cx="138" cy="133" r="1.8" fill="rgba(255,255,255,0.45)" />
          <path d="M 126 132 Q 140 121 154 132" stroke="#3A1808" strokeWidth="1.5" fill="rgba(0,0,0,0.07)" />
          {/* Right eye */}
          <ellipse cx="200" cy="132" rx="14" ry="11" fill="white" />
          <circle cx="199" cy="132" r="9" fill="#1A1040" />
          <circle cx="199" cy="132" r="5.5" fill="#2A1060" />
          <circle cx="201" cy="128" r="4" fill="rgba(255,255,255,0.88)" />
          <circle cx="196" cy="133" r="1.8" fill="rgba(255,255,255,0.45)" />
          <path d="M 186 132 Q 200 121 214 132" stroke="#3A1808" strokeWidth="1.5" fill="rgba(0,0,0,0.07)" />
          {/* Nose */}
          <path d="M 166 142 L 162 162 Q 170 168 178 162 L 174 142"
            stroke="rgba(165,90,30,0.28)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <ellipse cx="160" cy="161" rx="6.5" ry="4" fill="rgba(155,80,25,0.18)" />
          <ellipse cx="180" cy="161" rx="6.5" ry="4" fill="rgba(155,80,25,0.18)" />
          {/* Cheeks */}
          <ellipse cx="122" cy="152" rx="18" ry="11" fill="rgba(218,100,75,0.22)" />
          <ellipse cx="218" cy="152" rx="18" ry="11" fill="rgba(218,100,75,0.22)" />
          {/* Smile */}
          <path d="M 148 172 Q 170 184 192 172"
            stroke="rgba(125,65,25,0.55)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 152 172 Q 170 178 188 172"
            stroke="rgba(220,155,110,0.18)" strokeWidth="1.5" fill="none" />
          {/* Ears */}
          <path d="M 106 118 Q 96 130 98 146 Q 102 162 118 156 L 112 120 Z" fill="url(#sG)" />
          <path d="M 110 130 Q 106 142 110 152" stroke="rgba(160,85,35,0.20)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path d="M 234 120 L 222 156 Q 238 162 242 146 Q 244 130 234 118 Z" fill="url(#sG)" />
          <path d="M 230 130 Q 234 142 230 152" stroke="rgba(160,85,35,0.20)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          {/* Neck */}
          <rect x="150" y="182" width="40" height="22" rx="5" fill="url(#sG)" />
          <line x1="150" y1="192" x2="190" y2="192" stroke="rgba(155,85,35,0.08)" strokeWidth="1" />
          {/* Forehead shadow */}
          <path d="M 110 102 Q 170 90 230 102 L 226 120 Q 170 108 114 120 Z"
            fill="rgba(0,0,0,0.04)" />
        </svg>
      </motion.div>

      {/* Orbiting dot particles (CSS, around the SVG) */}
      {[
        { top: '7%',  left: '7%',   s: 5, c: '#818CF8', d: 0   },
        { top: '20%', right: '3%',  s: 4, c: '#A78BFA', d: 0.8 },
        { top: '56%', left: '2%',   s: 4, c: '#6366F1', d: 1.5 },
        { top: '74%', right: '4%',  s: 6, c: '#7C3AED', d: 2.2 },
        { top: '4%',  right: '14%', s: 4, c: '#93BBFF', d: 0.4 },
        { top: '88%', left: '22%',  s: 3, c: '#C4B5FD', d: 1.8 },
        { top: '40%', left: '1%',   s: 3, c: '#5B7FFF', d: 1.2 },
        { top: '65%', right: '16%', s: 4, c: '#818CF8', d: 3.0 },
        { top: '30%', left: '5%',   s: 3, c: '#A78BFA', d: 2.6 },
        { top: '12%', right: '8%',  s: 3, c: '#5B7FFF', d: 1.9 },
      ].map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            top: p.top,
            left: (p as Record<string,unknown>).left as string | undefined,
            right: (p as Record<string,unknown>).right as string | undefined,
            width: p.s, height: p.s,
            background: p.c,
            boxShadow: `0 0 ${p.s * 3}px ${p.c}`,
          }}
          animate={{ y: [-7, 7, -7], opacity: [0.25, 0.95, 0.25], scale: [0.7, 1.5, 0.7] }}
          transition={{ duration: 3.2 + p.d * 0.35, repeat: Infinity, ease: 'easeInOut', delay: p.d }}
        />
      ))}
    </div>
  )
}

// ─── Quick Prompt Chips ───────────────────────────────────────────────────────

const QUICK_TOPICS = [
  'Algebra', 'Fizika', 'Kimyo', 'Ingliz tili', 'Tarix', 'Insho', 'Dars rejasi',
]

// ─── Home AI Input ────────────────────────────────────────────────────────────
// Navigates to AI Assistant on submit — no direct AI calls on home page.

function HomeAIInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(text); setText('') }
  }

  const hasText = text.trim().length > 0

  return (
    <div
      className="rounded-[22px] overflow-hidden transition-all duration-200"
      style={{
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: hasText
          ? '0 0 0 2px rgba(91,127,255,0.3), 0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)'
          : '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}
    >
      {/* Textarea + Send */}
      <div className="flex items-end gap-3 px-4 pt-4 pb-3">
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => { setText(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px' }}
          onKeyDown={handleKeyDown}
          placeholder="Savolingizni yozing yoki rasm/PDF yuklang…"
          rows={1}
          className="flex-1 bg-transparent text-[14px] text-white/90 placeholder:text-white/30 resize-none outline-none leading-[1.6] max-h-28 py-0.5 font-medium"
          aria-label="AI ga savol yozing"
        />
        {/* Send button */}
        <motion.button
          type="button"
          onClick={() => { onSubmit(text); setText('') }}
          whileHover={{ scale: 1.08, y: -1 }}
          whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white mb-0.5"
          style={{
            background: hasText
              ? 'linear-gradient(135deg, #5B7FFF 0%, #7C3AED 100%)'
              : 'rgba(255,255,255,0.08)',
            boxShadow: hasText ? '0 6px 20px rgba(91,127,255,0.5), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
            transition: 'background 0.2s ease, box-shadow 0.2s ease',
          }}
          aria-label="Yuborish"
        >
          <Send className="w-4 h-4" style={{ color: hasText ? 'white' : 'rgba(255,255,255,0.3)' }} aria-hidden="true" />
        </motion.button>
      </div>

      {/* Divider */}
      <div className="h-px mx-4" style={{ background: 'rgba(255,255,255,0.07)' }} />

      {/* Action buttons row */}
      <div className="flex items-center gap-0.5 px-3 py-2">
        {[
          { icon: Camera,    label: 'Kamera' },
          { icon: ImageIcon, label: 'Galereya' },
          { icon: FileIcon,  label: 'PDF' },
          { icon: Mic,       label: 'Ovoz' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            onClick={() => onSubmit('')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11.5px] font-semibold text-white/35 hover:text-white/75 hover:bg-white/[0.08] transition-all duration-150"
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-white/20 pr-1 select-none">Enter ↵</span>
      </div>
    </div>
  )
}

// ─── Section: Hero (Sprint 4.7 Phase 1 — Premium redesign with greeting) ─────
// All navigation logic preserved: navigate(PATHS.STUDENT.AI_ASSISTANT/LESSONS)
// All existing functionality: HomeAIInput, quick chips, CTA buttons

function HeroSection({ name, navigate }: { name: string; navigate: ReturnType<typeof useNavigate> }) {
  const { greeting, weekday, date } = getLiveDate()

  return (
    <div
      className="relative overflow-hidden rounded-[28px] px-6 py-8 sm:px-10 sm:py-10"
      style={{
        background: 'linear-gradient(145deg, #070B18 0%, #0C1235 30%, #130D30 60%, #090C20 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.07) inset, 0 32px 80px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Layered ambient orbs */}
      <div className="absolute pointer-events-none inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 right-12 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15"
          style={{ background: 'radial-gradient(circle, #5B7FFF 0%, transparent 60%)' }} />
        <div className="absolute -bottom-24 -left-12 w-[400px] h-[400px] rounded-full blur-[100px] opacity-12"
          style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 60%)' }} />
        <div className="absolute top-1/2 right-1/4 w-72 h-72 rounded-full blur-[80px] opacity-10"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 65%)' }} />
        {/* Grid mesh overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Noise vignette */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '160px' }} />
      </div>
      {/* Floating dots + AI icons */}
      <HeroParticles />
      <FloatingAIIcons />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_400px] gap-4 md:gap-6 lg:gap-8 items-center">

        {/* ── LEFT: Greeting + Content ──────────────────────────────────────── */}
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-4 sm:space-y-5">

          {/* Greeting block */}
          <motion.div variants={FADE_UP} className="space-y-2">
            {/* Time + weekday + date row */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold backdrop-blur-sm"
                style={{
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  color: '#86efac',
                }}
              >
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  aria-hidden="true"
                />
                Bugun {weekday}
              </div>
              <span className="text-[12px] text-white/35 font-medium tracking-wide">{date}</span>
            </div>

            {/* Greeting headline */}
            <h1 className="text-[2.2rem] sm:text-[2.6rem] font-black text-white leading-[1.08] tracking-tight">
              {greeting},
              <br />
              <span
                style={{
                  background: 'linear-gradient(120deg, #93BBFF 0%, #C4B5FD 45%, #A78BFA 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {name}
              </span>{' '}
              <span
                aria-label="qo'l silkitish"
                style={{ display: 'inline-block' }}
              >
                <motion.span
                  style={{ display: 'inline-block' }}
                  animate={{ rotate: [0, 20, -5, 20, 0] }}
                  transition={{ duration: 1.6, delay: 0.8, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                >
                  👋
                </motion.span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-[15px] text-white/45 max-w-sm leading-relaxed mt-1">
              Imtihondan qo&apos;rqmang — bugun qaysi mavzuni o&apos;rganamiz?
            </p>
          </motion.div>

          {/* AI badge */}
          <motion.div variants={FADE_UP}>
            <Badge
              variant="brand"
              dot
              pulse
              className="bg-brand/15 dark:bg-brand/15 border border-brand/25 text-brand-light"
            >
              AI sizga 24/7 yordam beradi
            </Badge>
          </motion.div>

          {/* CTA buttons (navigate logic PRESERVED) */}
          <motion.div variants={FADE_UP} className="flex flex-wrap gap-3">
            {/* Primary */}
            <motion.button
              type="button"
              onClick={() => navigate(PATHS.STUDENT.AI_ASSISTANT)}
              whileHover={{ scale: 1.04, y: -3 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="relative inline-flex items-center gap-2.5 px-7 py-[14px] rounded-[18px] text-white font-bold text-[14px] overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #5B7FFF 0%, #7C3AED 100%)',
                boxShadow: '0 8px 32px rgba(91,127,255,0.5), 0 2px 8px rgba(91,127,255,0.25), inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
            >
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: 'linear-gradient(105deg, transparent 15%, rgba(255,255,255,0.15) 50%, transparent 85%)' }}
                aria-hidden="true"
              />
              <Zap className="w-4 h-4 relative z-10" aria-hidden="true" />
              <span className="relative z-10">AI bilan suhbatni boshlash</span>
            </motion.button>

            {/* Secondary */}
            <motion.button
              type="button"
              onClick={() => navigate(PATHS.STUDENT.LESSONS)}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="group inline-flex items-center gap-2 px-6 py-[14px] rounded-[18px] text-white/60 hover:text-white/90 font-semibold text-[14px] transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.13)',
                backdropFilter: 'blur(16px)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(91,127,255,0.35)'
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(91,127,255,0.10)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.13)'
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'
              }}
            >
              Darslarim
              <motion.span
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </motion.span>
            </motion.button>
          </motion.div>

          {/* AI Input (PRESERVED — onSubmit, navigate) */}
          <motion.div variants={FADE_UP} className="max-w-lg">
            <HomeAIInput onSubmit={(text) => {
              navigate(text ? PATHS.STUDENT.AI_ASSISTANT : PATHS.STUDENT.AI_ASSISTANT)
            }} />
          </motion.div>

          {/* Quick Topics (navigate PRESERVED) */}
          <motion.div variants={FADE_UP} className="flex flex-wrap gap-2">
            {QUICK_TOPICS.map((topic, i) => (
              <motion.button
                key={topic}
                type="button"
                onClick={() => navigate(PATHS.STUDENT.AI_ASSISTANT)}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.06, duration: 0.3, ease: EASE }}
                className="px-4 py-2 rounded-full text-[12px] font-semibold transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.11)',
                  color: 'rgba(255,255,255,0.65)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.background = 'rgba(91,127,255,0.18)'
                  el.style.borderColor = 'rgba(91,127,255,0.5)'
                  el.style.color = '#93BBFF'
                  el.style.boxShadow = '0 0 16px rgba(91,127,255,0.2), inset 0 0 0 1px rgba(91,127,255,0.25)'
                  el.style.transform = 'translateY(-2px) scale(1.03)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.background = 'rgba(255,255,255,0.06)'
                  el.style.borderColor = 'rgba(255,255,255,0.11)'
                  el.style.color = 'rgba(255,255,255,0.65)'
                  el.style.boxShadow = 'none'
                  el.style.transform = 'none'
                }}
              >
                {topic}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* ── RIGHT: Premium Student Illustration ──────────────────────────── */}
        {/* hidden on mobile, visible in right column on md+ */}
        <motion.div
          className="hidden md:flex items-center justify-center lg:justify-end"
          initial={{ opacity: 0, x: 24, scale: 0.88 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.75, delay: 0.25, ease: EASE }}
        >
          {/* Tablet: scale 78%, desktop: 100% — stays inside column */}
          <div className="scale-[0.72] md:scale-[0.78] lg:scale-100 origin-center transition-transform duration-300">
          {/* Neon ring system — 4 rings + ground reflection */}
          <div className="relative flex items-center justify-center">
            {/* Outermost slow pulse ring */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ width: 360, height: 360, border: '1px solid rgba(91,127,255,0.15)' }}
              animate={{ scale: [1, 1.07, 1], opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            />
            {/* Middle ring — faster */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ width: 300, height: 300, border: '1.5px solid rgba(91,127,255,0.28)' }}
              animate={{ scale: [1, 1.05, 1], opacity: [0.65, 0.2, 0.65] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
              aria-hidden="true"
            />
            {/* Inner ring — strongest */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ width: 240, height: 240, border: '1.5px solid rgba(124,58,237,0.4)',
                boxShadow: '0 0 20px rgba(91,127,255,0.15), inset 0 0 20px rgba(91,127,255,0.08)' }}
              animate={{ scale: [1, 1.04, 1], opacity: [0.8, 0.3, 0.8] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
              aria-hidden="true"
            />
            {/* Rotating gradient ring */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ width: 270, height: 270,
                background: 'conic-gradient(from 0deg, transparent 60%, rgba(91,127,255,0.18) 70%, rgba(124,58,237,0.14) 80%, transparent 100%)',
              }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              aria-hidden="true"
            />
            {/* Core radial glow */}
            <div
              className="absolute rounded-full pointer-events-none blur-[60px]"
              style={{ width: 220, height: 220,
                background: 'radial-gradient(circle, rgba(91,127,255,0.45) 0%, rgba(124,58,237,0.25) 45%, transparent 70%)',
              }}
              aria-hidden="true"
            />
            {/* Bottom ground reflection */}
            <div
              className="absolute bottom-0 pointer-events-none blur-2xl opacity-40"
              style={{ width: 200, height: 30, transform: 'translateY(60%)',
                background: 'radial-gradient(ellipse at center, rgba(91,127,255,0.6), transparent 70%)',
              }}
              aria-hidden="true"
            />
            <StudentIllustration />
          </div>
          </div>{/* end scale wrapper */}
        </motion.div>

      </div>

      {/* Mobile: illustration below text (only on <md) */}
      <motion.div
        className="flex md:hidden items-center justify-center mt-6 -mb-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
      >
        <div className="scale-[0.72] origin-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-56 h-56 rounded-full blur-[60px] opacity-30 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #5B7FFF 0%, #7C3AED 50%, transparent 70%)' }}
              aria-hidden="true" />
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ width: 220, height: 220, border: '1px solid rgba(91,127,255,0.28)' }}
              animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.2, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            />
            <StudentIllustration />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Section: Statistics ──────────────────────────────────────────────────────

const GLOBAL_STATS = [
  { emoji: '✔', value: '15 000+', label: 'Yechilgan savollar',         color: '#22C55E' },
  { emoji: '✔', value: '98%',     label: 'Aniqlik darajasi',           color: '#6366F1' },
  { emoji: '✔', value: '24/7',    label: 'AI mavjud',                  color: '#F59E0B' },
  { emoji: '✔', value: '3',       label: "Qo'llab-quvvatlanadigan tillar", color: '#3B82F6' },
]

function StatsSection() {
  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      variants={STAGGER_FAST}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
    >
      {GLOBAL_STATS.map(s => (
        <motion.div
          key={s.label}
          variants={FADE_UP}
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="rounded-[22px] p-5 cursor-default relative overflow-hidden group"
          style={{ ...GLASS_ELEVATED, borderColor: `${s.color}18` }}
        >
          {/* Hover glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[22px] pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 50% 0%, ${s.color}0C, transparent 65%)` }}
            aria-hidden="true"
          />
          {/* Icon */}
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center mb-4 relative z-10"
            style={{ background: `${s.color}15`, border: `1px solid ${s.color}28`, boxShadow: `0 0 16px ${s.color}15` }}
          >
            <CheckCircle className="w-4.5 h-4.5" style={{ color: s.color, width: 18, height: 18 }} aria-hidden="true" />
          </div>
          {/* Value */}
          <div
            className="text-[2rem] font-black leading-none mb-2 tracking-tight relative z-10"
            style={{ color: s.color }}
          >
            {s.value}
          </div>
          <p className="text-[11.5px] text-white/45 font-medium leading-snug relative z-10">{s.label}</p>
          {/* Accent line */}
          <motion.div
            className="absolute bottom-0 inset-x-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, ${s.color}70, ${s.color}20, transparent)` }}
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}

// ─── Section: Weak Topics ─────────────────────────────────────────────────────

function WeakTopicsCard({ avgPct, loading }: { avgPct: number; loading: boolean }) {
  const topics = getWeakTopics(avgPct)
  const show   = topics.length > 0

  return (
    <div
      className="rounded-[24px] p-5 border h-full"
      style={{
        ...GLASS_ELEVATED, borderColor: undefined,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
          <TrendingUp className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
        </div>
        <h3 className="text-[13px] font-bold text-white/80">Zaif tomonlar</h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 rounded-lg bg-white/[0.06] animate-pulse w-4/5" />
              <div className="h-1.5 rounded-full bg-white/[0.04] animate-pulse" />
            </div>
          ))}
        </div>
      ) : !show ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-white/70">Zo&apos;r! Zaif tomonlar yo&apos;q</p>
          <p className="text-[11px] text-white/35 mt-1">Barcha mavzular yaxshi o&apos;zlashtirilgan</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topics.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, ease: EASE, duration: 0.4 }}
            >
              <div className="flex justify-between mb-1.5 text-[12px]">
                <span className="text-white/70 font-medium">{t.name}</span>
                <span className="font-bold" style={{ color: t.pct < 55 ? '#EF4444' : '#F59E0B' }}>
                  {t.pct}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: t.pct < 55 ? 'linear-gradient(90deg,#EF4444,#F97316)' : 'linear-gradient(90deg,#F59E0B,#FBBF24)' }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${t.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.3, ease: EASE, delay: 0.2 + i * 0.1 }}
                />
              </div>
            </motion.div>
          ))}
          <p className="text-[11px] text-white/30 pt-1">AI bilan bu mavzularni mustahkamla</p>
        </div>
      )}
    </div>
  )
}

// ─── Section: Courses ─────────────────────────────────────────────────────────

function CoursesCard({
  groups, loading, navigate,
}: { groups: SDGroup[]; loading: boolean; navigate: ReturnType<typeof useNavigate> }) {
  const active = groups.filter(g => g.status === 'active').slice(0, 3)

  return (
    <div
      className="rounded-[24px] p-5 border h-full"
      style={{
        ...GLASS_ELEVATED, borderColor: undefined,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand/15 border border-brand/20 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-brand-light" aria-hidden="true" />
          </div>
          <h3 className="text-[13px] font-bold text-white/80">Faol kurslar</h3>
        </div>
        <button
          type="button"
          onClick={() => navigate(PATHS.STUDENT.LESSONS)}
          className="text-[11px] font-semibold text-brand-light/70 hover:text-brand-light transition-colors flex items-center gap-0.5"
        >
          Barchasi <ChevronRight className="w-3 h-3" aria-hidden="true" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-14 rounded-2xl bg-white/[0.04] animate-pulse" />)}
        </div>
      ) : active.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <BookOpen className="w-8 h-8 text-white/20 mb-2" aria-hidden="true" />
          <p className="text-sm text-white/40">Hali faol kurs yo&apos;q</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {active.map(course => {
            const pct = course.att_total > 0 ? Math.round((course.att_present/course.att_total)*100) : null
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => navigate(PATHS.STUDENT.LESSONS)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150 hover:bg-white/[0.05] group"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {course.subject?.icon ?? '📚'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-white/80 truncate">{course.name}</p>
                  {pct !== null && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-white/[0.08] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${pct}%`, background: getAttColor(pct) }} />
                      </div>
                      <span className="text-[10px] font-bold flex-shrink-0" style={{ color: getAttColor(pct) }}>{pct}%</span>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Section: Recent Activity ─────────────────────────────────────────────────

function RecentActivityCard({ tests, loading }: { tests: SDTest[]; loading: boolean }) {
  const recent = tests.slice(0, 5)

  return (
    <div
      className="rounded-[24px] border overflow-hidden"
      style={{
        ...GLASS_ELEVATED, borderColor: undefined,
      }}
    >
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
          <Clock className="w-3.5 h-3.5 text-violet-400" aria-hidden="true" />
        </div>
        <h3 className="text-[13px] font-bold text-white/80">So&apos;nggi faollik</h3>
      </div>

      {loading ? (
        <div className="p-5 space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-10 rounded-xl bg-white/[0.04] animate-pulse" />)}
        </div>
      ) : recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center px-5">
          <Clock className="w-7 h-7 text-white/20 mb-2" aria-hidden="true" />
          <p className="text-sm text-white/35">Hali faollik yo&apos;q</p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.05]">
          {recent.map((t, i) => {
            const pct    = t.total > 0 ? Math.round((t.score/t.total)*100) : 0
            const passed = pct >= 60
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, ease: EASE, duration: 0.3 }}
                className="flex items-center gap-3.5 px-5 py-3.5"
              >
                {/* Score badge */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
                  style={{ background: passed ? 'linear-gradient(135deg,#16A34A,#22C55E)' : 'linear-gradient(135deg,#DC2626,#EF4444)' }}
                  aria-label={`${pct}%`}
                >
                  {pct}%
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-white/75 truncate">{t.title}</p>
                  <p className="text-[11px] text-white/35 mt-0.5">{t.group_name} · {fmtDate(t.submitted_at)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[12px] font-bold text-white/60">{t.score}/{t.total}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Section: Score Progress ──────────────────────────────────────────────────

function ScoreCard({ snapshot, loading, attPct }: { snapshot: ScoreSnapshot | null; loading: boolean; attPct: number | null }) {
  if (loading) return (
    <div className="rounded-[24px] h-full p-5 border border-white/[0.07]"
         style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      <div className="h-4 w-24 bg-white/[0.06] rounded-lg animate-pulse mb-4" />
      <div className="flex items-center justify-center py-4">
        <div className="w-20 h-20 rounded-full bg-white/[0.05] animate-pulse" />
      </div>
    </div>
  )

  const mastery = attPct !== null
    ? Math.round((attPct * 0.4) + (snapshot?.total_score ? snapshot.total_score * 0.6 : 40))
    : 45
  const masteryColor = mastery >= 80 ? '#22C55E' : mastery >= 60 ? '#6366F1' : '#F59E0B'

  return (
    <div
      className="rounded-[24px] p-5 border h-full"
      style={{
        ...GLASS_ELEVATED, borderColor: undefined,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-brand/15 border border-brand/20 flex items-center justify-center">
          <Star className="w-3.5 h-3.5 text-brand-light" aria-hidden="true" />
        </div>
        <h3 className="text-[13px] font-bold text-white/80">O&apos;zlashtirish</h3>
      </div>

      <div className="flex items-center gap-4">
        <ProgressRing value={mastery} size={72} strokeWidth={6} color={masteryColor} animDelay={0.4} />
        <div className="space-y-2 flex-1">
          {[
            { label: 'Davomat',  value: attPct ?? 0,               color: '#22C55E' },
            { label: 'Testlar',  value: snapshot?.test_score ?? 0,  color: '#6366F1' },
            { label: 'Faollik',  value: snapshot?.activity_score ?? 0, color: '#F59E0B' },
          ].map(s => (
            <div key={s.label}>
              <div className="flex justify-between mb-1">
                <span className="text-[11px] text-white/45">{s.label}</span>
                <span className="text-[11px] font-bold" style={{ color: s.color }}>{s.value}%</span>
              </div>
              <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: s.color }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${s.value}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Section: Coming Soon ─────────────────────────────────────────────────────

const COMING_SOON = [
  { icon: '🤖', name: 'Universal AI',        desc: 'Har turdagi savollar uchun'   },
  { icon: '👁',  name: 'AI Vision',           desc: "Rasm va PDF tahlil qilish"     },
  { icon: '📝', name: 'Smart Test Generator', desc: 'AI yordamida test yaratish'   },
]

function ComingSoonCard() {
  return (
    <div
      className="rounded-[24px] p-5 border h-full"
      style={{
        ...GLASS_ELEVATED, borderColor: undefined,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
          <Lock className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
        </div>
        <h3 className="text-[13px] font-bold text-white/80">Yaqinda qo&apos;shiladi</h3>
      </div>

      <div className="space-y-3">
        {COMING_SOON.map((f, i) => (
          <motion.div
            key={f.name}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, ease: EASE, duration: 0.35 }}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="text-xl flex-shrink-0" aria-hidden="true">{f.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold text-white/70">{f.name}</p>
              <p className="text-[11px] text-white/35">{f.desc}</p>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              Tez orada
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── Section: Premium Banner ──────────────────────────────────────────────────

function PremiumBanner({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-[28px] px-8 py-10 text-center"
      style={{
        background: 'linear-gradient(135deg, #4338CA 0%, #5B5CF6 35%, #7C3AED 70%, #6D28D9 100%)',
        boxShadow: '0 16px 48px rgba(91,92,246,0.35), 0 4px 16px rgba(91,92,246,0.2)',
      }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {/* Decorative orbs */}
      <div className="absolute pointer-events-none" aria-hidden="true">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-black/20 blur-3xl" />
      </div>

      <div className="relative z-10">
        <Trophy className="w-8 h-8 text-white/80 mx-auto mb-3" aria-hidden="true" />
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
          Bilimingizni yangi bosqichga olib chiqing.
        </h2>
        <p className="text-white/65 mb-6 max-w-md mx-auto text-sm leading-relaxed">
          AI o&apos;qituvchi bilan istalgan mavzuni o&apos;rganing, testlarda muvaffaqiyat qozonin!
        </p>
        <motion.button
          type="button"
          onClick={() => navigate(PATHS.STUDENT.AI_ASSISTANT)}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[18px] bg-white text-brand font-bold text-[14px] transition-all hover:bg-white/90"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
        >
          <Zap className="w-4 h-4" aria-hidden="true" />
          AI bilan boshlash
        </motion.button>
      </div>
    </motion.div>
  )
}

// ═══════════════════════ SPRINT 4.7: NEW VISUAL-ONLY COMPONENTS ═══════════════

// ─── Quick Actions Bar ────────────────────────────────────────────────────────

const QUICK_NAV_ITEMS = [
  { icon: BookOpen,   label: 'Darslar',   color: '#6366F1', path: PATHS.STUDENT.LESSONS      },
  { icon: Zap,        label: 'AI Yordam', color: '#8B5CF6', path: PATHS.STUDENT.AI_ASSISTANT  },
  { icon: FileIcon,   label: 'Testlar',   color: '#22C55E', path: PATHS.STUDENT.TESTS         },
  { icon: Camera,     label: 'AI Vision', color: '#3B82F6', path: PATHS.STUDENT.AI_VISION     },
  { icon: Trophy,     label: 'Yutuqlar',  color: '#F59E0B', path: PATHS.STUDENT.ACHIEVEMENTS  },
  { icon: Clock,      label: 'Davomat',   color: '#14B8A6', path: PATHS.STUDENT.ATTENDANCE    },
  { icon: BarChart3,  label: 'Natijalar', color: '#EC4899', path: PATHS.STUDENT.ACHIEVEMENTS  },
  { icon: Star,       label: 'Profil',    color: '#A78BFA', path: PATHS.STUDENT.PROFILE       },
] as const

function QuickActionsBar({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
      className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
      aria-label="Tez harakat menyusi"
    >
      {QUICK_NAV_ITEMS.map(({ icon: Icon, label, color, path }, i) => (
        <motion.button
          key={label}
          type="button"
          onClick={() => navigate(path)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.04, duration: 0.3, ease: EASE }}
          whileHover={{ y: -2, scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-[18px] flex-shrink-0 min-w-[68px] transition-all duration-150"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}15`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}30` }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)' }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `${color}18`, border: `1px solid ${color}25` }}
          >
            <Icon className="w-4 h-4" style={{ color }} aria-hidden="true" />
          </div>
          <span className="text-[10.5px] font-semibold text-white/45 whitespace-nowrap">{label}</span>
        </motion.button>
      ))}
    </motion.div>
  )
}

// ─── Personal Stats Row ───────────────────────────────────────────────────────

const PersonalStatsRow = memo(function PersonalStatsRow({
  groups, tests, avgScore, attPct, loading,
}: {
  groups: SDGroup[]; tests: SDTest[]; avgScore: number
  attPct: number | null; loading: boolean
}) {
  const activeCount = groups.filter(g => g.status === 'active').length
  const stats = [
    { icon: BookOpen, label: 'Faol kurslar',    numericVal: activeCount,             suffix: '',  color: '#5B7FFF', sub: `${groups.length} ta jami`   },
    { icon: FileIcon, label: 'Test topshirildi', numericVal: tests.length,            suffix: '',  color: '#22C55E', sub: 'umumiy'                      },
    { icon: Award,    label: "O'rtacha ball",    numericVal: avgScore,                suffix: '%', color: '#F59E0B', sub: "testlar bo'yicha"             },
    { icon: Users,    label: 'Davomat',          numericVal: attPct ?? 0,             suffix: attPct !== null ? '%' : '', color: '#14B8A6', sub: "darslarning" },
  ]

  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      variants={STAGGER_FAST} initial="hidden"
      whileInView="show" viewport={{ once: true, amount: 0.3 }}
    >
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          variants={FADE_UP}
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="rounded-[22px] p-5 relative overflow-hidden group"
          style={{
            ...GLASS_ELEVATED,
            border: `1px solid ${s.color}20`,
            boxShadow: `0 6px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)`,
          }}
        >
          {/* Hover glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[22px]"
            style={{ background: `radial-gradient(ellipse at 20% 20%, ${s.color}12, transparent 60%)` }}
            aria-hidden="true"
          />
          {/* Corner glow orb */}
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-25 pointer-events-none"
            style={{ background: s.color }} aria-hidden="true" />

          <div className="relative z-10">
            {/* Icon */}
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: `${s.color}18`, border: `1px solid ${s.color}28`, boxShadow: `0 0 16px ${s.color}18` }}
            >
              <s.icon className="w-5 h-5" style={{ color: s.color, width: 18, height: 18 }} aria-hidden="true" />
            </div>
            {/* Animated number */}
            <div className="text-[2rem] font-black leading-none mb-1.5" style={{ color: s.color }}>
              {loading ? (
                <span className="text-white/20">—</span>
              ) : (s.numericVal === 0 && s.suffix === '' && attPct === null && s.label === 'Davomat') ? (
                <span className="text-white/20">—</span>
              ) : (
                <AnimatedCounter target={s.numericVal} suffix={s.suffix} />
              )}
            </div>
            <p className="text-[12px] font-bold text-white/65 leading-tight">{s.label}</p>
            <p className="text-[10.5px] text-white/28 mt-0.5">{s.sub}</p>
          </div>
          {/* Bottom accent */}
          <motion.div
            className="absolute bottom-0 inset-x-0 h-[2.5px]"
            style={{ background: `linear-gradient(90deg, ${s.color}80, ${s.color}20, transparent)` }}
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 + i * 0.07, duration: 0.9, ease: EASE }}
          />
        </motion.div>
      ))}
    </motion.div>
  )
})

// ─── Continue Learning Card ───────────────────────────────────────────────────

function ContinueLearningCard({
  groups, loading, navigate,
}: { groups: SDGroup[]; loading: boolean; navigate: ReturnType<typeof useNavigate> }) {
  const course = groups.find(g => g.status === 'active')

  if (loading) return (
    <div className="rounded-[24px] p-5 border border-white/[0.07] animate-pulse"
      style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="h-5 w-36 bg-white/[0.06] rounded-lg mb-4" />
      <div className="h-16 bg-white/[0.04] rounded-2xl" />
    </div>
  )

  if (!course) return null

  const pct = course.att_total > 0 ? Math.round((course.att_present / course.att_total) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: EASE }}
      className="relative overflow-hidden rounded-[28px] px-6 py-6 sm:px-8 sm:py-7"
      style={{
        background: 'linear-gradient(145deg, #0E122A 0%, #15193A 50%, #10162E 100%)',
        border: '1px solid rgba(99,102,241,0.2)',
        boxShadow: '0 8px 32px rgba(91,92,246,0.18), 0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Bg glow */}
      <div className="absolute -top-12 right-12 w-56 h-56 rounded-full blur-[56px] opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle,#6366F1,transparent)' }} aria-hidden="true" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Course icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-lg"
          style={{
            background: course.subject
              ? course.subject.color + '25'
              : 'rgba(99,102,241,0.2)',
            border: `2px solid ${course.subject?.color ?? '#6366F1'}35`,
          }}
        >
          {course.subject?.icon ?? '📚'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10.5px] font-bold text-brand-light/60 uppercase tracking-widest mb-1">
            O&apos;qishni davom ettiring
          </p>
          <h3 className="text-[16px] font-black text-white/85 truncate leading-tight">{course.name}</h3>
          {course.subject && (
            <p className="text-[12px] font-medium mt-0.5" style={{ color: course.subject.color }}>
              {course.subject.name}
            </p>
          )}
          {course.teacher_name && (
            <p className="text-[11px] text-white/30 mt-0.5">{course.teacher_name} · {course.lesson_count} ta dars</p>
          )}

          {/* Progress */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,#5B5CF6,#7C3AED)' }}
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
              />
            </div>
            <span className="text-[11px] font-bold text-brand-light/70 flex-shrink-0">{pct}%</span>
          </div>
        </div>

        {/* CTA */}
        <motion.button
          type="button"
          onClick={() => navigate(PATHS.STUDENT.LESSONS)}
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-[16px] text-white text-[13px] font-bold transition-opacity hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg,#5B5CF6,#7C3AED)',
            boxShadow: '0 6px 20px rgba(91,92,246,0.4)',
          }}
        >
          Davom etish
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Achievements Showcase ────────────────────────────────────────────────────

const TIER_STYLE: Record<string, { bg: string; border: string; label: string; labelColor: string }> = {
  gold:    { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)',  label: 'Gold',    labelColor: '#FCD34D' },
  silver:  { bg: 'rgba(156,163,175,0.15)',border: 'rgba(156,163,175,0.3)', label: 'Silver',  labelColor: '#D1D5DB' },
  bronze:  { bg: 'rgba(180,83,9,0.15)',   border: 'rgba(180,83,9,0.3)',    label: 'Bronze',  labelColor: '#D97706' },
  special: { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.35)', label: 'Special', labelColor: '#C4B5FD' },
}

const LOCKED_BADGES = [
  { emoji: '🏆', name: 'Test chempioni',  desc: '10 ta testdan 80%+', tier: 'gold'    },
  { emoji: '🔥', name: 'Ketma-ket faol',  desc: '7 kun ketma-ket',    tier: 'silver'  },
  { emoji: '⭐', name: 'A\'lo talaba',    desc: 'Barcha testlar 90%+', tier: 'special' },
  { emoji: '💎', name: 'Bilim ustozi',    desc: '50 ta dars tugallash',tier: 'bronze'  },
]

function AchievementsShowcase({
  achievements, loading,
}: { achievements: EarnedAchievement[]; loading: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, ease: EASE }}
      className="rounded-[24px] p-5 border"
      style={{
        ...GLASS_ELEVATED, borderColor: undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
            <Award className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
          </div>
          <h3 className="text-[13px] font-bold text-white/80">Yutuqlar</h3>
        </div>
        {achievements.length > 0 && (
          <button
            type="button"
            className="text-[11px] font-semibold text-brand-light/60 hover:text-brand-light transition-colors flex items-center gap-0.5"
          >
            Barchasi <ChevronRight className="w-3 h-3" aria-hidden="true" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Earned achievements */}
          {achievements.slice(0,4).map((a, i) => {
            const tier = a.def?.tier ?? 'bronze'
            const ts   = TIER_STYLE[tier]
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.35, ease: EASE }}
                whileHover={{ y: -3, scale: 1.03 }}
                className="flex flex-col items-center gap-2 p-3 rounded-[18px] text-center"
                style={{ background: ts.bg, border: `1px solid ${ts.border}` }}
              >
                <span className="text-3xl" aria-hidden="true">{a.def?.icon_emoji ?? '🏅'}</span>
                <div>
                  <p className="text-[11px] font-bold text-white/75 leading-tight">
                    {a.def?.name?.uz ?? 'Yutuq'}
                  </p>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block"
                    style={{ background: `${ts.border}`, color: ts.labelColor }}
                  >
                    {ts.label}
                  </span>
                </div>
              </motion.div>
            )
          })}

          {/* Locked badge placeholders */}
          {LOCKED_BADGES.slice(0, Math.max(0, 4 - achievements.slice(0,4).length)).map((b, i) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: (achievements.slice(0,4).length + i) * 0.08, duration: 0.35, ease: EASE }}
                className="flex flex-col items-center gap-2 p-3 rounded-[18px] text-center opacity-35"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="relative">
                  <span className="text-3xl grayscale" aria-hidden="true">{b.emoji}</span>
                  <Lock className="absolute -bottom-1 -right-1 w-3.5 h-3.5 text-white/50" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white/40 leading-tight">{b.name}</p>
                  <p className="text-[9px] text-white/25 mt-0.5">{b.desc}</p>
                </div>
              </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ─── Dashboard Sidebar ────────────────────────────────────────────────────────

const MOTIVATION_QUOTES = [
  { text: "Bilim — eng kuchli qurol.", author: "Nelson Mandela" },
  { text: "Har kuni bir qadam oldinga.",author: "YordamchiAI" },
  { text: "Muvaffaqiyat odatdan tug'iladi.", author: "Aristotel" },
]

function DashboardSidebar({
  tests, groups, attPct, navigate,
}: {
  tests: SDTest[]; groups: SDGroup[]
  attPct: number | null; navigate: ReturnType<typeof useNavigate>
}) {
  // Visual-only streak calculation from test submission dates
  const streak = (() => {
    if (!tests.length) return 0
    const dates = [...new Set(tests.map(t => new Date(t.submitted_at).toDateString()))].sort()
    let s = 1
    const today     = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    if (dates[dates.length - 1] !== today && dates[dates.length - 1] !== yesterday) return 0
    for (let i = dates.length - 1; i > 0; i--) {
      const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000
      if (Math.round(diff) === 1) s++
      else break
    }
    return s
  })()

  const quote = MOTIVATION_QUOTES[new Date().getDate() % MOTIVATION_QUOTES.length]
  const activeCount = groups.filter(g => g.status === 'active').length
  const goalPct = Math.min(100, tests.length * 10) // visual goal metric

  const glassCard = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
  } as const

  return (
    <div className="space-y-3">

      {/* Daily Goal */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: EASE }}
        className="p-4"
        style={glassCard}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-xl bg-brand/15 border border-brand/20 flex items-center justify-center">
            <Target className="w-3.5 h-3.5 text-brand-light" aria-hidden="true" />
          </div>
          <p className="text-[12.5px] font-bold text-white/75">Kunlik maqsad</p>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <ProgressRing value={goalPct} size={52} strokeWidth={5} color="#6366F1" animDelay={0.3} />
          <div>
            <p className="text-lg font-black text-white/80">{goalPct}%</p>
            <p className="text-[11px] text-white/35">bajarildi</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {[
            { label: 'Testlar',  done: tests.length > 0,      val: `${tests.length}/10`  },
            { label: 'Kurslar',  done: activeCount > 0,        val: `${activeCount} ta`   },
            { label: 'Davomat',  done: (attPct ?? 0) >= 80,    val: attPct ? `${attPct}%` : '—' },
          ].map(g => (
            <div key={g.label} className="flex items-center justify-between text-[11px]">
              <span className="text-white/35">{g.label}</span>
              <span className={g.done ? 'text-emerald-400 font-bold' : 'text-white/30'}>{g.val}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Study Streak */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.08 }}
        className="p-4"
        style={glassCard}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-orange-400" aria-hidden="true" />
          </div>
          <p className="text-[12.5px] font-bold text-white/75">Faollik zanjiri</p>
        </div>
        <div className="flex items-end gap-2 mb-3">
          <motion.span
            className="text-4xl font-black text-orange-400 leading-none"
            initial={{ scale: 0.5, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.15 }}
          >
            {streak}
          </motion.span>
          <span className="text-[13px] text-white/40 mb-1">kun</span>
        </div>
        {/* Week dots */}
        <div className="flex items-center gap-1.5">
          {['D','S','Ch','P','J','Sh','Y'].map((d, i) => {
            const active = i < (streak % 7)
            return (
              <div key={d} className="flex flex-col items-center gap-1">
                <div
                  className="w-5 h-5 rounded-lg transition-all"
                  style={active
                    ? { background: 'linear-gradient(135deg,#F97316,#EF4444)', boxShadow: '0 2px 8px rgba(249,115,22,0.4)' }
                    : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                />
                <span className="text-[8px] text-white/25">{d}</span>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Mini Leaderboard */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.16 }}
        className="p-4"
        style={glassCard}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
          </div>
          <p className="text-[12.5px] font-bold text-white/75">Guruh natijalar</p>
        </div>
        <div className="space-y-2">
          {['1st', '2nd', '3rd'].map((rank, i) => {
            const medals = ['🥇','🥈','🥉']
            const colors = ['#FCD34D','#D1D5DB','#D97706']
            const pcts   = [92, 84, 78]
            return (
              <div key={rank} className="flex items-center gap-2.5">
                <span className="text-base" aria-hidden="true">{medals[i]}</span>
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  {rank[0]}
                </div>
                <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: colors[i] }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pcts[i]}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.2 + i * 0.1 }}
                  />
                </div>
                <span className="text-[10px] font-bold text-white/40 w-8 text-right">{pcts[i]}%</span>
              </div>
            )
          })}
        </div>
        <p className="text-[10px] text-white/20 mt-2.5 text-center">Vizual namuna · Sprint 4.8 da real ma&apos;lumotlar</p>
      </motion.div>

      {/* Notifications (visual-only) */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.24 }}
        className="p-4"
        style={glassCard}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-violet-400" aria-hidden="true" />
            </div>
            <p className="text-[12.5px] font-bold text-white/75">Bildirishnomalar</p>
          </div>
          <span
            className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(139,92,246,0.25)', color: '#C4B5FD' }}
          >
            Yangi
          </span>
        </div>
        <div className="space-y-2">
          {[
            { icon: '📚', text: "Yangi dars qo'shildi",         time: 'Hozir',   dot: true  },
            { icon: '✅', text: 'Testlar baholandi',             time: '2s oldin', dot: false },
            { icon: '🏆', text: "Yutuq olish chegarasiga yetdingiz", time: '1k oldin', dot: false },
          ].map((n, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.07, duration: 0.3, ease: EASE }}
              className="flex items-start gap-2.5 p-2.5 rounded-xl transition-all hover:bg-white/[0.04]"
            >
              <span className="text-sm flex-shrink-0 mt-0.5" aria-hidden="true">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11.5px] font-medium text-white/65 leading-snug">{n.text}</p>
                <p className="text-[9.5px] text-white/25 mt-0.5">{n.time}</p>
              </div>
              {n.dot && <span className="w-1.5 h-1.5 rounded-full bg-brand-light flex-shrink-0 mt-1.5" aria-hidden="true" />}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Motivation card */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.32 }}
        className="relative overflow-hidden p-4"
        style={{
          background: 'linear-gradient(135deg,#1E1B4B 0%,#2D1B69 50%,#1A1035 100%)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: '20px',
        }}
      >
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-brand/20 blur-2xl pointer-events-none" aria-hidden="true" />
        <Zap className="w-5 h-5 text-brand-light mb-2" aria-hidden="true" />
        <p className="text-[13px] font-bold text-white/85 leading-snug mb-1">
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="text-[10px] text-white/35">— {quote.author}</p>
        <motion.button
          type="button"
          onClick={() => navigate(PATHS.STUDENT.AI_ASSISTANT)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="mt-3 w-full py-2 text-[12px] font-bold text-brand-light/80 hover:text-brand-light rounded-xl transition-colors"
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}
        >
          AI bilan boshlash →
        </motion.button>
      </motion.div>

      {/* Quick downloads row */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.4 }}
        className="grid grid-cols-2 gap-2"
      >
        {[
          { icon: Download, label: 'Materiallar', path: PATHS.STUDENT.LESSONS,  color: '#6366F1' },
          { icon: Star,     label: 'Sertifikatlar', path: PATHS.STUDENT.ACHIEVEMENTS, color: '#F59E0B' },
        ].map(({ icon: Icon, label, path, color }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-[16px] transition-all hover:bg-white/[0.06]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <Icon className="w-4 h-4" style={{ color }} aria-hidden="true" />
            <span className="text-[10.5px] font-semibold text-white/40">{label}</span>
          </button>
        ))}
      </motion.div>

    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Page — ALL DATA FETCHING LOGIC PRESERVED UNCHANGED
// ═════════════════════════════════════════════════════════════════════════════

export default function StudentDashboardPage() {
  const auth             = useAuth()
  const { language: _language } = useLanguage()
  const navigate         = useNavigate()
  const [loading, setLoading] = useState(true)

  const [groups,       setGroups]       = useState<SDGroup[]>([])
  const [tests,        setTests]        = useState<SDTest[]>([])
  const [attStats,     setAttStats]     = useState<{
    present: number; absent: number; late: number; excused: number; total: number
  } | null>(null)
  const [_achievements, setAchievements] = useState<EarnedAchievement[]>([])
  const [snapshots,    setSnapshots]    = useState<ScoreSnapshot[]>([])

  useEffect(() => {
    if (!auth.user?.id) return
    void load()
  }, [auth.user?.id])

  async function load() {
    if (!auth.user?.id) return
    setLoading(true)
    try {
      const { data: enrollments } = await supabase
        .from('student_groups')
        .select('group_id, enrolled_at')
        .eq('student_id', auth.user.id)
        .order('enrolled_at', { ascending: false })

      if (!enrollments?.length) { setLoading(false); return }

      const groupIds = enrollments.map(e => e.group_id)

      const [groupsRes, testRes, attRes, lessonsRes, achieveRes, snapshotRes] = await Promise.all([
        supabase.from('groups').select('id,name,status,teacher_id,subject:subjects(name,icon,color)').in('id', groupIds),
        supabase.from('test_results').select('id,test_id,score,total_questions,submitted_at,test:tests(title,group:groups(name))').eq('student_id', auth.user.id).not('submitted_at', 'is', null).order('submitted_at', { ascending: false }),
        supabase.from('attendance').select('status,group_id').eq('student_id', auth.user.id).in('group_id', groupIds),
        supabase.from('lessons').select('group_id').in('group_id', groupIds).eq('is_published', true),
        supabase.from('user_achievements').select('id,total_score,period_year,period_month,period_type,earned_at,group_id,achievement_definitions(code,name,description,tier,icon_emoji),groups(name)').eq('user_id', auth.user.id).order('earned_at', { ascending: false }).limit(20),
        supabase.from('user_score_snapshots').select('id,total_score,attendance_score,test_score,consistency_score,activity_score,period_year,period_month,group_id,groups(name)').eq('user_id', auth.user.id).eq('role', 'student').eq('period_type', 'monthly').order('period_year', { ascending: false }).order('period_month', { ascending: false }).limit(6),
      ])

      const teacherIds = [...new Set((groupsRes.data ?? []).map((g: any) => g.teacher_id).filter(Boolean))]
      const { data: teachersData } = teacherIds.length
        ? await supabase.from('profiles').select('id,full_name').in('id', teacherIds)
        : { data: [] }

      const groupMap   = new Map((groupsRes.data ?? []).map((g: any) => [g.id, g]))
      const teacherMap = new Map((teachersData ?? []).map((t: any) => [t.id, t]))
      const lessonCountMap = new Map<string, number>()
      for (const l of lessonsRes.data ?? []) { const gid = (l as any).group_id; lessonCountMap.set(gid, (lessonCountMap.get(gid) ?? 0) + 1) }
      const grpAttMap = new Map<string, { present: number; total: number }>()
      for (const a of attRes.data ?? []) {
        const gid = (a as any).group_id
        if (!grpAttMap.has(gid)) grpAttMap.set(gid, { present: 0, total: 0 })
        const entry = grpAttMap.get(gid)!
        entry.total++
        if ((a as any).status === 'present') entry.present++
      }

      setGroups(enrollments.map(e => {
        const g = groupMap.get(e.group_id)
        if (!g) return null
        const teacher = g.teacher_id ? teacherMap.get(g.teacher_id) : null
        const att     = grpAttMap.get(g.id) ?? { present: 0, total: 0 }
        return { id: g.id, name: g.name, status: g.status, subject: (g as any).subject ?? null, teacher_name: teacher?.full_name ?? null, lesson_count: lessonCountMap.get(g.id) ?? 0, enrolled_at: e.enrolled_at, att_present: att.present, att_total: att.total }
      }).filter(Boolean) as SDGroup[])

      setTests((testRes.data ?? []).map((r: any) => ({ id: r.id, test_id: r.test_id, title: r.test?.title ?? 'Test', group_name: r.test?.group?.name ?? '—', score: r.score, total: r.total_questions, submitted_at: r.submitted_at })))

      const attTotals = { present: 0, absent: 0, late: 0, excused: 0, total: 0 }
      for (const a of attRes.data ?? []) {
        attTotals.total++
        const s = (a as any).status as 'present' | 'absent' | 'late' | 'excused'
        if (['present','absent','late','excused'].includes(s)) attTotals[s]++
      }
      setAttStats(attTotals)

      setAchievements((achieveRes.data ?? []).map((r: any) => ({ id: r.id, total_score: r.total_score, period_year: r.period_year, period_month: r.period_month, period_type: r.period_type, earned_at: r.earned_at, group_id: r.group_id, group_name: r.groups?.name ?? null, def: r.achievement_definitions ?? null })))
      setSnapshots((snapshotRes.data ?? []).map((r: any) => ({ id: r.id, total_score: r.total_score, attendance_score: r.attendance_score, test_score: r.test_score, consistency_score: r.consistency_score, activity_score: r.activity_score, period_year: r.period_year, period_month: r.period_month, group_name: r.groups?.name ?? null })))
    } catch (e) {
      console.error('[StudentDashboard] load error:', e)
    } finally {
      setLoading(false)
    }
  }

  // ── Computed values (UNCHANGED) ───────────────────────────────────────────
  const totalTests  = tests.length
  const avgScore    = totalTests > 0
    ? Math.round(tests.reduce((a, r) => a + (r.total > 0 ? (r.score / r.total) * 100 : 0), 0) / totalTests)
    : 0
  void tests.filter(r => r.total > 0 && r.score / r.total >= 0.6).length // preserved for future use
  const attPct      = attStats && attStats.total > 0
    ? Math.round((attStats.present / attStats.total) * 100)
    : null
  const latestSnap  = snapshots[0] ?? null
  const userName    = auth.user?.name ?? 'Talaba'

  // ── Render (Sprint 4.7: enhanced layout with sidebar) ─────────────────────
  return (
    <div className="space-y-4 pb-8">

      {/* 1. Hero (PRESERVED) */}
      <HeroSection name={userName} navigate={navigate} />

      {/* 2. Sprint 4.7: Quick Actions Bar */}
      <QuickActionsBar navigate={navigate} />

      {/* 3. Sprint 4.7: Personal Stats (real data from existing state) */}
      <PersonalStatsRow
        groups={groups} tests={tests}
        avgScore={avgScore} attPct={attPct} loading={loading}
      />

      {/* 4. Main content + sidebar grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_272px] gap-4 items-start">

        {/* ── Main column ── */}
        <div className="space-y-4 min-w-0">

          {/* Global stats (PRESERVED) */}
          <StatsSection />

          {/* Content grid (PRESERVED — exactly as Sprint 4.2) */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            variants={STAGGER}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
          >
            <motion.div variants={FADE_UP}>
              <WeakTopicsCard avgPct={avgScore} loading={loading} />
            </motion.div>
            <motion.div variants={FADE_UP}>
              <CoursesCard groups={groups} loading={loading} navigate={navigate} />
            </motion.div>
            <motion.div variants={FADE_UP} className="md:col-span-2 xl:col-span-1">
              <ScoreCard snapshot={latestSnap} loading={loading} attPct={attPct} />
            </motion.div>
            <motion.div variants={FADE_UP} className="md:col-span-2 xl:col-span-2">
              <RecentActivityCard tests={tests} loading={loading} />
            </motion.div>
            <motion.div variants={FADE_UP}>
              <ComingSoonCard />
            </motion.div>
          </motion.div>

          {/* Sprint 4.7: Continue Learning Card */}
          <ContinueLearningCard groups={groups} loading={loading} navigate={navigate} />

          {/* Sprint 4.7: Achievements Showcase (uses existing _achievements state) */}
          <AchievementsShowcase achievements={_achievements} loading={loading} />

          {/* Premium Banner (PRESERVED) */}
          <PremiumBanner navigate={navigate} />
        </div>

        {/* ── Sidebar column (hidden on mobile, visible on xl+) ── */}
        <div className="hidden xl:block">
          <DashboardSidebar
            tests={tests} groups={groups}
            attPct={attPct} navigate={navigate}
          />
        </div>
      </div>
    </div>
  )
}
