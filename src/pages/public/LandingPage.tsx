import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Building2, Star, ArrowRight, Check, UserCheck, ChevronDown, Sparkles, Globe, ShieldCheck,
  MessageSquare, Camera, ClipboardCheck, CalendarCheck, NotebookPen, FolderOpen,
  type LucideIcon,
} from 'lucide-react'
import { motion, AnimatePresence, useInView as useInViewFM, MotionConfig } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { PATHS } from '@/routes/paths'
import { APP_NAME } from '@/utils/constants'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Logo from '@/components/common/Logo'

// ─── Premium design tokens (cohesive with Hero/Navbar dark UI) ────────────────

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]
const PRIMARY = 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)'

const CARD_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(16px) saturate(160%)',
  WebkitBackdropFilter: 'blur(16px) saturate(160%)',
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setCount(Math.round((1 - Math.pow(1 - progress, 3)) * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [active, target, duration])
  return count
}

function IconBadge({ Icon, glyph, color, size = 'md' }: { Icon?: LucideIcon; glyph?: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-10 h-10' : 'w-12 h-12'
  const ic  = size === 'lg' ? 'w-7 h-7' : size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
  return (
    <span
      className={`flex items-center justify-center ${box} rounded-2xl flex-shrink-0`}
      style={{ background: `${color}1f`, border: `1px solid ${color}33`, boxShadow: `0 0 22px ${color}22` }}
    >
      {glyph
        ? <span className="text-lg font-black" style={{ color }}>{glyph}</span>
        : Icon && <Icon className={ic} style={{ color }} strokeWidth={1.9} aria-hidden="true" />}
    </span>
  )
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="text-center mb-10 sm:mb-14"
    >
      <h2 className="text-[26px] sm:text-[34px] lg:text-[40px] font-black tracking-tight text-white leading-tight">
        {title}
      </h2>
      <div className="mx-auto mt-4 h-[3px] w-14 rounded-full" style={{ background: PRIMARY }} aria-hidden="true" />
      <p className="mt-5 text-[15px] sm:text-base text-white/50 max-w-xl mx-auto leading-relaxed">{subtitle}</p>
    </motion.div>
  )
}

// Premium glass feature card (used by FeaturesSection)
interface GlassCardItem {
  Icon?: LucideIcon
  glyph?: string
  color: string
  title: string
  desc: string
}

