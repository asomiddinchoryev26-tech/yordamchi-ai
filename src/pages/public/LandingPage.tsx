import { useState, useEffect, useRef, memo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Play, GraduationCap, Users, Zap, Building2,
  Star, BookOpen, CheckCircle, LayoutDashboard, Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { PATHS } from '@/routes/paths'
import { APP_NAME } from '@/utils/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'student' | 'teacher' | 'school'

// ─── Chat Demo Content ────────────────────────────────────────────────────────

const DEMO = {
  uz: {
    student: {
      userMsg: 'Matematika testiga qanday tayyorlanaman?',
      aiMsg: [
        'Testga tayyorlanish uchun quyidagilarga e\'tibor bering:',
        '**1. Mavzularni takrorlang** — o\'tilgan barcha darslarni ko\'zdan kechiring',
        '**2. Amaliy mashqlar** — har bir mavzu bo\'yicha misollar yeching',
        '**3. Zaif tomonlaringiz** — qiyin mavzularga ko\'proq vaqt ajrating',
      ],
    },
    teacher: {
      userMsg: 'Bugungi davomatni qanday belgilash mumkin?',
      aiMsg: [
        'Davomatni belgilash juda oson:',
        '**1. "Davomat" bo\'limiga o\'ting** — chap menyudan tanlang',
        '**2. Guruhni tanlang** — kerakli guruhni bosing',
        '**3. Talabalarni belgilang** — "bor" yoki "yo\'q" ni tanlab saqlang',
      ],
    },
    school: {
      userMsg: 'Barcha guruhlar hisobotini qanday ko\'raman?',
      aiMsg: [
        'To\'liq statistikani bir joyda ko\'rishingiz mumkin:',
        '**1. Admin panelga kiring** — boshqaruv sahifasiga o\'ting',
        '**2. "Hisobotlar" ni oching** — umumiy ko\'rinishni tanlang',
        '**3. Export qiling** — PDF yoki Excel formatida saqlang',
      ],
    },
  },
  ru: {
    student: {
      userMsg: 'Как подготовиться к тесту по математике?',
      aiMsg: [
        'Для эффективной подготовки к тесту:',
        '**1. Повторите темы** — просмотрите все пройденные материалы',
        '**2. Практические задачи** — решайте упражнения по каждой теме',
        '**3. Слабые места** — уделите больше времени сложным темам',
      ],
    },
    teacher: {
      userMsg: 'Как отметить посещаемость сегодня?',
      aiMsg: [
        'Отметить посещаемость очень просто:',
        '**1. Раздел "Посещаемость"** — выберите в левом меню',
        '**2. Выберите группу** — нажмите на нужную группу',
        '**3. Отметьте студентов** — выберите присутствующих и сохраните',
      ],
    },
    school: {
      userMsg: 'Как посмотреть отчёт по всем группам?',
      aiMsg: [
        'Полная статистика доступна в одном месте:',
        '**1. Войдите в панель** — перейдите в административный раздел',
        '**2. Откройте "Отчёты"** — выберите общий обзор',
        '**3. Экспортируйте** — сохраните в PDF или Excel',
      ],
    },
  },
  en: {
    student: {
      userMsg: 'How do I prepare for the math test?',
      aiMsg: [
        'Here\'s how to prepare effectively:',
        '**1. Review all topics** — go through every lesson covered so far',
        '**2. Practice problems** — solve exercises for each topic',
        '**3. Focus on weak spots** — spend more time on difficult areas',
      ],
    },
    teacher: {
      userMsg: 'How do I mark today\'s attendance?',
      aiMsg: [
        'Marking attendance is straightforward:',
        '**1. Go to "Attendance"** — select it from the left menu',
        '**2. Choose your group** — click on the right class',
        '**3. Mark students** — select present/absent and save',
      ],
    },
    school: {
      userMsg: 'How do I view reports for all groups?',
      aiMsg: [
        'Full statistics are available in one place:',
        '**1. Open Admin Panel** — navigate to the management section',
        '**2. Click "Reports"** — choose the overview view',
        '**3. Export data** — save as PDF or Excel',
      ],
    },
  },
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-gray-900 dark:text-gray-100">{part}</strong>
      : <span key={i}>{part}</span>,
  )
}

