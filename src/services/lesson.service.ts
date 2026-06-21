import { supabase } from '@/lib/supabase'
import type { LessonRow, LessonInsert, LessonUpdate } from '@/types/database.types'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

export type LessonWithDetails = LessonRow & {
  group:   { id: string; name: string } | null
  subject: { id: string; name: string; color: string; icon: string } | null
  teacher: { id: string; full_name: string | null } | null
}

// ─── Servis ───────────────────────────────────────────────────────────────────

export const lessonService = {
  // O'qituvchi: o'z guruhlarining darslarini olish
  getByTeacher: async (teacherId: string): Promise<LessonWithDetails[]> => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*, group:groups(id, name), subject:subjects(id, name, color, icon), teacher:profiles(id, full_name)')
      .eq('teacher_id', teacherId)
      .order('lesson_date', { ascending: false })
      .order('order_num')

    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as LessonWithDetails[]
  },

  // Guruh bo'yicha darslar (o'qituvchi guruh tanlash uchun)
  getByGroup: async (groupId: string): Promise<LessonWithDetails[]> => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*, group:groups(id, name), subject:subjects(id, name, color, icon), teacher:profiles(id, full_name)')
      .eq('group_id', groupId)
      .order('lesson_date', { ascending: false })
      .order('order_num')

    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as LessonWithDetails[]
  },

  // Talaba: ro'yxatdagi guruhlarning nashr qilingan darslari
  getForStudent: async (studentId: string): Promise<LessonWithDetails[]> => {
    const { data: enrollments } = await supabase
      .from('student_groups')
      .select('group_id')
      .eq('student_id', studentId)

    const groupIds = (enrollments ?? []).map((e: any) => e.group_id)
    if (!groupIds.length) return []

    const { data, error } = await supabase
      .from('lessons')
      .select('*, group:groups(id, name), subject:subjects(id, name, color, icon), teacher:profiles(id, full_name)')
      .in('group_id', groupIds)
      .eq('is_published', true)
      .order('lesson_date', { ascending: false })
      .order('order_num')

    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as LessonWithDetails[]
  },

  // Admin: barcha darslar
  getAll: async (): Promise<LessonWithDetails[]> => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*, group:groups(id, name), subject:subjects(id, name, color, icon), teacher:profiles(id, full_name)')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as LessonWithDetails[]
  },

  create: async (payload: LessonInsert): Promise<LessonRow> => {
    const { data, error } = await supabase
      .from('lessons')
      .insert(payload)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  update: async (id: string, payload: LessonUpdate): Promise<LessonRow> => {
    const { data, error } = await supabase
      .from('lessons')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('lessons').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}
