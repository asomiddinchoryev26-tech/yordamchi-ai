/**
 * ai-brain/tutor/types.ts
 * AI Tutor Engine types.
 * Defines all supported teaching modes and session structures.
 */

import type { Language } from '../core/types'
import type { StudentIntelligenceProfile } from '../intelligence/types'
import type { ConversationEntry } from '../memory/types'

// ─── Tutor Modes ──────────────────────────────────────────────────────────────

export type TutorMode =
  | 'explain'       // Clear explanation of a concept
  | 'practice'      // Generate practice problems
  | 'quiz'          // Multiple-choice assessment
  | 'hint'          // Give a hint without the full answer
  | 'step_by_step'  // Walk through a problem step by step
  | 'socratic'      // Guide through questions
  | 'revision'      // Review previously covered material
  | 'exam'          // Simulate exam conditions
  | 'conversation'  // Free-form educational conversation

// ─── Tutor Mode Configuration ─────────────────────────────────────────────────

export interface TutorModeConfig {
  readonly mode:            TutorMode
  readonly label:           { uz: string; ru: string; en: string }
  readonly description:     { uz: string; ru: string; en: string }
  readonly icon:            string
  readonly systemInstruction: string   // injected into the prompt for this mode
  /** How many turns before suggesting a mode switch */
  readonly maxTurns:        number
  /** Should AI ask verification questions? */
  readonly checkComprehension: boolean
  /** Should AI avoid giving direct answers? */
  readonly guidedOnly:      boolean
}

// ─── Tutor Session ────────────────────────────────────────────────────────────

export interface TutorSession {
  readonly sessionId:         string
  readonly mode:              TutorMode
  readonly topic:             string
  readonly studentProfile:    StudentIntelligenceProfile
  readonly language:          Language
  readonly history:           readonly ConversationEntry[]
  readonly currentTurn:       number
  readonly isComplete:        boolean
  readonly startedAt:         string
}

// ─── Tutor Step ───────────────────────────────────────────────────────────────

export interface TutorStep {
  readonly stepIndex:    number
  readonly instruction:  string   // What the AI should do in this step
  readonly isLast:       boolean
}