function useInView(threshold = 0.25) {
  const ref    = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, inView }
}

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const ease     = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(ease * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [active, target, duration])
  return count
}

// ─── Chat Mockup ──────────────────────────────────────────────────────────────

type DemoContent = { userMsg: string; aiMsg: readonly string[] }

const ChatMockup = memo(function ChatMockup({ demo, language }: { demo: DemoContent; language: string }) {
  const [showAI, setShowAI] = useState(false)
  const [typing, setTyping]  = useState(true)

  const prefersReduced = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )

  useEffect(() => {
    setShowAI(false)
    setTyping(true)
    if (prefersReduced.current) { setShowAI(true); setTyping(false); return }
    const t1 = setTimeout(() => setTyping(false), 1600)
    const t2 = setTimeout(() => setShowAI(true),  1800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [demo, language])

  const placeholderText = language === 'uz'
    ? 'Savol yozing...'
    : language === 'ru'
      ? 'Задайте вопрос...'
      : 'Ask a question...'

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-gray-200/70 dark:border-gray-700/60 shadow-2xl shadow-indigo-500/10 dark:shadow-black/30 bg-white dark:bg-gray-900"
      role="img"
      aria-label="Animated demonstration of YordamchiAI AI assistant answering a question"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-100/80 dark:bg-gray-800/80 border-b border-gray-200/60 dark:border-gray-700/60">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
        <div className="ml-3 flex-1 bg-white dark:bg-gray-700/60 rounded-md px-3 py-1 text-[10px] text-gray-400 dark:text-gray-500 font-mono max-w-[220px] truncate select-none">
          yordamchi-ai-alpha.vercel.app
        </div>
      </div>

      {/* Chat area */}
      <div className="px-4 pt-4 pb-3 space-y-3.5 min-h-[290px]">

        {/* AI Header inside chat */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center ring-2 ring-indigo-500/20">
              <img
                src="/asomiddin.jpg"
                alt="Asomiddin AI"
                className="w-full h-full rounded-full object-cover"
                onError={e => {
                  const img = e.currentTarget
                  img.style.display = 'none'
                }}
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100 leading-none tracking-wide">ASOMIDDIN AI</p>
            <p className="text-[10px] text-indigo-500 dark:text-indigo-400 leading-none mt-0.5">Gemini 2.5 Flash</p>
          </div>
        </div>

        {/* User message */}
        <div className="flex justify-end">
          <div className="max-w-[78%] bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-[12.5px] leading-relaxed px-3.5 py-2.5 rounded-2xl rounded-tr-sm shadow-sm">
            {demo.userMsg}
          </div>
        </div>

        {/* Typing indicator */}
        {typing && (
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex-shrink-0" />
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full"
                  style={{
                    animation: 'bounce 1s infinite',
                    animationDelay: `${i * 180}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* AI response */}
        {showAI && (
          <div
            className={cn(
              'flex items-start gap-2 transition-opacity duration-500',
              showAI ? 'opacity-100' : 'opacity-0',
            )}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 px-3.5 py-3 rounded-2xl rounded-tl-sm">
              {demo.aiMsg.map((line, i) => (
                <p
                  key={i}
                  className={cn(
                    'text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed',
                    i > 0 && 'mt-1.5',
                  )}
                >
                  {renderText(line)}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Decorative input bar */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-700/60 rounded-xl px-3 py-2.5">
          <span className="flex-1 text-[11.5px] text-gray-400 dark:text-gray-500 select-none">
            {placeholderText}
          </span>
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Send className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
})

// ─── Social Proof Stat Item ────────────────────────────────────────────────────

function StatItem({
  target, suffix, label, Icon, colorClass, active,
}: {
  target: number
  suffix: string
  label: string
  Icon: React.ElementType
  colorClass: string
  active: boolean
}) {
  const count = useCountUp(target, active)
  return (
    <div className="flex flex-col items-center gap-1 px-5 py-4 sm:py-5">
      <div className={cn('flex items-center gap-1.5', colorClass)}>
        <Icon className="w-4 h-4 opacity-75 flex-shrink-0" />
        <span className="text-2xl sm:text-[1.75rem] font-black tracking-tight tabular-nums leading-none">
          {count.toLocaleString()}{suffix}
        </span>
      </div>
      <p className="text-[11.5px] text-gray-500 dark:text-gray-400 font-medium text-center leading-tight max-w-[100px]">
        {label}
      </p>
    </div>
  )
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  const { t, language } = useLanguage()
  const [activeRole, setActiveRole] = useState<Role>('student')
  const [mounted, setMounted]       = useState(false)

  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const headlineParts  = t.heroTitle.split('|')
  const headlineBefore = headlineParts[0] ?? ''
  const headlineAccent = headlineParts[1] ?? ''

  const ROLES: { id: Role; label: string; Icon: React.ElementType }[] = [
    { id: 'student', label: t.heroRoleStudent, Icon: GraduationCap  },
    { id: 'teacher', label: t.heroRoleTeacher, Icon: BookOpen        },
    { id: 'school',  label: t.heroRoleSchool,  Icon: LayoutDashboard },
  ]

  const langKey  = (language === 'uz' || language === 'ru' || language === 'en') ? language : 'en'
  const demoData = DEMO[langKey][activeRole]

  function fadeUp(delay = 0) {
    return {
      className: cn(
        'transition-all',
        prefersReduced ? '' : 'duration-700',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
      ),
      style: prefersReduced ? {} : { transitionDelay: `${delay}ms` },
    }
  }

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pt-10 pb-14 sm:pt-14 sm:pb-16 lg:pt-20 lg:pb-24"
    >
      {/* Subtle radial background glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-indigo-100/60 via-violet-50/30 to-transparent dark:from-indigo-950/30 dark:via-violet-950/15 dark:to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-10 lg:gap-12 xl:gap-16 items-center">

          {/* ── LEFT: Copy ──────────────────────────────────────────────────── */}
          <div className="flex flex-col items-start">

            {/* Eyebrow badge */}
            {(() => { const p = fadeUp(0);  return (
              <div className={p.className} style={p.style}>
                <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 shadow-sm shadow-indigo-500/10">
                  <Zap className="w-3.5 h-3.5 text-indigo-500" />
                  {t.heroBadge}
                </div>
              </div>
            )})()}

            {/* H1 Headline */}
            {(() => { const p = fadeUp(90); return (
              <div className={p.className} style={p.style}>
                <h1
                  id="hero-heading"
                  className="text-[2.6rem] sm:text-5xl lg:text-[3.35rem] xl:text-[3.6rem] font-black text-gray-900 dark:text-gray-50 leading-[1.08] tracking-tight mb-5"
                >
                  {headlineBefore && (
                    <span className="block">{headlineBefore}</span>
                  )}
                  {headlineAccent && (
                    <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent pb-1">
                      {headlineAccent}
                    </span>
                  )}
                </h1>
              </div>
            )})()}

            {/* Subtitle */}
            {(() => { const p = fadeUp(170); return (
              <div className={p.className} style={p.style}>
                <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 leading-relaxed max-w-[500px] mb-8">
                  {t.heroSubtitle}
                </p>
              </div>
            )})()}

            {/* CTA group */}
            {(() => { const p = fadeUp(250); return (
              <div className={p.className} style={p.style}>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 w-full sm:w-auto">
                  <Link
                    to={PATHS.REGISTER}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-[15px] transition-all duration-150 shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/35 hover:-translate-y-px active:translate-y-0"
                  >
                    {t.heroCtaPrimary}
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('social-proof')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-[15px] hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all duration-150"
                  >
                    <Play className="w-4 h-4 fill-current opacity-70" />
                    {t.heroCtaDemo}
                  </button>
                </div>

                <p className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  {t.heroNoCreditCard}
                </p>
              </div>
            )})()}

            {/* Role tabs */}
            {(() => { const p = fadeUp(330); return (
              <div className={cn(p.className, 'mt-8')} style={p.style}>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Select your role to see the relevant demo"
              >
                {ROLES.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveRole(id)}
                    aria-pressed={activeRole === id}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-150',
                      activeRole === id
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 shadow-sm shadow-indigo-500/15'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400',
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            )})()}
          </div>

          {/* ── RIGHT: Chat Mockup ──────────────────────────────────────────── */}
          <div
            className={cn(
              'relative transition-all',
              prefersReduced ? '' : 'duration-700',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
            )}
            style={prefersReduced ? {} : { transitionDelay: '220ms' }}
          >
            {/* Glow behind card */}
            <div
              className="absolute -inset-6 bg-gradient-to-br from-indigo-100/50 via-violet-100/30 to-transparent dark:from-indigo-950/25 dark:via-violet-950/15 dark:to-transparent rounded-3xl blur-2xl -z-10 pointer-events-none"
              aria-hidden="true"
            />
            <ChatMockup demo={demoData} language={language} />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Social Proof Section ─────────────────────────────────────────────────────

function SocialProofSection() {
  const { t } = useLanguage()
  const { ref, inView } = useInView(0.3)

  const STATS = [
    { target: 1200, suffix: '+', label: t.statStudentsLabel,      Icon: GraduationCap, color: 'text-indigo-600 dark:text-indigo-400' },
    { target: 85,   suffix: '+', label: t.statTeachersLabel,      Icon: Users,         color: 'text-violet-600 dark:text-violet-400' },
    { target: 8400, suffix: '+', label: t.statConversationsLabel, Icon: Zap,           color: 'text-amber-600 dark:text-amber-400'   },
    { target: 12,   suffix: '',  label: t.statCentersLabel,       Icon: Building2,     color: 'text-emerald-600 dark:text-emerald-400' },
  ]

  return (
    <section
      id="social-proof"
      aria-label="Platform statistics"
      ref={ref as React.RefObject<HTMLElement>}
      className="border-y border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center sm:divide-x divide-gray-200 dark:divide-gray-700/60">

          {STATS.map(({ target, suffix, label, Icon, color }) => (
            <StatItem
              key={label}
              target={target}
              suffix={suffix}
              label={label}
              Icon={Icon}
              colorClass={color}
              active={inView}
            />
          ))}

          {/* Rating — always static */}
          <div className="flex flex-col items-center gap-1 px-5 py-4 sm:py-5">
            <div className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
              <Star className="w-4 h-4 fill-current opacity-90 flex-shrink-0" />
              <span className="text-2xl sm:text-[1.75rem] font-black tracking-tight leading-none">4.9</span>
              <span className="text-base font-semibold opacity-50 leading-none mt-0.5">/5</span>
            </div>
            <p className="text-[11.5px] text-gray-500 dark:text-gray-400 font-medium text-center leading-tight max-w-[100px]">
              {t.statRatingLabel}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Features Section (original, upgraded with real icons) ───────────────────

function FeaturesSection() {
  const { t } = useLanguage()

  const FEATURES = [
    {
      title: t.feature1Title,
      desc: t.feature1Desc,
      Icon: GraduationCap,
      bgLight: 'bg-indigo-50',
      bgDark: 'dark:bg-indigo-950/60',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      title: t.feature2Title,
      desc: t.feature2Desc,
      Icon: Users,
      bgLight: 'bg-violet-50',
      bgDark: 'dark:bg-violet-950/60',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      title: t.feature3Title,
      desc: t.feature3Desc,
      Icon: LayoutDashboard,
      bgLight: 'bg-emerald-50',
      bgDark: 'dark:bg-emerald-950/60',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ]

  return (
    <section className="bg-gray-50 dark:bg-gray-900/50 py-14 sm:py-20 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
          {t.whyTitle.replace('YordamchiAI', APP_NAME)}
        </h2>
        <p className="text-center text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-8 sm:mb-12">
          {t.whySubtitle}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 sm:p-6 hover:shadow-md dark:hover:shadow-gray-900/40 hover:-translate-y-[2px] transition-all duration-200"
            >
              <div className={cn('w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-3 sm:mb-4', f.bgLight, f.bgDark)}>
                <f.Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', f.iconColor)} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2 text-base sm:text-lg">
                {f.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { t } = useLanguage()

  return (
    <div className="overflow-x-hidden">
      <HeroSection />
      <SocialProofSection />
      <FeaturesSection />

      {/* ── Final CTA ── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 text-center bg-white dark:bg-gray-950">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
          {t.ctaTitle}
        </h2>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-lg mx-auto">
          {t.ctaSubtitle}
        </p>
        <Link
          to={PATHS.REGISTER}
          className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all duration-150 shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-px active:translate-y-0"
        >
          {t.registerNow}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  )
}
