import { useState, useEffect, useRef, memo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, GraduationCap, Users, Zap, Building2,
  Star, BookOpen, CheckCircle, LayoutDashboard, Send, Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { PATHS } from '@/routes/paths'
import { APP_NAME } from '@/utils/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'student' | 'teacher' | 'school'

// ─── Demo Conversations ───────────────────────────────────────────────────────
// Contextual conversations that immediately answer "why not ChatGPT":
// the AI knows your lesson, your class, your specific data.

const DEMO = {
  uz: {
    student: {
      context: '📚 Algebra · 9-sinf · Kvadrat tenglamalar',
      userMsg: 'Qaysi mavzularda zaif ekanman?',
      aiMsg: [
        'Oxirgi 3 ta test natijangizga ko\'ra:',
        '**Diskriminant hisoblash** — 68% hollarda xato',
        '**Manfiy ildizlar** — 54% hollarda xato',
        'Bu hafta 3 mashq → natijangiz 73%→88% ga ko\'tariladi',
      ],
    },
    teacher: {
      context: '👩‍🏫 9A guruh · Bugungi dars',
      userMsg: 'Bugun qaysi talabalar darsga kelmadi?',
      aiMsg: [
        'Bugungi 9A guruh davomati:',
        '**Aliyev B., Nazarov D., Umarova S.** — kelmadi',
        '**85% davomat** — o\'rtachadan past',
        'Ota-onalarga avtomatik xabar yuboriladimi?',
      ],
    },
    school: {
      context: '🏫 Barcha sinflar · 2025–26 o\'quv yili',
      userMsg: 'Qaysi sinflarda natijalar pasaymoqda?',
      aiMsg: [
        'Oxirgi 30 kunlik tahlil:',
        '**7B sinf** — o\'rtacha ball 68→59 (↓13%)',
        '**10A sinf** — davomat 91%→83% (↓9%)',
        'Muammolar erta aniqlandi — hozir choralar ko\'ring',
      ],
    },
  },
  ru: {
    student: {
      context: '📚 Алгебра · 9-й класс · Квадратные уравнения',
      userMsg: 'По каким темам я слабый?',
      aiMsg: [
        'По результатам последних 3 тестов:',
        '**Вычисление дискриминанта** — ошибки в 68% случаев',
        '**Отрицательные корни** — ошибки в 54% случаев',
        '3 упражнения на неделе → результат вырастет с 73% до 88%',
      ],
    },
    teacher: {
      context: '👩‍🏫 9А класс · Сегодняшний урок',
      userMsg: 'Кто не пришёл на урок сегодня?',
      aiMsg: [
        'Посещаемость сегодня (9А):',
        '**Алиев Б., Назаров Д., Умарова С.** — отсутствуют',
        '**85% посещаемость** — ниже среднего',
        'Отправить уведомления родителям автоматически?',
      ],
    },
    school: {
      context: '🏫 Все классы · Учебный год 2025–26',
      userMsg: 'В каких классах падают результаты?',
      aiMsg: [
        'Анализ за последние 30 дней:',
        '**7Б класс** — средний балл 68→59 (↓13%)',
        '**10А класс** — посещаемость 91%→83% (↓9%)',
        'Проблемы выявлены — примите меры сейчас',
      ],
    },
  },
  en: {
    student: {
      context: '📚 Algebra · Grade 9 · Quadratic Equations',
      userMsg: 'Which topics am I weakest in?',
      aiMsg: [
        'Based on your last 3 test results:',
        '**Calculating discriminant** — errors in 68% of attempts',
        '**Negative roots** — errors in 54% of attempts',
        '3 exercises this week → your score will go from 73%→88%',
      ],
    },
    teacher: {
      context: "👩‍🏫 Grade 9A · Today's Lesson",
      userMsg: "Who was absent from today's class?",
      aiMsg: [
        "Today's attendance (Grade 9A):",
        '**Aliyev B., Nazarov D., Umarova S.** — absent',
        '**85% attendance** — below average',
        'Send automatic notifications to parents?',
      ],
    },
    school: {
      context: '🏫 All Classes · Academic Year 2025–26',
      userMsg: 'Which classes are showing declining results?',
      aiMsg: [
        'Analysis for the past 30 days:',
        '**Grade 7B** — average score 68→59 (↓13%)',
        '**Grade 10A** — attendance 91%→83% (↓9%)',
        'Issues identified early — take action now',
      ],
    },
  },
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderText(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-gray-900 dark:text-gray-50">{part}</strong>
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
      setCount(Math.round((1 - Math.pow(1 - progress, 3)) * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [active, target, duration])
  return count
}

// ─── Chat Mockup ──────────────────────────────────────────────────────────────

type DemoContent = {
  context: string
  userMsg: string
  aiMsg: readonly string[]
}

const ChatMockup = memo(function ChatMockup({
  demo,
  language,
}: {
  demo: DemoContent
  language: string
}) {
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
    const t1 = setTimeout(() => setTyping(false), 1500)
    const t2 = setTimeout(() => setShowAI(true),  1700)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [demo, language])

  const placeholder = language === 'uz'
    ? 'Savol yozing...'
    : language === 'ru'
      ? 'Задайте вопрос...'
      : 'Ask a question...'

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-gray-200/70 dark:border-gray-700/60 shadow-[0_20px_60px_-10px_rgba(79,70,229,0.15)] dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] bg-white dark:bg-gray-900"
      role="img"
      aria-label="YordamchiAI demo showing contextual AI responses based on your curriculum"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-100/70 dark:bg-gray-800/70 border-b border-gray-200/50 dark:border-gray-700/50">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/80"   aria-hidden="true" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" aria-hidden="true" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" aria-hidden="true" />
        <div className="ml-3 flex-1 bg-white dark:bg-gray-700/50 rounded-md px-3 py-[3px] text-[10px] text-gray-400 dark:text-gray-500 font-mono max-w-[200px] truncate select-none leading-5">
          yordamchi-ai · AI Chat
        </div>
      </div>

      {/* Chat content */}
      <div className="px-4 pt-3.5 pb-3 space-y-3 min-h-[320px]">

        {/* AI header */}
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-100 dark:border-gray-800">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden ring-2 ring-indigo-500/20">
              <img
                src="/asomiddin.jpg"
                alt="Asomiddin AI"
                className="w-full h-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100 leading-none tracking-wider">
              ASOMIDDIN AI
            </p>
            <p className="text-[10px] text-indigo-500 dark:text-indigo-400 leading-none mt-0.5">
              Gemini 2.5 Flash
            </p>
          </div>
        </div>

        {/* Context badge — the key differentiator visual */}
        <div className="flex items-center">
          <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10.5px] font-medium px-2.5 py-1 rounded-lg truncate max-w-full">
            {demo.context}
          </div>
        </div>

        {/* User message */}
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-[12.5px] leading-relaxed px-3.5 py-2.5 rounded-2xl rounded-tr-sm shadow-sm">
            {demo.userMsg}
          </div>
        </div>

        {/* Typing indicator */}
        {typing && (
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex-shrink-0" />
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm inline-flex items-center gap-1.5">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full"
                  style={{ animation: 'bounce 1.0s infinite', animationDelay: `${i * 160}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* AI response */}
        {showAI && (
          <div className={cn(
            'flex items-start gap-2 transition-opacity duration-500',
            showAI ? 'opacity-100' : 'opacity-0',
          )}>
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
            {placeholder}
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
  target, suffix, label, Icon, colorClass, active, className: cls,
}: {
  target: number
  suffix: string
  label: string
  Icon: React.ElementType
  colorClass: string
  active: boolean
  className?: string
}) {
  const count = useCountUp(target, active)
  return (
    <div className={cn('flex flex-col items-center gap-1 px-5 py-4 sm:py-5', cls)}>
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

  // Animation factory — GPU-only, ease-out
  function fu(delay: number) {
    return {
      className: cn(
        'transition-[opacity,transform]',
        prefersReduced ? 'duration-0' : 'duration-700 ease-out',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
      ),
      style: prefersReduced ? {} : { transitionDelay: `${delay}ms` } as React.CSSProperties,
    }
  }

  // Dynamic per-role headline (split by | for gradient treatment)
  const roleTitle =
    activeRole === 'student' ? t.heroTitleStudent :
    activeRole === 'teacher' ? t.heroTitleTeacher :
                               t.heroTitleSchool

  const titleParts  = roleTitle.split('|')
  const titleBefore = titleParts[0] ?? ''
  const titleAccent = titleParts[1] ?? ''

  // Dynamic per-role subtitle → 3 benefit bullets (split on '. ')
  const roleSub =
    activeRole === 'student' ? t.heroSubtitleStudent :
    activeRole === 'teacher' ? t.heroSubtitleTeacher :
                               t.heroSubtitleSchool

  const subtitlePoints = roleSub
    .split(/\.\s+/)
    .map(s => s.replace(/\.$/, '').trim())
    .filter(Boolean)

  const ROLES: { id: Role; label: string; Icon: React.ElementType }[] = [
    { id: 'student', label: t.heroRoleStudent, Icon: GraduationCap  },
    { id: 'teacher', label: t.heroRoleTeacher, Icon: BookOpen        },
    { id: 'school',  label: t.heroRoleSchool,  Icon: LayoutDashboard },
  ]

  const langKey  = (language === 'uz' || language === 'ru' || language === 'en') ? language : 'en'
  const demoData = DEMO[langKey][activeRole]

  // Pre-compute animation states
  const a = {
    tabs:    fu(0),
    h1:      fu(70),
    sub:     fu(145),
    diff:    fu(210),
    proof:   fu(260),
    cta:     fu(320),
    trust:   fu(385),
    urgency: fu(440),
    mockup:  {
      className: cn(
        'relative transition-[opacity,transform]',
        prefersReduced ? 'duration-0' : 'duration-700 ease-out',
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
      ),
      style: prefersReduced
        ? {}
        : { transitionDelay: '160ms', willChange: 'transform, opacity' } as React.CSSProperties,
    },
  }

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pt-8 pb-14 sm:pt-12 sm:pb-16 lg:pt-14 lg:pb-20"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[650px] bg-gradient-to-b from-indigo-100/70 via-violet-50/35 to-transparent dark:from-indigo-950/35 dark:via-violet-950/15 dark:to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[52%_48%] gap-8 lg:gap-12 xl:gap-16 items-start lg:items-center">

          {/* ══ LEFT: COPY ══════════════════════════════════════════════════════ */}
          <div className="flex flex-col items-start">

            {/* 1. ROLE TABS — moved to top: personalize before reading */}
            <div className={a.tabs.className} style={a.tabs.style}>
              <div
                className="inline-flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-2xl mb-7 gap-0.5"
                role="group"
                aria-label="Select your role to personalize the demo"
              >
                {ROLES.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveRole(id)}
                    aria-pressed={activeRole === id}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                      activeRole === id
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. DYNAMIC HEADLINE — role-specific, outcome-focused */}
            <div className={a.h1.className} style={a.h1.style}>
              <h1
                id="hero-heading"
                className="text-[2.1rem] sm:text-5xl lg:text-[3.25rem] xl:text-[3.5rem] font-black text-gray-900 dark:text-gray-50 leading-[1.1] tracking-tight mb-5"
              >
                {titleBefore && (
                  <span className="block">{titleBefore}</span>
                )}
                {titleAccent && (
                  <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent pb-1">
                    {titleAccent}
                  </span>
                )}
              </h1>
            </div>

            {/* 3. ROLE-SPECIFIC BENEFIT BULLETS — outcomes, not features */}
            <div className={a.sub.className} style={a.sub.style}>
              <ul className="space-y-2 mb-5" role="list">
                {subtitlePoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <span className="text-[15px] sm:text-base text-gray-600 dark:text-gray-400 leading-snug">
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 4. CHATGPT DIFFERENTIATION — answers the #1 objection */}
            <div className={a.diff.className} style={a.diff.style}>
              <div className="inline-flex items-center gap-2 text-[12.5px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-1.5 rounded-full mb-4 border border-indigo-200/70 dark:border-indigo-800/50">
                <span aria-hidden="true" className="text-indigo-400 font-black text-[11px] leading-none">≠</span>
                {t.heroDiff}
              </div>
            </div>

            {/* 5. INLINE SOCIAL PROOF — trust before the ask */}
            <div className={a.proof.className} style={a.proof.style}>
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-0.5" aria-label="4.9 out of 5 stars">
                  {[0,1,2,3,4].map(i => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  ))}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{t.heroSocialInline}</span>
              </div>
            </div>

            {/* 6. CTA GROUP — primary impossible to miss, secondary reduces hesitation */}
            <div className={a.cta.className} style={a.cta.style}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 w-full sm:w-auto">
                <Link
                  to={PATHS.REGISTER}
                  className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-[15px] transition-all duration-150 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {t.heroCtaPrimary}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('social-proof')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-[15px] hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 transition-all duration-150"
                >
                  {t.heroCtaDemo}
                </button>
              </div>
            </div>

            {/* 7. TRUST ROW — removes friction after CTA */}
            <div className={a.trust.className} style={a.trust.style}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-gray-400 dark:text-gray-500 mb-3">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  {t.heroBadge}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  {t.heroNoCreditCard.split(' · ')[0]}
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  {t.heroTrustNoInstall}
                </span>
              </div>
            </div>

            {/* 8. URGENCY — pulsing dot + copy, subtle but present */}
            <div className={a.urgency.className} style={a.urgency.style}>
              <p className="flex items-center gap-2 text-[12px] text-amber-600 dark:text-amber-500">
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
                {t.heroUrgency}
              </p>
            </div>
          </div>

          {/* ══ RIGHT: AI DEMO — visual center, most compelling element ════════ */}
          <div className={a.mockup.className} style={a.mockup.style}>
            {/* Glow behind card */}
            <div
              className="absolute -inset-6 bg-gradient-to-br from-indigo-100/60 via-violet-100/30 to-transparent dark:from-indigo-950/30 dark:via-violet-950/15 dark:to-transparent rounded-3xl blur-2xl -z-10 pointer-events-none"
              aria-hidden="true"
            />
            <ChatMockup demo={demoData} language={language} />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Social Proof Section (unchanged) ────────────────────────────────────────

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
      className="scroll-mt-16 border-y border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:flex sm:flex-nowrap sm:items-center sm:justify-center sm:divide-x divide-gray-200 dark:divide-gray-700/60">
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
          {/* Rating — static */}
          <div className="col-span-2 sm:col-span-1 flex flex-col items-center gap-1 px-5 py-4 sm:py-5">
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

// ─── Features Section (unchanged) ─────────────────────────────────────────────

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
