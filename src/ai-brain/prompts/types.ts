/**
 * ai-brain/prompts/types.ts
 * Types for the centralized Prompt Builder.
 */

import type { Language } from '../core/types'
import type { StudentIntelligenceProfile } from '../intelligence/types'
import type { AIMemory } from '../memory/types'
import type { Recommendation } from '../recommendations/types'
import type { TutorMode } from '../tutor/types'

// ─── Prompt Builder Input ─────────────────────────────────────────────────────

export interface PromptBuilderInput {
  readonly profile:         StudentIntelligenceProfile
  readonly memory:          AIMemory | null
  readonly recommendations: readonly Recommendation[]
  readonly tutorMode:       TutorMode
  readonly currentTopic:    string | null
  readonly userMessage:     string
  readonly language:        Language
}

// ─── Prompt Section ───────────────────────────────────────────────────────────

export interface PromptSection {
  readonly heading: string
  readonly content: string
  /** Lower = rendered first */
  readonly order:   number
}

// ─── Build Result ─────────────────────────────────────────────────────────────

export interface PromptBuildResult {
  readonly systemPrompt:    string
  readonly sections:        readonly PromptSection[]
  readonly tokenEstimate:   number     // rough word count / 0.75
  readonly builtAt:         string
}
