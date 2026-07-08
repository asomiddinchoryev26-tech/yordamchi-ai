/**
 * pages/student/CertificatesPage.tsx
 * Sertifikatlar — premium glass sahifa (YordamchiAI dizayn tili).
 * Sertifikat PDF'lari "Natijalarim" (Achievements) bo'limida generatsiya qilinadi
 * (mavjud certificate.service — dublikat yaratilmaydi). Bu sahifa o'sha yerga yo'naltiradi.
 */

import { Link } from 'react-router-dom'
import { GraduationCap, ArrowRight, Award } from 'lucide-react'
import { PATHS } from '@/routes/paths'

export default function CertificatesPage() {
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
        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-[70px] opacity-30" style={{ background: '#7C3AED' }} aria-hidden="true" />

        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 relative z-10"
          style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)', boxShadow: '0 8px 24px rgba(124,58,237,0.5)' }}
        >
          <GraduationCap className="w-8 h-8 text-white" aria-hidden="true" />
        </div>

        <h1 className="text-[22px] font-black text-white tracking-tight relative z-10">Sertifikatlar</h1>
        <p className="text-[13.5px] text-white/55 mt-2 leading-relaxed max-w-sm mx-auto relative z-10">
          Yutuqlaringiz uchun sertifikatlar &laquo;Natijalarim&raquo; bo&apos;limida — har bir yutuq uchun
          PDF sertifikatni yuklab olishingiz mumkin.
        </p>

        <Link
          to={PATHS.STUDENT.ACHIEVEMENTS}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] text-white text-[13.5px] font-bold relative z-10 transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)', boxShadow: '0 6px 24px rgba(91,127,255,0.45)' }}
        >
          <Award className="w-4 h-4" aria-hidden="true" />
          Natijalarimga o&apos;tish
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
