/**
 * ai-brain/memory/types.ts
 * AI Memory Engine types.
 * The memory system tracks everything about a student's learning journey.
 */

import type { IdentifiedTimestamped } from '../core/types'

// ─── Conversation Entry ───────────────────────────────────────────────────────

export interface ConversationEntry {
  readonly id:             string
  readonly conversationId: string
  readonly role:           'user' | 'assistant'
  readonly content:        string
  readonly topicTags:      readonly string[]
  readonly timestamp:      string
}

// ─── Topic History ────────────────────────────────────────────────────────────

export interface TopicHistoryEntry {
  readonly topicId:      string
  readonly title:        string
  readonly visitedAt:    string
  readonly interactions: number   // how many times discussed
  readonly understood:   boolean  // did student show understanding?
}

// ─── Mistake Record ───────────────────────────────────────────────────────────

export interface MistakeRecord extends IdentifiedTimestamped {
  readonly topicId:       string
  readonly topicTitle:    string
  readonly wrongAnswer:   string
  readonly correctAnswer: string
  readonly explanation:   string
  readonly correctedAt:   string | null
}

// ─── Generated Quiz ───────────────────────────────────────────────────────────

export interface QuizQuestion {
  readonly id:            string
  readonly question:      string
  readonly options:       readonly string[]
  readonly correctIndex:  number
  readonly explanation:   string
}

export interface GeneratedQuiz extends IdentifiedTimestamped {
  readonly topicId:    string
  readonly topicTitle: string
  readonly questions:  readonly QuizQuestion[]
  readonly score:      number | null    // null = not attempted
  readonly completedAt: string | null
}

// ─── Homework Attempt ─────────────────────────────────────────────────────────

export interface HomeworkAttempt {
  readonly homeworkId:  string
  readonly title:       string
  readonly attemptedAt: string
  readonly isCorrect:   boolean
  readonly feedback:    string
}

// ─── Weak Concept ─────────────────────────────────────────────────────────────

export interface WeakConcept {
  readonly conceptId:  string
  readonly title:      string
  readonly firstSeenAt: string
  readonly lastSeenAt:  string
  /** How many times the student struggled with this concept */
  readonly failCount:  number
  readonly isResolved: boolean
}

// ─── Explanation Style Preference ────────────────────────────────────────────

export interface ExplanationStylePreference {
  readonly preferStepByStep: boolean
  readonly preferExamples:   boolean
  readonly preferAnalogy:    boolean
  readonly preferDiagrams:   boolean  // text descriptions of diagrams
  readonly preferSocratic:   boolean  // learning through questions
}

// ─── AI Memory (full session memory) ─────────────────────────────────────────

export interface AIMemory {
  readonly conversationHistory:     readonly ConversationEntry[]
  readonly topicHistory:            readonly TopicHistoryEntry[]
  readonly homeworkHistory:         readonly HomeworkAttempt[]
  readonly mistakes:                readonly MistakeRecord[]
  readonly generatedQuizzes:        readonly GeneratedQuiz[]
  readonly weakConcepts:            readonly WeakConcept[]
  readonly preferredExplanation:    ExplanationStylePreference
  /** ISO timestamp of last interaction */
  readonly lastInteractionAt:       string | null
  /** Summary of the session so far (for long conversations) */
  readonly sessionSummary:          string | null
}

// ─── Memory Operation Result ──────────────────────────────────────────────────

export interface MemoryUpdateResult {
  readonly success: boolean
  readonly memory:  AIMemory
}

// ─── Empty Memory Factory ────────────────────────────────────────────────────

export function createEmptyMemory(): AIMemory {
  return {
    conversationHistory:  [],
    topicHistory:         [],
    homeworkHistory:      [],
    mistakes:             [],
    generatedQuizzes:     [],
    weakConcepts:         [],
    preferredExplanation: {
      preferStepByStep: true,
      preferExamples:   true,
      preferAnalogy:    false,
      preferDiagrams:   false,
      preferSocratic:   false,
    },
    lastInteractionAt: null,
    sessionSummary:    null,
  }
}
