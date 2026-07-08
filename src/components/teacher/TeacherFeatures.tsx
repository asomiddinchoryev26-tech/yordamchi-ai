/**
 * components/teacher/TeacherFeatures.tsx
 * O'qituvchi paneli qo'shimcha bo'limlari (additiv, prop-driven). Mavjud servislarga
 * ulanadi — yangi/dublikat logika yaratilmaydi:
 *   lessonView.service · qrAttendance.service · teacherInsights.service ·
 *   teacherPremium.service (subscription) · PremiumModal (AssignmentsAI).
 *
 * FREE: LessonAnalytics, Test natijalari (mavjud TestsPage).
 * PREMIUM: QRAttendanceManager, VideoUploadGate, AIWeakStudents.
 * YordamchiAI dizayn tili — mavjud UI o'zgarmaydi.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Eye, EyeOff, Users, QrCode, Lock, Loader2, RefreshCw, Brain, AlertTriangle,
  Video, Zap, CheckCircle2, Clock,
} from 'lucide-react'
import { lessonViewService, type LessonAnalytics } from '@/services/lessonView.service'
import { qrAttendanceService } from '@/services/qrAttendance.service'
import { teacherInsightsService, type ClassInsight } from '@/services/teacherInsights.service'
import { teacherPremiumService } from '@/services/teacherPremium.service'
import type { QrAttendanceSessionRow } from '@/types/teacher.types'
import { PremiumModal } from '@/components/student/AssignmentsAI'
import { useLanguage } from '@/contexts/LanguageContext'

const GLASS = {
  background: 'rgba(11,15,28,0.82)', backdropFilter: 'blur(28px) saturate(200%)',
  WebkitBackdropFilter: 'blur(28px) saturate(200%)', border: '1px solid rgba(255,255,255,0.08)',
} as const

function fmt(iso: string) {
  return new Intl.DateTimeFormat('uz', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

// ═══ Premium lock card (video / QR / AI — Free foydalanuvchi) ═══
export function PremiumLockCard({ title, desc, Icon = Lock }: { title: string; desc: string; Icon?: typeof Lock }) {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()
  return (
    <>
      <div className="rounded-[20px] p-5 text-center relative overflow-hidden" style={{ ...GLASS, border: '1px solid rgba(124,58,237,0.25)' }}>
        <div className="absolute -top-14 -right-10 w-36 h-36 rounded-full blur-[60px] opacity-40" style={{ background: '#7C3AED' }} aria-hidden="true" />
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2.5" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <Icon className="w-5 h-5 text-[#C4B5FD]" aria-hidden="true" />
          </div>
          <h3 className="text-[15px] font-black text-white">{title}</h3>
          <p className="text-[12.5px] text-white/50 mt-1 max-w-xs mx-auto">{desc}</p>
          <button type="button" onClick={() => setOpen(true)}
            className="mt-3 inline-flex items-center gap-2 px-5 py-2 rounded-xl text-white text-[13px] font-bold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)', boxShadow: '0 6px 20px rgba(91,127,255,0.4)' }}>
            <Zap className="w-4 h-4" aria-hidden="true" /> {t.pmCta}
          </button>
        </div>
      </div>
      <PremiumModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

// Premium bo'lmasa lock, bo'lsa children — takroriy tekshiruvni bir joyda
function PremiumGate({ teacherId, lock, children }: { teacherId: string; lock: React.ReactNode; children: React.ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null)
  useEffect(() => { void teacherPremiumService.canUse(teacherId).then(setAllowed) }, [teacherId])
  if (allowed === null) return <div className="rounded-[20px] h-32 animate-pulse" style={GLASS} />
  return <>{allowed ? children : lock}</>
}

// ═══ TASK 1 — Lesson view tracking (FREE) ═══
export function LessonAnalyticsCard({ lessonId, groupId, title }: { lessonId: string; groupId: string; title?: string }) {
  const { t } = useLanguage()
  const [data, setData] = useState<LessonAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => {
    setLoading(true)
    try { setData(await lessonViewService.getLessonAnalytics(lessonId, groupId)) } finally { setLoading(false) }
  }, [lessonId, groupId])
  useEffect(() => { void load() }, [load])

  return (
    <div className="rounded-[20px] p-5" style={GLASS}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: 'rgba(91,127,255,0.15)', border: '1px solid rgba(91,127,255,0.25)' }}><Eye className="w-4 h-4 text-[#93BBFF]" aria-hidden="true" /></div>
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold text-white/85 truncate">{title ? `${title} — ${t.tfViewsSuffix}` : t.tfLessonViews}</h3>
        </div>
        <button type="button" onClick={() => void load()} className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5" aria-label={t.tfRefresh}><RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /></button>
      </div>

      {loading ? (
        <div className="h-24 animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
      ) : !data ? null : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: t.tfTotalStudents, value: data.total, color: '#93BBFF', Icon: Users },
              { label: t.tfViewed, value: data.viewedCount, color: '#22C55E', Icon: CheckCircle2 },
              { label: t.tfCompleted, value: `${data.completedPct}%`, color: '#A78BFA', Icon: Clock },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[16px] font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9.5px] text-white/40 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {data.students.map(s => (
              <div key={s.studentId} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                {s.viewed
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />
                  : <EyeOff className="w-4 h-4 text-red-400/70 flex-shrink-0" aria-hidden="true" />}
                <span className="flex-1 text-[12.5px] font-medium text-white/80 truncate">{s.name}</span>
                {s.viewed
                  ? <span className="text-[11px] text-white/40">{s.watchMinutes} {t.tfMin} · {s.completed ? t.tfDoneWatch : t.tfWatched}</span>
                  : <span className="text-[11px] text-red-400/70">{t.tfNotOpened}</span>}
              </div>
            ))}
            {data.students.length === 0 && <p className="text-[12px] text-white/35 text-center py-4">{t.tfNoStudents}</p>}
          </div>
        </>
      )}
    </div>
  )
}

// ═══ TASK 2 — QR Attendance (PREMIUM) ═══
function QRManagerInner({ teacherId, groupId, groupName, lessonId }: { teacherId: string; groupId: string; groupName?: string; lessonId?: string | null }) {
  const { t } = useLanguage()
  const [session, setSession] = useState<QrAttendanceSessionRow | null>(null)
  const [busy, setBusy] = useState(false)
  const start = async () => { setBusy(true); setSession(await qrAttendanceService.createSession(teacherId, groupId, lessonId ?? null, 15)); setBusy(false) }
  const stop  = async () => { if (session) { await qrAttendanceService.closeSession(session.id); setSession(null) } }

  return (
    <div className="rounded-[20px] p-5" style={GLASS}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)' }}><QrCode className="w-5 h-5 text-white" aria-hidden="true" /></div>
        <div><h3 className="text-[14px] font-bold text-white">{t.qrTitle}</h3><p className="text-[11px] text-white/45">{groupName ?? t.tfGroup}</p></div>
      </div>
      {!session ? (
        <button type="button" onClick={() => void start()} disabled={busy}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-[13.5px] font-bold disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)' }}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <QrCode className="w-4 h-4" aria-hidden="true" />} {t.tfStartSession}
        </button>
      ) : (
        <div className="text-center">
          <p className="text-[11px] text-white/45 mb-1">{t.tfEnterCode}</p>
          <div className="text-[34px] font-black tracking-[0.2em] text-white py-3 rounded-xl mb-2" style={{ background: 'rgba(91,127,255,0.1)', border: '1px solid rgba(91,127,255,0.28)', textShadow: '0 0 20px rgba(147,187,255,0.5)' }}>{session.code}</div>
          <p className="text-[11px] text-white/35 mb-3">{t.tfExpires} {fmt(session.expires_at)}</p>
          <button type="button" onClick={() => void stop()} className="w-full py-2.5 rounded-xl text-[12.5px] font-bold text-red-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>{t.tfCloseSession}</button>
          <p className="text-[10px] text-white/25 mt-2">{t.tfCameraSoon}</p>
        </div>
      )}
    </div>
  )
}
export function QRAttendanceManager(props: { teacherId: string; groupId: string; groupName?: string; lessonId?: string | null }) {
  const { t } = useLanguage()
  return (
    <PremiumGate teacherId={props.teacherId} lock={<PremiumLockCard title={t.tfQrLockTitle} desc={t.tfQrLockDesc} Icon={QrCode} />}>
      <QRManagerInner {...props} />
    </PremiumGate>
  )
}

// ═══ TASK 3 — Video upload gate (PREMIUM) ═══
export function VideoUploadGate({ teacherId, children }: { teacherId: string; children?: React.ReactNode }) {
  const { t } = useLanguage()
  return (
    <PremiumGate teacherId={teacherId} lock={<PremiumLockCard title={t.tfVideoLockTitle} desc={t.tfVideoLockDesc} Icon={Video} />}>
      {children ?? (
        <div className="rounded-[20px] p-5 text-center" style={GLASS}>
          <Video className="w-6 h-6 text-emerald-400 mx-auto mb-2" aria-hidden="true" />
          <p className="text-[13px] font-bold text-white/85">{t.tfVideoOpen}</p>
          <p className="text-[11.5px] text-white/45 mt-1">{t.tfVideoOpenDesc}</p>
        </div>
      )}
    </PremiumGate>
  )
}

// ═══ TASK 5 — AI weak-student analysis (PREMIUM) ═══
function AIAnalysisInner({ teacherId }: { teacherId: string }) {
  const { t } = useLanguage()
  const [data, setData] = useState<ClassInsight | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { void teacherInsightsService.getInsights(teacherId).then(setData).finally(() => setLoading(false)) }, [teacherId])

  if (loading) return <div className="rounded-[20px] h-40 animate-pulse" style={GLASS} />
  if (!data) return null
  return (
    <div className="rounded-[20px] p-5" style={{ background: 'linear-gradient(135deg, rgba(91,127,255,0.08), rgba(124,58,237,0.12))', border: '1px solid rgba(124,58,237,0.25)' }}>
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.2)' }}><Brain className="w-4 h-4 text-[#C4B5FD]" aria-hidden="true" /></div>
        <h3 className="text-[14px] font-bold text-white/85">{t.tfAIStudentAnalysis}</h3>
      </div>
      <p className="text-[12.5px] text-white/70 leading-relaxed mb-3">{data.summary}</p>

      {data.weakStudents.length > 0 && (
        <>
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-white/35 mb-1.5">{t.tfWeakStudents}</p>
          <div className="space-y-2">
            {data.weakStudents.map(w => (
              <div key={w.studentId} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" aria-hidden="true" />
                  <span className="text-[13px] font-bold text-white/90">{w.name}</span>
                  <span className="ml-auto text-[12px] font-black" style={{ color: w.avgScore < 60 ? '#EF4444' : '#F59E0B' }}>{w.avgScore}%</span>
                </div>
                <p className="text-[11px] text-white/45 mt-1">{w.groupName} · {t.achAttendance} {w.attendancePct}% · {w.problems.join(', ')}</p>
                <p className="text-[11.5px] text-[#C4B5FD] mt-1.5">🤖 {w.recommendation}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
export function AIWeakStudents({ teacherId }: { teacherId: string }) {
  const { t } = useLanguage()
  return (
    <PremiumGate teacherId={teacherId} lock={<PremiumLockCard title={t.tfAILockTitle} desc={t.tfAILockDesc} Icon={Brain} />}>
      <AIAnalysisInner teacherId={teacherId} />
    </PremiumGate>
  )
}
