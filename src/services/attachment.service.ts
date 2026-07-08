import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

export type AttachmentRow = Database['public']['Tables']['lesson_attachments']['Row']

// Materiallar markazi uchun kengaytirilgan model (yuklovchi ismi bilan)
export type AttachmentWithMeta = AttachmentRow & { uploader_name: string | null }

export type PreviewKind = 'pdf' | 'image' | 'video' | 'audio' | 'office' | 'text' | 'other'

const BUCKET       = 'lesson-attachments'
export const MAX_SIZE = 20 * 1024 * 1024 // 20 MB
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
  'application/zip',
  'application/x-zip-compressed',
])

type RawAttachmentWithUploader = AttachmentRow & { uploader: { full_name: string | null } | null }

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

  // Materiallar markazi uchun — yuklovchi ismi + statistika bilan
  getForLessonWithMeta: async (lessonId: string): Promise<AttachmentWithMeta[]> => {
    const { data, error } = await supabase
      .from('lesson_attachments')
      .select('*, uploader:profiles!lesson_attachments_uploaded_by_fkey(full_name)')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as unknown as RawAttachmentWithUploader[]
    return rows.map(({ uploader, ...rest }) => ({ ...rest, uploader_name: uploader?.full_name ?? null }))
  },

  // Statistikani oshirish (view / download) — RLS'ni chetlab o'tuvchi RPC
  bumpStat: async (id: string, kind: 'view' | 'download'): Promise<void> => {
    await supabase.rpc('bump_attachment_stat', { p_id: id, p_kind: kind })
  },

  // Majburiy / ixtiyoriy belgisini o'zgartirish (o'qituvchi)
  setRequired: async (id: string, value: boolean): Promise<void> => {
    const { error } = await supabase
      .from('lesson_attachments')
      .update({ is_required: value })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  // Faylni qayta nomlash (o'qituvchi)
  rename: async (id: string, fileName: string): Promise<void> => {
    const { error } = await supabase
      .from('lesson_attachments')
      .update({ file_name: fileName })
      .eq('id', id)
    if (error) throw new Error(error.message)
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

  // Yuklab olish uchun (download=true — brauzer faylni saqlaydi)
  getSignedUrl: async (filePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 3600, { download: true })
    if (error) throw new Error(error.message)
    return data.signedUrl
  },

  // Ko'rib chiqish uchun (download YO'Q — PDF/rasm brauzerda ochiladi)
  getPreviewUrl: async (filePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 3600)
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

  // Progress bilan yuklash (XHR orqali — real foiz ko'rsatadi).
  uploadWithProgress: async (
    lessonId:   string,
    uploadedBy: string,
    file:       File,
    onProgress: (percent: number) => void,
  ): Promise<AttachmentRow> => {
    if (file.size === 0)      throw new Error("Fayl bo'sh")
    if (file.size > MAX_SIZE) throw new Error('Fayl hajmi 20 MB dan oshmasligi kerak')
    if (!ALLOWED_MIME.has(file.type)) throw new Error("Bu fayl turi qo'llab-quvvatlanmaydi")

    const dotIdx = file.name.lastIndexOf('.')
    const ext = dotIdx !== -1 ? file.name.slice(dotIdx) : ''
    const storagePath = `${lessonId}/${crypto.randomUUID()}${ext}`

    const { data: sess } = await supabase.auth.getSession()
    const token   = sess.session?.access_token
    if (!token) throw new Error('Sessiya topilmadi — qayta kiring')
    const baseUrl = import.meta.env['VITE_SUPABASE_URL']       as string
    const anonKey = import.meta.env['VITE_SUPABASE_ANON_KEY']  as string

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${baseUrl}/storage/v1/object/${BUCKET}/${storagePath}`)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.setRequestHeader('apikey', anonKey)
      xhr.setRequestHeader('x-upsert', 'false')
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload  = () => (xhr.status >= 200 && xhr.status < 300)
        ? resolve()
        : reject(new Error(`Yuklash xatosi (${xhr.status})`))
      xhr.onerror = () => reject(new Error('Tarmoq xatosi — qayta urinib ko\'ring'))
      xhr.send(file)
    })

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
}

// Fayl brauzerda ko'rib chiqilishi mumkinmi? (Materiallar markazi 'other'dan boshqa hammasini ko'rsatadi)
export function isPreviewable(mimeType: string | null, fileName = ''): boolean {
  return previewKind(mimeType, fileName) !== 'other'
}

// Yuklashdan oldin mijoz tomonida validatsiya (o'lcham + tur)
export function validateAttachment(file: File): string | null {
  if (file.size === 0)      return "Fayl bo'sh"
  if (file.size > MAX_SIZE) return `"${file.name}" — 20 MB dan oshmasligi kerak`
  if (!ALLOWED_MIME.has(file.type)) return `"${file.name}" — qo'llab-quvvatlanmaydigan fayl turi`
  return null
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
  if (mimeType.startsWith('video/')) return '🎬'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📑'
  if (mimeType.includes('zip')) return '📦'
  return '📄'
}

// Fayl kengaytmasini nomdan ajratib olish (katta harflarda: PDF, DOCX ...)
export function fileExtension(fileName: string): string {
  const i = fileName.lastIndexOf('.')
  return i !== -1 ? fileName.slice(i + 1).toUpperCase() : ''
}

// Preview turini MIME + kengaytma bo'yicha aniqlaymiz (Materiallar markazi)
export function previewKind(mimeType: string | null, fileName: string): PreviewKind {
  const mime = mimeType ?? ''
  const ext  = fileExtension(fileName).toLowerCase()
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
  if (mime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video'
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'oga'].includes(ext)) return 'audio'
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)
      || mime.includes('word') || mime.includes('document')
      || mime.includes('excel') || mime.includes('spreadsheet')
      || mime.includes('powerpoint') || mime.includes('presentation')) return 'office'
  if (mime.startsWith('text/') || ext === 'txt') return 'text'
  return 'other'
}

// Microsoft Office Online viewer — DOCX/PPTX/XLSX ni brauzerda ko'rsatadi.
// src imzolangan (signed) URL bo'lishi kerak — Office serveri uni o'qiy oladi.
export function officeViewerUrl(signedUrl: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(signedUrl)}`
}
