/**
 * ai-brain/core/types.ts
 * Primitive types shared across all AI Brain modules.
 * No business logic here — pure type definitions only.
 */

// ─── Language ─────────────────────────────────────────────────────────────────

export type Language = 'uz' | 'ru' | 'en'

// ─── Priority ─────────────────────────────────────────────────────────────────

export type Priority = 'urgent' | 'high' | 'medium' | 'low'

// ─── Proficiency ──────────────────────────────────────────────────────────────

/** 0–100 mastery percentage */
export type Proficiency = number

// ─── Bloom's Taxonomy Levels ──────────────────────────────────────────────────

export type BloomsLevel =
  | 'remember'   // Recall facts
  | 'understand' // Explain ideas
  | 'apply'      // Use information
  | 'analyze'    // Draw connections
  | 'evaluate'   // Justify a decision
  | 'create'     // Produce new work

// ─── Learning Style ──────────────────────────────────────────────────────────

export type LearningStyle =
  | 'visual'       // Diagrams, charts, spatial understanding
  | 'auditory'     // Listening, discussion, verbal explanation
  | 'reading'      // Text-heavy learning, notes
  | 'kinesthetic'  // Examples, practice, hands-on

// ─── Confidence Trend ────────────────────────────────────────────────────────

export type ConfidenceTrend = 'rising' | 'stable' | 'declining' | 'unknown'

// ─── Timestamped base ────────────────────────────────────────────────────────

export interface Timestamped {
  readonly createdAt: string  // ISO-8601
  readonly updatedAt: string  // ISO-8601
}

// ─── Identified base ─────────────────────────────────────────────────────────

export interface Identified {
  readonly id: string
}

export type IdentifiedTimestamped = Identified & Timestamped
