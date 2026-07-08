import { supabase } from '@/lib/supabase'
import type {
  AssignmentRow, AssignmentUpdate, AssignmentAttachmentRow, AssignmentSubmissionRow,
} from '@/types/database.types'

// ─── Storage + validation ─────────────────────────────────────────────────────

const BUCKET   = 'assignment-files'
const MAX_SIZE = 20 * 1024 * 1024 // 20 MB — bucket limiti bilan bir xil

const ALLOWED_MIME = new Set<string>([
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
])

export type FileValidationResult = { ok: true } | { ok: false; error: string }

export function validateAssignmentFile(file: File): FileValidationResult {
  if (file.size === 0) return { ok: false, error: "Fayl bo'sh" }
  if (file.size > MAX_SIZE) return { ok: false, error: 'Fayl hajmi 20 MB dan oshmasligi kerak' }
  if (!ALLOWED_MIME.has(file.type)) return { ok: false, error: "Bu fayl turi qo'llab-quvvatlanmaydi (PDF, DOCX, rasm)" }
  return { ok: true }
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileExt(name: string): string {
  const i = name.lastIndexOf('.')
  return i !== -1 ? name.slice(i) : ''
}

// ─── Display models ───────────────────────────────────────────────────────────

export type AssignmentSubject = { id: string; name: string; color: string; icon: string } | null

export type StudentSubmission = Pick<
  AssignmentSubmissionRow,
  'id' | 'status' | 'score' | 'feedback' | 'submitted_at' | 'file_name' | 'file_path' | 'comment'
>

export type StudentAssignment = {
  id:          string
  title:       string
  description: string | null
  deadline:    string | null
  max_score:   number
  created_at:  string
  subject:     AssignmentSubject
  submission:  StudentSubmission | null
}

export type TeacherAssignment = AssignmentRow & {
  subject:           AssignmentSubject
  group_ids:         string[]
  submission_count:  number
}

export type CreateAssignmentPayload = {
  title:       string
  description?: string | null
  subject_id?: string | null
  deadline?:   string | null
  max_score:   number
  status:      'draft' | 'published'
  group_ids:   string[]
}

export type UpdateAssignmentPayload = Partial<Omit<CreateAssignmentPayload, 'group_ids'>> & {
  group_ids?: string[]
}

// ─── Raw nested-select rows (typed — no `any`) ────────────────────────────────

type RawStudentAssignmentRow = {
  id:          string
  title:       string
  description: string | null
  deadline:    string | null
  max_score:   number
  created_at:  string
  subject:     AssignmentSubject
  submissions: StudentSubmission[] | null
}

type RawTeacherAssignmentRow = AssignmentRow & {
  subject:            AssignmentSubject
  assignment_groups:  { group_id: string }[] | null
  submissions:        { count: number }[] | null
}

// ─── Deadline helpers ─────────────────────────────────────────────────────────

export type DeadlineState = 'none' | 'upcoming' | 'due_today' | 'overdue'

export function deadlineState(deadline: string | null, submitted: boolean): DeadlineState {
  if (!deadline) return 'none'
  const now = Date.now()
  const dl  = new Date(deadline).getTime()
  if (Number.isNaN(dl)) return 'none'
  if (dl < now && !submitted) return 'overdue'
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const dlDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(deadline))
  if (dlDay === today) return 'due_today'
  return dl < now ? 'overdue' : 'upcoming'
}

// ═══════════════════════════════════════════════════════════════════════════════
// Service
// ═══════════════════════════════════════════════════════════════════════════════

