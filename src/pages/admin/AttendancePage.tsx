import { useState, useEffect } from 'react'
import { CheckSquare, AlertCircle, Search, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { attendanceService, STATUS_META } from '@/services/attendance.service'
import { groupService } from '@/services/group.service'
import type { AttendanceWithDetails } from '@/services/attendance.service'
import type { GroupWithRelations } from '@/services/group.service'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

const MONTH_KEYS: (keyof Translations)[] = [
  'mJan','mFeb','mMar','mApr','mMay','mJun','mJul','mAug','mSep','mOct','mNov','mDec',
]
const ATT_STATUS_KEYS: Record<string, keyof Translations> = {
  present: 'sdPresent', absent: 'sdAbsent', late: 'sdLate', excused: 'sdExcused',
}
function fmtDate(d: string, t: Translations) {
  const dt = new Date(d)
  return `${dt.getDate()} ${t[MONTH_KEYS[dt.getMonth()]].slice(0,3)} ${dt.getFullYear()}`
}

export default function AdminAttendancePage() {
  const { t } = useLanguage()
  const [records, setRecords] = useState<AttendanceWithDetails[]>([])
  const [groups,  setGroups]  = useState<GroupWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const [groupId,  setGroupId]  = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [search,   setSearch]   = useState('')

  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only load; load() is intentionally unmemoized
  useEffect(() => { void load() }, [])

  async function load(filters?: { groupId?: string; dateFrom?: string; dateTo?: string }) {
    setLoading(true)
    setError(null)
    try {
      const [recs, grps] = await Promise.all([
        attendanceService.getAll(filters),
        groupService.getAll(),
      ])
      setRecords(recs)
      setGroups(grps)
    } catch {
      setError(t.mpLoadErr)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    void load({
      groupId:  groupId  || undefined,
      dateFrom: dateFrom || undefined,
      dateTo:   dateTo   || undefined,
    })
  }

  const filtered = records.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      ((r.student as any)?.full_name ?? '').toLowerCase().includes(q) ||
      ((r.student as any)?.email     ?? '').toLowerCase().includes(q) ||
      ((r.group   as any)?.name      ?? '').toLowerCase().includes(q)
    )
  })

  const counts = {
    present: records.filter(r => r.status === 'present').length,
    absent:  records.filter(r => r.status === 'absent').length,
    late:    records.filter(r => r.status === 'late').length,
    excused: records.filter(r => r.status === 'excused').length,
  }

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.achAttendance}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t.aatSubtitle}</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Filtrlar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <select
              value={groupId}
              onChange={e => setGroupId(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">{t.tstAllGroups}</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            placeholder={t.aatFrom}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={applyFilters}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {t.aatFilter}
          </button>
        </div>
      </div>

      {/* Statistika */}
      {!loading && records.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(counts).map(([k, v]) => {
            const m = STATUS_META[k as keyof typeof STATUS_META]
            return (
              <div key={k} className={cn('rounded-2xl p-4', m.bg)}>
                <p className={cn('text-2xl font-bold', m.color)}>{v}</p>
                <p className={cn('text-xs font-medium mt-0.5', m.color)}>{ATT_STATUS_KEYS[k] ? t[ATT_STATUS_KEYS[k]] : m.label}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Qidiruv */}
      {!loading && records.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.aatSearchPh}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      )}

      {/* Yuklanmoqda */}
      {loading && (
        <div className="space-y-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 h-14 animate-pulse" />
          ))}
        </div>
      )}

      {/* Bo'sh */}
      {!loading && records.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-14 text-center">
          <CheckSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">{t.aatNotFound}</p>
        </div>
      )}

      {/* Jadval */}
      {!loading && filtered.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">{t.tdColStudent}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">{t.tfGroup}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">{t.tcDate}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">{t.tdColStatus}</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">{t.aatNote}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.slice(0, 100).map(r => {
                const meta = STATUS_META[r.status as keyof typeof STATUS_META]
                return (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {(r.student as any)?.full_name ?? '—'}
                      </p>
                      <p className="text-xs text-gray-400">{(r.student as any)?.email}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-200">{(r.group as any)?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{fmtDate(r.attended_date, t)}</td>
                    <td className="px-5 py-3">
                      <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', meta?.bg, meta?.color)}>
                        {ATT_STATUS_KEYS[r.status] ? t[ATT_STATUS_KEYS[r.status]] : meta?.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{r.note ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
          {filtered.length > 100 && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
              {t.aatLimitPrefix}{filtered.length} {t.aatLimitSuffix}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
