import { useState, useEffect } from 'react'
import { CheckSquare, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { attendanceService, STATUS_META } from '@/services/attendance.service'
import type { AttendanceWithDetails } from '@/services/attendance.service'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

// Oy/hafta kalitlari — render vaqtida t bilan resolve qilinadi
const MONTH_KEYS: (keyof Translations)[] = [
  'mJan','mFeb','mMar','mApr','mMay','mJun',
  'mJul','mAug','mSep','mOct','mNov','mDec',
]
const DAY_KEYS: (keyof Translations)[] = ['sdSun','sdMon','sdTue','sdWed','sdThu','sdFri','sdSat']
// Holat teglari — servisdagi STATUS_META rang/fonini saqlab, matnni tarjima qilamiz
const STATUS_LABEL_KEYS: Record<string, keyof Translations> = {
  present: 'sdPresent', absent: 'sdAbsent', late: 'sdLate', excused: 'sdExcused',
}
function fmtDate(d: string, t: Translations) {
  const dt = new Date(d)
  return `${dt.getDate()} ${t[MONTH_KEYS[dt.getMonth()]]} ${dt.getFullYear()}`
}
function weekDay(d: string, t: Translations) {
  return t[DAY_KEYS[new Date(d).getDay()]]
}

export default function StudentAttendancePage() {
  const auth = useAuth()
  const { t } = useLanguage()
  const [records, setRecords] = useState<AttendanceWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!auth.user?.id) return
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load() unmemoized by design; re-run only on user id change
  }, [auth.user?.id])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setRecords(await attendanceService.getStudentAttendance(auth.user!.id))
    } catch {
      setError(t.mpLoadErr)
    } finally {
      setLoading(false)
    }
  }

  const total    = records.length
  const present  = records.filter(r => r.status === 'present').length
  const absent   = records.filter(r => r.status === 'absent').length
  const late     = records.filter(r => r.status === 'late').length
  const excused  = records.filter(r => r.status === 'excused').length
  const pct      = total ? Math.round((present / total) * 100) : 0

  if (loading) return (
    <div className="space-y-4 pb-8">
      <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
      <div className="grid grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-5 pb-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.achAttendance}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t.stAttSubtitle}</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Statistika */}
      {total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">{t.stAttOverall}</p>
            <span className={cn(
              'text-2xl font-bold',
              pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'
            )}>
              {pct}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(['present', 'absent', 'late', 'excused'] as const).map(key => {
              const meta  = STATUS_META[key]
              const value = { present, absent, late, excused }[key]
              return (
                <div key={key} className={cn('rounded-xl p-3 text-center', meta.bg)}>
                  <p className={cn('text-xl font-bold', meta.color)}>{value}</p>
                  <p className={cn('text-[11px] font-medium mt-0.5', meta.color)}>{t[STATUS_LABEL_KEYS[key]]}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Bo'sh holat */}
      {!loading && total === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <CheckSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">{t.sdNoAttendance}</p>
          <p className="text-xs text-gray-400 mt-1">{t.stAttEmptyHint}</p>
        </div>
      )}

      {/* Davomat ro'yxati */}
      {total > 0 && (
        <div className="space-y-2">
          {records.map(r => {
            const meta = STATUS_META[r.status as keyof typeof STATUS_META]
            return (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
              >
                {/* Sana */}
                <div className="w-14 text-center flex-shrink-0">
                  <p className="text-lg font-bold text-gray-900 leading-none">
                    {new Date(r.attended_date).getDate()}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {t[MONTH_KEYS[new Date(r.attended_date).getMonth()]].slice(0,3)}
                  </p>
                </div>

                <div className="w-px h-10 bg-gray-100 flex-shrink-0" />

                {/* Ma'lumot */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {(r.group as any)?.name ?? t.tfGroup}
                    </p>
                    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', meta?.bg, meta?.color)}>
                      {STATUS_LABEL_KEYS[r.status] ? t[STATUS_LABEL_KEYS[r.status]] : meta?.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {weekDay(r.attended_date, t)}, {fmtDate(r.attended_date, t)}
                  </p>
                  {r.note && <p className="text-xs text-gray-500 mt-1 italic">"{r.note}"</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
