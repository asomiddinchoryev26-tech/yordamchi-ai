import { Link } from 'react-router-dom'
import { APP_NAME } from '@/utils/constants'
import { PATHS } from '@/routes/paths'

const FEATURES = [
  {
    emoji:   '🎓',
    title:   'Talabalar uchun',
    desc:    "AI yordamida shaxsiy o'rganish yo'li, interaktiv testlar va real vaqt tahlili.",
    iconBg:  'bg-blue-50',
  },
  {
    emoji:   '👨‍🏫',
    title:   "O'qituvchilar uchun",
    desc:    "Darslarni boshqarish, talabalar davomati va o'quv natijalarini kuzatish.",
    iconBg:  'bg-indigo-50',
  },
  {
    emoji:   '⚙️',
    title:   'Adminlar uchun',
    desc:    "To'liq platforma nazorati, foydalanuvchilar va tizim sozlamalarini boshqarish.",
    iconBg:  'bg-emerald-50',
  },
] as const

export default function LandingPage() {
  return (
    <div>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-6 py-24 sm:py-32 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-100 mb-6">
          🚀 AI bilan ta&apos;lim yangi darajada
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Bilim olamiga<br className="hidden sm:block" /> xush kelibsiz
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          {APP_NAME} — sun&apos;iy intellekt yordamida o&apos;qituvchilar, talabalar va
          administratorlarni birlashtiruvchi zamonaviy ta&apos;lim platformasi.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            to={PATHS.REGISTER}
            className="px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-md shadow-blue-200"
          >
            Bepul boshlash →
          </Link>
          <Link
            to={PATHS.PRICING}
            className="px-7 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Narxlarni ko&apos;rish
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-gray-50 py-20 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-3">
            Nima uchun {APP_NAME}?
          </h2>
          <p className="text-center text-gray-500 mb-12">
            Har bir foydalanuvchi uchun moslashtirilgan imkoniyatlar
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 ${f.iconBg}`}>
                  {f.emoji}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 text-center bg-white">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Bugun boshlang — bepul!
        </h2>
        <p className="text-gray-500 mb-8 max-w-lg mx-auto">
          Minglab o&apos;qituvchilar va talabalar allaqachon {APP_NAME} bilan
          ta&apos;limni yangi darajaga olib chiqdi.
        </p>
        <Link
          to={PATHS.REGISTER}
          className="inline-flex px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-md shadow-blue-200"
        >
          Hoziroq ro&apos;yxatdan o&apos;ting →
        </Link>
      </section>

    </div>
  )
}
