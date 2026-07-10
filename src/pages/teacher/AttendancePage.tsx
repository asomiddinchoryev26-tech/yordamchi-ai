import { useState, useEffect } from 'react'
import { CheckSquare, AlertCircle, Save, Users, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { attendanceService, STATUS_META } from '@/services/attendance.service'
import { supabase } from '@/lib/supabase'
import type { AttendanceEntry, AttendanceStatus } from '@/services/attendance.service'
import { QRAttendanceManager } from '@/components/teacher/TeacherFeatures'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

type GroupOption = { id: string; name: string }
const STATUSES: AttendanceStatus[] = ['present', 'absent', 'late', 'excused']
// Holat teglari — rang/fon servisdan, matn tarjimadan
const ATT_STATUS_KEYS: Record<AttendanceStatus, keyof Translations> = {
  present: 'sdPresent', absent: 'sdAbsent', late: 'sdLate', excused: 'sdExcused',
}

function StatusBtn({
  status, selected, onClick,
}: { status: AttendanceStatus; selected: boolean; onClick: () => void }) {
  const { t } = useLanguage()
  const m = STATUS_META[status]
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all',
        selected
          ? `${m.bg} ${m.color} border-transparent shadow-sm`
          : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:border-gray-600',
      )}
    >
      {t[ATT_STATUS_KEYS[status]]}
    </button>
  )
}

export default function TeacherAttendancePage() {
  const auth = useAuth()
  const { t } = useLanguage()
  const [groups,      setGroups]      = useState<GroupOption[]>([])
  const [groupId,     setGroupId]     = useState('')
  const [date,        setDate]        = useState(todayStr())
  const [entries,     setEntries]     = useState<AttendanceEntry[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [pageError,   setPageError]   = useState<string | null>(null)
  const [savedMsg,    setSavedMsg]    = useState(false)

  useEffect(() => {
    if (!auth.user?.id) return
    void loadGroups()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadGroups() unmemoized by design; re-run only on user id change
  }, [auth.user?.id])

  async function loadGroups() {
    const { data } = await supabase
      .from('groups')
      .select('id, name')
      .eq('teacher_id', auth.user!.id)
      .eq('status', 'active')
      .order('name')
    const list = (data ?? []) as GroupOption[]
    setGroups(list)
    if (list.length) setGroupId(list[0].id)
  }

  useEffect(() => {
    if (!groupId || !date) { setEntries([]); return }
    void loadAttendance()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadAttendance() unmemoized by design; re-run only on groupId/date change
  }, [groupId, date])

  async function loadAttendance() {
    setLoadingData(true)
    setPageError(null)
    try {
      setEntries(await attendanceService.getGroupAttendance(groupId, date))
    } catch {
      setPageError(t.mpLoadErr)
    } finally {
      setLoadingData(false)
    }
  }

  function setStatus(studentId: string, status: AttendanceStatus) {
    setEntries(prev => prev.map(e => e.student.id === studentId ? { ...e, status } : e))
  }

  function setNote(studentId: string, note: string) {
    setEntries(prev => prev.map(e => e.student.id === studentId ? { ...e, note } : e))
  }

  function setAllStatus(status: AttendanceStatus) {
    setEntries(prev => prev.map(e => ({ ...e, status })))
  }

  async function handleSave() {
    if (!groupId || !auth.user?.id || !entries.length) return
    setSaving(true)
    setPageError(null)
    try {
      await attendanceService.saveGroupAttendance(entries, groupId, date, auth.user.id)
      setSavedMsg(true)
      setTimeout(() => setSavedMsg(false), 3000)
    } catch {
      setPageError(t.tcSaveErr)
    } finally {
      setSaving(false)
    }
  }

  const presentCount = entries.filter(e => e.status === 'present').length
  const absentCount  = entries.filter(e => e.status === 'absent').length

  return (
    <div className="space-y-5 pb-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.achAttendance}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t.taSubtitle}</p>
      </div>

      {savedMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-medium flex items-center gap-2">
          <CheckSquare className="w-4 h-4" />
          {t.taSaved}
        </div>
      )}
      {pageError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {pageError}
        </div>
      )}

      {/* Guruh + sana */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t.tfGroup}</label>
            {groups.length === 0 ? (
              <p className="text-sm text-gray-400 italic">{t.taNoActiveGroup}</p>
            ) : (
              <div className="relative">
                <select
                  value={groupId}
                  onChange={e => setGroupId(e.target.value)}
                  className="w-full appearance-none px-3 py-2.5 pr-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                >
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t.tcDate}</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              max={todayStr()}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* QR davomat (Premium) — additiv, tanlangan guruh uchun */}
      {auth.user?.id && groupId && (
        <QRAttendanceManager
          teacherId={auth.user.id}
          groupId={groupId}
          groupName={groups.find(g => g.id === groupId)?.name}
        />
      )}

      {groups.length === 0 && !loadingData && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">{t.taNoActiveGroupAssigned}</p>
        </div>
      )}

      {loadingData && (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 animate-pulse flex gap-3">
              <div className="w-9 h-9 bg-gray-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loadingData && groupId && entries.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">{t.tfNoStudents}</p>
        </div>
      )}

      {!loadingData && entries.length > 0 && (
        <>
          {/* Statistika + ommaviy belgilash */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-emerald-600 font-semibold">{presentCount} {t.sdPresent.toLowerCase()}</span>
              <span className="text-gray-300">·</span>
              <span className="text-red-600 font-semibold">{absentCount} {t.sdAbsent.toLowerCase()}</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500 dark:text-gray-400">{entries.length} {t.adTotal.replace(':', '').toLowerCase()}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400 text-xs">{t.adAll}:</span>
              {STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAllStatus(s)}
                  className={cn('px-2 py-1 rounded-lg font-semibold border transition-colors border-transparent', STATUS_META[s].bg, STATUS_META[s].color)}
                >
                  {t[ATT_STATUS_KEYS[s]]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {entries.map((entry, idx) => (
              <div
                key={entry.student.id}
                className={cn(
                  'bg-white dark:bg-gray-800 rounded-xl border p-4',
                  entry.status === 'absent'  ? 'border-red-100 bg-red-50/30'    :
                  entry.status === 'late'    ? 'border-amber-100 bg-amber-50/30':
                  entry.status === 'excused' ? 'border-blue-100 bg-blue-50/30'  :
                  'border-gray-100 dark:border-gray-700',
                )}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {entry.student.full_name ?? t.taNoName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{entry.student.email}</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {STATUSES.map(s => (
                      <StatusBtn
                        key={s}
                        status={s}
                        selected={entry.status === s}
                        onClick={() => setStatus(entry.student.id, s)}
                      />
                    ))}
                  </div>
                </div>
                {(entry.status === 'absent' || entry.status === 'late' || entry.status === 'excused') && (
                  <div className="mt-2.5 pl-11">
                    <input
                      type="text"
                      value={entry.note}
                      onChange={e => setNote(entry.student.id, e.target.value)}
                      placeholder={t.taNotePh}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="sticky bottom-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl shadow-lg transition-colors disabled:opacity-60"
            >
              {saving
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Save className="w-4 h-4" />
              }
              {t.taSaveBtn}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
