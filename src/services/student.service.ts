import { supabase } from '@/lib/supabase'
import type { ProfileRow, GroupRow } from '@/types/database.types'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

export type StudentGroupRef = Pick<GroupRow, 'id' | 'name' | 'status'>

export type Student = ProfileRow & {
  groups: StudentGroupRef[]
}

export type CreateStudentPayload = {
  full_name: string
  email:     string
  password:  string
  phone?:    string
  bio?:      string
  group_ids?: string[]
}

export type UpdateStudentPayload = {
  full_name?:  string
  phone?:      string | null
  bio?:        string | null
  status?:     'active' | 'inactive'
  group_ids?:  string[]
}

// ─── Servis ───────────────────────────────────────────────────────────────────

export const studentService = {
  getAll: async (): Promise<Student[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        student_groups(group:groups(id, name, status))
      `)
      .eq('role', 'student')
      .order('full_name', { nullsFirst: false })

    if (error) throw new Error(error.message)

    return (data ?? []).map((row: any) => ({
      ...row,
      groups: (row.student_groups ?? []).map((sg: any) => sg.group).filter(Boolean),
    })) as Student[]
  },

  update: async (id: string, payload: UpdateStudentPayload): Promise<ProfileRow> => {
    const { group_ids, ...profileFields } = payload

    const { data, error } = await supabase
      .from('profiles')
      .update(profileFields)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)

    if (group_ids !== undefined) {
      const { error: delErr } = await supabase
        .from('student_groups')
        .delete()
        .eq('student_id', id)
      if (delErr) throw new Error(delErr.message)

      if (group_ids.length > 0) {
        const { error: insErr } = await supabase
          .from('student_groups')
          .insert(group_ids.map(group_id => ({ student_id: id, group_id })))
        if (insErr) throw new Error(insErr.message)
      }
    }

    return data
  },

  // Edge Function orqali yangi talaba yaratish
  create: async (payload: CreateStudentPayload): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: {
        action:    'create',
        email:     payload.email,
        full_name: payload.full_name,
        password:  payload.password,
        phone:     payload.phone ?? null,
        bio:       payload.bio   ?? null,
        role:      'student',
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

    if (payload.group_ids?.length && userId) {
      await supabase.from('student_groups').insert(
        payload.group_ids.map(group_id => ({ student_id: userId, group_id }))
      )
    }

    return userId
  },

  // Edge Function orqali o'chirish
  delete: async (id: string): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'delete', userId: id },
    })

    if (error) {
      const { error: dbErr } = await supabase.from('profiles').delete().eq('id', id)
      if (dbErr) throw new Error(dbErr.message)
      return
    }
    if ((data as any)?.error) throw new Error((data as any).error)
  },
}
