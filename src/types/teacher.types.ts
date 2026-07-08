/**
 * types/teacher.types.ts
 * Teacher panel yangi jadval tiplari (023 migratsiyada yaratiladi — hali
 * generatsiya qilingan database.types.ts da yo'q).
 */

export type LessonViewRow = {
  id:              string
  lesson_id:       string
  student_id:      string
  watch_seconds:   number
  completed:       boolean
  first_viewed_at: string
  last_viewed_at:  string
}

export type VideoLessonRow = {
  id:               string
  lesson_id:        string | null
  teacher_id:       string
  video_url:        string
  duration_seconds: number | null
  created_at:       string
}

export type QrAttendanceSessionRow = {
  id:         string
  teacher_id: string
  group_id:   string
  lesson_id:  string | null
  code:       string
  status:     'active' | 'closed'
  expires_at: string
  created_at: string
}
