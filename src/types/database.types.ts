// Supabase uchun to'liq typed database schema.
// Yangi jadval qo'shsangiz — shu faylni ham yangilang.

export type TestQuestion = {
  id:            string
  question:      string
  options:       [string, string, string, string]
  correct_index: 0 | 1 | 2 | 3
}

export type Database = {
  public: {
    Tables: {
      subjects: {
        Row: {
          id:          string
          name:        string
          description: string | null
          color:       string
          icon:        string
          created_at:  string
        }
        Insert: {
          id?:          string
          name:         string
          description?: string | null
          color?:       string
          icon?:        string
          created_at?:  string
        }
        Update: {
          name?:        string
          description?: string | null
          color?:       string
          icon?:        string
        }
        Relationships: []
      }
      groups: {
        Row: {
          id:          string
          name:        string
          subject_id:  string | null
          teacher_id:  string | null
          capacity:    number
          status:      'active' | 'inactive' | 'completed'
          start_date:  string | null
          end_date:    string | null
          description: string | null
          created_at:  string
        }
        Insert: {
          id?:          string
          name:         string
          subject_id?:  string | null
          teacher_id?:  string | null
          capacity?:    number
          status?:      'active' | 'inactive' | 'completed'
          start_date?:  string | null
          end_date?:    string | null
          description?: string | null
          created_at?:  string
        }
        Update: {
          name?:        string
          subject_id?:  string | null
          teacher_id?:  string | null
          capacity?:    number
          status?:      'active' | 'inactive' | 'completed'
          start_date?:  string | null
          end_date?:    string | null
          description?: string | null
        }
        Relationships: [
          { foreignKeyName: 'groups_subject_id_fkey'; columns: ['subject_id']; referencedRelation: 'subjects'; referencedColumns: ['id'] },
          { foreignKeyName: 'groups_teacher_id_fkey'; columns: ['teacher_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      profiles: {
        Row: {
          id:         string
          full_name:  string | null
          email:      string | null
          role:       'student' | 'teacher' | 'admin'
          avatar_url: string | null
          phone:      string | null
          bio:        string | null
          status:     'active' | 'inactive'
          created_at: string
          organization_id: string | null
        }
        Insert: {
          id:          string
          full_name?:  string | null
          email?:      string | null
          role?:       'student' | 'teacher' | 'admin'
          avatar_url?: string | null
          phone?:      string | null
          bio?:        string | null
          status?:     'active' | 'inactive'
          created_at?: string
          organization_id?: string | null
        }
        Update: {
          id?:         string
          full_name?:  string | null
          email?:      string | null
          role?:       'student' | 'teacher' | 'admin'
          avatar_url?: string | null
          phone?:      string | null
          bio?:        string | null
          status?:     'active' | 'inactive'
          created_at?: string
          organization_id?: string | null
        }
        Relationships: []
      }
      teacher_subjects: {
        Row: {
          teacher_id: string
          subject_id: string
        }
        Insert: {
          teacher_id: string
          subject_id: string
        }
        Update: {
          teacher_id?: string
          subject_id?: string
        }
        Relationships: [
          { foreignKeyName: 'teacher_subjects_teacher_id_fkey'; columns: ['teacher_id']; referencedRelation: 'profiles';  referencedColumns: ['id'] },
          { foreignKeyName: 'teacher_subjects_subject_id_fkey'; columns: ['subject_id']; referencedRelation: 'subjects'; referencedColumns: ['id'] },
        ]
      }
      attendance: {
        Row: {
          id:            string
          student_id:    string
          group_id:      string
          teacher_id:    string | null
          attended_date: string
          status:        'present' | 'absent' | 'late' | 'excused'
          note:          string | null
          created_at:    string
        }
        Insert: {
          id?:            string
          student_id:     string
          group_id:       string
          teacher_id?:    string | null
          attended_date:  string
          status?:        'present' | 'absent' | 'late' | 'excused'
          note?:          string | null
          created_at?:    string
        }
        Update: {
          status?:        'present' | 'absent' | 'late' | 'excused'
          note?:          string | null
          teacher_id?:    string | null
        }
        Relationships: [
          { foreignKeyName: 'attendance_student_id_fkey'; columns: ['student_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'attendance_group_id_fkey';   columns: ['group_id'];   referencedRelation: 'groups';   referencedColumns: ['id'] },
        ]
      }
      tests: {
        Row: {
          id:               string
          title:            string
          description:      string | null
          group_id:         string | null
          subject_id:       string | null
          created_by:       string | null
          duration_minutes: number
          is_published:     boolean
          questions:        TestQuestion[]
          created_at:       string
        }
        Insert: {
          id?:               string
          title:             string
          description?:      string | null
          group_id?:         string | null
          subject_id?:       string | null
          created_by?:       string | null
          duration_minutes?: number
          is_published?:     boolean
          questions?:        TestQuestion[]
          created_at?:       string
        }
        Update: {
          title?:            string
          description?:      string | null
          group_id?:         string | null
          subject_id?:       string | null
          duration_minutes?: number
          is_published?:     boolean
          questions?:        TestQuestion[]
        }
        Relationships: [
          { foreignKeyName: 'tests_group_id_fkey';   columns: ['group_id'];   referencedRelation: 'groups';   referencedColumns: ['id'] },
          { foreignKeyName: 'tests_subject_id_fkey'; columns: ['subject_id']; referencedRelation: 'subjects'; referencedColumns: ['id'] },
          { foreignKeyName: 'tests_created_by_fkey'; columns: ['created_by']; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      lessons: {
        Row: {
          id:           string
          title:        string
          content:      string | null
          video_url:    string | null
          group_id:     string | null
          subject_id:   string | null
          teacher_id:   string | null
          lesson_date:  string | null
          order_num:    number
          is_published: boolean
          created_at:   string
        }
        Insert: {
          id?:           string
          title:         string
          content?:      string | null
          video_url?:    string | null
          group_id?:     string | null
          subject_id?:   string | null
          teacher_id?:   string | null
          lesson_date?:  string | null
          order_num?:    number
          is_published?: boolean
          created_at?:   string
        }
        Update: {
          title?:        string
          content?:      string | null
          video_url?:    string | null
          group_id?:     string | null
          subject_id?:   string | null
          teacher_id?:   string | null
          lesson_date?:  string | null
          order_num?:    number
          is_published?: boolean
        }
        Relationships: [
          { foreignKeyName: 'lessons_group_id_fkey';   columns: ['group_id'];   referencedRelation: 'groups';   referencedColumns: ['id'] },
          { foreignKeyName: 'lessons_subject_id_fkey'; columns: ['subject_id']; referencedRelation: 'subjects'; referencedColumns: ['id'] },
          { foreignKeyName: 'lessons_teacher_id_fkey'; columns: ['teacher_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      lesson_attachments: {
        Row: {
          id:                 string
          lesson_id:          string
          file_name:          string
          file_path:          string
          file_size:          number | null
          mime_type:          string | null
          uploaded_by:        string | null
          created_at:         string
          view_count:         number
          download_count:     number
          last_viewed_at:     string | null
          last_downloaded_at: string | null
          is_required:        boolean
        }
        Insert: {
          id?:          string
          lesson_id:    string
          file_name:    string
          file_path:    string
          file_size?:   number | null
          mime_type?:   string | null
          uploaded_by?: string | null
          created_at?:  string
          is_required?: boolean
        }
        Update: {
          file_name?:   string
          is_required?: boolean
        }
        Relationships: [
          { foreignKeyName: 'lesson_attachments_lesson_id_fkey';   columns: ['lesson_id'];   referencedRelation: 'lessons';  referencedColumns: ['id'] },
          { foreignKeyName: 'lesson_attachments_uploaded_by_fkey'; columns: ['uploaded_by']; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      settings: {
        Row: {
          key:        string
          value:      string | null
          updated_at: string
        }
        Insert: {
          key:         string
          value?:      string | null
          updated_at?: string
        }
        Update: {
          value?:      string | null
          updated_at?: string
        }
        Relationships: []
      }
      test_results: {
        Row: {
          id:              string
          test_id:         string
          student_id:      string
          answers:         Record<string, number>
          score:           number
          total_questions: number
          submitted_at:    string | null
          started_at:      string
        }
        Insert: {
          id?:              string
          test_id:          string
          student_id:       string
          answers?:         Record<string, number>
          score?:           number
          total_questions?: number
          submitted_at?:    string | null
          started_at?:      string
        }
        Update: {
          answers?:         Record<string, number>
          score?:           number
          total_questions?: number
          submitted_at?:    string | null
        }
        Relationships: [
          { foreignKeyName: 'test_results_test_id_fkey';    columns: ['test_id'];    referencedRelation: 'tests';    referencedColumns: ['id'] },
          { foreignKeyName: 'test_results_student_id_fkey'; columns: ['student_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      student_groups: {
        Row: {
          id:          string
          student_id:  string
          group_id:    string
          enrolled_at: string
        }
        Insert: {
          id?:          string
          student_id:   string
          group_id:     string
          enrolled_at?: string
        }
        Update: {
          student_id?:  string
          group_id?:    string
          enrolled_at?: string
        }
        Relationships: [
          { foreignKeyName: 'student_groups_student_id_fkey'; columns: ['student_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'student_groups_group_id_fkey';   columns: ['group_id'];   referencedRelation: 'groups';   referencedColumns: ['id'] },
        ]
      }
      achievement_definitions: {
        Row: {
          id:               string
          code:             string
          name:             Record<string, string>
          description:      Record<string, string>
          target_role:      'student' | 'teacher'
          tier:             'gold' | 'silver' | 'bronze' | 'special'
          icon_emoji:       string
          condition_type:   'threshold' | 'rank' | 'component'
          condition_config: Record<string, unknown>
          is_active:        boolean
          created_at:       string
        }
        Insert: {
          id?:               string
          code:              string
          name?:             Record<string, string>
          description?:      Record<string, string>
          target_role:       'student' | 'teacher'
          tier:              'gold' | 'silver' | 'bronze' | 'special'
          icon_emoji?:       string
          condition_type:    'threshold' | 'rank' | 'component'
          condition_config?: Record<string, unknown>
          is_active?:        boolean
          created_at?:       string
        }
        Update: {
          code?:             string
          name?:             Record<string, string>
          description?:      Record<string, string>
          target_role?:      'student' | 'teacher'
          tier?:             'gold' | 'silver' | 'bronze' | 'special'
          icon_emoji?:       string
          condition_type?:   'threshold' | 'rank' | 'component'
          condition_config?: Record<string, unknown>
          is_active?:        boolean
        }
        Relationships: []
      }
      user_score_snapshots: {
        Row: {
          id:                string
          user_id:           string
          role:              'student' | 'teacher'
          period_type:       'monthly' | 'yearly'
          period_year:       number
          period_month:      number | null
          group_id:          string | null
          attendance_score:  number
          test_score:        number
          consistency_score: number
          activity_score:    number
          total_score:       number
          calculated_at:     string
        }
        Insert: {
          id?:                string
          user_id:            string
          role:               'student' | 'teacher'
          period_type:        'monthly' | 'yearly'
          period_year:        number
          period_month?:      number | null
          group_id?:          string | null
          attendance_score?:  number
          test_score?:        number
          consistency_score?: number
          activity_score?:    number
          total_score?:       number
          calculated_at?:     string
        }
        Update: {
          attendance_score?:  number
          test_score?:        number
          consistency_score?: number
          activity_score?:    number
          total_score?:       number
          calculated_at?:     string
        }
        Relationships: [
          { foreignKeyName: 'user_score_snapshots_user_id_fkey';  columns: ['user_id'];  referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'user_score_snapshots_group_id_fkey'; columns: ['group_id']; referencedRelation: 'groups';   referencedColumns: ['id'] },
        ]
      }
      user_achievements: {
        Row: {
          id:             string
          user_id:        string
          achievement_id: string
          snapshot_id:    string | null
          period_type:    'monthly' | 'yearly'
          period_year:    number
          period_month:   number | null
          group_id:       string | null
          total_score:    number | null
          earned_at:      string
        }
        Insert: {
          id?:             string
          user_id:         string
          achievement_id:  string
          snapshot_id?:    string | null
          period_type:     'monthly' | 'yearly'
          period_year:     number
          period_month?:   number | null
          group_id?:       string | null
          total_score?:    number | null
          earned_at?:      string
        }
        Update: {
          snapshot_id?: string | null
          total_score?: number | null
          earned_at?:   string
        }
        Relationships: [
          { foreignKeyName: 'user_achievements_user_id_fkey';         columns: ['user_id'];         referencedRelation: 'profiles';                referencedColumns: ['id'] },
          { foreignKeyName: 'user_achievements_achievement_id_fkey';  columns: ['achievement_id'];  referencedRelation: 'achievement_definitions'; referencedColumns: ['id'] },
          { foreignKeyName: 'user_achievements_snapshot_id_fkey';     columns: ['snapshot_id'];     referencedRelation: 'user_score_snapshots';    referencedColumns: ['id'] },
          { foreignKeyName: 'user_achievements_group_id_fkey';        columns: ['group_id'];        referencedRelation: 'groups';                  referencedColumns: ['id'] },
        ]
      }
      ai_conversations: {
        Row: {
          id:         string
          student_id: string
          title:      string
          is_pinned:  boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?:         string
          student_id:  string
          title?:      string
          is_pinned?:  boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?:      string
          is_pinned?:  boolean
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'ai_conversations_student_id_fkey'; columns: ['student_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      ai_messages: {
        Row: {
          id:              string
          conversation_id: string
          role:            'user' | 'assistant'
          content:         string
          created_at:      string
        }
        Insert: {
          id?:              string
          conversation_id:  string
          role:             'user' | 'assistant'
          content:          string
          created_at?:      string
        }
        Update: {
          content?: string
        }
        Relationships: [
          { foreignKeyName: 'ai_messages_conversation_id_fkey'; columns: ['conversation_id']; referencedRelation: 'ai_conversations'; referencedColumns: ['id'] },
        ]
      }
      // Sprint 3.2 Phase 1 — AI Vision
      ai_vision_results: {
        Row: {
          id:            string
          student_id:    string
          topic:         string
          subject:       string
          difficulty:    string
          detected_text: string
          solution_json: Record<string, unknown>
          xp_earned:     number
          duration_ms:   number
          confidence:    number
          created_at:    string
          updated_at:    string
        }
        Insert: {
          id?:            string
          student_id:     string
          topic?:         string
          subject?:       string
          difficulty?:    string
          detected_text?: string
          solution_json?: Record<string, unknown>
          xp_earned?:     number
          duration_ms?:   number
          confidence?:    number
          created_at?:    string
          updated_at?:    string
        }
        Update: {
          topic?:         string
          subject?:       string
          difficulty?:    string
          detected_text?: string
          solution_json?: Record<string, unknown>
          xp_earned?:     number
          duration_ms?:   number
          confidence?:    number
          updated_at?:    string
        }
        Relationships: []
      }
      // Migration 018 — Homework & Assignment module
      assignments: {
        Row: {
          id:           string
          teacher_id:   string
          subject_id:   string | null
          title:        string
          description:  string | null
          deadline:     string | null
          max_score:    number
          status:       'draft' | 'published'
          published_at: string | null
          deleted_at:   string | null
          created_at:   string
          updated_at:   string
        }
        Insert: {
          id?:           string
          teacher_id:    string
          subject_id?:   string | null
          title:         string
          description?:  string | null
          deadline?:     string | null
          max_score?:    number
          status?:       'draft' | 'published'
          published_at?: string | null
          deleted_at?:   string | null
          created_at?:   string
          updated_at?:   string
        }
        Update: {
          subject_id?:   string | null
          title?:        string
          description?:  string | null
          deadline?:     string | null
          max_score?:    number
          status?:       'draft' | 'published'
          published_at?: string | null
          deleted_at?:   string | null
          updated_at?:   string
        }
        Relationships: [
          { foreignKeyName: 'assignments_teacher_id_fkey'; columns: ['teacher_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'assignments_subject_id_fkey'; columns: ['subject_id']; referencedRelation: 'subjects'; referencedColumns: ['id'] },
        ]
      }
      assignment_groups: {
        Row: {
          id:            string
          assignment_id: string
          group_id:      string
          created_at:    string
        }
        Insert: {
          id?:            string
          assignment_id:  string
          group_id:       string
          created_at?:    string
        }
        Update: {
          group_id?: string
        }
        Relationships: [
          { foreignKeyName: 'assignment_groups_assignment_id_fkey'; columns: ['assignment_id']; referencedRelation: 'assignments'; referencedColumns: ['id'] },
          { foreignKeyName: 'assignment_groups_group_id_fkey';      columns: ['group_id'];      referencedRelation: 'groups';      referencedColumns: ['id'] },
        ]
      }
      assignment_attachments: {
        Row: {
          id:            string
          assignment_id: string
          file_name:     string
          file_path:     string
          file_size:     number | null
          mime_type:     string | null
          uploaded_by:   string | null
          created_at:    string
        }
        Insert: {
          id?:            string
          assignment_id:  string
          file_name:      string
          file_path:      string
          file_size?:     number | null
          mime_type?:     string | null
          uploaded_by?:   string | null
          created_at?:    string
        }
        Update: {
          file_name?: string
        }
        Relationships: [
          { foreignKeyName: 'assignment_attachments_assignment_id_fkey'; columns: ['assignment_id']; referencedRelation: 'assignments'; referencedColumns: ['id'] },
        ]
      }
      assignment_submissions: {
        Row: {
          id:            string
          assignment_id: string
          student_id:    string
          file_name:     string | null
          file_path:     string | null
          file_size:     number | null
          mime_type:     string | null
          comment:       string | null
          status:        'submitted' | 'graded' | 'returned'
          score:         number | null
          feedback:      string | null
          graded_by:     string | null
          graded_at:     string | null
          submitted_at:  string
          deleted_at:    string | null
          created_at:    string
          updated_at:    string
        }
        Insert: {
          id?:            string
          assignment_id:  string
          student_id:     string
          file_name?:     string | null
          file_path?:     string | null
          file_size?:     number | null
          mime_type?:     string | null
          comment?:       string | null
          status?:        'submitted' | 'graded' | 'returned'
          score?:         number | null
          feedback?:      string | null
          graded_by?:     string | null
          graded_at?:     string | null
          submitted_at?:  string
          deleted_at?:    string | null
          created_at?:    string
          updated_at?:    string
        }
        Update: {
          file_name?:    string | null
          file_path?:    string | null
          file_size?:    number | null
          mime_type?:    string | null
          comment?:      string | null
          status?:       'submitted' | 'graded' | 'returned'
          score?:        number | null
          feedback?:     string | null
          graded_by?:    string | null
          graded_at?:    string | null
          deleted_at?:   string | null
          updated_at?:   string
        }
        Relationships: [
          { foreignKeyName: 'assignment_submissions_assignment_id_fkey'; columns: ['assignment_id']; referencedRelation: 'assignments'; referencedColumns: ['id'] },
          { foreignKeyName: 'assignment_submissions_student_id_fkey';    columns: ['student_id'];    referencedRelation: 'profiles';    referencedColumns: ['id'] },
        ]
      }
      notifications: {
        Row: {
          id:         string
          user_id:    string
          type:       'assignment_new' | 'assignment_graded' | 'assignment_deadline'
          title:      string
          body:       string | null
          data:       Record<string, unknown>
          read_at:    string | null
          created_at: string
        }
        Insert: {
          id?:         string
          user_id:     string
          type:        'assignment_new' | 'assignment_graded' | 'assignment_deadline'
          title:       string
          body?:       string | null
          data?:       Record<string, unknown>
          read_at?:    string | null
          created_at?: string
        }
        Update: {
          read_at?: string | null
        }
        Relationships: [
          { foreignKeyName: 'notifications_user_id_fkey'; columns: ['user_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_profile_role: {
        Args:    Record<string, never>
        Returns: string
      }
      get_my_current_score: {
        Args:    { p_group_id: string }
        Returns: Array<{
          attendance_score:  number
          test_score:        number
          consistency_score: number
          activity_score:    number
          total_score:       number
        }>
      }
      get_my_teacher_score_current: {
        Args:    Record<string, never>
        Returns: Array<{
          attendance_score:  number
          test_score:        number
          consistency_score: number
          activity_score:    number
          total_score:       number
        }>
      }
      run_monthly_achievement_cycle: {
        Args:    { p_year: number; p_month: number }
        Returns: Record<string, unknown>
      }
      create_deadline_reminders: {
        Args:    Record<string, never>
        Returns: number
      }
      bump_attachment_stat: {
        Args:    { p_id: string; p_kind: string }
        Returns: undefined
      }
      // Migration 021 — test integrity (server-side, answer-safe)
      get_student_tests: {
        Args:    Record<string, never>
        Returns: unknown[]
      }
      submit_test: {
        Args:    { p_test_id: string; p_answers: Record<string, number> }
        Returns: Record<string, unknown>
      }
      get_my_test_results: {
        Args:    Record<string, never>
        Returns: unknown[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
export type ProfileRow    = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type SubjectRow    = Database['public']['Tables']['subjects']['Row']
export type SubjectInsert = Database['public']['Tables']['subjects']['Insert']
export type SubjectUpdate = Database['public']['Tables']['subjects']['Update']

export type GroupRow    = Database['public']['Tables']['groups']['Row']
export type GroupInsert = Database['public']['Tables']['groups']['Insert']
export type GroupUpdate = Database['public']['Tables']['groups']['Update']

export type TeacherSubjectRow = Database['public']['Tables']['teacher_subjects']['Row']
export type StudentGroupRow   = Database['public']['Tables']['student_groups']['Row']

export type LessonRow    = Database['public']['Tables']['lessons']['Row']
export type LessonInsert = Database['public']['Tables']['lessons']['Insert']
export type LessonUpdate = Database['public']['Tables']['lessons']['Update']

export type SettingRow = Database['public']['Tables']['settings']['Row']

export type AttendanceRow    = Database['public']['Tables']['attendance']['Row']
export type AttendanceInsert = Database['public']['Tables']['attendance']['Insert']
export type AttendanceUpdate = Database['public']['Tables']['attendance']['Update']

export type TestRow    = Database['public']['Tables']['tests']['Row']
export type TestInsert = Database['public']['Tables']['tests']['Insert']
export type TestUpdate = Database['public']['Tables']['tests']['Update']

export type TestResultRow    = Database['public']['Tables']['test_results']['Row']
export type TestResultInsert = Database['public']['Tables']['test_results']['Insert']

export type AiConversationRow    = Database['public']['Tables']['ai_conversations']['Row']
export type AiConversationInsert = Database['public']['Tables']['ai_conversations']['Insert']
export type AiMessageRow         = Database['public']['Tables']['ai_messages']['Row']
export type AiMessageInsert      = Database['public']['Tables']['ai_messages']['Insert']

// Migration 018 — Homework & Assignment module
export type AssignmentRow    = Database['public']['Tables']['assignments']['Row']
export type AssignmentInsert = Database['public']['Tables']['assignments']['Insert']
export type AssignmentUpdate = Database['public']['Tables']['assignments']['Update']

export type AssignmentGroupRow = Database['public']['Tables']['assignment_groups']['Row']

export type AssignmentAttachmentRow    = Database['public']['Tables']['assignment_attachments']['Row']
export type AssignmentAttachmentInsert = Database['public']['Tables']['assignment_attachments']['Insert']

export type AssignmentSubmissionRow    = Database['public']['Tables']['assignment_submissions']['Row']
export type AssignmentSubmissionInsert = Database['public']['Tables']['assignment_submissions']['Insert']
export type AssignmentSubmissionUpdate = Database['public']['Tables']['assignment_submissions']['Update']

export type NotificationRow    = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

