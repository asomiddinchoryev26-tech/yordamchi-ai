import { useState, useEffect } from 'react'
import { Award, Download, Loader2, AlertCircle, Trophy, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import {
  generateCertificatePDF,
  buildPeriodLabel,
  type CertificateData,
} from '@/services/certificate.service'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

type EarnedAchievement = {
  id:           string
  earned_at:    string
  period_year:  number
  period_month: number
  total_score:  number | null
  achievement: {
    name:        Record<string, string>
    description: Record<string, string>
    tier:        'gold' | 'silver' | 'bronze' | 'special'
    icon_emoji:  string
  }
}

// ─── Yordamchi funksiyalar ─────────────────────────────────────────────────────

const TIER_KEY: Record<string, keyof Translations> = {
  gold: 'tdGold', silver: 'tdSilver', bronze: 'tdBronze', special: 'tdSpecial',
}
function tierKey(tier: string): keyof Translations {
  return TIER_KEY[tier] ?? 'tdSpecial'
}

function tierBadgeClass(tier: string) {
  switch (tier) {
    case 'gold':    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    case 'silver':  return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    case 'bronze':  return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
    default:        return 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
  }
}

function tierCardBorder(tier: string) {
  switch (tier) {
    case 'gold':    return 'border-amber-200 dark:border-amber-800/60'
    case 'silver':  return 'border-slate-200 dark:border-slate-600/60'
    case 'bronze':  return 'border-orange-200 dark:border-orange-800/60'
    default:        return 'border-violet-200 dark:border-violet-800/60'
  }
}

function tierGlow(tier: string) {
  switch (tier) {
    case 'gold':    return 'from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10'
    case 'silver':  return 'from-slate-50 to-gray-50 dark:from-slate-800/20 dark:to-gray-800/20'
    case 'bronze':  return 'from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10'
    default:        return 'from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10'
  }
}

const MONTH_KEYS: (keyof Translations)[] = [
  'mJan','mFeb','mMar','mApr','mMay','mJun',
  'mJul','mAug','mSep','mOct','mNov','mDec',
]

// ═════════════════════════════════════════════════════════════════════════════

export default function TeacherAchievementsPage() {
  const auth = useAuth()
  const { t } = useLanguage()

  const [achievements,  setAchievements]  = useState<EarnedAchievement[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    if (!auth.user?.id) return
    void load()
  }, [auth.user?.id])

  async function load() {
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('user_achievements')
      .select(`
        id, earned_at, period_year, period_month, total_score,
        achievement:achievement_definitions(name, description, tier, icon_emoji)
      `)
      .eq('user_id', auth.user!.id)
      .order('earned_at', { ascending: false })

    if (err) {
      setError(t.mpLoadErr)
      setLoading(false)
      return
    }

    setAchievements(
      (data ?? []).map((row: any) => ({
        id:           row.id,
        earned_at:    row.earned_at,
        period_year:  row.period_year,
        period_month: row.period_month,
        total_score:  row.total_score,
        achievement:  row.achievement as EarnedAchievement['achievement'],
      }))
    )
    setLoading(false)
  }

  function handleDownload(item: EarnedAchievement) {
    setDownloadingId(item.id)
    try {
      const certData: CertificateData = {
        studentName:      auth.user?.name ?? t.tdTeacher,
        achievementTitle: item.achievement.name?.uz
                          ?? item.achievement.name?.en
                          ?? t.tdAchievement,
        achievementTier:  item.achievement.tier,
        achievementEmoji: item.achievement.icon_emoji,
        earnedAt:         item.earned_at,
        certId:           item.id,
        periodLabel:      buildPeriodLabel(item.period_year, item.period_month),
      }
      generateCertificatePDF(certData)
    } catch {
      setError(t.mpLoadErr)
    } finally {
      setDownloadingId(null)
    }
  }

  // ─── Skeleton ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="space-y-4 pb-8">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-44 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  )

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-8 max-w-3xl">

      {/* Sarlavha */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Crown className="w-6 h-6 text-amber-500" />
          {t.taMyAch}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {t.taMyAchSub}
        </p>
      </div>

      {/* Xatolik */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Bo'sh holat */}
      {achievements.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-14 text-center">
          <Trophy className="w-12 h-12 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t.tdNoAchYet}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs mx-auto">
            {t.taAchEmptyHint}
          </p>
        </div>
      )}

      {/* Yutuqlar ro'yxati */}
      {achievements.length > 0 && (
        <>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 px-1">
            {achievements.length} {t.tdMoreAchievements}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {achievements.map(item => {
              const title = item.achievement.name?.uz
                         ?? item.achievement.name?.en
                         ?? '—'
              const desc  = item.achievement.description?.uz
                         ?? item.achievement.description?.en
                         ?? ''
              const earnedDate = new Date(item.earned_at)
              const dateStr = `${earnedDate.getDate()} ${t[MONTH_KEYS[earnedDate.getMonth()]]} ${earnedDate.getFullYear()}`

              return (
                <div
                  key={item.id}
                  className={cn(
                    'rounded-2xl border p-5 flex flex-col gap-3 bg-gradient-to-br',
                    tierGlow(item.achievement.tier),
                    tierCardBorder(item.achievement.tier),
                  )}
                >
                  {/* Top row: emoji + tier badge */}
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{item.achievement.icon_emoji}</span>
                    <span className={cn(
                      'text-[10px] font-bold px-2.5 py-1 rounded-full',
                      tierBadgeClass(item.achievement.tier),
                    )}>
                      {t[tierKey(item.achievement.tier)]}
                    </span>
                  </div>

                  {/* Title + description */}
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-snug">
                      {title}
                    </h3>
                    {desc && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {desc}
                      </p>
                    )}
                  </div>

                  {/* Footer: date + score + download */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/60 dark:border-gray-700 mt-auto">
                    <div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">
                        {t[MONTH_KEYS[item.period_month - 1]]} {item.period_year}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {dateStr}
                      </p>
                      {item.total_score !== null && (
                        <p className="text-[10px] font-bold text-gray-600 dark:text-gray-300 mt-0.5">
                          {t.taBall} {item.total_score}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={downloadingId === item.id}
                      onClick={() => handleDownload(item)}
                      className={cn(
                        'flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors',
                        'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
                        'hover:bg-indigo-100 dark:hover:bg-indigo-900/40',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                      )}
                    >
                      {downloadingId === item.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Download className="w-3.5 h-3.5" />
                      }
                      {t.achCertificates}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Ma'lumot banneri */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-4 flex gap-3">
        <Award className="w-5 h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">
            {t.taAboutTitle}
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-500 mt-1">
            {t.taAboutDesc}
          </p>
        </div>
      </div>
    </div>
  )
}
