/**
 * components/student/LessonsSections.tsx
 * "Mening darslarim" sahifasi uchun premium bo'limlar (YordamchiAI dizayn tili:
 * dark glass, blue/purple gradient, glow, rounded, smooth animatsiya).
 *
 * Prop-driven va presentational — barcha ma'lumot LessonsPage'dan keladi.
 * Mavjud dars ro'yxati / detali (video, materiallar, AI panel) o'zgarmagan.
 */

import { useState, useEffect, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Play, Lock, CheckCircle2, Clock, Flame, TrendingUp, BarChart3,
  Clock3, ClipboardList, ArrowRight, ChevronRight, GraduationCap, CalendarClock,
} from 'lucide-react'
import type { StudentCourse, StudentLearningStats, LessonStatus } from '@/services/course.service'
import type { StudentAssignment } from '@/services/assignment.service'
import { deadlineState } from '@/services/assignment.service'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

const EASE: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98]

const STATUS_META: Record<LessonStatus, { label: keyof Translations; color: string; Icon: typeof Play }> = {
  completed:   { label: 'lessStDone',     color: '#22C55E', Icon: CheckCircle2 },
  in_progress: { label: 'lessStProgress', color: '#5B7FFF', Icon: Play },
  locked:      { label: 'lessLocked',     color: '#94A3B8', Icon: Lock },
}

// ─── Shared bits ──────────────────────────────────────────────────────────────

function SectionHeading({ color, Icon, title, extra }: {
  color: string; Icon: typeof Play; title: string; extra?: ReactNode
}) {
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

const GLASS = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
} as const

// ─── Live Tashkent clock ──────────────────────────────────────────────────────

function tashkentSnap() {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date())
  const g = (t: string) => p.find(x => x.type === t)?.value ?? '00'
  const h = g('hour') === '24' ? '00' : g('hour')
  return { date: `${g('day')}.${g('month')}.${g('year')}`, time: `${h}:${g('minute')}:${g('second')}` }
}
function useTashkentClock() {
  const [s, setS] = useState(tashkentSnap)
  useEffect(() => { const id = setInterval(() => setS(tashkentSnap()), 1000); return () => clearInterval(id) }, [])
  return s
}

// ═══ 1) Header ═══════════════════════════════════════════════════════════════

export function LessonsHeader() {
  const { date, time } = useTashkentClock()
  const { t } = useLanguage()
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#5B5CF6,#7C3AED)', boxShadow: '0 0 20px rgba(91,92,246,0.4)' }}>
          <GraduationCap className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">{t.lessTitle}</h1>
          <p className="text-[12.5px] text-white/40 mt-0.5">{t.lessSubtitle}</p>
        </div>
      </div>

      {/* Live date + time (Asia/Tashkent) */}
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold text-white/70"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <CalendarClock className="w-3.5 h-3.5 text-white/40" aria-hidden="true" />
          {date}
        </div>
        <div className="inline-flex items-center px-3 py-1.5 rounded-xl text-[13px] font-bold tabular-nums"
          style={{ background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.22)', color: '#C7D2FE', textShadow: '0 0 12px rgba(165,180,252,0.5)' }}>
          {time}
        </div>
      </div>
    </motion.div>
  )
}

// ═══ 2) Search + status filter tabs ══════════════════════════════════════════

export type StatusFilter = 'all' | 'active' | 'completed' | 'locked'

const FILTER_TABS: { key: StatusFilter; label: keyof Translations }[] = [
  { key: 'all',       label: 'lessAll'       },
  { key: 'active',    label: 'lessActive'    },
  { key: 'completed', label: 'lessCompleted' },
  { key: 'locked',    label: 'lessLocked'    },
]

