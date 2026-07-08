/**
 * pages/student/LeaderboardPage.tsx
 * Reyting — premium glass sahifa (YordamchiAI dizayn tili).
 * To'liq reyting jadvali "Natijalarim" (Achievements) bo'limida (LeaderboardCard —
 * mavjud komponent). Bu sahifa o'sha yerga yo'naltiradi (dublikat yaratilmaydi).
 */

import { Link } from 'react-router-dom'
import { Trophy, ArrowRight, Medal } from 'lucide-react'
import { PATHS } from '@/routes/paths'

export default function LeaderboardPage() {
  return (
    <div className="max-w-2xl mx-auto pt-4 sm:pt-8">
      <div
        className="relative overflow-hidden rounded-[24px] p-7 sm:p-9 text-center"
        style={{
          background: 'rgba(11,15,28,0.82)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        }}
      >
        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-[70px] opacity-30" style={{ background: '#F59E0B' }} aria-hidden="true" />

        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 relative z-10"
          style={{ background: 'linear-gradient(135deg,#F59E0B,#EF4444)', boxShadow: '0 8px 24px rgba(245,158,11,0.5)' }}
        >
          <Trophy className="w-8 h-8 text-white" aria-hidden="true" />
        </div>

        <h1 className="text-[22px] font-black text-white tracking-tight relative z-10">Reyting</h1>
        <p className="text-[13.5px] text-white/55 mt-2 leading-relaxed max-w-sm mx-auto relative z-10">
          Guruhingizdagi o&apos;rningizni va umumiy reytingni &laquo;Natijalarim&raquo; bo&apos;limida
          ko&apos;ring — XP va yutuqlar asosida.
        </p>

        <Link
          to={PATHS.STUDENT.ACHIEVEMENTS}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] text-white text-[13.5px] font-bold relative z-10 transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg,#F59E0B,#EF4444)', boxShadow: '0 6px 24px rgba(245,158,11,0.42)' }}
        >
          <Medal className="w-4 h-4" aria-hidden="true" />
          Natijalarimga o&apos;tish
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
