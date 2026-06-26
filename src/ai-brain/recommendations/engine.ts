/**
 * ai-brain/recommendations/engine.ts
 * Rule-based recommendation engine.
 * Applies all rules to the student profile and returns prioritized recommendations.
 */

import type { StudentIntelligenceProfile } from '../intelligence/types'
import type { Recommendation, RecommendationQueue } from './types'
import { RECOMMENDATION_RULES } from './rules'

// ─── Priority ordering ────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<Recommendation['priority'], number> = {
  urgent: 0,
  high:   1,
  medium: 2,
  low:    3,
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export const recommendationEngine = {

  /**
   * Run all rules against the profile and return a sorted recommendation queue.
   * Rules are independent — all that pass `condition()` are included.
   * Results are sorted: urgent → high → medium → low.
   *
   * @param profile - The student's intelligence profile
   * @returns       - Prioritized list of actionable recommendations
   */
  generate(profile: StudentIntelligenceProfile): RecommendationQueue {
    const now = new Date().toISOString()

    const recommendations: Recommendation[] = RECOMMENDATION_RULES
      .filter(rule => {
        try {
          return rule.condition(profile)
        } catch {
          // Never let a broken rule crash the engine
          return false
        }
      })
      .map(rule => {
        const base = rule.generate(profile)
        return {
          ...base,
          id:         `rec_${rule.id}_${Date.now()}`,
          createdAt:  now,
          updatedAt:  now,
          isActioned: false,
        } satisfies Recommendation
      })
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

    return {
      items:       recommendations,
      generatedAt: now,
      profileId:   profile.userId,
    }
  },

  /**
   * Get the top N recommendations by priority.
   *
   * @param profile - Student profile
   * @param limit   - Maximum recommendations to return (default: 5)
   */
  getTopN(profile: StudentIntelligenceProfile, limit = 5): readonly Recommendation[] {
    const queue = this.generate(profile)
    return queue.items.slice(0, limit)
  },

  /**
   * Get only the most urgent recommendation (the next action).
   */
  getNextAction(profile: StudentIntelligenceProfile): Recommendation | null {
    const queue = this.generate(profile)
    return queue.items[0] ?? null
  },

  /**
   * Filter recommendations by type.
   */
  getByType(
    profile: StudentIntelligenceProfile,
    type: Recommendation['type'],
  ): readonly Recommendation[] {
    const queue = this.generate(profile)
    return queue.items.filter(r => r.type === type)
  },

  /**
   * Generate quick prompt suggestions (for the AI chat quick-prompts widget).
   * Returns up to 4 context-aware prompts based on current recommendations.
   */
  getQuickPrompts(profile: StudentIntelligenceProfile): readonly string[] {
    const queue   = this.generate(profile)
    const prompts = queue.items
      .filter(r => r.suggestedPrompt !== null)
      .map(r => r.suggestedPrompt!)
      .slice(0, 4)

    // Pad with generic prompts if fewer than 4 recommendations have prompts
    const fallbacks = [
      `${profile.currentCourse?.subjectName ?? profile.currentCourse?.name ?? 'Dars'} bo'yicha savol ber`,
      'Imtihonga qanday tayyorlanay?',
      'Zaif tomonlarimni qanday kuchaytiray?',
      "Bu hafta nimalarga e'tibor berishim kerak?",
    ]

    const result = [...prompts]
    for (const fb of fallbacks) {
      if (result.length >= 4) break
      if (!result.includes(fb)) result.push(fb)
    }

    return result.slice(0, 4)
  },
}
