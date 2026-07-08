/**
 * pages/auth/RoleSelectionStep.tsx
 * Premium role-selection screen — matches the YordamchiAI landing design system:
 * dark premium SaaS background, purple/blue gradient glow, floating orbs + particles,
 * glassmorphism cards, neon borders, landing character images with glowing frames,
 * smooth hover + purple selected-glow. Same typography / button style / animations.
 *
 * ⚠️ Faqat vizual UI. Logika o'zgarmagan — props (selected / onSelect / onContinue)
 * o'sha-o'sha; rol saqlash, redirect, auth, Supabase RegisterPage'da qoladi.
 */

import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { PATHS } from '@/routes/paths'
import type { UserRole } from '@/types/auth.types'
import Logo from '@/components/common/Logo'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

type TKey = keyof Translations

interface RoleDef {
  value:     UserRole
  color:     string
  img:       string
  scene?:    boolean   // true = to'liq qoplaydigan sahna (bino), false = shaffof personaj
  titleKey:  TKey
  descKey:   TKey
  pointKeys: [TKey, TKey, TKey, TKey]
}

// Tarjima qilingan (ko'rsatiladigan) shakl
type RoleView = { value: UserRole; color: string; img: string; scene?: boolean; title: string; desc: string; points: string[] }

const ROLES: RoleDef[] = [
  { value: 'student', color: '#A78BFA', img: '/images/home/aud-student.webp',
    titleKey: 'roleStudentTitle', descKey: 'roleStudentDesc', pointKeys: ['roleStudentP1', 'roleStudentP2', 'roleStudentP3', 'roleStudentP4'] },
  { value: 'teacher', color: '#34D399', img: '/images/home/aud-teacher.webp',
    titleKey: 'roleTeacherTitle', descKey: 'roleTeacherDesc', pointKeys: ['roleTeacherP1', 'roleTeacherP2', 'roleTeacherP3', 'roleTeacherP4'] },
  { value: 'admin', color: '#60A5FA', img: '/images/home/aud-school.webp', scene: true,
    titleKey: 'roleSchoolTitle', descKey: 'roleSchoolDesc', pointKeys: ['roleSchoolP1', 'roleSchoolP2', 'roleSchoolP3', 'roleSchoolP4'] },
]

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

// ─── Floating orbs + particles backdrop (landing bilan bir xil his) ───────────

const ORBS = [
  { color: 'rgba(124,58,237,0.55)', size: 560, top: '-12%',  left: '-10%', dur: 9 },
  { color: 'rgba(59,130,246,0.45)', size: 520, bottom: '-14%', right: '-8%', dur: 11 },
  { color: 'rgba(34,211,238,0.28)', size: 380, top: '38%',   left: '52%',  dur: 10 },
]

const PARTICLES = [
  { top: '14%', left: '12%', s: 4, d: 0 },   { top: '22%', left: '82%', s: 3, d: 0.6 },
  { top: '30%', left: '46%', s: 2, d: 1.1 }, { top: '58%', left: '8%',  s: 3, d: 0.3 },
  { top: '66%', left: '90%', s: 4, d: 0.9 }, { top: '78%', left: '30%', s: 2, d: 1.4 },
  { top: '44%', left: '95%', s: 2, d: 1.8 }, { top: '86%', left: '62%', s: 3, d: 0.5 },
  { top: '10%', left: '60%', s: 2, d: 2.1 }, { top: '52%', left: '38%', s: 2, d: 1.6 },
]

