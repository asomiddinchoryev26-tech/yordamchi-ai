import { supabase } from '@/lib/supabase'
import type { GroupRow, GroupInsert, GroupUpdate } from '@/types/database.types'
import type { SubjectRow } from '@/types/database.types'
import type { ProfileRow } from '@/types/database.types'

export type { GroupRow, GroupInsert, GroupUpdate }

export type GroupWithRelations = GroupRow & {
  subject: Pick<SubjectRow, 'id' | 'name' | 'color' | 'icon'> | null
  teacher: Pick<ProfileRow, 'id' | 'full_name' | 'email'> | null
}

export const groupService = {
  getAll: async (): Promise<GroupWithRelations[]> => {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        subject:subjects(id, name, color, icon),
        teacher:profiles(id, full_name, email)
      `)
      .order('name')
    if (error) throw new Error(error.message)
    return data as GroupWithRelations[]
  },

  create: async (payload: GroupInsert): Promise<GroupRow> => {
    const { data, error } = await supabase
      .from('groups')
      .insert(payload)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  update: async (id: string, payload: GroupUpdate): Promise<GroupRow> => {
    const { data, error } = await supabase
      .from('groups')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
}
