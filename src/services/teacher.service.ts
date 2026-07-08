import { supabase } from '@/lib/supabase'
import type { ProfileRow, SubjectRow } from '@/types/database.types'
import { adminCreateAuthUser, adminDeleteAuthUser } from './adminUser.service'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

export type TeacherSubjectRef = Pick<SubjectRow, 'id' | 'name' | 'color' | 'icon'>

export type Teacher = ProfileRow & {
  subjects:    TeacherSubjectRef[]
  group_count: number
}

export type CreateTeacherPayload = {
  full_name:   string
  email:       string
  password:    string
  phone?:      string
  bio?:        string
  subject_ids?: string[]
}

export type UpdateTeacherPayload = {
  full_name?:   string
  phone?:       string | null
  bio?:         string | null
  status?:      'active' | 'inactive'
  subject_ids?: string[]
}

// ─── Servis ───────────────────────────────────────────────────────────────────

export const teacherService = {
  getAll: async (): Promise<Teacher[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        teacher_subjects(subject:subjects(id, name, color, icon)),
        groups!groups_teacher_id_fkey(id)
      `)
      .eq('role', 'teacher')
      .order('full_name', { nullsFirst: false })

    if (error) throw new Error(error.message)

    return (data ?? []).map((row: any) => ({
      ...row,
      subjects:    (row.teacher_subjects ?? []).map((ts: any) => ts.subject).filter(Boolean),
      group_count: (row.groups ?? []).length,
    })) as Teacher[]
  },

  update: async (id: string, payload: UpdateTeacherPayload): Promise<ProfileRow> => {
    const { subject_ids, ...profileFields } = payload

    const { data, error } = await supabase
      .from('profiles')
      .update(profileFields)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    if (subject_ids !== undefined) {
      const { error: delErr } = await supabase
        .from('teacher_subjects')
        .delete()
        .eq('teacher_id', id)
      if (delErr) throw new Error(delErr.message)

      if (subject_ids.length > 0) {
        const { error: insErr } = await supabase
          .from('teacher_subjects')
          .insert(subject_ids.map(subject_id => ({ teacher_id: id, subject_id })))
        if (insErr) throw new Error(insErr.message)
      }
    }

    return data
  },

  // Edge Function orqali yangi o'qituvchi yaratish (auth.users + profil + rol)
  create: async (payload: CreateTeacherPayload): Promise<string> => {
    const userId = await adminCreateAuthUser({
      email:     payload.email,
      full_name: payload.full_name,
      password:  payload.password,
      phone:     payload.phone ?? null,
      bio:       payload.bio   ?? null,
      role:      'teacher',
    })

    if (payload.subject_ids?.length) {
      const { error } = await supabase.from('teacher_subjects').insert(
        payload.subject_ids.map(subject_id => ({ teacher_id: userId, subject_id }))
      )
      if (error) throw new Error(`O'qituvchi yaratildi, ammo fanlarni biriktirishda xatolik: ${error.message}`)
    }

    return userId
  },

  // Edge Function orqali o'chirish (auth foydalanuvchisi ham o'chadi)
  delete: async (id: string): Promise<void> => {
    await adminDeleteAuthUser(id)
  },
}