function GlassFeatureCard({ Icon, glyph, color, title, desc, i }: GlassCardItem & { i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: EASE, delay: i * 0.06 }}
      whileHover={{ y: -6 }}
      className="relative rounded-2xl p-6 overflow-hidden group cursor-default"
      style={CARD_STYLE}
    >
      <div
        className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px ${color}44, 0 0 34px ${color}1f` }}
        aria-hidden="true"
      />
      <IconBadge Icon={Icon} glyph={glyph} color={color} />
      <h3 className="mt-4 text-[17px] font-bold text-white">{title}</h3>
      <p className="mt-2 text-[13.5px] text-white/50 leading-relaxed">{desc}</p>
    </motion.div>
  )
}

// ─── Audience Section (Student / Teacher / Institution) ───────────────────────

interface AudienceCard {
  img: string       // personaj (shaffof PNG) yoki sahna (bino) rasmi
  scene?: boolean   // true = to'liq qoplaydigan sahna (bino), false = shaffof personaj
  color: string
  title: string
  points: string[]
}

function AudienceSection() {
  const { t } = useLanguage()
  const cards: AudienceCard[] = [
    {
      img: '/images/home/aud-student.webp', color: '#A78BFA', title: t.audStudentTitle,
      points: [t.audStudentP1, t.audStudentP2, t.audStudentP3, t.audStudentP4],
    },
    {
      img: '/images/home/aud-teacher.webp', color: '#34D399', title: t.audTeacherTitle,
      points: [t.audTeacherP1, t.audTeacherP2, t.audTeacherP3, t.audTeacherP4],
    },
    {
      img: '/images/home/aud-school.webp', scene: true, color: '#60A5FA', title: t.audSchoolTitle,
      points: [t.audSchoolP1, t.audSchoolP2, t.audSchoolP3, t.audSchoolP4],
    },
  ]

  return (
    <section id="why" className="relative py-16 sm:py-24 px-5 sm:px-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[520px] h-[420px] rounded-full blur-[130px] opacity-15"
          style={{ background: 'radial-gradient(circle,#7C3AED,transparent 60%)' }} />
      </div>

      <div className="relative max-w-[1150px] mx-auto">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-center text-[26px] sm:text-[34px] lg:text-[40px] font-black tracking-tight text-white leading-tight mb-10 sm:mb-14"
        >
          {t.audienceHeading}{' '}
          <span style={{ background: 'linear-gradient(100deg,#9B7CFF 0%,#6366F1 50%,#3B82F6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {APP_NAME}?
          </span>
        </motion.h2>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, ease: EASE, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
              className="relative flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-5 rounded-2xl p-5 sm:p-6 overflow-hidden group"
              style={CARD_STYLE}
            >
              <div
                className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ boxShadow: `inset 0 0 0 1px ${c.color}44, 0 0 36px ${c.color}1f` }}
                aria-hidden="true"
              />
              {/* Rasm — mobil: tepada markazda / desktop: chapda portret.
                  Personaj (shaffof PNG) rangli-nurli fon ustida turadi;
                  bino (sahna) esa butun ramkani qoplaydi. */}
              <div
                className="group/img relative w-full max-w-[240px] mx-auto lg:mx-0 lg:max-w-none lg:w-[150px] lg:flex-shrink-0 rounded-2xl overflow-hidden aspect-[3/4]"
                style={{
                  border: `1px solid ${c.color}33`,
                  boxShadow: `0 0 24px ${c.color}22`,
                  background: `radial-gradient(115% 85% at 50% 12%, ${c.color}33 0%, rgba(12,14,28,0.7) 58%, rgba(8,10,20,0.92) 100%)`,
                }}
              >
                {/* Orqa yorug'lik (spotlight) — personaj boshi/yelkasi ortida */}
                {!c.scene && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-[6%] top-[3%] h-[64%] pointer-events-none"
                    style={{ background: `radial-gradient(50% 50% at 50% 42%, ${c.color}66 0%, ${c.color}1f 45%, transparent 72%)` }}
                  />
                )}
                <img
                  src={c.img}
                  alt={c.title}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className={
                    c.scene
                      ? 'absolute inset-0 w-full h-full object-cover'
                      : 'absolute inset-0 w-full h-full object-cover object-bottom drop-shadow-[0_10px_22px_rgba(0,0,0,0.5)]'
                  }
                />
                {/* Pastki soya — kesilgan tana qorong'iga singib ketadi (yopishtirilgandek emas) */}
                {!c.scene && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-[26%] pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(9,11,22,0.97) 6%, rgba(9,11,22,0.55) 45%, transparent 100%)' }}
                  />
                )}
              </div>
              {/* Matn bloki — mobilda rasm tagida, desktopda rasm o'ngida */}
              <div className="flex flex-col min-w-0 flex-1">
                <h3 className="text-[18px] sm:text-[19px] font-bold text-white leading-snug mb-3.5">{c.title}</h3>
                {/* Checklist */}
                <ul className="space-y-2.5 mb-5">
                  {c.points.map(p => (
                    <li key={p} className="flex items-start gap-2.5">
                      <span className="flex items-center justify-center w-[18px] h-[18px] rounded-full flex-shrink-0 mt-0.5"
                        style={{ background: `${c.color}22`, border: `1px solid ${c.color}55` }}>
                        <Check className="w-[11px] h-[11px]" style={{ color: c.color }} strokeWidth={3.5} aria-hidden="true" />
                      </span>
                      <span className="text-[13.5px] text-white/65 leading-snug">{p}</span>
                    </li>
                  ))}
                </ul>
                {/* Batafsil */}
                <Link
                  to={PATHS.REGISTER}
                  className="inline-flex items-center gap-1.5 self-start px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A16]"
                  style={{ color: c.color, background: `${c.color}14`, border: `1px solid ${c.color}33` }}
                >
                  {t.detailsBtn}
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Statistics glass bar ─────────────────────────────────────────────────────

interface StatUnitProps {
  target?: number
  suffix?: string
  staticValue?: string
  label: string
  Icon: LucideIcon
  color: string
  i: number
}

function StatUnit({ target = 0, suffix = '', staticValue, label, Icon, color, i }: StatUnitProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInViewFM(ref, { once: true, amount: 0.5 })
  const count = useCountUp(target, inView && !staticValue)

  return (
    <div
      ref={ref}
      className={`flex items-center gap-3.5 px-3 sm:px-6 py-3 ${i > 0 ? 'lg:border-l lg:border-white/[0.08]' : ''}`}
    >
      <IconBadge Icon={Icon} color={color} />
      <div className="min-w-0">
        <div className="text-[1.6rem] sm:text-[2rem] font-black text-white tabular-nums leading-none tracking-tight">
          {staticValue ?? `${count.toLocaleString()}${suffix}`}
        </div>
        <div className="mt-1 text-[12.5px] sm:text-[13px] text-white/50 font-medium leading-snug">{label}</div>
      </div>
    </div>
  )
}

function StatisticsSection() {
  const { t } = useLanguage()
  const stats: Omit<StatUnitProps, 'i'>[] = [
    { target: 5000, suffix: '+', label: t.statActiveStudents,   Icon: Users,      color: '#A78BFA' },
    { target: 300,  suffix: '+', label: t.teachers,             Icon: UserCheck,  color: '#34D399' },
    { target: 65,   suffix: '+', label: t.statInstitutions,     Icon: Building2,  color: '#60A5FA' },
    { staticValue: '4.9 / 5',    label: t.statUserRating,       Icon: Star,       color: '#F59E0B' },
  ]

  return (
    <section id="social-proof" aria-label="Statistika" className="relative scroll-mt-20 py-12 sm:py-16 px-5 sm:px-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[820px] h-[280px] rounded-full blur-[120px] opacity-10"
          style={{ background: 'radial-gradient(ellipse,#3B82F6,transparent 65%)' }} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="relative max-w-[1150px] mx-auto rounded-3xl px-4 sm:px-6 py-6 sm:py-7"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}
      >
        <div className="grid grid-cols-1 min-[430px]:grid-cols-2 lg:grid-cols-4 gap-y-1 min-[430px]:gap-y-0">
          {stats.map((s, i) => <StatUnit key={s.label} {...s} i={i} />)}
        </div>
      </motion.div>
    </section>
  )
}

// ─── Features Section (platformaning haqiqiy imkoniyatlari) ────────────────────

function FeaturesSection() {
  const { t } = useLanguage()
  const items: GlassCardItem[] = [
    { Icon: MessageSquare, color: '#A78BFA', title: t.featChatT,   desc: t.featChatD },
    { Icon: Camera,        color: '#60A5FA', title: t.featVisionT, desc: t.featVisionD },
    { Icon: ClipboardCheck, color: '#F59E0B', title: t.featTestsT, desc: t.featTestsD },
    { Icon: CalendarCheck, color: '#34D399', title: t.featAttendT, desc: t.featAttendD },
    { Icon: NotebookPen,   color: '#38BDF8', title: t.featHwT,     desc: t.featHwD },
    { Icon: FolderOpen,    color: '#FB7185', title: t.featMatT,    desc: t.featMatD },
  ]

  return (
    <section id="features" className="relative py-16 sm:py-24 px-5 sm:px-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute bottom-0 right-1/4 w-[520px] h-[420px] rounded-full blur-[130px] opacity-15"
          style={{ background: 'radial-gradient(circle,#3B82F6,transparent 60%)' }} />
      </div>
      <div className="relative max-w-[1100px] mx-auto">
        <SectionHeading title={t.secFeaturesTitle} subtitle={t.secFeaturesSub} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {items.map((it, i) => <GlassFeatureCard key={it.title} {...it} i={i} />)}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing Section ──────────────────────────────────────────────────────────

interface Plan {
  name: string; price: string; period: string; desc: string
  color: string; popular: boolean; features: string[]; cta: string
}

function PricingCard({ plan, i }: { plan: Plan; i: number }) {
  const { t } = useLanguage()
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: EASE, delay: i * 0.08 }}
      whileHover={{ y: -6 }}
      className="relative flex flex-col rounded-2xl p-6 sm:p-7 overflow-hidden"
      style={plan.popular
        ? { background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: '0 0 40px rgba(124,58,237,0.22)' }
        : CARD_STYLE}
    >
      {plan.popular && (
        <span className="absolute top-5 right-5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-white" style={{ background: PRIMARY }}>
          <Sparkles className="w-3 h-3" aria-hidden="true" /> {t.popularBadge}
        </span>
      )}
      <h3 className="text-[16px] font-bold text-white">{plan.name}</h3>
      <p className="mt-1 text-[12.5px] text-white/45">{plan.desc}</p>
      <div className="mt-4 flex items-end gap-1.5">
        <span className="text-[2rem] font-black text-white leading-none tracking-tight">{plan.price}</span>
        {plan.period && <span className="text-[13px] text-white/50 mb-0.5">{plan.period}</span>}
      </div>
      <ul className="mt-5 space-y-2.5 flex-1">
        {plan.features.map(f => (
          <li key={f} className="flex items-start gap-2.5">
            <span className="flex items-center justify-center w-[18px] h-[18px] rounded-full flex-shrink-0 mt-0.5"
              style={{ background: `${plan.color}22`, border: `1px solid ${plan.color}55` }}>
              <Check className="w-[11px] h-[11px]" style={{ color: plan.color }} strokeWidth={3.5} aria-hidden="true" />
            </span>
            <span className="text-[13.5px] text-white/65 leading-snug">{f}</span>
          </li>
        ))}
      </ul>
      <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} className="mt-6">
        <Link
          to={PATHS.REGISTER}
          className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl text-[14px] font-bold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A16]"
          style={plan.popular
            ? { background: PRIMARY, color: '#fff', boxShadow: '0 8px 24px rgba(124,58,237,0.45)' }
            : { background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.14)' }}
        >
          {plan.cta}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </motion.div>
    </motion.div>
  )
}

function PricingSection() {
  const { t } = useLanguage()
  const plans: Plan[] = [
    {
      name: t.planStarterName, price: t.priceFree, period: '', desc: t.planStarterDesc, color: '#60A5FA', popular: false,
      features: [t.planStarterF1, t.planStarterF2, t.planStarterF3, t.planStarterF4], cta: t.ctaStartFree,
    },
    {
      name: t.planProName, price: '49 000', period: t.pricePeriodMonth, desc: t.planProDesc, color: '#A78BFA', popular: true,
      features: [t.planProF1, t.planProF2, t.planProF3, t.planProF4, t.planProF5], cta: t.ctaBuyPro,
    },
    {
      name: t.planSchoolName, price: t.priceNegotiable, period: '', desc: t.planSchoolDesc, color: '#34D399', popular: false,
      features: [t.planSchoolF1, t.planSchoolF2, t.planSchoolF3, t.planSchoolF4, t.planSchoolF5], cta: t.ctaContact,
    },
  ]

  return (
    <section id="pricing" className="relative scroll-mt-20 py-16 sm:py-24 px-5 sm:px-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[560px] h-[420px] rounded-full blur-[130px] opacity-15"
          style={{ background: 'radial-gradient(circle,#7C3AED,transparent 60%)' }} />
      </div>
      <div className="relative max-w-[1080px] mx-auto">
        <SectionHeading title={t.secPricingTitle} subtitle={t.secPricingSub} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          {plans.map((p, i) => <PricingCard key={p.name} plan={p} i={i} />)}
        </div>
      </div>
    </section>
  )
}

// ─── About Section ────────────────────────────────────────────────────────────

function AboutSection() {
  const { t } = useLanguage()
  const values: GlassCardItem[] = [
    { Icon: Sparkles,    color: '#A78BFA', title: t.aboutVal1T, desc: t.aboutVal1D },
    { Icon: Globe,       color: '#60A5FA', title: t.aboutVal2T, desc: t.aboutVal2D },
    { Icon: ShieldCheck, color: '#34D399', title: t.aboutVal3T, desc: t.aboutVal3D },
  ]

  return (
    <section id="about" className="relative scroll-mt-20 py-16 sm:py-24 px-5 sm:px-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute bottom-0 left-1/4 w-[520px] h-[420px] rounded-full blur-[130px] opacity-12"
          style={{ background: 'radial-gradient(circle,#3B82F6,transparent 60%)' }} />
      </div>
      <div className="relative max-w-[1000px] mx-auto">
        <SectionHeading title={t.secAboutTitle} subtitle={t.secAboutSub} />
        <p className="text-center text-[15px] sm:text-base text-white/55 max-w-2xl mx-auto leading-relaxed">
          {t.aboutParagraph}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-10">
          {values.map((v, i) => <GlassFeatureCard key={v.title} {...v} i={i} />)}
        </div>
      </div>
    </section>
  )
}

// ─── FAQ Section ──────────────────────────────────────────────────────────────

function FaqItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={CARD_STYLE}>
      <button
        type="button" onClick={onToggle} aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/50 rounded-2xl"
      >
        <span className="text-[14.5px] sm:text-[15px] font-semibold text-white">{q}</span>
        <ChevronDown className={`w-5 h-5 flex-shrink-0 text-white/45 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            style={{ overflow: 'hidden' }}
          >
            <p className="px-5 pb-4 text-[13.5px] text-white/55 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FaqSection() {
  const { t } = useLanguage()
  const [open, setOpen] = useState<number | null>(0)
  const faqs = [
    { q: t.faqQ1, a: t.faqA1 },
    { q: t.faqQ2, a: t.faqA2 },
    { q: t.faqQ3, a: t.faqA3 },
    { q: t.faqQ4, a: t.faqA4 },
    { q: t.faqQ5, a: t.faqA5 },
    { q: t.faqQ6, a: t.faqA6 },
  ]

  return (
    <section id="faq" className="relative scroll-mt-20 py-16 sm:py-24 px-5 sm:px-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 right-1/4 w-[480px] h-[400px] rounded-full blur-[130px] opacity-12"
          style={{ background: 'radial-gradient(circle,#7C3AED,transparent 60%)' }} />
      </div>
      <div className="relative max-w-[760px] mx-auto">
        <SectionHeading title={t.secFaqTitle} subtitle={t.secFaqSub} />
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} isOpen={open === i} onToggle={() => setOpen(open === i ? null : i)} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