export function LessonsToolbar({ search, onSearch, filter, onFilter }: {
  search: string; onSearch: (v: string) => void
  filter: StatusFilter; onFilter: (f: StatusFilter) => void
}) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" aria-hidden="true" />
        <input
          type="text" value={search} onChange={e => onSearch(e.target.value)}
          placeholder={t.lessSearchPh}
          className="w-full pl-9 pr-4 py-2.5 text-sm text-white/70 placeholder:text-white/25 outline-none rounded-xl transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          onFocus={e => { e.currentTarget.style.border = '1px solid rgba(91,92,246,0.45)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(91,92,246,0.12)' }}
          onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
        />
      </div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-0.5 px-0.5">
        {FILTER_TABS.map(tab => {
          const active = filter === tab.key
          return (
            <button
              key={tab.key} type="button" onClick={() => onFilter(tab.key)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-[12.5px] font-semibold transition-all"
              style={active
                ? { background: 'rgba(91,127,255,0.18)', border: '1px solid rgba(91,127,255,0.45)', color: '#93BBFF', boxShadow: '0 0 14px rgba(91,127,255,0.15)' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
            >
              {t[tab.label]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ═══ 3) My Courses ═══════════════════════════════════════════════════════════

function CourseCard({ course, onContinue }: { course: StudentCourse; onContinue: (id: string) => void }) {
  const { color } = course
  const { t } = useLanguage()
  return (
    <motion.div
      whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="group relative flex flex-col rounded-[20px] p-4 overflow-hidden"
      style={{ ...GLASS, boxShadow: '0 2px 14px rgba(0,0,0,0.22)' }}
    >
      <div className="absolute -inset-px rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px ${color}40, 0 0 26px ${color}1f` }} aria-hidden="true" />

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${color}20`, border: `1.5px solid ${color}40`, boxShadow: `0 0 16px ${color}18` }}>
          {course.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[14.5px] font-bold text-white/90 truncate">{course.title}</h3>
          <p className="text-[11.5px] text-white/40 mt-0.5 truncate">
            {course.teacher_name ? `${t.lessTeacher} ${course.teacher_name}` : (course.description ?? t.lessCourse)}
          </p>
        </div>
        {course.status === 'completed' && (
          <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#86efac', border: '1px solid rgba(34,197,94,0.25)' }}>
            {t.lessDone}
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-white/45 font-medium">
            {course.completed_lessons}/{course.total_lessons} {t.lessLessonsDone}
          </span>
          <span className="text-[12.5px] font-black tabular-nums" style={{ color }}>{course.progress}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg,${color},#7C3AED)`, boxShadow: `0 0 10px ${color}80` }}
            initial={{ width: 0 }} whileInView={{ width: `${course.progress}%` }} viewport={{ once: true }}
            transition={{ duration: 0.9, ease: EASE }}
          />
        </div>
      </div>

      <button
        type="button" onClick={() => onContinue(course.id)}
        className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12.5px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: `linear-gradient(135deg,${color},#7C3AED)`, boxShadow: `0 4px 16px ${color}44, inset 0 1px 0 rgba(255,255,255,0.16)` }}
      >
        {t.lessContinue}
        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </motion.div>
  )
}

export function CoursesSection({ courses, loading, onContinue }: {
  courses: StudentCourse[]; loading: boolean; onContinue: (id: string) => void
}) {
  const { t } = useLanguage()
  if (loading) {
    return (
      <section>
        <SectionHeading color="#5B7FFF" Icon={GraduationCap} title={t.lessMyCourses} />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-[20px] p-4 h-[176px] animate-pulse" style={GLASS} />
          ))}
        </div>
      </section>
    )
  }
  if (!courses.length) return null
  return (
    <section>
      <SectionHeading
        color="#5B7FFF" Icon={GraduationCap} title={t.lessMyCourses}
        extra={<span className="text-[11px] font-semibold text-white/35">{courses.length} {t.lessCoursesCount}</span>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {courses.map(c => <CourseCard key={c.id} course={c} onContinue={onContinue} />)}
      </div>
    </section>
  )
}

// ═══ 4) Today's Lessons (status) ═════════════════════════════════════════════

export type LessonStatusItem = {
  id: string; title: string; subjectName: string | null
  color: string; icon: string; status: LessonStatus; dateLabel: string
}

export function TodayLessonsSection({ items, continueItem, onOpen }: {
  items: LessonStatusItem[]; continueItem: LessonStatusItem | null; onOpen: (id: string) => void
}) {
  const { t } = useLanguage()
  if (!items.length && !continueItem) return null
  return (
    <section>
      <SectionHeading color="#22D3EE" Icon={Clock3} title={t.lessToday} />

      {/* Oxirgi ko'rilgan / Davom ettirish */}
      {continueItem && (
        <button
          type="button" onClick={() => onOpen(continueItem.id)}
          className="group w-full flex items-center gap-3.5 p-4 rounded-[20px] mb-3 text-left transition-all hover:opacity-95"
          style={{
            background: 'linear-gradient(120deg, rgba(91,127,255,0.12), rgba(124,58,237,0.12))',
            border: '1px solid rgba(124,58,237,0.28)',
            boxShadow: '0 0 26px rgba(124,58,237,0.12)',
          }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(91,127,255,0.2)', border: '1px solid rgba(91,127,255,0.35)' }}>
            <Play className="w-5 h-5 text-[#A5B4FC]" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#93BBFF]/70 mb-0.5">{t.lessLastViewed}</p>
            <p className="text-[14px] font-bold text-white/90 truncate">{continueItem.title}</p>
            <p className="text-[11.5px] text-white/40 truncate">{continueItem.subjectName ?? '—'}</p>
          </div>
          <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold text-white group-hover:gap-2.5 transition-all"
            style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)', boxShadow: '0 4px 16px rgba(91,127,255,0.4)' }}>
            {t.lessContinueBtn}
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        </button>
      )}

      {/* Lesson status cards — scrollable row */}
      {items.length > 0 && (
        <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-0.5 px-0.5 pb-1">
          {items.map(it => {
            const meta = STATUS_META[it.status]
            const locked = it.status === 'locked'
            return (
              <button
                key={it.id} type="button" onClick={() => !locked && onOpen(it.id)} disabled={locked}
                className="flex-shrink-0 w-[200px] flex flex-col p-3.5 rounded-[18px] text-left transition-all disabled:cursor-not-allowed hover:enabled:-translate-y-1"
                style={{ ...GLASS, opacity: locked ? 0.62 : 1 }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                    style={{ background: `${it.color}20`, border: `1px solid ${it.color}35` }}>
                    {it.icon}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
                    style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}30` }}>
                    <meta.Icon className="w-2.5 h-2.5" aria-hidden="true" />
                    {t[meta.label]}
                  </span>
                </div>
                <p className="text-[13px] font-bold text-white/85 leading-snug line-clamp-2 min-h-[34px]">{it.title}</p>
                <p className="text-[10.5px] text-white/35 mt-1.5">{it.dateLabel}</p>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ═══ 5) Learning Analytics ═══════════════════════════════════════════════════

function MiniBars({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-[3px] h-9 mt-1.5">
      {data.map((v, i) => (
        <motion.div
          key={i} className="flex-1 rounded-[3px]"
          style={{ background: `linear-gradient(180deg,${color},${color}55)` }}
          initial={{ height: 2 }} whileInView={{ height: `${Math.max(8, (v / max) * 100)}%` }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}
        />
      ))}
    </div>
  )
}

export function AnalyticsSection({ stats, loading }: { stats: StudentLearningStats | null; loading: boolean }) {
  const { t } = useLanguage()
  if (loading || !stats) {
    return (
      <section>
        <SectionHeading color="#EC4899" Icon={BarChart3} title={t.lessAnalytics} />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => <div key={i} className="rounded-[18px] p-4 h-[112px] animate-pulse" style={GLASS} />)}
        </div>
      </section>
    )
  }
  const cards = [
    { label: t.achWeeklyActivity, value: `${Math.round(stats.weeklyActivity.reduce((a, b) => a + b, 0) / stats.weeklyActivity.length)}%`, Icon: TrendingUp, color: '#5B7FFF', chart: true },
    { label: t.lessStreak,        value: `${stats.streakDays} ${t.achDays}`, Icon: Flame,      color: '#F59E0B' },
    { label: t.achCompletedLessons, value: String(stats.completedLessons), Icon: CheckCircle2, color: '#22C55E' },
    { label: t.achStudyHours,     value: `${stats.studyHours}${t.achHourShort}`, Icon: Clock,       color: '#A78BFA' },
  ]
  return (
    <section>
      <SectionHeading color="#EC4899" Icon={BarChart3} title={t.lessAnalytics} />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {cards.map(c => (
          <motion.div
            key={c.label} whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="rounded-[18px] p-4" style={{ ...GLASS, boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                style={{ background: `${c.color}18`, border: `1px solid ${c.color}30` }}>
                <c.Icon className="w-4 h-4" style={{ color: c.color }} aria-hidden="true" />
              </div>
              <span className="text-[18px] font-black tabular-nums" style={{ color: c.color }}>{c.value}</span>
            </div>
            {c.chart
              ? <MiniBars data={stats.weeklyActivity} color={c.color} />
              : <p className="text-[11px] text-white/40 font-medium mt-3">{c.label}</p>}
            {c.chart && <p className="text-[11px] text-white/40 font-medium mt-1.5">{c.label}</p>}
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ═══ 6) Homework ═════════════════════════════════════════════════════════════

function homeworkMeta(a: StudentAssignment, t: Translations): { label: string; color: string } {
  const sub = a.submission
  if (sub?.status === 'graded')    return { label: `${t.lessHwGraded}${sub.score != null ? ` · ${sub.score}/${a.max_score}` : ''}`, color: '#22C55E' }
  if (sub?.status === 'submitted') return { label: t.lessHwSubmitted, color: '#5B7FFF' }
  const st = deadlineState(a.deadline, false)
  if (st === 'overdue')   return { label: t.lessHwOverdue,  color: '#EF4444' }
  if (st === 'due_today') return { label: t.lessHwDueToday, color: '#F59E0B' }
  return { label: t.lessHwNotDone, color: '#94A3B8' }
}

function fmtDeadline(deadline: string | null, t: Translations): string {
  if (!deadline) return t.lessNoDeadline
  return new Intl.DateTimeFormat('uz', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(deadline))
}

export function HomeworkSection({ assignments, loading, onViewAll }: {
  assignments: StudentAssignment[]; loading: boolean; onViewAll: () => void
}) {
  const { t } = useLanguage()
  if (loading) {
    return (
      <section>
        <SectionHeading color="#F59E0B" Icon={ClipboardList} title={t.achAssignments} />
        <div className="rounded-[20px] p-4 space-y-2.5" style={GLASS}>
          {[0, 1, 2].map(i => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
        </div>
      </section>
    )
  }
  const list = assignments.slice(0, 4)
  return (
    <section>
      <SectionHeading
        color="#F59E0B" Icon={ClipboardList} title={t.achAssignments}
        extra={assignments.length > 0 && (
          <button type="button" onClick={onViewAll} className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#93BBFF] hover:opacity-80 transition-opacity">
            {t.lessAll} <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      />
      {list.length === 0 ? (
        <div className="rounded-[20px] p-6 text-center" style={GLASS}>
          <ClipboardList className="w-6 h-6 text-white/20 mx-auto mb-2" aria-hidden="true" />
          <p className="text-[13px] text-white/35">{t.lessNoHw}</p>
        </div>
      ) : (
        <div className="rounded-[20px] p-2.5 space-y-1.5" style={GLASS}>
          {list.map(a => {
            const meta = homeworkMeta(a, t)
            const subj = a.subject
            return (
              <button
                key={a.id} type="button" onClick={onViewAll}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all hover:bg-white/[0.04]"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={subj ? { background: `${subj.color}18`, border: `1px solid ${subj.color}30` } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {subj?.icon ?? '📝'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-white/85 truncate">{a.title}</p>
                  <p className="text-[11px] text-white/35 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {t.lessDeadline} {fmtDeadline(a.deadline, t)}
                  </p>
                </div>
                <span className="flex-shrink-0 text-[10.5px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}30` }}>
                  {meta.label}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
