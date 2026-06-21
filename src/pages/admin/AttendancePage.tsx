import { useState, useEffect } from 'react'
import { CheckSquare, AlertCircle, Search, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { attendanceService, STATUS_META } from '@/services/attendance.service'
import { groupService } from '@/services/group.service'
import type { AttendanceWithDetails } from '@/services/attendance.service'
import type { GroupWithRelations } from '@/services/group.service'

const MONTHS = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']
function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<AttendanceWithDetails[]>([])
  const [groups,  setGroups]  = useState<GroupWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const [groupId,  setGroupId]  = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [search,   setSearch]   = useState('')

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
      setError("Ma'lumotlarni yuklashda xatolik")
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
        <h1 className="text-2xl font-bold text-gray-900">Davomat</h1>
        <p className="text-sm text-gray-500 mt-0.5">Barcha talabalar davomati</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Filtrlar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <select
              value={groupId}
              onChange={e => setGroupId(e.target.value)}
              className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">Barcha guruhlar</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            placeholder="Boshlanish"
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={applyFilters}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Filtrlash
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
                <p className={cn('text-xs font-medium mt-0.5', m.color)}>{m.label}</p>
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
            placeholder="Talaba yoki guruh..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      )}

      {/* Yuklanmoqda */}
      {loading && (
        <div className="space-y-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 h-14 animate-pulse" />
          ))}
        </div>
      )}

      {/* Bo'sh */}
      {!loading && records.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <CheckSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Davomat yozuvlari topilmadi</p>
        </div>
      )}

      {/* Jadval */}
      {!loading && filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Talaba</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Guruh</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Sana</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Holat</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Izoh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.slice(0, 100).map(r => {
                const meta = STATUS_META[r.status as keyof typeof STATUS_META]
                return (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">
                        {(r.student as any)?.full_name ?? '—'}
                      </p>
                      <p className="text-xs text-gray-400">{(r.student as any)?.email}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{(r.group as any)?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmtDate(r.attended_date)}</td>
                    <td className="px-5 py-3">
                      <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', meta?.bg, meta?.color)}>
                        {meta?.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{r.note ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length > 100 && (
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              Faqat 100 ta yozuv ko'rsatilmoqda ({filtered.length} tadan)
            </div>
          )}
        </div>
      )}
    </div>
  )
}
