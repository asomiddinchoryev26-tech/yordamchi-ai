import { Link } from 'react-router-dom'
import { APP_NAME } from '@/utils/constants'
import { PATHS } from '@/routes/paths'
import { useLanguage } from '@/contexts/LanguageContext'

const ICON_BG_LIGHT = ['bg-blue-50',    'bg-indigo-50',    'bg-emerald-50'   ] as const
const ICON_BG_DARK  = ['dark:bg-blue-950/60', 'dark:bg-indigo-950/60', 'dark:bg-emerald-950/60'] as const
const EMOJIS        = ['🎓', '👨‍🏫', '⚙️'] as const

export default function LandingPage() {
  const { t } = useLanguage()

  const FEATURES = [
    { title: t.feature1Title, desc: t.feature1Desc, iconBgLight: ICON_BG_LIGHT[0], iconBgDark: ICON_BG_DARK[0], emoji: EMOJIS[0] },
    { title: t.feature2Title, desc: t.feature2Desc, iconBgLight: ICON_BG_LIGHT[1], iconBgDark: ICON_BG_DARK[1], emoji: EMOJIS[1] },
    { title: t.feature3Title, desc: t.feature3Desc, iconBgLight: ICON_BG_LIGHT[2], iconBgDark: ICON_BG_DARK[2], emoji: EMOJIS[2] },
  ]

  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-800 mb-5 sm:mb-6">
          🚀 {t.heroTagline}
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-50 mb-4 sm:mb-6 leading-tight">
          {t.heroTitle}
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-gray-500 dark:text-gray-400 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
          {t.heroSubtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            to={PATHS.REGISTER}
            className="w-full sm:w-auto px-6 sm:px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center transition-colors shadow-md shadow-blue-200 dark:shadow-blue-900/30"
          >
            {t.startFree}
          </Link>
          <Link
            to={PATHS.PRICING}
            className="w-full sm:w-auto px-6 sm:px-7 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t.viewPricing}
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
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
                className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 sm:p-6 hover:shadow-md dark:hover:shadow-gray-900/40 transition-shadow`}
              >
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4 ${f.iconBgLight} ${f.iconBgDark}`}>
                  {f.emoji}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2 text-base sm:text-lg">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 text-center bg-white dark:bg-gray-950">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
          {t.ctaTitle}
        </h2>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-lg mx-auto">
          {t.ctaSubtitle}
        </p>
        <Link
          to={PATHS.REGISTER}
          className="inline-flex w-full sm:w-auto justify-center px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-md shadow-blue-200 dark:shadow-blue-900/30"
        >
          {t.registerNow}
        </Link>
      </section>

    </div>
  )
}
