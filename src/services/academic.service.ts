/**
 * services/academic.service.ts
 * Institut akademik strukturasi: semestrlar, kurslar (kredit bilan), yozilish.
 * Faqat institut turidagi tashkilotlarda ishlatiladi. Org bo'yicha RLS (050).
 * Jadvallar generatsiya qilingan tiplarda yo'q → loose cast.
 */

import { supabase } from '@/lib/supabase'

const sb = supabase as unknown as { from: (t: string) => any }

export type Semester = {
  id: string; name: string; start_date: string | null; end_date: string | null; is_active: boolean; created_at: string
}
export type Course = {
  id: string; name: string; code: string | null; credits: number
  semester_id: string | null; teacher_id: string | null; status: string; created_at: string
}
export type TeacherOpt = { id: string; full_name: string | null }

export const academicService = {
  // ── Semestrlar ──
  listSemesters: async (): Promise<Semester[]> => {
    try { const { data } = await sb.from('semesters').select('*').order('created_at', { ascending: false }); return (data ?? []) as Semester[] }
    catch { return [] }
  },
  createSemester: async (name: string, start?: string | null, end?: string | null): Promise<void> => {
    const { error } = await sb.from('semesters').insert({ name: name.trim(), start_date: start || null, end_date: end || null })
    if (error) throw new Error(error.message ?? 'Semestr yaratishda xatolik')
  },
  deleteSemester: async (id: string): Promise<void> => {
    const { error } = await sb.from('semesters').delete().eq('id', id)
    if (error) throw new Error(error.message ?? 'O‘chirishda xatolik')
  },

  // ── Kurslar ──
  listCourses: async (): Promise<Course[]> => {
    try { const { data } = await sb.from('courses').select('*').order('created_at', { ascending: false }); return (data ?? []) as Course[] }
    catch { return [] }
  },
  createCourse: async (c: { name: string; code?: string | null; credits: number; semester_id?: string | null; teacher_id?: string | null }): Promise<void> => {
    const { error } = await sb.from('courses').insert({
      name: c.name.trim(), code: c.code?.trim() || null, credits: c.credits,
      semester_id: c.semester_id || null, teacher_id: c.teacher_id || null,
    })
    if (error) throw new Error(error.message ?? 'Kurs yaratishda xatolik')
  },
  deleteCourse: async (id: string): Promise<void> => {
    const { error } = await sb.from('courses').delete().eq('id', id)
    if (error) throw new Error(error.message ?? 'O‘chirishda xatolik')
  },

  // ── Kurs uchun o'qituvchilar ro'yxati (o'z tashkiloti, RLS) ──
  listTeachers: async (): Promise<TeacherOpt[]> => {
    try { const { data } = await sb.from('profiles').select('id, full_name').eq('role', 'teacher').order('full_name'); return (data ?? []) as TeacherOpt[] }
    catch { return [] }
  },
}