function Backdrop() {
  const reduce = useReducedMotion()
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* base radial depth */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% -10%, #0D1230 0%, #080B18 55%, #05060F 100%)' }} />
      {/* floating orbs */}
      {ORBS.map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-[110px]"
          style={{ width: o.size, height: o.size, top: o.top, bottom: o.bottom, left: o.left, right: o.right,
            background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)` }}
          animate={reduce ? undefined : { y: [0, -22, 0], x: [0, 12, 0] }}
          transition={{ duration: o.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      {/* glowing particles */}
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ top: p.top, left: p.left, width: p.s, height: p.s,
            background: 'rgba(190,205,255,0.9)', boxShadow: '0 0 8px rgba(147,187,255,0.9)' }}
          animate={reduce ? undefined : { opacity: [0.15, 0.85, 0.15], scale: [1, 1.5, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: p.d }}
        />
      ))}
    </div>
  )
}

// ─── Role card ────────────────────────────────────────────────────────────────

function RoleCard({ role, active, onSelect, index }: {
  role: RoleView; active: boolean; onSelect: () => void; index: number
}) {
  const { color, img, scene } = role
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.1 + index * 0.09 }}
      whileHover={{ y: -6 }}
      className="group relative flex flex-col text-left rounded-[24px] p-4 sm:p-5 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070B14]"
      style={{
        background: active ? `${color}12` : 'rgba(11,15,28,0.82)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        border: `1px solid ${active ? `${color}aa` : 'rgba(255,255,255,0.09)'}`,
        boxShadow: active
          ? `0 0 0 1.5px ${color}, 0 0 34px ${color}55, 0 0 66px rgba(124,58,237,0.42), 0 12px 48px rgba(0,0,0,0.5)`
          : '0 8px 40px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.06)',
        transition: 'background 0.28s, border-color 0.28s, box-shadow 0.28s',
      }}
    >
      {/* hover neon border glow */}
      <span
        aria-hidden="true"
        className="absolute -inset-px rounded-[24px] pointer-events-none transition-opacity duration-300"
        style={{ boxShadow: `inset 0 0 0 1px ${color}55, 0 0 34px ${color}26`, opacity: active ? 1 : 0 }}
      />
      <span
        aria-hidden="true"
        className="absolute -inset-px rounded-[24px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ boxShadow: `inset 0 0 0 1px ${color}4d, 0 0 30px ${color}1f` }}
      />

      {/* selected check */}
      <span
        className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
        style={active
          ? { background: color, boxShadow: `0 0 16px ${color}cc`, opacity: 1, transform: 'scale(1)' }
          : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', opacity: 0.45, transform: 'scale(0.85)' }}
        aria-hidden="true"
      >
        {active && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
      </span>

      {/* Glowing image area (landing bilan bir xil ishlov) */}
      <div
        className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden mb-4"
        style={{
          border: `1px solid ${color}30`,
          boxShadow: `0 0 28px ${color}22`,
          background: `radial-gradient(115% 85% at 50% 12%, ${color}38 0%, rgba(12,14,28,0.72) 58%, rgba(8,10,20,0.94) 100%)`,
        }}
      >
        {!scene && (
          <div
            aria-hidden="true"
            className="absolute inset-x-[6%] top-[3%] h-[64%]"
            style={{ background: `radial-gradient(50% 50% at 50% 42%, ${color}70 0%, ${color}22 45%, transparent 72%)` }}
          />
        )}
        <img
          src={img}
          alt={role.title}
          loading="eager"
          decoding="async"
          draggable={false}
          className={scene
            ? 'absolute inset-0 w-full h-full object-cover'
            : 'absolute inset-0 w-full h-full object-contain object-bottom drop-shadow-[0_10px_22px_rgba(0,0,0,0.5)]'}
        />
        {!scene && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[26%]"
            style={{ background: 'linear-gradient(to top, rgba(9,11,22,0.97) 6%, rgba(9,11,22,0.55) 45%, transparent 100%)' }}
          />
        )}
      </div>

      {/* Title + desc */}
      <h3 className="text-[18px] font-bold text-white leading-snug">{role.title}</h3>
      <p className="text-[12.5px] text-white/50 mt-1 mb-4 leading-snug">{role.desc}</p>

      {/* Permissions */}
      <ul className="space-y-2 mt-auto">
        {role.points.map(p => (
          <li key={p} className="flex items-start gap-2.5">
            <span className="flex items-center justify-center w-[16px] h-[16px] rounded-full flex-shrink-0 mt-0.5"
              style={{ background: `${color}22`, border: `1px solid ${color}55` }}>
              <Check className="w-[10px] h-[10px]" style={{ color }} strokeWidth={3.5} aria-hidden="true" />
            </span>
            <span className="text-[12.5px] text-white/60 leading-snug">{p}</span>
          </li>
        ))}
      </ul>
    </motion.button>
  )
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function RoleSelectionStep({ selected, onSelect, onContinue }: {
  selected: UserRole | null
  onSelect: (role: UserRole) => void
  onContinue: () => void
}) {
  const { t } = useLanguage()
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10 sm:py-12" style={{ background: '#05060F' }}>
      <Backdrop />

      <div className="relative w-full max-w-[1120px]">
        {/* Logo — landing bilan bir xil */}
        <div className="flex items-center justify-center mb-6">
          <Logo showSubtitle={false} />
        </div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="text-center mb-8 sm:mb-10"
        >
          <h1 className="text-[26px] sm:text-[32px] lg:text-[38px] font-black text-white tracking-tight leading-tight">
            <span style={{ background: 'linear-gradient(100deg,#9B7CFF 0%,#6366F1 50%,#3B82F6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {t.selectRole}
            </span>
          </h1>
          <p className="text-[13.5px] sm:text-[15px] text-white/45 mt-2">
            {t.roleSelectSubtitle}
          </p>
        </motion.div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {ROLES.map((r, i) => (
            <RoleCard
              key={r.value}
              role={{ value: r.value, color: r.color, img: r.img, scene: r.scene, title: t[r.titleKey], desc: t[r.descKey], points: r.pointKeys.map(k => t[k]) }}
              index={i}
              active={selected === r.value}
              onSelect={() => onSelect(r.value)}
            />
          ))}
        </div>

        {/* Continue + login link */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.4 }}
          className="mt-9 flex flex-col items-center gap-4"
        >
          <button
            type="button"
            onClick={onContinue}
            disabled={!selected}
            className="w-full sm:w-auto sm:min-w-[300px] flex items-center justify-center gap-2 py-[14px] px-8 rounded-[14px] text-white text-[14.5px] font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg,#5B7FFF 0%,#7C3AED 100%)',
              boxShadow: '0 6px 24px rgba(91,127,255,0.42), inset 0 1px 0 rgba(255,255,255,0.16)',
            }}
          >
            {t.roleContinue}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {t.haveAccountQ}{' '}
            <Link to={PATHS.LOGIN} className="font-bold" style={{ color: '#93BBFF' }}>
              {t.login}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
