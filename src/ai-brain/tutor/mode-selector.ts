/**
 * ai-brain/tutor/mode-selector.ts
 * Automatically selects the best TutorMode for the current interaction.
 * Decision depends on: profile mastery, message content, memory state, XP.
 */

import type { TutorMode } from './types'
import type { StudentIntelligenceProfile } from '../intelligence/types'
import type { AIMemory } from '../memory/types'

// ─── Keyword matchers ─────────────────────────────────────────────────────────

const KEYWORD_MODES: ReadonlyArray<{ pattern: RegExp; mode: TutorMode }> = [
  { pattern: /\btest\b|quiz|sinov|проверь|imtihon/i,           mode: 'quiz'         },
  { pattern: /mashq|amaliy|практика|practice|exercise/i,       mode: 'practice'     },
  { pattern: /tushunt|tushunmad|объясни|explain|nima bu/i,     mode: 'explain'      },
  { pattern: /maslahat|подсказ|hint|clue/i,                    mode: 'hint'         },
  { pattern: /qadam|bosqich|шаг|step.by.step|step by/i,        mode: 'step_by_step' },
  { pattern: /takrorla|повтор|revise|review|revision/i,        mode: 'revision'     },
  { pattern: /imtihonga|экзамен|exam.prep|exam sim/i,          mode: 'exam'         },
  { pattern: /savol|сократ|socratic|nima deb o'ylaysiz/i,      mode: 'socratic'     },
]

// ─── Rule-based mode selection ────────────────────────────────────────────────

/**
 * Selects the optimal TutorMode from:
 *  1. Explicit keywords in the user message (highest priority)
 *  2. Profile-based rules (mastery, weakTopics, streak, XP)
 *  3. Memory-based rules (recent mistakes)
 *  4. Default: 'conversation'
 */
export function selectTutorMode(
  profile: StudentIntelligenceProfile,
  userMessage: string,
  memory: AIMemory,
): TutorMode {
  // 1 ── Explicit keyword detection ─────────────────────────────────────────
  for (const { pattern, mode } of KEYWORD_MODES) {
    if (pattern.test(userMessage)) return mode
  }

  // 2 ── Profile-based rules ────────────────────────────────────────────────
  const { masteryScore, weeklyAvgPct, weakTopics, streak, xp, testsTotal } = profile
  const { mistakes } = memory

  // Brand new student — friendly conversation
  if (xp < 50 || testsTotal === 0) return 'conversation'

  // Critical struggles — step-by-step with maximum scaffolding
  if (masteryScore < 35 || weeklyAvgPct < 45) return 'step_by_step'

  // Many recent unresolved mistakes — revision
  const unresolvedMistakes = mistakes.filter(m => m.correctedAt === null)
  if (unresolvedMistakes.length >= 3) return 'revision'

  // Multiple weak topics — focused explanation
  if (weakTopics.length >= 2) return 'explain'

  // One weak topic — targeted practice
  if (weakTopics.length === 1) return 'practice'

  // High streak + decent score — push for practice
  if (streak >= 7 && weeklyAvgPct >= 70) return 'practice'

  // Excellent mastery — challenge with quiz
  if (masteryScore >= 80 && weeklyAvgPct >= 80) return 'quiz'

  // Medium confidence — revision before advancing
  if (masteryScore >= 60 && masteryScore < 75) return 'revision'

  // 3 ── Default ─────────────────────────────────────────────────────────────
  return 'conversation'
}
