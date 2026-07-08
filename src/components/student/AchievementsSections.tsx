/**
 * components/student/AchievementsSections.tsx
 * "Natijalarim" sahifasi premium bo'limlari (YordamchiAI dizayn tili).
 * Prop-driven / presentational — ma'lumot progress.service'dan keladi.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Trophy, Star, Coins, BookOpen, ClipboardCheck, Brain, Clock,
  CalendarDays, CalendarClock, TrendingUp, Medal, Sparkles,
  Award, Download, CheckCircle2, XCircle, Clock3, Lock,
} from 'lucide-react'
import type {
  ProgressProfile, Badge, StatsSummary, WeeklyPoint, AttendanceAnalytics,
  Leaderboard, AIProgressAnalysis, RewardKind,
} from '@/services/progress.service'
import { useLanguage } from '@/contexts/LanguageContext'

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]
const GLASS = {
  background: 'rgba(11,15,28,0.82)',
  backdropFilter: 'blur(28px) saturate(200%)',
  WebkitBackdropFilter: 'blur(28px) saturate(200%)',
  border: '1px solid rgba(255,255,255,0.08)',
} as const

function SectionHead({ color, Icon, title, extra }: { color: string; Icon: typeof Trophy; title: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-3.5">
      <div className="w-7 h-7 rounded-[9px] flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}25`, boxShadow: `0 0 10px ${color}12` }}>
        <Icon className="w-4 h-4" style={{ color }} aria-hidden="true" />
      </div>
      <h2 className="text-[15px] font-bold text-white/85 tracking-tight">{title}</h2>
      {extra && <div className="ml-auto">{extra}</div>}
    </div>
  )
}

// ── clock ──
function snap() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tashkent', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date())
  const g = (t: string) => p.find(x => x.type === t)?.value ?? '00'
  const h = g('hour') === '24' ? '00' : g('hour')
  return { date: `${g('day')}.${g('month')}.${g('year')}`, time: `${h}:${g('minute')}:${g('second')}` }
}
function useClock() { const [s, setS] = useState(snap); useEffect(() => { const id = setInterval(() => setS(snap()), 1000); return () => clearInterval(id) }, []); return s }

// ═══ Header ═══
export function AchievementsHeader() {
  const { date, time } = useClock()
  const { t } = useLanguage()
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#F59E0B,#7C3AED)', boxShadow: '0 0 20px rgba(245,158,11,0.35)' }}>
          <Trophy className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-[22px] font-black text-white tracking-tight">{t.achTitle}</h1>
          <p className="text-[12.5px] text-white/45 mt-0.5">{t.achSubtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold text-white/70" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <CalendarClock className="w-3.5 h-3.5 text-white/40" aria-hidden="true" />{date}
        </div>
        <div className="inline-flex items-center px-3 py-1.5 rounded-xl text-[13px] font-bold tabular-nums" style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.22)', color: '#C7D2FE', textShadow: '0 0 12px rgba(165,180,252,0.5)' }}>{time}</div>
      </div>
    </header>
  )
}

// ═══ 1) Level + XP ═══
export function LevelCard({ p }: { p: ProgressProfile }) {
  const { t } = useLanguage()
  return (
    <div className="rounded-[22px] p-5 relative overflow-hidden" style={{ ...GLASS, border: '1px solid rgba(124,58,237,0.28)' }}>
      <div className="absolute -top-16 -right-10 w-44 h-44 rounded-full blur-[70px] opacity-40" style={{ background: '#7C3AED' }} aria-hidden="true" />
      <div className="relative flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)', boxShadow: '0 8px 24px rgba(124,58,237,0.5)' }}>
          <span className="text-[10px] font-bold text-white/70 leading-none">LVL</span>
          <span className="text-[24px] font-black text-white leading-none">{p.level}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,0.18)', color: '#C4B5FD', border: '1px solid rgba(167,139,250,0.3)' }}>{p.rank}</span>
            <span className="inline-flex items-center gap-1 text-[14px] font-black text-white"><Star className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />{p.xp.toLocaleString()} XP</span>
          </div>
          <p className="text-[12px] text-white/50 mt-2">{t.achNextLevel} <span className="font-bold text-white/80">{p.xpToNext} XP {t.achLeft}</span></p>
          <div className="h-2.5 rounded-full overflow-hidden mt-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#5B7FFF,#A78BFA,#7C3AED)', boxShadow: '0 0 12px rgba(124,58,237,0.7)' }}
              initial={{ width: 0 }} animate={{ width: `${p.progressPct}%` }} transition={{ duration: 0.9, ease: EASE }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══ 2) Coins ═══
const REWARD_ICON: Record<RewardKind, typeof Coins> = { lesson: BookOpen, assignment: ClipboardCheck, attendance: CalendarDays, test: Star }
export function CoinsCard({ coins, rewards }: { coins: number; rewards: ProgressProfile['recentRewards'] }) {
  const { t } = useLanguage()
  return (
    <div className="rounded-[22px] p-5" style={GLASS}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#F59E0B,#FBBF24)', boxShadow: '0 0 18px rgba(245,158,11,0.4)' }}>
          <Coins className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[11px] text-white/45 font-medium">{t.achMyCoins}</p>
          <p className="text-[22px] font-black text-amber-300 tabular-nums leading-none">🪙 {coins.toLocaleString()}</p>
        </div>
      </div>
      {rewards.length > 0 && (
        <div className="space-y-1.5 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 pt-1">{t.achRecentRewards}</p>
          {rewards.map(r => {
            const Icon = REWARD_ICON[r.kind]
            return (
              <div key={r.id} className="flex items-center gap-2.5">
                <Icon className="w-3.5 h-3.5 text-white/40 flex-shrink-0" aria-hidden="true" />
                <span className="text-[12px] text-white/60 flex-1 truncate">{r.label}</span>
                <span className="text-[12px] font-bold text-emerald-400">+{r.amount}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══ 3) Badges ═══
const TIER_COLOR: Record<Badge['tier'], string> = { gold: '#F59E0B', silver: '#94A3B8', bronze: '#D97706', special: '#A78BFA' }
export function BadgesGrid({ badges }: { badges: Badge[] }) {
  const { t } = useLanguage()
  const unlockedCount = badges.filter(b => b.unlocked).length
  return (
    <section>
      <SectionHead color="#F59E0B" Icon={Medal} title={t.achBadges} extra={<span className="text-[11px] font-semibold text-white/35">{unlockedCount}/{badges.length}</span>} />
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {badges.map(b => {
          const c = TIER_COLOR[b.tier]
          return (
            <motion.div key={b.code} whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="rounded-[18px] p-4 flex flex-col items-center text-center relative overflow-hidden"
              style={{ ...GLASS, opacity: b.unlocked ? 1 : 0.55, border: b.unlocked ? `1px solid ${c}40` : '1px solid rgba(255,255,255,0.07)' }}>
              {b.unlocked && <div className="absolute -inset-px rounded-[18px] pointer-events-none" style={{ boxShadow: `inset 0 0 0 1px ${c}30, 0 0 22px ${c}18` }} aria-hidden="true" />}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2 relative"
                style={{ background: b.unlocked ? `${c}1f` : 'rgba(255,255,255,0.05)', border: `1px solid ${b.unlocked ? c + '40' : 'rgba(255,255,255,0.08)'}` }}>
                {b.unlocked ? b.emoji : <Lock className="w-5 h-5 text-white/30" aria-hidden="true" />}
              </div>
              <p className="text-[12px] font-bold text-white/85 leading-snug">{b.title}</p>
              <p className="text-[10px] text-white/35 mt-0.5 leading-snug">{b.hint}</p>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

// ═══ 4) AI progress analysis ═══
export function AIAnalysisCard({ ai }: { ai: AIProgressAnalysis }) {
  const { t } = useLanguage()
  return (
    <div className="rounded-[22px] p-5" style={{ background: 'linear-gradient(135deg, rgba(91,127,255,0.09), rgba(124,58,237,0.13))', border: '1px solid rgba(124,58,237,0.25)' }}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)' }}><Brain className="w-4 h-4 text-[#C4B5FD]" aria-hidden="true" /></div>
        <span className="text-[13px] font-bold text-white/85">{t.achAIRec}</span>
      </div>
      <p className="text-[13px] text-white/75 leading-relaxed">{ai.text}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        {ai.strong.map(s => <span key={s} className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.14)', color: '#86efac', border: '1px solid rgba(34,197,94,0.25)' }}>💪 {s}</span>)}
        {ai.weak.map(s => <span key={s} className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.14)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.25)' }}>📈 {s}</span>)}
      </div>
    </div>
  )
}

// ═══ 5) Leaderboard ═══
export function LeaderboardCard({ lb }: { lb: Leaderboard }) {
  const { t } = useLanguage()
  return (
    <section>
      <SectionHead color="#22D3EE" Icon={TrendingUp} title={t.achRating} />
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-[16px] p-4" style={GLASS}>
          <p className="text-[11px] text-white/45">{t.achClassRank}</p>
          <p className="text-[20px] font-black text-white">#{lb.classRank} <span className="text-[13px] text-white/40 font-semibold">/ {lb.classTotal}</span></p>
        </div>
        <div className="rounded-[16px] p-4" style={GLASS}>
          <p className="text-[11px] text-white/45">{t.achSchoolRank}</p>
          <p className="text-[20px] font-black text-white">#{lb.schoolRank}</p>
        </div>
      </div>
      <div className="rounded-[16px] p-2.5 space-y-1" style={GLASS}>
        {lb.entries.map((e, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-xl" style={e.isSelf ? { background: 'rgba(91,127,255,0.12)', border: '1px solid rgba(91,127,255,0.25)' } : undefined}>
            <span className="w-6 text-center text-[12px] font-black text-white/50">{i + 1}</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black text-white" style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)' }}>{e.name.charAt(0)}</div>
            <span className="flex-1 text-[13px] font-semibold text-white/85 truncate">{e.name}</span>
            <span className="text-[12px] font-bold text-amber-300 tabular-nums">🪙 {e.coins}</span>
            <span className="text-[12px] font-bold text-[#93BBFF] tabular-nums">{e.xp} XP</span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ═══ 7) Statistics + weekly chart ═══
function MiniBars({ data, color }: { data: WeeklyPoint[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end justify-between gap-1.5 h-24 mt-1">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
            <motion.div className="w-full rounded-[4px]" style={{ background: `linear-gradient(180deg,${color},${color}55)` }}
              initial={{ height: 2 }} whileInView={{ height: `${Math.max(6, (d.value / max) * 100)}%` }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }} />
          </div>
          <span className="text-[9.5px] text-white/35">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
export function StatsSection({ stats, weekly }: { stats: StatsSummary; weekly: WeeklyPoint[] }) {
  const { t } = useLanguage()
  const cards = [
    { label: t.achCompletedLessons, value: String(stats.completedLessons), Icon: BookOpen,       color: '#5B7FFF' },
    { label: t.achAssignments,      value: String(stats.finishedAssignments), Icon: ClipboardCheck, color: '#22C55E' },
    { label: t.achAvgAIScore,       value: `${stats.avgAIScore}%`, Icon: Brain, color: '#A78BFA' },
    { label: t.achStudyHours,       value: `${stats.studyHours}${t.achHourShort}`, Icon: Clock, color: '#22D3EE' },
    { label: t.achAttendance,       value: `${stats.attendancePct}%`, Icon: CalendarDays, color: '#F59E0B' },
  ]
  return (
    <section>
      <SectionHead color="#5B7FFF" Icon={Sparkles} title={t.navStats} />
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 mb-3">
        {cards.map(c => (
          <div key={c.label} className="rounded-[16px] p-3.5" style={GLASS}>
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center mb-2" style={{ background: `${c.color}18`, border: `1px solid ${c.color}30` }}>
              <c.Icon className="w-4 h-4" style={{ color: c.color }} aria-hidden="true" />
            </div>
            <p className="text-[19px] font-black tabular-nums" style={{ color: c.color }}>{c.value}</p>
            <p className="text-[10.5px] text-white/40 font-medium mt-0.5 leading-snug">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-[18px] p-4" style={GLASS}>
        <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-3.5 h-3.5 text-[#93BBFF]" aria-hidden="true" /><p className="text-[12px] font-bold text-white/70">{t.achWeeklyActivity}</p></div>
        <MiniBars data={weekly} color="#5B7FFF" />
      </div>
    </section>
  )
}

// ═══ 8) Attendance ═══
const ATT_COLOR = { present: '#22C55E', absent: '#EF4444', late: '#F59E0B', excused: '#6366F1', none: 'rgba(255,255,255,0.05)' } as const
export function AttendanceSection({ a }: { a: AttendanceAnalytics }) {
  const { t } = useLanguage()
  const cards = [
    { label: t.achAttendance, value: `${a.pct}%`,                     Icon: CalendarDays, color: '#5B7FFF', emoji: '📅' },
    { label: t.achPresent,    value: `${a.present} ${t.achDays}`,     Icon: CheckCircle2, color: '#22C55E', emoji: '✅' },
    { label: t.achAbsent,     value: `${a.absent} ${t.achDays}`,      Icon: XCircle,      color: '#EF4444', emoji: '❌' },
    { label: t.achLate,       value: `${a.late} ${t.achTimes}`,       Icon: Clock3,       color: '#F59E0B', emoji: '⏰' },
  ]
  return (
    <section>
      <SectionHead color="#22C55E" Icon={CalendarDays} title={t.achAttendanceTitle} extra={<span className="text-[11px] font-semibold text-white/35">{a.monthLabel}</span>} />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-3">
        {cards.map(c => (
          <div key={c.label} className="rounded-[16px] p-3.5" style={GLASS}>
            <div className="flex items-center justify-between">
              <span className="text-lg" aria-hidden="true">{c.emoji}</span>
              <span className="text-[18px] font-black tabular-nums" style={{ color: c.color }}>{c.value}</span>
            </div>
            <p className="text-[10.5px] text-white/40 font-medium mt-2">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="rounded-[18px] p-4 mb-3" style={GLASS}>
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <p className="text-[12px] font-bold text-white/70">{a.monthLabel}</p>
          <div className="flex items-center gap-3 ml-auto text-[10px] text-white/40">
            <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: ATT_COLOR.present }} />{t.achPresent}</span>
            <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: ATT_COLOR.late }} />{t.achLateShort}</span>
            <span className="inline-flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: ATT_COLOR.absent }} />{t.achAbsent}</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {a.calendar.map(d => (
            <div key={d.day} className="aspect-square rounded-lg flex items-center justify-center text-[11px] font-semibold"
              style={{
                background: d.status === 'none' ? 'rgba(255,255,255,0.04)' : `${ATT_COLOR[d.status]}22`,
                border: d.status === 'none' ? '1px solid rgba(255,255,255,0.05)' : `1px solid ${ATT_COLOR[d.status]}55`,
                color: d.status === 'none' ? 'rgba(255,255,255,0.35)' : ATT_COLOR[d.status],
              }}>
              {d.day}
            </div>
          ))}
        </div>
      </div>

      {/* AI attendance analysis */}
      <div className="rounded-[18px] p-4" style={{ background: 'linear-gradient(135deg, rgba(91,127,255,0.08), rgba(124,58,237,0.11))', border: '1px solid rgba(124,58,237,0.22)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-[#C4B5FD]" aria-hidden="true" />
          <span className="text-[12px] font-bold text-white/80">{t.achAIAnalysis}</span>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={a.risk === 'low' ? { background: 'rgba(34,197,94,0.15)', color: '#86efac' } : a.risk === 'medium' ? { background: 'rgba(245,158,11,0.15)', color: '#FCD34D' } : { background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
            {a.risk === 'low' ? t.achRiskLow : a.risk === 'medium' ? t.achRiskMed : t.achRiskHigh}
          </span>
        </div>
        <p className="text-[12.5px] text-white/70 leading-relaxed">{a.aiAnalysis}</p>
      </div>
    </section>
  )
}

// ═══ 6) Certificates ═══
export type CertItem = { id: string; title: string; date: string; emoji: string }
export function CertificatesSection({ certs, downloadingId, onDownload }: {
  certs: CertItem[]; downloadingId: string | null; onDownload: (id: string) => void
}) {
  const { t } = useLanguage()
  return (
    <section>
      <SectionHead color="#A78BFA" Icon={Award} title={t.achCertificates} />
      {certs.length === 0 ? (
        <div className="rounded-[18px] p-6 text-center" style={GLASS}>
          <Award className="w-6 h-6 text-white/20 mx-auto mb-2" aria-hidden="true" />
          <p className="text-[13px] text-white/35">{t.achCertEmpty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {certs.map(c => (
            <div key={c.id} className="rounded-[18px] p-4 flex items-center gap-3" style={{ ...GLASS, border: '1px solid rgba(167,139,250,0.25)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}>{c.emoji}</div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-white/90 truncate">{c.title}</p>
                <p className="text-[11px] text-white/40">{c.date}</p>
              </div>
              <button type="button" onClick={() => onDownload(c.id)} disabled={downloadingId === c.id}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)' }} aria-label={t.achDownload}>
                <Download className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
