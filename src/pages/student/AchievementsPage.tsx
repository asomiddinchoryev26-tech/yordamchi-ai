/**
 * pages/student/AchievementsPage.tsx
 * "Natijalarim" — premium AI-quvvatli rivojlanish tizimi (YordamchiAI dizayn tili).
 * Daraja/XP, tangalar, badge'lar, AI tahlil, reyting, statistika, davomat (kalendar +
 * AI), sertifikatlar. Ma'lumot progress.service'dan (haqiqiy + hisoblangan).
 * Sertifikat PDF — mavjud certificate.service orqali (o'zgarmagan).
 */

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { generateCertificatePDF, buildPeriodLabel, type CertificateData } from '@/services/certificate.service'
import { progressService, type StudentProgress } from '@/services/progress.service'
import {
  AchievementsHeader, LevelCard, CoinsCard, BadgesGrid, AIAnalysisCard,
  LeaderboardCard, StatsSection, AttendanceSection, CertificatesSection, type CertItem,
} from '@/components/student/AchievementsSections'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

type EarnedRow = {
  id: string; earned_at: string; period_year: number; period_month: number
  achievement: { name: Record<string, string>; tier: 'gold' | 'silver' | 'bronze' | 'special'; icon_emoji: string } | null
}

const MONTH_KEYS: (keyof Translations)[] = [
  'mJan','mFeb','mMar','mApr','mMay','mJun','mJul','mAug','mSep','mOct','mNov','mDec',
]

export default function StudentAchievementsPage() {
  const { t } = useLanguage()
  const auth = useAuth()
  const [data,    setData]    = useState<StudentProgress | null>(null)
  const [earned,  setEarned]  = useState<EarnedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!auth.user?.id) return
    setLoading(true); setError(null)
    try {
      const [progress, achRes] = await Promise.all([
        progressService.getStudentProgress(auth.user.id),
        supabase.from('user_achievements')
          .select('id, earned_at, period_year, period_month, achievement:achievement_definitions(name, tier, icon_emoji)')
          .eq('user_id', auth.user.id)
          .order('earned_at', { ascending: false }),
      ])
      setData(progress)
      setEarned((achRes.data ?? []) as unknown as EarnedRow[])
    } catch (e) {
      logger.error('[Achievements] load error:', e)
      setError(t.mpLoadErr)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-create only on user id change; t.* affects error text only
  }, [auth.user?.id])

  useEffect(() => { void load() }, [load])

  // Sertifikat kartalari (earned yutuqlardan)
  const certs: CertItem[] = earned.map(e => ({
    id: e.id,
    title: e.achievement?.name?.uz ?? e.achievement?.name?.en ?? t.achCertificates,
    date: `${t[MONTH_KEYS[(e.period_month ?? 1) - 1]] ?? ''} ${e.period_year ?? ''}`.trim() || new Date(e.earned_at).toLocaleDateString('uz'),
    emoji: e.achievement?.icon_emoji ?? '🏅',
  }))

  const handleDownload = async (id: string) => {
    const item = earned.find(e => e.id === id)
    if (!item) return
    setDownloadingId(id)
    try {
      const cert: CertificateData = {
        studentName:      auth.user?.name ?? t.adStudent,
        achievementTitle: item.achievement?.name?.uz ?? item.achievement?.name?.en ?? t.tdAchievement,
        achievementTier:  item.achievement?.tier ?? 'special',
        achievementEmoji: item.achievement?.icon_emoji ?? '🏅',
        earnedAt:         item.earned_at,
        certId:           item.id,
        periodLabel:      buildPeriodLabel(item.period_year, item.period_month),
      }
      await generateCertificatePDF(cert)
    } catch {
      setError(t.mpLoadErr)
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 pb-10" aria-busy="true">
        <div className="h-12 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.05)', width: '260px' }} />
        {[0, 1, 2].map(i => <div key={i} className="h-32 rounded-[22px] animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', animationDelay: `${i * 0.1}s` }} />)}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-5 pb-10">
        <AchievementsHeader />
        <div role="alert" className="flex flex-col items-center text-center gap-3 py-12 rounded-[22px]"
          style={{ background: 'rgba(11,15,28,0.82)', border: '1px solid rgba(239,68,68,0.22)' }}>
          <AlertCircle className="w-8 h-8 text-red-400" aria-hidden="true" />
          <p className="text-[14px] font-bold text-white/85">{error ?? t.anNoData}</p>
          <button type="button" onClick={() => void load()}
            className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-white" style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)' }}>
            {t.ebRetry}
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div className="space-y-5 pb-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
      <AchievementsHeader />

      {/* Level + Coins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LevelCard p={data.profile} />
        <CoinsCard coins={data.profile.coins} rewards={data.profile.recentRewards} />
      </div>

      {/* AI progress analysis */}
      <AIAnalysisCard ai={data.ai} />

      {/* Badges */}
      <BadgesGrid badges={data.badges} />

      {/* Statistics + weekly chart */}
      <StatsSection stats={data.stats} weekly={data.weekly} />

      {/* Attendance — cards + calendar + AI */}
      <AttendanceSection a={data.attendance} />

      {/* Leaderboard */}
      <LeaderboardCard lb={data.leaderboard} />

      {/* Certificates */}
      <CertificatesSection certs={certs} downloadingId={downloadingId} onDownload={handleDownload} />
    </motion.div>
  )
}
