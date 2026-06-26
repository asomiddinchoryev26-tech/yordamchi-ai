/**
 * ai-brain/intelligence/types.ts
 * Complete Student Intelligence Profile.
 * Designed for future Supabase persistence — all fields are serializable.
 */

import type { Language, LearningStyle, Proficiency, ConfidenceTrend, IdentifiedTimestamped } from '../core/types'
import type { LevelDefinition } from '../core/constants'

// ─── Course Enrollment ───────────────────────────────────────────────────────

export interface CourseEnrollment {
  readonly courseId:    string
  readonly name:        string
  readonly subjectName: string | undefined
  readonly subjectIcon: string | undefined
  readonly enrolledAt:  string
  readonly status:      'active' | 'completed' | 'inactive'
  /** Overall attendance for this course, 0–100 */
  readonly attPct:      number | null
}

// ─── Topic Mastery ───────────────────────────────────────────────────────────

export interface TopicMastery {
  readonly topicId:    string
  readonly title:      string
  readonly mastery:    Proficiency   // 0–100
  readonly courseId:   string
  readonly assessedAt: string
  /** Relative to subject average */
  readonly isWeak:     boolean
}

// ─── Student Level ───────────────────────────────────────────────────────────

export interface StudentLevel {
  readonly definition:   LevelDefinition
  readonly currentXP:    number
  readonly xpInLevel:    number    // XP above this level's minimum
  readonly xpToNext:     number    // XP needed to reach next level
  readonly progressPct:  number    // 0–100 within current level
}

// ─── Learning Goal ───────────────────────────────────────────────────────────

export interface LearningGoal {
  readonly id:          string
  readonly title:       string
  readonly description: string
  /** Target completion date (ISO-8601) */
  readonly deadline:    string | null
  readonly progress:    number   // 0–100
  readonly isComplete:  boolean
}

// ─── Teacher Note ─────────────────────────────────────────────────────────────

export interface TeacherNote extends IdentifiedTimestamped {
  readonly teacherId:   string
  readonly teacherName: string
  readonly content:     string
  readonly courseId:    string
  readonly isPublic:    boolean
}

// ─── Homework Item ───────────────────────────────────────────────────────────

export interface HomeworkItem extends IdentifiedTimestamped {
  readonly title:       string
  readonly description: string
  readonly courseId:    string
  readonly dueDate:     string
  readonly isCompleted: boolean
  readonly priority:    'high' | 'medium' | 'low'
}

// ─── Student Intelligence Profile ────────────────────────────────────────────

/**
 * Complete AI model of a student's learning state.
 * Built from StudentContext + derived computations.
 * Designed to be persisted to user_intelligence_profiles table (Sprint 3.1+).
 */
export interface StudentIntelligenceProfile {
  // ── Identity ──────────────────────────────────────────────────────────────
  readonly userId:            string
  readonly name:              string
  readonly language:          Language
  readonly preferredLanguage: Language
  readonly learningStyle:     LearningStyle
  readonly confidenceTrend:   ConfidenceTrend

  // ── Enrollment ───────────────────────────────────────────────────────────
  readonly enrolledCourses: readonly CourseEnrollment[]
  readonly currentCourse:   CourseEnrollment | null

  // ── Academic Performance ──────────────────────────────────────────────────
  /** Weighted composite: att×0.4 + tests×0.4 + activity×0.2 */
  readonly masteryScore:  Proficiency
  readonly weeklyAvgPct:  number
  readonly testsPassed:   number
  readonly testsTotal:    number
  readonly attPct:        number | null
  readonly attTotal:      number
  readonly weakTopics:    readonly TopicMastery[]
  readonly strongTopics:  readonly TopicMastery[]

  // ── Gamification ──────────────────────────────────────────────────────────
  readonly xp:     number
  readonly level:  StudentLevel
  readonly streak: number

  // ── Goals ─────────────────────────────────────────────────────────────────
  readonly dailyGoal:  LearningGoal
  readonly weeklyGoal: LearningGoal

  // ── External Data ─────────────────────────────────────────────────────────
  readonly teacherNotes:    readonly TeacherNote[]
  readonly homeworkSummary: readonly HomeworkItem[]

  // ── Meta ──────────────────────────────────────────────────────────────────
  readonly builtAt: string  // ISO-8601, when this profile was computed
}
