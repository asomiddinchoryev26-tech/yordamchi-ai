export type CourseStatus = 'draft' | 'published' | 'archived'
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

export interface Course {
  id: string
  title: string
  description: string
  thumbnailUrl?: string
  teacherId: string
  status: CourseStatus
  level: CourseLevel
  category: string
  price: number
  enrollmentCount: number
  createdAt: string
  updatedAt: string
}

export interface Lesson {
  id: string
  courseId: string
  title: string
  content: string
  videoUrl?: string
  order: number
  duration: number
  createdAt: string
}

export interface Enrollment {
  id: string
  courseId: string
  studentId: string
  progress: number
  completedAt?: string
  enrolledAt: string
}

export interface CreateCoursePayload {
  title: string
  description: string
  level: CourseLevel
  category: string
  price: number
}
