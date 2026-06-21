import { supabase } from '@/lib/supabase'
import type { AttendanceRow, AttendanceInsert } from '@/types/database.types'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export type StudentForAttendance = {
  id:        string
  full_name: string | null
  email:     string | null
}

export type AttendanceEntry = {
  student:    StudentForAttendance
  record:     AttendanceRow | null
  status:     AttendanceStatus
  note:       string
}

export type AttendanceWithDetails = AttendanceRow & {
  student: Pick<StudentForAttendance, 'id' | 'full_name' | 'email'> | null
  group:   { id: string; name: string } | null
}

// ─── Konstantalar ─────────────────────────────────────────────────────────────

export const STATUS_META: Record<AttendanceStatus, { label: string; color: string; bg: string }> = {
  present:  { label: "Kelgan",      color: 'text-emerald-700', bg: 'bg-emerald-100' },
  absent:   { label: "Kelmagan",    color: 'text-red-700',     bg: 'bg-red-100'     },
  late:     { label: "Kechikkan",   color: 'text-amber-700',   bg: 'bg-amber-100'   },
  excused:  { label: "Sababli",     color: 'text-blue-700',    bg: 'bg-blue-100'    },
}

// ─── Servis ───────────────────────────────────────────────────────────────────

export const attendanceService = {
  // O'qituvchi: guruhning ma'lum kundagi davomatini olish
  getGroupAttendance: async (groupId: string, date: string): Promise<AttendanceEntry[]> => {
    const [studentsRes, attendanceRes] = await Promise.all([
      supabase
        .from('student_groups')
        .select('student:profiles(id, full_name, email)')
        .eq('group_id', groupId),

      supabase
        .from('attendance')
        .select('*')
        .eq('group_id', groupId)
        .eq('attended_date', date),
    ])

    if (studentsRes.error) throw new Error(studentsRes.error.message)

    const students = (studentsRes.data ?? [])
      .map((e: any) => e.student)
      .filter(Boolean) as StudentForAttendance[]

    const attMap = new Map<string, AttendanceRow>(
      (attendanceRes.data ?? []).map(a => [a.student_id, a])
    )

    return students
      .sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? ''))
      .map(student => {
        const record = attMap.get(student.id) ?? null
        return {
          student,
          record,
          status: (record?.status ?? 'present') as AttendanceStatus,
          note:   record?.note ?? '',
        }
      })
  },

  // O'qituvchi: guruh davomatini ommaviy saqlash (upsert)
  saveGroupAttendance: async (
    entries:   AttendanceEntry[],
    groupId:   string,
    date:      string,
    teacherId: string,
  ): Promise<void> => {
    const records: AttendanceInsert[] = entries.map(e => ({
      student_id:    e.student.id,
      group_id:      groupId,
      teacher_id:    teacherId,
      attended_date: date,
      status:        e.status,
      note:          e.note.trim() || null,
    }))

    const { error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'student_id,group_id,attended_date' })

    if (error) throw new Error(error.message)
  },

  // Talaba: o'z davomatini olish
  getStudentAttendance: async (studentId: string): Promise<AttendanceWithDetails[]> => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*, student:profiles(id, full_name, email), group:groups(id, name)')
      .eq('student_id', studentId)
      .order('attended_date', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as AttendanceWithDetails[]
  },

  // Admin: barcha davomat yozuvlarini olish (filtrlash bilan)
  getAll: async (filters?: {
    groupId?:  string
    dateFrom?: string
    dateTo?:   string
  }): Promise<AttendanceWithDetails[]> => {
    let q = supabase
      .from('attendance')
      .select('*, student:profiles(id, full_name, email), group:groups(id, name)')
      .order('attended_date', { ascending: false })
      .limit(200)

    if (filters?.groupId)  q = q.eq('group_id', filters.groupId)
    if (filters?.dateFrom) q = q.gte('attended_date', filters.dateFrom)
    if (filters?.dateTo)   q = q.lte('attended_date', filters.dateTo)

    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as AttendanceWithDetails[]
  },
}
