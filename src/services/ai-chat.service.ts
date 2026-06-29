import { supabase } from "@/lib/supabase"
import type { AiConversationRow, AiMessageRow } from "@/types/database.types"

export type { AiConversationRow, AiMessageRow }

export const aiChatService = {
  async getConversations(studentId: string): Promise<AiConversationRow[]> {
    const { data, error } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("student_id", studentId)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async createConversation(studentId: string, title = "Yangi suhbat"): Promise<AiConversationRow> {
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({ student_id: studentId, title })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async updateTitle(id: string, title: string): Promise<void> {
    const { error } = await supabase
      .from("ai_conversations")
      .update({ title })
      .eq("id", id)
    if (error) throw new Error(error.message)
  },

  async setPinned(id: string, pinned: boolean): Promise<void> {
    const { error } = await supabase
      .from("ai_conversations")
      .update({ is_pinned: pinned })
      .eq("id", id)
    if (error) throw new Error(error.message)
  },

  async deleteConversation(id: string): Promise<void> {
    const { error } = await supabase
      .from("ai_conversations")
      .delete()
      .eq("id", id)
    if (error) throw new Error(error.message)
  },

  async getMessages(conversationId: string): Promise<AiMessageRow[]> {
    const { data, error } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async addMessage(conversationId: string, role: "user" | "assistant", content: string): Promise<AiMessageRow> {
    const { data, error } = await supabase
      .from("ai_messages")
      .insert({ conversation_id: conversationId, role, content })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async updateMessageContent(id: string, content: string): Promise<void> {
    const { error } = await supabase
      .from("ai_messages")
      .update({ content })
      .eq("id", id)
    if (error) throw new Error(error.message)
  },
}
