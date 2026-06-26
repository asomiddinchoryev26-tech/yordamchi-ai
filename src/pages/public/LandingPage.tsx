import { useState, useEffect, useRef, memo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, GraduationCap, Users, Zap, Building2,
  Star, BookOpen, CheckCircle, LayoutDashboard, Send, Lock,
} from 'lucide-react'
import {
  motion,
  AnimatePresence,
  useInView as useInViewFM,
  useReducedMotion,
  MotionConfig,
} from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { PATHS } from '@/routes/paths'
import { APP_NAME } from '@/utils/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'student' | 'teacher' | 'school'

// ─── Motion Variants (stable, defined outside components) ─────────────────────

const STAGGER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.065, delayChildren: 0.06 },
  },
}

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

const FADE_UP = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
}

const FADE_RIGHT = {
  hidden: { opacity: 0, x: 28, y: 10 },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.7, ease: EASE, delay: 0.12 },
  },
}

const STAT_CARD = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: EASE },
  },
}

const STAGGER_STATS = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

// ─── Demo Conversations ───────────────────────────────────────────────────────

const DEMO = {
  uz: {
    student: {
      context: '📚 Algebra · 9-sinf · Kvadrat tenglamalar',
      userMsg: 'Qaysi mavzularda zaif ekanman?',
      aiMsg: [
        'Oxirgi 3 ta test natijangizga ko\'ra:',
        '**Diskriminant hisoblash** — 68% hollarda xato',
        '**Manfiy ildizlar** — 54% hollarda xato',
        'Bu hafta 3 mashq → natijangiz 73%→88% ga ko\'tariladi. Birinchi mashqni boshlaylikmi?',
      ],
    },
    teacher: {
      context: '👩‍🏫 9A guruh · Algebra · O\'zlashtirish: 68%',
      userMsg: '9A uchun algebra bo\'yicha test yarating',
      aiMsg: [
        '9A guruhining zaif tomonlari asosida:',
        '**5 ta savol** — diskriminant (68% xato) va manfiy ildizlar (54% xato)',
        '**Vaqt**: 20 daqiqa · **Baholash**: 1–3 oson, 4–5 qiyin',
        'Testni talabalar sahifasiga hozir jo\'nataylikmi? Natijalar avtomatik baholanadi.',
      ],
    },
    school: {
      context: '🏫 2025–26 o\'quv yili · 847 ta talaba',
      userMsg: 'Kelgusi oy xavfli o\'quvchilarni ko\'rsat',
      aiMsg: [
        'Yanvar tahlili (AI bashorati):',
        '**7 ta talaba** — 3 oy ketma-ket pasayish (7B, 10A sinflari)',
        '**23 ta talaba** — davomat 70% dan past, imtihon 4 haftada',
        'Tegishli o\'qituvchilarga ogohlantirish yuboriladimi?',
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
        '3 упражнения за неделю → результат вырастет с 73% до 88%. Начнём первое?',
      ],
    },
    teacher: {
      context: '👩‍🏫 9А класс · Алгебра · Успеваемость: 68%',
      userMsg: 'Создайте тест по алгебре для 9А',
      aiMsg: [
        'На основе слабых мест класса 9А:',
        '**5 вопросов** — дискриминант (68% ошибок) и отрицательные корни (54% ошибок)',
        '**Время**: 20 минут · **Оценивание**: 1–3 лёгкие, 4–5 сложнее',
        'Отправить тест студентам сейчас? Результаты будут проверены автоматически.',
      ],
    },
    school: {
      context: '🏫 Учебный год 2025–26 · 847 учеников',
      userMsg: 'Покажи учеников в зоне риска на следующий месяц',
      aiMsg: [
        'Январский прогноз (ИИ-анализ):',
        '**7 учеников** — 3 месяца подряд снижение (классы 7Б, 10А)',
        '**23 ученика** — посещаемость ниже 70%, экзамен через 4 недели',
        'Отправить предупреждения учителям?',
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
        '3 exercises this week → your score will go from 73% to 88%. Start the first one now?',
      ],
    },
    teacher: {
      context: "👩‍🏫 Grade 9A · Algebra · Performance: 68%",
      userMsg: 'Create an algebra test for Grade 9A',
      aiMsg: [
        "Based on Grade 9A's weak spots:",
        '**5 questions** — discriminant (68% errors) and negative roots (54% errors)',
        '**Duration**: 20 min · **Grading**: Q1–3 easier, Q4–5 harder',
        'Send the test to students now? Results will be graded automatically.',
      ],
    },
    school: {
      context: '🏫 Academic Year 2025–26 · 847 students',
      userMsg: 'Show at-risk students for next month',
      aiMsg: [
        'January forecast (AI analysis):',
        '**7 students** — 3 months of consistent decline (Grades 7B, 10A)',
        '**23 students** — attendance below 70%, exam in 4 weeks',
        'Send early-warning alerts to their teachers?',
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

// ─── Chat Mockup ─────────────────────────────────────────────────────────────
// Glassmorphism card with rounded-card (24px), premium shadow, smooth animation

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
  const hasPlayed = useRef(false)

  useEffect(() => {
    setShowAI(false)
    setTyping(true)
    if (prefersReduced.current) { setShowAI(true); setTyping(false); return }
    const delay = hasPlayed.current ? 550 : 1300
    const t1 = setTimeout(() => setTyping(false), delay)
    const t2 = setTimeout(() => { setShowAI(true); hasPlayed.current = true }, delay + 180)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [demo, language])

  const placeholder = language === 'uz' ? 'Savol yozing...'
    : language === 'ru' ? 'Задайте вопрос...'
    : 'Ask a question...'

  return (
    <div
      className="relative w-full overflow-hidden border border-white/60 dark:border-white/[0.08]"
      style={{
        borderRadius: '24px',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: '0 24px 64px -8px rgba(91,92,246,0.22), 0 4px 16px -4px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}
      role="img"
      aria-label="YordamchiAI interactive demo: contextual AI knowledge of your specific curriculum"
    >
      {/* Dark mode overlay */}
      <div className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{
          borderRadius: '24px',
          background: 'rgba(15,23,42,0.82)',
          backdropFilter: 'blur(24px) saturate(120%)',
          WebkitBackdropFilter: 'blur(24px) saturate(120%)',
        }}
      />

      {/* Content wrapper (above dark overlay) */}
      <div className="relative">
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-100/60 dark:bg-white/[0.04] border-b border-gray-200/40 dark:border-white/[0.06] select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/80"   aria-hidden="true" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" aria-hidden="true" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" aria-hidden="true" />
          <div className="ml-3 flex-1 bg-white/80 dark:bg-white/[0.06] rounded-md px-3 py-[3px] text-[10px] text-gray-400 dark:text-gray-500 font-mono max-w-[220px] truncate leading-5">
            {APP_NAME} · AI Assistant
          </div>
        </div>

        {/* Chat content */}
        <div className="px-4 pt-3.5 pb-3 space-y-3 min-h-[310px]">

          {/* AI identity header */}
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-gray-100/60 dark:border-white/[0.06]">
            <div className="relative flex-shrink-0">
              {/* Pulsing glow ring behind avatar */}
              <motion.div
                className="absolute -inset-1.5 rounded-full -z-10"
                style={{ background: 'linear-gradient(135deg, #5B5CF6, #7C3AED)' }}
                animate={{ scale: [1, 1.35, 1], opacity: [0.45, 0, 0.45] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden="true"
              />
              <div
                className="relative w-8 h-8 rounded-full flex items-center justify-center overflow-hidden z-10"
                style={{
                  background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)',
                  boxShadow: '0 0 0 2px rgba(91,92,246,0.3), 0 0 16px rgba(91,92,246,0.25)',
                }}
              >
                <img
                  src="/asomiddin.jpg"
                  alt="Asomiddin AI"
                  className="w-full h-full object-cover"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 z-20" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100 leading-none tracking-wider">ASOMIDDIN AI</p>
              <p className="text-[10px] text-brand dark:text-brand-light leading-none mt-0.5">
                {language === 'ru' ? 'Gemini 2.5 Flash · Знает ваш класс' : language === 'en' ? 'Gemini 2.5 Flash · Knows your class' : 'Gemini 2.5 Flash · Sinfingizni biladi'}
              </p>
            </div>
          </div>

          {/* Context badge */}
          <div>
            <div className="inline-flex items-center text-[10.5px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100/70 dark:bg-white/[0.06] px-2.5 py-1 rounded-lg truncate max-w-full border border-gray-200/50 dark:border-white/[0.06]">
              {demo.context}
            </div>
          </div>

          {/* User message */}
          <div className="flex justify-end">
            <div
              className="max-w-[78%] text-white text-[12.5px] leading-relaxed px-3.5 py-2.5 rounded-[18px] rounded-tr-sm"
              style={{
                background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)',
                boxShadow: '0 4px 12px rgba(91,92,246,0.3)',
              }}
            >
              {demo.userMsg}
            </div>
          </div>

          {/* Typing indicator — wave pulse via Framer Motion */}
          <AnimatePresence>
            {typing && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.25 }}
                className="flex items-end gap-2"
                aria-label="AI is thinking"
                aria-live="polite"
              >
                <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)' }} aria-hidden="true" />
                <div className="bg-gray-100 dark:bg-white/[0.07] px-4 py-[11px] rounded-2xl rounded-tl-sm inline-flex items-center gap-[5px]">
                  {[0, 1, 2].map(i => (
                    <motion.span
                      key={i}
                      className="block w-[5px] h-[5px] bg-gray-400 dark:bg-gray-400 rounded-full"
                      animate={{ scale: [0.6, 1, 0.6], opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.2,
                      }}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI response — animated fade-in via AnimatePresence */}
          <AnimatePresence>
            {showAI && (
              <motion.div
                key="ai-response"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="flex items-start gap-2"
              >
                <div className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)' }} aria-hidden="true" />
                <div className="flex-1 bg-gray-50/80 dark:bg-white/[0.05] border border-gray-100/60 dark:border-white/[0.06] px-3.5 py-3 rounded-2xl rounded-tl-sm">
                  {demo.aiMsg.map((line, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.08 }}
                      className={cn('text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed', i > 0 && 'mt-1.5')}
                    >
                      {renderText(line)}
                    </motion.p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Decorative input bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 bg-gray-50/70 dark:bg-white/[0.04] border border-gray-200/50 dark:border-white/[0.06] rounded-[14px] px-3 py-2.5">
            <span className="flex-1 text-[11.5px] text-gray-400 dark:text-gray-500 select-none">{placeholder}</span>
            <div
              className="w-7 h-7 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)' }}
            >
              <Send className="w-3 h-3 text-white" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

// ─── Mobile Compact Demo ──────────────────────────────────────────────────────

function CompactDemo({ demo }: { demo: DemoContent }) {
  return (
    <div
      className="relative lg:hidden overflow-hidden border border-white/60 dark:border-white/[0.08] mb-5"
      style={{
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px -6px rgba(91,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 pointer-events-none hidden dark:block rounded-[20px]"
        style={{ background: 'rgba(15,23,42,0.82)' }}
      />
      <div className="relative">
        {/* Context bar */}
        <div className="flex items-center gap-1.5 bg-gray-50/50 dark:bg-white/[0.03] px-3 py-2 border-b border-gray-100/50 dark:border-white/[0.05]">
          <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #5B5CF6, #7C3AED)' }} />
          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate">{demo.context}</span>
        </div>
        {/* Messages */}
        <div className="px-3 py-3 space-y-2.5">
          <div className="flex justify-end">
            <div className="max-w-[82%] text-white text-[11.5px] leading-relaxed px-3 py-2 rounded-[16px] rounded-tr-sm"
              style={{ background: 'linear-gradient(135deg, #5B5CF6, #7C3AED)' }}>
              {demo.userMsg}
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <div className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg, #5B5CF6, #7C3AED)' }} />
            <div className="flex-1 bg-gray-50/70 dark:bg-white/[0.04] border border-gray-100/50 dark:border-white/[0.05] px-3 py-2.5 rounded-2xl rounded-tl-sm">
              {demo.aiMsg.slice(0, 3).map((line, i) => (
                <p key={i} className={cn('text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed', i > 0 && 'mt-1')}>
                  {renderText(line)}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Premium Stat Card ────────────────────────────────────────────────────────

interface StatCardProps {
  target: number
  suffix?: string
  label: string
  Icon: React.ElementType
  iconBg: string
  iconColor: string
  gradientClass: string
}

function StatCard({ target, suffix = '', label, Icon, iconBg, iconColor, gradientClass }: StatCardProps) {
  const ref  = useRef<HTMLDivElement>(null)
  const isInView = useInViewFM(ref, { once: true, amount: 0.3 })
  const count = useCountUp(target, isInView)

  return (
    <motion.div
      ref={ref}
      variants={STAT_CARD}
      whileHover={{ y: -5, scale: 1.015 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="relative bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-white/[0.07] p-6 overflow-hidden group cursor-default rounded-card shadow-soft hover:shadow-large"
    >
      {/* Gradient top accent */}
      <div className={`absolute top-0 inset-x-0 h-[2.5px] ${gradientClass}`} />

      {/* Icon */}
      <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center mb-5`}>
        <Icon className={`w-6 h-6 ${iconColor}`} aria-hidden="true" />
      </div>

      {/* Value */}
      <div className="text-[2.25rem] font-black text-gray-900 dark:text-white tabular-nums leading-none mb-2 tracking-tight">
        {count.toLocaleString()}{suffix}
      </div>

      {/* Label */}
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-snug">{label}</p>

      {/* Hover bottom bar */}
      <div className={`absolute bottom-0 inset-x-0 h-[3px] ${gradientClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </motion.div>
  )
}

function RatingCard({ label }: { label: string }) {
  return (
    <motion.div
      variants={STAT_CARD}
      whileHover={{ y: -5, scale: 1.015 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="relative bg-white dark:bg-gray-900/80 border border-gray-100 dark:border-white/[0.07] p-6 overflow-hidden group cursor-default rounded-card shadow-soft hover:shadow-large"
    >
      <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-amber-400 to-orange-400" />
      <div className="flex items-center gap-0.5 mb-5">
        {[0,1,2,3,4].map(i => (
          <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" aria-hidden="true" />
        ))}
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-[2.25rem] font-black text-gray-900 dark:text-white leading-none tracking-tight">4.9</span>
        <span className="text-base font-semibold text-gray-400 dark:text-gray-500">/5</span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-snug">{label}</p>
      <div className="absolute bottom-0 inset-x-0 h-[3px] bg-gradient-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  )
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  const { t, language } = useLanguage()
  const [activeRole, setActiveRole] = useState<Role>('student')
  const shouldReduce = useReducedMotion()

  const roleTitle =
    activeRole === 'student' ? t.heroTitleStudent :
    activeRole === 'teacher' ? t.heroTitleTeacher :
                               t.heroTitleSchool
  const [titleBefore, titleAccent] = roleTitle.split('|')

  const roleSub =
    activeRole === 'student' ? t.heroSubtitleStudent :
    activeRole === 'teacher' ? t.heroSubtitleTeacher :
                               t.heroSubtitleSchool
  const bullets = roleSub.split(/\.\s+/).map(s => s.replace(/\.$/, '').trim()).filter(Boolean)

  const roleCta =
    activeRole === 'student' ? t.heroCtaStudentAction :
    activeRole === 'teacher' ? t.heroCtaTeacherAction :
                               t.heroCtaSchoolAction

  const ROLES: { id: Role; label: string; Icon: React.ElementType }[] = [
    { id: 'student', label: t.heroRoleStudent, Icon: GraduationCap  },
    { id: 'teacher', label: t.heroRoleTeacher, Icon: BookOpen        },
    { id: 'school',  label: t.heroRoleSchool,  Icon: LayoutDashboard },
  ]

  const langKey  = (language === 'uz' || language === 'ru' || language === 'en') ? language : 'en'
  const demoData = DEMO[langKey][activeRole]

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pt-8 pb-14 sm:pt-10 sm:pb-16 lg:pt-14 lg:pb-20"
    >
      {/* Multi-layer ambient glow — creates depth */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Primary center glow — top */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(91,92,246,0.16) 0%, rgba(124,58,237,0.08) 35%, transparent 65%)',
            filter: 'blur(72px)',
          }}
        />
        {/* Right accent glow */}
        <div
          className="absolute -top-8 right-[2%] w-[480px] h-[420px] rounded-full opacity-60"
          style={{
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.18) 0%, transparent 65%)',
            filter: 'blur(64px)',
          }}
        />
        {/* Bottom-left warmth */}
        <div
          className="absolute -bottom-8 -left-16 w-[380px] h-[320px] rounded-full opacity-35"
          style={{
            background: 'radial-gradient(ellipse, rgba(91,92,246,0.14) 0%, transparent 70%)',
            filter: 'blur(56px)',
          }}
        />
      </div>

      {/* Decorative floating dots — desktop only, very subtle */}
      <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <motion.div
          className="absolute hidden lg:block top-20 right-[46%] w-[11px] h-[11px] rounded-full"
          style={{ background: 'rgba(91,92,246,0.45)', boxShadow: '0 0 10px rgba(91,92,246,0.5)' }}
          animate={{ y: [0, -14, 0], opacity: [0.7, 0.25, 0.7] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute hidden lg:block top-52 right-[41%] w-[7px] h-[7px] rounded-full"
          style={{ background: 'rgba(124,58,237,0.5)', boxShadow: '0 0 7px rgba(124,58,237,0.45)' }}
          animate={{ y: [0, -10, 0], opacity: [0.6, 0.15, 0.6] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />
        <motion.div
          className="absolute hidden lg:block bottom-20 right-[48%] w-[9px] h-[9px] rounded-full"
          style={{ background: 'rgba(139,92,246,0.4)', boxShadow: '0 0 8px rgba(139,92,246,0.4)' }}
          animate={{ y: [0, -12, 0], opacity: [0.5, 0.1, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[52%_48%] gap-8 lg:gap-12 xl:gap-16 items-start lg:items-center">

          {/* ══ LEFT: COPY ══════════════════════════════════════════════════ */}
          <motion.div
            className="flex flex-col items-start"
            variants={shouldReduce ? undefined : STAGGER}
            initial={shouldReduce ? false : 'hidden'}
            animate={shouldReduce ? false : 'show'}
          >

            {/* Role selector */}
            <motion.div variants={FADE_UP}>
              <div
                className="inline-flex bg-gray-100/80 dark:bg-white/[0.06] p-1 rounded-2xl mb-6 gap-0.5"
                role="group"
                aria-label="Select your role to personalise the demo"
              >
                {ROLES.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveRole(id)}
                    aria-pressed={activeRole === id}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                      activeRole === id
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-soft'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div variants={FADE_UP}>
              <h1
                id="hero-heading"
                className="text-[2.1rem] sm:text-5xl lg:text-[3.2rem] xl:text-[3.45rem] font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight mb-5"
              >
                {titleBefore && <span className="block">{titleBefore}</span>}
                {titleAccent && (
                  <span
                    className="block pb-1"
                    style={{
                      background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 60%, #8B5CF6 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {titleAccent}
                  </span>
                )}
              </h1>
            </motion.div>

            {/* Mobile compact demo */}
            <motion.div variants={FADE_UP}>
              <CompactDemo demo={demoData} />
            </motion.div>

            {/* Benefit bullets */}
            <motion.div variants={FADE_UP}>
              <ul className="space-y-2.5 mb-5" role="list">
                {bullets.map((point, i) => (
                  <li
                    key={i}
                    className={cn('flex items-start gap-2.5', i === 2 && 'hidden sm:flex')}
                  >
                    <CheckCircle className="w-4 h-4 text-brand mt-[3px] flex-shrink-0" aria-hidden="true" />
                    <span className="text-[15px] sm:text-[15.5px] text-gray-600 dark:text-gray-400 leading-snug">{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* ChatGPT differentiation chip */}
            <motion.div variants={FADE_UP}>
              <div
                className="inline-flex items-center gap-2 text-[12.5px] font-medium px-3.5 py-1.5 rounded-full mb-5 border"
                style={{
                  color: '#5B5CF6',
                  background: 'rgba(91,92,246,0.07)',
                  borderColor: 'rgba(91,92,246,0.2)',
                }}
              >
                <span aria-hidden="true" className="font-black text-[11px] opacity-60">≠</span>
                {t.heroDiff}
              </div>
            </motion.div>

            {/* Inline social proof */}
            <motion.div variants={FADE_UP}>
              <div className="flex items-center gap-2 mb-5">
                <div className="flex items-center gap-0.5" aria-label="4.9 out of 5 stars">
                  {[0,1,2,3,4].map(i => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  ))}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{t.heroSocialInline}</span>
              </div>
            </motion.div>

            {/* CTA — gradient button with FM hover */}
            <motion.div variants={FADE_UP} className="w-full sm:w-auto">
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="w-full sm:w-auto mb-3"
              >
                <Link
                  to={PATHS.REGISTER}
                  className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 text-white font-bold text-[15px] transition-opacity duration-150 hover:opacity-92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  style={{
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)',
                    boxShadow: '0 8px 24px rgba(91,92,246,0.38), 0 2px 8px rgba(91,92,246,0.2)',
                  }}
                >
                  {roleCta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" aria-hidden="true" />
                </Link>
              </motion.div>

              <p className="text-[13px] text-gray-400 dark:text-gray-500">
                {t.heroAlreadyUser}{' '}
                <Link to={PATHS.LOGIN} className="text-brand dark:text-brand-light font-medium hover:underline underline-offset-2">
                  {t.login}
                </Link>
              </p>
            </motion.div>

            {/* Trust row */}
            <motion.div variants={FADE_UP}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-gray-400 dark:text-gray-500 mt-4 mb-3">
                <span className="inline-flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-brand/60" aria-hidden="true" />
                  {t.heroBadge}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                  {t.heroNoCreditCard.split(' · ')[0]}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                  {t.heroTrustNoInstall}
                </span>
              </div>
            </motion.div>

            {/* Urgency */}
            <motion.div variants={FADE_UP}>
              <p className="flex items-center gap-2 text-[12px] text-warning dark:text-amber-500">
                <span className="relative flex h-2 w-2 flex-shrink-0" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
                {t.heroUrgency}
              </p>
            </motion.div>
          </motion.div>

          {/* ══ RIGHT: AI DEMO — entrance + continuous float ════════════════ */}
          <motion.div
            variants={shouldReduce ? undefined : FADE_RIGHT}
            initial={shouldReduce ? false : 'hidden'}
            animate={shouldReduce ? false : 'show'}
          >
            {/* Float wrapper (nested motion for continuous y oscillation) */}
            <motion.div
              animate={shouldReduce ? {} : { y: [0, -9, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.0 }}
            >
              {/* Enhanced double-layer glow behind card */}
              <div className="relative">
                {/* Primary glow */}
                <div
                  className="absolute -inset-8 rounded-[40px] -z-10 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at 40% 40%, rgba(91,92,246,0.22) 0%, rgba(124,58,237,0.12) 35%, transparent 65%)',
                    filter: 'blur(28px)',
                  }}
                  aria-hidden="true"
                />
                {/* Secondary glow — opposite corner */}
                <div
                  className="absolute -inset-8 rounded-[40px] -z-10 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at 70% 70%, rgba(139,92,246,0.16) 0%, transparent 60%)',
                    filter: 'blur(36px)',
                  }}
                  aria-hidden="true"
                />
                <ChatMockup demo={demoData} language={language} />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── Premium Statistics Section ───────────────────────────────────────────────

function StatsSection() {
  const { t } = useLanguage()

  const STATS: StatCardProps[] = [
    {
      target: 1200, suffix: '+', label: t.statStudentsLabel,
      Icon: GraduationCap,
      iconBg: 'bg-brand/10 dark:bg-brand/15',
      iconColor: 'text-brand',
      gradientClass: 'bg-gradient-to-r from-[#5B5CF6] to-[#7C3AED]',
    },
    {
      target: 85, suffix: '+', label: t.statTeachersLabel,
      Icon: Users,
      iconBg: 'bg-violet-100 dark:bg-violet-900/30',
      iconColor: 'text-violet-600 dark:text-violet-400',
      gradientClass: 'bg-gradient-to-r from-violet-500 to-purple-600',
    },
    {
      target: 8400, suffix: '+', label: t.statConversationsLabel,
      Icon: Zap,
      iconBg: 'bg-amber-100 dark:bg-amber-900/25',
      iconColor: 'text-amber-600 dark:text-amber-400',
      gradientClass: 'bg-gradient-to-r from-amber-400 to-orange-500',
    },
    {
      target: 12, suffix: '', label: t.statCentersLabel,
      Icon: Building2,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/25',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      gradientClass: 'bg-gradient-to-r from-emerald-500 to-green-600',
    },
  ]

  return (
    <section
      id="social-proof"
      aria-label="Platform statistics"
      className="scroll-mt-16 py-12 sm:py-16 border-y border-gray-100 dark:border-white/[0.05] relative overflow-hidden bg-[#F8F9FF] dark:bg-[#0F172A]"
    >
      {/* Light-mode gradient depth overlay */}
      <div
        className="absolute inset-0 pointer-events-none dark:hidden"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(91,92,246,0.06) 0%, transparent 60%)' }}
        aria-hidden="true"
      />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4"
          variants={STAGGER_STATS}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {STATS.map(props => (
            <StatCard key={props.label} {...props} />
          ))}
          <RatingCard label={t.statRatingLabel} />
        </motion.div>
      </div>
    </section>
  )
}

// ─── Features Section (unchanged visually) (unchanged visually) ────────────────────────────────────

function FeaturesSection() {
  const { t } = useLanguage()
  const FEATURES = [
    { title: t.feature1Title, desc: t.feature1Desc, Icon: GraduationCap, iconBg: 'bg-brand/10 dark:bg-brand/15', iconColor: 'text-brand' },
    { title: t.feature2Title, desc: t.feature2Desc, Icon: Users, iconBg: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600 dark:text-violet-400' },
    { title: t.feature3Title, desc: t.feature3Desc, Icon: LayoutDashboard, iconBg: 'bg-emerald-100 dark:bg-emerald-900/25', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  ]

  return (
    <section className="bg-gray-50 dark:bg-gray-900/50 py-14 sm:py-20 border-t border-gray-100 dark:border-white/[0.05]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center text-gray-900 dark:text-white mb-2 sm:mb-3">
          {t.whyTitle.replace('YordamchiAI', APP_NAME)}
        </h2>
        <p className="text-center text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-8 sm:mb-12">{t.whySubtitle}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {FEATURES.map(f => (
            <motion.div
              key={f.title}
              whileHover={{
                y: -6,
                scale: 1.015,
                boxShadow: '0 0 0 1.5px rgba(91,92,246,0.28), 0 16px 44px -6px rgba(91,92,246,0.14), 0 4px 12px -2px rgba(0,0,0,0.05)',
              }}
              initial={{
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
              }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative bg-white dark:bg-gray-900/80 rounded-card border border-gray-100 dark:border-white/[0.06] p-5 sm:p-6 cursor-default overflow-hidden group"
            >
              {/* Gradient top accent — appears on hover */}
              <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-brand to-brand-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className={cn('w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110', f.iconBg)}>
                <f.Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', f.iconColor)} aria-hidden="true" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-base sm:text-lg">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </motion.div>
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
    <MotionConfig reducedMotion="user">
      <div className="overflow-x-hidden">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />

        {/* Final CTA */}
        <section className="py-14 sm:py-20 px-4 sm:px-6 text-center bg-white dark:bg-[#0F172A] relative overflow-hidden">
          {/* Radial glow centered on CTA */}
          <div
            className="absolute inset-0 pointer-events-none dark:hidden"
            style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(91,92,246,0.07) 0%, transparent 55%)' }}
            aria-hidden="true"
          />
          <div className="relative">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            {t.ctaTitle}
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-lg mx-auto">
            {t.ctaSubtitle}
          </p>
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="inline-flex w-full sm:w-auto justify-center"
          >
            <Link
              to={PATHS.REGISTER}
              className="inline-flex w-full sm:w-auto justify-center items-center gap-2 px-8 py-4 text-white font-semibold transition-opacity hover:opacity-90"
              style={{
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)',
                boxShadow: '0 8px 24px rgba(91,92,246,0.35)',
              }}
            >
              {t.registerNow}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </motion.div>
          </div>
        </section>
      </div>
    </MotionConfig>
  )
}
