/**
 * ai-brain/recommendations/types.ts
 * Recommendation engine types.
 */

import type { Priority, IdentifiedTimestamped } from '../core/types'
import type { StudentIntelligenceProfile } from '../intelligence/types'

// ─── Recommendation Type ──────────────────────────────────────────────────────

export type RecommendationType =
  | 'weak_topic_revision'  // Revisit topics the student is weak in
  | 'next_lesson'          // Advance to the recommended next lesson
  | 'homework_due'         // Incomplete homework needs attention
  | 'practice_quiz'        // Practice quiz on current topic
  | 'exam_preparation'     // Coming exam — start preparing
  | 'streak_maintenance'   // Keep the streak alive
  | 'xp_challenge'         // Challenge to earn more XP
  | 'attendance_warning'   // Attendance dropping
  | 'mastery_boost'        // Topic mastered — go deeper

// ─── Recommendation ───────────────────────────────────────────────────────────

export interface Recommendation extends IdentifiedTimestamped {
  readonly type:          RecommendationType
  readonly priority:      Priority
  readonly title:         string
  readonly description:   string
  /** Why this recommendation was generated */
  readonly reason:        string
  readonly relatedTopics: readonly string[]
  readonly estimatedMin:  number    // estimated time in minutes
  readonly xpReward:      number
  /** Optional prompt to pre-fill in AI chat */
  readonly suggestedPrompt: string | null
  readonly isActioned:    boolean
}

// ─── Recommendation Rule ──────────────────────────────────────────────────────

export interface RecommendationRule {
  readonly id:          string
  readonly name:        string
  readonly description: string
  /** Return true if this rule should fire for the given profile */
  condition(profile: StudentIntelligenceProfile): boolean
  /** Generate the recommendation — called only when condition() is true */
  generate(profile: StudentIntelligenceProfile): Omit<Recommendation, 'id' | 'createdAt' | 'updatedAt' | 'isActioned'>
}

// ─── Recommendation Queue ─────────────────────────────────────────────────────

export interface RecommendationQueue {
  readonly items:      readonly Recommendation[]
  readonly generatedAt: string
  readonly profileId:  string
}
