import { useState, useEffect } from 'react'
import { Award, Trophy, Users, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

type AchievementDef = {
  id:          string
  code:        string
  name:        { uz?: string; ru?: string; en?: string }
  description: { uz?: string; ru?: string; en?: string }
  target_role: 'student' | 'teacher'
  tier:        'gold' | 'silver' | 'bronze' | 'special'
  icon_emoji:  string
  is_active:   boolean
  earned_count?: number
}

type TierStat = {
  tier:  'gold' | 'silver' | 'bronze' | 'special'
  label: string
  emoji: string
  count: number
  bg:    string
  text:  string
}

function tierLabel(tier: string) {
  switch (tier) {
    case 'gold':    return 'Oltin'
    case 'silver':  return 'Kumush'
    case 'bronze':  return 'Bronza'
    default:        return 'Maxsus'
  }
}

function tierBadge(tier: string) {
  switch (tier) {
    case 'gold':    return 'bg-amber-100 text-amber-700'
    case 'silver':  return 'bg-slate-100 text-slate-600'
    case 'bronze':  return 'bg-orange-100 text-orange-700'
    default:        return 'bg-violet-100 text-violet-700'
  }
}

export default function AchievementsPage() {
  const [defs,    setDefs]    = useState<AchievementDef[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [filter,  setFilter]  = useState<'all' | 'student' | 'teacher'>('all')

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    setError(null)

    const { data: defsData, error: defsErr } = await supabase
      .from('achievement_definitions')
      .select('id, code, name, description, target_role, tier, icon_emoji, is_active')
      .order('tier')
      .order('code')

    if (defsErr) {
      setError(defsErr.message)
      setLoading(false)
      return
    }

    const { data: earnedData } = await supabase
      .from('user_achievements')
      .select('achievement_id')

    const countMap = new Map<string, number>()
    for (const row of earnedData ?? []) {
      countMap.set(row.achievement_id, (countMap.get(row.achievement_id) ?? 0) + 1)
    }

    setDefs((defsData ?? []).map(d => ({
      ...d,
      name:        d.name        as AchievementDef['name'],
      description: d.description as AchievementDef['description'],
      earned_count: countMap.get(d.id) ?? 0,
    })))

    setLoading(false)
  }

  const filtered = filter === 'all' ? defs : defs.filter(d => d.target_role === filter)

  const tierStats: TierStat[] = [
    { tier: 'gold',    label: 'Oltin',  emoji: '🥇', count: defs.filter(d=>d.tier==='gold').length,    bg: 'bg-amber-50  border-amber-200',  text: 'text-amber-600'  },
    { tier: 'silver',  label: 'Kumush', emoji: '🥈', count: defs.filter(d=>d.tier==='silver').length,  bg: 'bg-slate-50  border-slate-200',  text: 'text-slate-500'  },
    { tier: 'bronze',  label: 'Bronza', emoji: '🥉', count: defs.filter(d=>d.tier==='bronze').length,  bg: 'bg-orange-50 border-orange-200', text: 'text-orange-600' },
    { tier: 'special', label: 'Maxsus', emoji: '⭐',  count: defs.filter(d=>d.tier==='special').length, bg: 'bg-violet-50 border-violet-200', text: 'text-violet-600' },
  ]

  const totalEarned = (defs.reduce((s, d) => s + (d.earned_count ?? 0), 0))

  return (
    <div className="space-y-6 pb-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            Yutuqlar boshqaruvi
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Erishilgan sertifikatlar va medallalar
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Yangilash
        </button>
      </div>

      {/* Tier statistics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {tierStats.map(s => (
          <div key={s.tier} className={cn('rounded-2xl border p-5', s.bg)}>
            <span className="text-2xl">{s.emoji}</span>
            <p className={cn('text-2xl font-bold mt-2', s.text)}>{s.count}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label} yutuq</p>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{defs.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Jami yutuq turlari</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{totalEarned}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Jami berilgan</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit">
        {(['all', 'student', 'teacher'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              filter === f
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60',
            )}
          >
            {f === 'all' ? 'Barchasi' : f === 'student' ? 'Talabalar' : "O'qituvchilar"}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-sm text-red-700 dark:text-red-400">
          Xatolik: {error}
        </div>
      )}

      {/* Achievement list */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-36 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Award className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Yutuqlar topilmadi</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
            Yutuqlar migration fayllarini ishga tushiring
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(def => (
            <div
              key={def.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{def.icon_emoji}</span>
                <div className="flex items-center gap-1.5">
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', tierBadge(def.tier))}>
                    {tierLabel(def.tier)}
                  </span>
                  {!def.is_active && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      Nofaol
                    </span>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">
                {def.name?.uz ?? def.name?.en ?? def.code}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {def.description?.uz ?? def.description?.en ?? ''}
              </p>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <span className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                  def.target_role === 'student'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                )}>
                  {def.target_role === 'student' ? 'Talaba' : "O'qituvchi"}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {def.earned_count ?? 0} marta berilgan
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
