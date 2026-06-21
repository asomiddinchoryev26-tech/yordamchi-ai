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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_profile_role: {
        Args:    Record<string, never>
        Returns: string
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

