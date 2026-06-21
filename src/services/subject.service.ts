import { supabase } from '@/lib/supabase'
import type { SubjectRow, SubjectInsert, SubjectUpdate } from '@/types/database.types'

export type { SubjectRow, SubjectInsert, SubjectUpdate }

export const subjectService = {
  getAll: async (): Promise<SubjectRow[]> => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name')
    if (error) throw new Error(error.message)
    return data
  },

  create: async (payload: SubjectInsert): Promise<SubjectRow> => {
    const { data, error } = await supabase
      .from('subjects')
      .insert(payload)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  update: async (id: string, payload: SubjectUpdate): Promise<SubjectRow> => {
    const { data, error } = await supabase
      .from('subjects')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
}