export const assignmentService = {
  // ── Shared ──────────────────────────────────────────────────────────────────
  getSignedUrl: async (filePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 3600, { download: true })
    if (error) throw new Error(error.message)
    return data.signedUrl
  },

  getAttachments: async (assignmentId: string): Promise<AssignmentAttachmentRow[]> => {
    const { data, error } = await supabase
      .from('assignment_attachments')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  // ── Student ───────────────────────────────────────────────────────────────────
  getStudentAssignments: async (): Promise<StudentAssignment[]> => {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        id, title, description, deadline, max_score, created_at,
        subject:subjects(id, name, color, icon),
        submissions:assignment_submissions(id, status, score, feedback, submitted_at, file_name, file_path, comment)
      `)
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('deadline', { ascending: true, nullsFirst: false })
    if (error) throw new Error(error.message)

    const rows = (data ?? []) as unknown as RawStudentAssignmentRow[]
    return rows.map(r => ({
      id: r.id, title: r.title, description: r.description,
      deadline: r.deadline, max_score: r.max_score, created_at: r.created_at,
      subject: r.subject,
      submission: r.submissions && r.submissions.length > 0 ? r.submissions[0] : null,
    }))
  },

  submitOrReplace: async (
    assignmentId: string,
    studentId:    string,
    file:         File,
    comment?:     string,
  ): Promise<AssignmentSubmissionRow> => {
    const check = validateAssignmentFile(file)
    if (!check.ok) throw new Error(check.error)

    // Muddat tekshiruvi
    const { data: aData, error: aErr } = await supabase
      .from('assignments')
      .select('deadline, status, deleted_at')
      .eq('id', assignmentId)
      .single()
    if (aErr) throw new Error(aErr.message)
    if (!aData || aData.status !== 'published' || aData.deleted_at) throw new Error('Topshiriq mavjud emas')
    if (aData.deadline && new Date(aData.deadline).getTime() < Date.now()) {
      throw new Error("Muddat tugagan — endi topshirib bo'lmaydi")
    }

    // Eski topshiriqni (agar bo'lsa) topamiz — almashtirishda faylni tozalash uchun
    const { data: existing } = await supabase
      .from('assignment_submissions')
      .select('id, file_path')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .maybeSingle()

    const storagePath = `submissions/${assignmentId}/${studentId}/${crypto.randomUUID()}${fileExt(file.name)}`
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false })
    if (upErr) throw new Error(upErr.message)

    const { data, error } = await supabase
      .from('assignment_submissions')
      .upsert({
        assignment_id: assignmentId,
        student_id:    studentId,
        file_name:     file.name,
        file_path:     storagePath,
        file_size:     file.size,
        mime_type:     file.type,
        comment:       comment ?? null,
        status:        'submitted',
        submitted_at:  new Date().toISOString(),
      }, { onConflict: 'assignment_id,student_id' })
      .select()
      .single()

    if (error) {
      await supabase.storage.from(BUCKET).remove([storagePath])
      throw new Error(error.message)
    }

    // Muvaffaqiyatli almashtirilsa — eski faylni o'chiramiz
    if (existing?.file_path && existing.file_path !== storagePath) {
      await supabase.storage.from(BUCKET).remove([existing.file_path])
    }
    return data
  },

  // ── Teacher ───────────────────────────────────────────────────────────────────
  getTeacherAssignments: async (teacherId: string): Promise<TeacherAssignment[]> => {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        subject:subjects(id, name, color, icon),
        assignment_groups(group_id),
        submissions:assignment_submissions(count)
      `)
      .eq('teacher_id', teacherId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)

    const rows = (data ?? []) as unknown as RawTeacherAssignmentRow[]
    return rows.map(r => ({
      ...r,
      subject: r.subject,
      group_ids: (r.assignment_groups ?? []).map(g => g.group_id),
      submission_count: r.submissions?.[0]?.count ?? 0,
    }))
  },

  create: async (teacherId: string, payload: CreateAssignmentPayload): Promise<string> => {
    if (!payload.title.trim()) throw new Error('Sarlavha kiritilishi shart')
    if (payload.deadline && new Date(payload.deadline).getTime() < Date.now()) {
      throw new Error("Muddat o'tmishdagi sana bo'lishi mumkin emas")
    }
    if (payload.group_ids.length === 0) throw new Error('Kamida bitta guruh tanlang')

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        teacher_id:   teacherId,
        subject_id:   payload.subject_id ?? null,
        title:        payload.title.trim(),
        description:  payload.description ?? null,
        deadline:     payload.deadline ?? null,
        max_score:    payload.max_score,
        status:       payload.status,
        published_at: payload.status === 'published' ? new Date().toISOString() : null,
      })
      .select('id')
      .single()
    if (error) throw new Error(error.message)

    await assignmentService.setGroups(data.id, payload.group_ids)
    return data.id
  },

  update: async (assignmentId: string, payload: UpdateAssignmentPayload): Promise<void> => {
    if (payload.deadline && new Date(payload.deadline).getTime() < Date.now()) {
      throw new Error("Muddat o'tmishdagi sana bo'lishi mumkin emas")
    }
    const patch: AssignmentUpdate = {}
    if (payload.title       !== undefined) patch.title       = payload.title?.trim()
    if (payload.description !== undefined) patch.description = payload.description
    if (payload.subject_id  !== undefined) patch.subject_id  = payload.subject_id
    if (payload.deadline    !== undefined) patch.deadline    = payload.deadline
    if (payload.max_score   !== undefined) patch.max_score   = payload.max_score
    if (payload.status      !== undefined) {
      patch.status = payload.status
      if (payload.status === 'published') patch.published_at = new Date().toISOString()
    }

    const { error } = await supabase.from('assignments').update(patch).eq('id', assignmentId)
    if (error) throw new Error(error.message)

    if (payload.group_ids) await assignmentService.setGroups(assignmentId, payload.group_ids)
  },

  // Soft delete
  remove: async (assignmentId: string): Promise<void> => {
    const { error } = await supabase
      .from('assignments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', assignmentId)
    if (error) throw new Error(error.message)
  },

  setGroups: async (assignmentId: string, groupIds: string[]): Promise<void> => {
    // Guruh biriktirmalarini to'liq almashtiramiz
    const { error: delErr } = await supabase
      .from('assignment_groups')
      .delete()
      .eq('assignment_id', assignmentId)
    if (delErr) throw new Error(delErr.message)

    if (groupIds.length === 0) return
    const { error: insErr } = await supabase
      .from('assignment_groups')
      .insert(groupIds.map(group_id => ({ assignment_id: assignmentId, group_id })))
    if (insErr) throw new Error(insErr.message)
  },

  uploadAttachment: async (
    assignmentId: string,
    uploadedBy:   string,
    file:         File,
  ): Promise<AssignmentAttachmentRow> => {
    const check = validateAssignmentFile(file)
    if (!check.ok) throw new Error(check.error)

    const storagePath = `assignments/${assignmentId}/${crypto.randomUUID()}${fileExt(file.name)}`
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false })
    if (upErr) throw new Error(upErr.message)

    const { data, error } = await supabase
      .from('assignment_attachments')
      .insert({
        assignment_id: assignmentId,
        file_name:     file.name,
        file_path:     storagePath,
        file_size:     file.size,
        mime_type:     file.type,
        uploaded_by:   uploadedBy,
      })
      .select()
      .single()
    if (error) {
      await supabase.storage.from(BUCKET).remove([storagePath])
      throw new Error(error.message)
    }
    return data
  },

  deleteAttachment: async (id: string, filePath: string): Promise<void> => {
    await supabase.storage.from(BUCKET).remove([filePath])
    const { error } = await supabase.from('assignment_attachments').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  getSubmissions: async (assignmentId: string): Promise<AssignmentSubmissionRow[]> => {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .is('deleted_at', null)
      .order('submitted_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  gradeSubmission: async (
    submissionId: string,
    graderId:     string,
    score:        number,
    feedback:     string | null,
    maxScore:     number,
  ): Promise<void> => {
    if (score < 0 || score > maxScore) throw new Error(`Baho 0 va ${maxScore} orasida bo'lishi kerak`)
    const { error } = await supabase
      .from('assignment_submissions')
      .update({
        score, feedback,
        status:    'graded',
        graded_by: graderId,
        graded_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
    if (error) throw new Error(error.message)
  },
}
