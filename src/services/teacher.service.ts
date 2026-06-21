import { supabase } from '@/lib/supabase'
import type { ProfileRow, SubjectRow } from '@/types/database.types'

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

  // Edge Function orqali yangi o'qituvchi yaratish (service_role talab qiladi)
  create: async (payload: CreateTeacherPayload): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: {
        action:    'create',
        email:     payload.email,
        full_name: payload.full_name,
        password:  payload.password,
        phone:     payload.phone  ?? null,
        bio:       payload.bio    ?? null,
        role:      'teacher',
      },
    })

    if (error) {
      throw new Error(
        "Foydalanuvchi yaratishda xatolik.\n" +
        "Edge Function ishga solinganmi? (supabase functions deploy admin-users)"
      )
    }
    if ((data as any)?.error) throw new Error((data as any).error)

    const userId = (data as any)?.userId as string

    if (payload.subject_ids?.length && userId) {
      await supabase.from('teacher_subjects').insert(
        payload.subject_ids.map(subject_id => ({ teacher_id: userId, subject_id }))
      )
    }

    return userId
  },

  // Edge Function orqali o'chirish (auth foydalanuvchisi ham o'chadi)
  delete: async (id: string): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'delete', userId: id },
    })

    if (error) {
      // Edge Function ishlamasa — faqat profilni o'chiramiz
      const { error: dbErr } = await supabase.from('profiles').delete().eq('id', id)
      if (dbErr) throw new Error(dbErr.message)
      return
    }
    if ((data as any)?.error) throw new Error((data as any).error)
  },
}
