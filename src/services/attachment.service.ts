import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

export type AttachmentRow = Database['public']['Tables']['lesson_attachments']['Row']

const BUCKET       = 'lesson-attachments'
const MAX_SIZE     = 50 * 1024 * 1024 // 50 MB
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
])

export const attachmentService = {
  getForLesson: async (lessonId: string): Promise<AttachmentRow[]> => {
    const { data, error } = await supabase
      .from('lesson_attachments')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  upload: async (
    lessonId:   string,
    uploadedBy: string,
    file:       File,
  ): Promise<AttachmentRow> => {
    if (file.size > MAX_SIZE) throw new Error("Fayl hajmi 50 MB dan oshmasligi kerak")
    if (!ALLOWED_MIME.has(file.type)) throw new Error("Bu fayl turi qo'llab-quvvatlanmaydi")

    const dotIdx = file.name.lastIndexOf('.')
    const ext = dotIdx !== -1 ? file.name.slice(dotIdx) : ''
    const storagePath = `${lessonId}/${crypto.randomUUID()}${ext}`

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false })
    if (uploadErr) throw new Error(uploadErr.message)

    const { data, error: dbErr } = await supabase
      .from('lesson_attachments')
      .insert({
        lesson_id:   lessonId,
        file_name:   file.name,
        file_path:   storagePath,
        file_size:   file.size,
        mime_type:   file.type,
        uploaded_by: uploadedBy,
      })
      .select()
      .single()

    if (dbErr) {
      await supabase.storage.from(BUCKET).remove([storagePath])
      throw new Error(dbErr.message)
    }

    return data
  },

  getSignedUrl: async (filePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 3600, { download: true })
    if (error) throw new Error(error.message)
    return data.signedUrl
  },

  delete: async (id: string, filePath: string): Promise<void> => {
    await supabase.storage.from(BUCKET).remove([filePath])
    const { error } = await supabase
      .from('lesson_attachments')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
  },
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/\s]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return null
}

export function getMimeIcon(mimeType: string | null): string {
  if (!mimeType) return '📄'
  if (mimeType === 'application/pdf') return '📕'
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📑'
  return '📄'
}
