import { useState, useEffect } from 'react'
import {
  Award, Trophy, Users, RefreshCw,
  Play, CheckCircle, AlertCircle, Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

type AchievementDef = {
  id:          string
  code:        string
  name:        { uz?: string; ru?: string; en?: string }
  description: { uz?: string; ru?: string; en?: string }
  target_role: 'student' | 'teacher'
  tier:        'gold' | 'silver' | 'bronze' | 'special'
  icon_emoji:  string
  is_active:   boolean
  earned_count: number
}

type CycleResult = {
  year:                 number
  month:                number
  snapshots_computed:   number
  achievements_awarded: number
  executed_at:          string
}

type RecentAward = {
  id:               string
  user_name:        string | null
  user_role:        string
  achievement_name: string
  icon_emoji:       string
  tier:             string
  total_score:      number | null
}

// ─── Konstantalar ─────────────────────────────────────────────────────────────

const MONTHS = [
  'Yanvar','Fevral','Mart','Aprel','May','Iyun',
  'Iyul','Avgust','Sentabr','Oktyabr','Noyabr','Dekabr',
]

// ─── Yordamchi funksiyalar ────────────────────────────────────────────────────

function tierLabel(tier: string) {
  switch (tier) {
    case 'gold':   return 'Oltin'
    case 'silver': return 'Kumush'
    case 'bronze': return 'Bronza'
    default:       return 'Maxsus'
  }
}

function tierBadgeClass(tier: string) {
  switch (tier) {
    case 'gold':   return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    case 'silver': return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    case 'bronze': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
    default:       return 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
  }
}

// ═════════════════════════════════════════════════════════════════════════════

export default function AchievementsPage() {
  const now = new Date()
  // Standart: oldingi oy (joriy oy tugamaguncha to'liq emas)
  const defaultYear  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const defaultMonth = now.getMonth() === 0 ? 12 : now.getMonth()

  // ── Achievement ta'riflari ──
  const [defs,    setDefs]    = useState<AchievementDef[]>([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [filter,  setFilter]  = useState<'all' | 'student' | 'teacher'>('all')

  // ── Hisoblash paneli ──
  const [calcYear,   setCalcYear]   = useState(defaultYear)
  const [calcMonth,  setCalcMonth]  = useState(defaultMonth)
  const [running,    setRunning]    = useState(false)
  const [cycleResult, setCycleResult] = useState<CycleResult | null>(null)
  const [cycleErr,   setCycleErr]   = useState<string | null>(null)
  const [recentAwards, setRecentAwards] = useState<RecentAward[]>([])

  useEffect(() => { void loadDefs() }, [])

  // ── Achievement ta'riflarini yuklash ──────────────────────────────────────────
  async function loadDefs() {
    setLoading(true)
    setLoadErr(null)

    const [defsRes, earnedRes] = await Promise.all([
      supabase
        .from('achievement_definitions')
        .select('id, code, name, description, target_role, tier, icon_emoji, is_active')
        .order('tier')
        .order('code'),
      supabase
        .from('user_achievements')
        .select('achievement_id'),
    ])

    if (defsRes.error) {
      setLoadErr(defsRes.error.message)
      setLoading(false)
      return
    }

    const countMap = new Map<string, number>()
    for (const row of earnedRes.data ?? []) {
      countMap.set(row.achievement_id, (countMap.get(row.achievement_id) ?? 0) + 1)
    }

    setDefs(
      (defsRes.data ?? []).map(d => ({
        id:          d.id,
        code:        d.code,
        name:        d.name        as AchievementDef['name'],
        description: d.description as AchievementDef['description'],
        target_role: d.target_role as AchievementDef['target_role'],
        tier:        d.tier        as AchievementDef['tier'],
        icon_emoji:  d.icon_emoji,
        is_active:   d.is_active,
        earned_count: countMap.get(d.id) ?? 0,
      }))
    )
    setLoading(false)
  }

  // ── Oylik hisoblash sikli ─────────────────────────────────────────────────────
  async function runCycle() {
    setRunning(true)
    setCycleErr(null)
    setCycleResult(null)
    setRecentAwards([])

    const { data, error: rpcErr } = await supabase.rpc(
      'run_monthly_achievement_cycle',
      { p_year: calcYear, p_month: calcMonth },
    )

    if (rpcErr) {
      setCycleErr(rpcErr.message)
      setRunning(false)
      return
    }

    // Returns: Record<string, unknown> — ma'lum shakl
    const raw = data as Record<string, unknown>
    const result: CycleResult = {
      year:                 raw['year']                 as number,
      month:                raw['month']                as number,
      snapshots_computed:   raw['snapshots_computed']   as number,
      achievements_awarded: raw['achievements_awarded'] as number,
      executed_at:          raw['executed_at']          as string,
    }
    setCycleResult(result)

    // Shu oy uchun berilgan yutuqlarni yuklash
    const { data: awards } = await supabase
      .from('user_achievements')
      .select(`
        id,
        total_score,
        profiles!user_achievements_user_id_fkey ( full_name, role ),
        achievement_definitions!user_achievements_achievement_id_fkey ( name, icon_emoji, tier )
      `)
      .eq('period_year',  calcYear)
      .eq('period_month', calcMonth)
      .order('total_score', { ascending: false })
      .limit(30)

    setRecentAwards(
      (awards ?? []).map((a: any) => ({
        id:               a.id,
        user_name:        a.profiles?.full_name        ?? null,
        user_role:        a.profiles?.role             ?? 'student',
        achievement_name: (a.achievement_definitions?.name as Record<string,string> | null)?.uz
                          ?? (a.achievement_definitions?.name as Record<string,string> | null)?.en
                          ?? '—',
        icon_emoji:       a.achievement_definitions?.icon_emoji ?? '🏆',
        tier:             a.achievement_definitions?.tier       ?? 'bronze',
        total_score:      a.total_score,
      }))
    )

    // earned_count larni yangilash
    void loadDefs()
    setRunning(false)
  }

  // ── Hisob-kitoblar ────────────────────────────────────────────────────────────

  const filtered = filter === 'all' ? defs : defs.filter(d => d.target_role === filter)

  const tierStats = [
    { tier:'gold',    label:'Oltin',  emoji:'🥇', count: defs.filter(d=>d.tier==='gold').length,    bg:'bg-amber-50  dark:bg-amber-900/20  border-amber-200  dark:border-amber-700',  text:'text-amber-600  dark:text-amber-400'  },
    { tier:'silver',  label:'Kumush', emoji:'🥈', count: defs.filter(d=>d.tier==='silver').length,  bg:'bg-slate-50  dark:bg-slate-800/40  border-slate-200  dark:border-slate-600',  text:'text-slate-500  dark:text-slate-400'  },
    { tier:'bronze',  label:'Bronza', emoji:'🥉', count: defs.filter(d=>d.tier==='bronze').length,  bg:'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700', text:'text-orange-600 dark:text-orange-400' },
    { tier:'special', label:'Maxsus', emoji:'⭐',  count: defs.filter(d=>d.tier==='special').length, bg:'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700', text:'text-violet-600 dark:text-violet-400' },
  ]

  const totalEarned = defs.reduce((s, d) => s + d.earned_count, 0)
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i)

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-6">

      {/* ── Sarlavha ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            Yutuqlar boshqaruvi
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Oylik hisoblash sikli va sertifikatlar
          </p>
        </div>
        <button
          onClick={() => void loadDefs()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Yangilash
        </button>
      </div>

      {/* ══ HISOBLASH PANELI ══ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">

        {/* Panel sarlavhasi */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
              <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Oylik hisoblash sikli
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Tanlangan oy uchun ballar hisoblanadi va yutuqlar avtomatik beriladi
              </p>
            </div>
          </div>
        </div>

        {/* Boshqaruvlar */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">

            {/* Yil */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Yil
              </label>
              <select
                value={calcYear}
                onChange={e => setCalcYear(Number(e.target.value))}
                disabled={running}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 min-w-[90px]"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Oy */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Oy
              </label>
              <select
                value={calcMonth}
                onChange={e => setCalcMonth(Number(e.target.value))}
                disabled={running}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 min-w-[130px]"
              >
                {MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            {/* Hisoblash tugmasi */}
            <button
              onClick={() => void runCycle()}
              disabled={running}
              className={cn(
                'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
                running
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm hover:shadow-md',
              )}
            >
              {running
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Hisoblanmoqda...</>
                : <><Play className="w-4 h-4" /> Hisoblash</>
              }
            </button>

            {/* Tanlangan davr */}
            <p className="text-xs text-gray-400 dark:text-gray-500 pb-2.5">
              {MONTHS[calcMonth - 1]} {calcYear} uchun
            </p>
          </div>

          {/* ── Xatolik ── */}
          {cycleErr && (
            <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">Xatolik yuz berdi</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 font-mono">{cycleErr}</p>
              </div>
            </div>
          )}

          {/* ── Natija ── */}
          {cycleResult && !cycleErr && (
            <div className="mt-5 space-y-4">

              {/* Muvaffaqiyat banneri */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    Hisoblash muvaffaqiyatli tugadi
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                    {MONTHS[cycleResult.month - 1]} {cycleResult.year} •{' '}
                    {new Date(cycleResult.executed_at).toLocaleString('uz-UZ')}
                  </p>
                </div>
              </div>

              {/* Natija statistikasi */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-5 text-center">
                  <p className="text-4xl font-black text-blue-600 dark:text-blue-400 leading-none">
                    {cycleResult.snapshots_computed}
                  </p>
                  <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 mt-2">
                    Snapshot hisoblandi
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    talaba + o'qituvchi
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-5 text-center">
                  <p className="text-4xl font-black text-amber-600 dark:text-amber-400 leading-none">
                    {cycleResult.achievements_awarded}
                  </p>
                  <p className="text-xs font-semibold text-amber-500 dark:text-amber-400 mt-2">
                    Yutuq berildi
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    yangi yoki yangilangan
                  </p>
                </div>
              </div>

              {/* Berilgan yutuqlar ro'yxati */}
              {recentAwards.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    {MONTHS[cycleResult.month - 1]} {cycleResult.year} — berilgan yutuqlar
                  </p>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {recentAwards.map(a => (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700"
                      >
                        <span className="text-xl flex-shrink-0">{a.icon_emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {a.user_name ?? '—'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {a.achievement_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {a.total_score !== null && (
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 tabular-nums">
                              {a.total_score}
                            </span>
                          )}
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', tierBadgeClass(a.tier))}>
                            {tierLabel(a.tier)}
                          </span>
                          <span className={cn(
                            'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                            a.user_role === 'student'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                          )}>
                            {a.user_role === 'student' ? 'Talaba' : "O'qituvchi"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cycleResult.achievements_awarded === 0 && (
                <p className="text-xs text-center text-gray-400 dark:text-gray-500 py-3">
                  Bu oy uchun yutuq berilmadi — ballar yetarli emas yoki hali ma&apos;lumot yo&apos;q
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Tier statistikasi ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {tierStats.map(s => (
          <div key={s.tier} className={cn('rounded-2xl border p-5', s.bg)}>
            <span className="text-2xl">{s.emoji}</span>
            <p className={cn('text-2xl font-bold mt-2', s.text)}>{s.count}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label} yutuq turi</p>
          </div>
        ))}
      </div>

      {/* ── Yig'indi ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{defs.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Jami yutuq turlari</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{totalEarned}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Jami berilgan yutuqlar</p>
          </div>
        </div>
      </div>

      {/* ── Filter ── */}
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

      {/* ── Yuklash xatosi ── */}
      {loadErr && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-sm text-red-700 dark:text-red-400">
          Xatolik: {loadErr}
        </div>
      )}

      {/* ── Achievement ta'riflari ro'yxati ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-36 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Award className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Yutuqlar topilmadi</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
            Avval migratsiyalar (008–010) ni Supabase SQL Editor da ishga tushiring
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
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', tierBadgeClass(def.tier))}>
                    {tierLabel(def.tier)}
                  </span>
                  {!def.is_active && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
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
                <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                  {def.earned_count} marta berilgan
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
