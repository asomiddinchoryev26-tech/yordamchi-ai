import { supabase } from '@/lib/supabase'
import type { NotificationRow } from '@/types/database.types'

export type NotificationType = NotificationRow['type']

export const notificationService = {
  list: async (limit = 30): Promise<NotificationRow[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)
    return data ?? []
  },

  unreadCount: async (): Promise<number> => {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null)
    if (error) throw new Error(error.message)
    return count ?? 0
  },

  markRead: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  markAllRead: async (): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null)
    if (error) throw new Error(error.message)
  },

  /**
   * Realtime — foydalanuvchiga yangi bildirishnoma kelganda `onChange` chaqiriladi.
   * Tozalash uchun qaytgan funksiyani chaqiring. (RLS: faqat o'z qatorlarini oladi.)
   */
  subscribeToOwn: (userId: string, onChange: () => void): (() => void) => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => onChange(),
      )
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  },
}