function CTASection() {
  const { t } = useLanguage()

  return (
    <section className="relative py-20 sm:py-28 px-5 sm:px-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[420px] rounded-full blur-[120px] opacity-30"
          style={{ background: 'radial-gradient(ellipse,#7C3AED,transparent 65%)' }} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="relative max-w-2xl mx-auto text-center rounded-3xl px-6 py-12 sm:px-12 sm:py-16 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        <h2 className="text-[26px] sm:text-[36px] font-black tracking-tight text-white leading-tight">{t.ctaTitle}</h2>
        <p className="mt-4 text-[15px] sm:text-base text-white/55 max-w-lg mx-auto leading-relaxed">{t.ctaSubtitle}</p>
        <motion.div
          whileHover={{ y: -2, scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 320, damping: 20 }}
          className="inline-block mt-8"
          style={{ borderRadius: 14 }}
        >
          <Link
            to={PATHS.REGISTER}
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-[14px] text-[15px] font-bold text-white overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A16]"
            style={{ background: PRIMARY, boxShadow: '0 10px 30px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.18)' }}
          >
            <span
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"
              style={{ background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.25) 50%,transparent 70%)' }}
              aria-hidden="true"
            />
            <span className="relative z-10">{t.registerNow}</span>
            <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const { t } = useLanguage()

  return (
    <footer
      role="contentinfo"
      className="relative border-t border-white/[0.06] py-10 px-5 sm:px-8"
      style={{ background: 'rgba(8,10,20,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
        <Logo showSubtitle={false} />
        <p className="text-[13px] text-white/40 order-last sm:order-none">
          © 2026 {APP_NAME}. {t.allRightsReserved}.
        </p>
        <div className="flex gap-6 text-[13px]">
          <Link to="/privacy" className="text-white/45 hover:text-white/80 transition-colors duration-150">{t.privacyPolicy}</Link>
          <Link to="/terms"   className="text-white/45 hover:text-white/80 transition-colors duration-150">{t.termsOfService}</Link>
        </div>
      </div>
    </footer>
  )
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
// Render tree (aynan tartibda):
//   <Navbar/> · <Hero/> · <AudienceSection/> · <StatisticsSection/> ·
//   <FeaturesSection/> · <CTASection/> · <Footer/>

export default function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      {/* Navbar sits OUTSIDE the overflow-x-hidden wrapper so `position: sticky` works */}
      <Navbar />
      <div className="overflow-x-hidden bg-[#0A0A16] text-white">
        <Hero />
        <AudienceSection />
        <StatisticsSection />
        <FeaturesSection />
        <PricingSection />
        <AboutSection />
        <FaqSection />
        <CTASection />
        <Footer />
      </div>
    </MotionConfig>
  )
}
