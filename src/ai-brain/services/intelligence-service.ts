/**
 * ai-brain/services/intelligence-service.ts
 * Sprint 3.1 — Main orchestrator for AI Brain integration.
 *
 * Pipeline:
 *   StudentContext + userId + convId + lastMessage
 *     → IntelligenceProfile (cached, 5 min TTL)
 *     → AIMemory (session-scoped, from MemoryEngine)
 *     → Recommendations (top 3, sorted by priority)
 *     → TutorMode (auto-selected)
 *     → PromptBuilder
 *     → Rich system prompt string (→ Edge Function → Gemini)
 *
 * Failure mode: returns null → caller falls back to generic prompt.
 * No exceptions propagated. Non-critical side effects are silently ignored.
 */

import type { StudentContext } from '@/services/ai-provider.service'
import type { StudentIntelligenceProfile } from '../intelligence/types'
import type { TutorMode } from '../tutor/types'
import { buildIntelligenceProfile } from '../intelligence/builder'
import { memoryEngine }            from '../memory/engine'
import { recommendationEngine }    from '../recommendations/engine'
import { promptBuilder }           from '../prompts/builder'
import { selectTutorMode }         from '../tutor/mode-selector'

// ─── Profile Cache ────────────────────────────────────────────────────────────

interface CacheEntry {
  profile:   StudentIntelligenceProfile
  expiresAt: number
}

/** Session-scoped in-memory profile cache. Sprint 3.2: persist to localStorage. */
const profileCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000   // 5 minutes

/** Cache key embeds volatile values so stale entries auto-invalidate. */
function makeCacheKey(userId: string, ctx: StudentContext): string {
  return `${userId}:${ctx.testStats.total}:${ctx.attTotal}:${ctx.groups.length}`
}

// ─── Correction-pattern detection ────────────────────────────────────────────

const CORRECTION_PATTERNS: readonly RegExp[] = [
  /noto[''`]g[''`]ri|xato|incorrect|wrong|that[''`]s not/i,
  /aslida|actually|в действительности|на самом деле/i,
  /to[''`]g[''`]ri javob|correct answer|правильный ответ/i,
  /keling.+(to[''`]g[''`]rilab|tuzatib)|let me correct|давайте исправим/i,
]

function looksLikeCorrection(aiResponse: string): boolean {
  return CORRECTION_PATTERNS.some(p => p.test(aiResponse.slice(0, 400)))
}

// ─── Intelligence Service ─────────────────────────────────────────────────────

export const intelligenceService = {

  // ── Profile management ───────────────────────────────────────────────────────

  /**
   * Returns a cached or freshly-built StudentIntelligenceProfile.
   * Deterministic — same StudentContext always produces the same profile.
   */
  getProfile(ctx: StudentContext, userId: string): StudentIntelligenceProfile {
    const key    = makeCacheKey(userId, ctx)
    const cached = profileCache.get(key)
    if (cached && cached.expiresAt > Date.now()) return cached.profile

    const profile = buildIntelligenceProfile(ctx, userId)
    profileCache.set(key, { profile, expiresAt: Date.now() + CACHE_TTL_MS })
    return profile
  },

  /**
   * Force-rebuild the profile (call after a major event like a new test result).
   */
  invalidateCache(userId: string): void {
    for (const key of profileCache.keys()) {
      if (key.startsWith(`${userId}:`)) profileCache.delete(key)
    }
  },

  clearAllCaches(): void {
    profileCache.clear()
  },

  // ── System Prompt ────────────────────────────────────────────────────────────

  /**
   * Builds a rich, personalized system prompt for Gemini.
   *
   * @returns The system prompt string, or null if building fails.
   *          The caller must handle null with a generic fallback.
   */
  buildSystemPrompt(
    ctx:             StudentContext,
    userId:          string,
    conversationId:  string,
    lastUserMessage: string,
  ): string | null {
    try {
      const profile         = this.getProfile(ctx, userId)
      const memory          = memoryEngine.get(conversationId)
      const recommendations = recommendationEngine.getTopN(profile, 3)
      const tutorMode: TutorMode = selectTutorMode(profile, lastUserMessage, memory)

      // Prefer the latest lesson title, fall back to subject name
      const currentTopic =
        ctx.recentLessons[0]?.title
        ?? profile.currentCourse?.subjectName
        ?? null

      const result = promptBuilder.build({
        profile,
        memory,
        recommendations,
        tutorMode,
        currentTopic,
        userMessage: lastUserMessage,
        language:    profile.preferredLanguage,
      })

      return result.systemPrompt

    } catch (err) {
      // Never let intelligence failures crash the AI pipeline
      console.warn('[IntelligenceService] buildSystemPrompt failed — using generic fallback:', err)
      return null
    }
  },

  // ── Memory Recording ─────────────────────────────────────────────────────────

  /**
   * Record the user's message into session memory.
   * Extracts topic tags from the current context.
   */
  recordUserMessage(
    conversationId: string,
    message:        string,
    ctx:            StudentContext,
  ): void {
    try {
      const topicTags: string[] = ctx.recentLessons
        .slice(0, 2)
        .map(l => l.title)
        .filter(Boolean)

      memoryEngine.addMessage(conversationId, {
        role:      'user',
        content:   message,
        topicTags,
        timestamp: new Date().toISOString(),
      })

      // Record topic visits for the current lesson
      if (ctx.recentLessons[0]) {
        const lesson = ctx.recentLessons[0]
        memoryEngine.recordTopic(
          conversationId,
          lesson.title.toLowerCase().replace(/\s+/g, '_'),
          lesson.title,
          false, // understanding confirmed after AI responds
        )
      }
    } catch { /* non-critical */ }
  },

  /**
   * Record the AI response into session memory.
   * Also detects whether the response was correcting a mistake.
   */
  recordAIResponse(
    conversationId:  string,
    aiResponse:      string,
    userMessage:     string,
    ctx:             StudentContext,
  ): void {
    try {
      memoryEngine.addMessage(conversationId, {
        role:      'assistant',
        content:   aiResponse,
        topicTags: [],
        timestamp: new Date().toISOString(),
      })

      // Auto-detect corrections and record as mistakes
      if (looksLikeCorrection(aiResponse) && ctx.recentLessons[0]) {
        const topic = ctx.recentLessons[0]
        memoryEngine.recordMistake(conversationId, {
          topicId:       topic.title.toLowerCase().replace(/\s+/g, '_'),
          topicTitle:    topic.title,
          wrongAnswer:   userMessage.slice(0, 120),
          correctAnswer: aiResponse.slice(0, 120),
          explanation:   '',
          correctedAt:   null,
        })
      }
    } catch { /* non-critical */ }
  },

  /**
   * Mark a concept as understood (call after AI confirms correct answer).
   */
  markConceptLearned(conversationId: string, topicId: string): void {
    try {
      memoryEngine.resolveWeakConcept(conversationId, topicId)
      memoryEngine.recordTopic(conversationId, topicId, topicId, true)
    } catch { /* non-critical */ }
  },

  /**
   * Get a human-readable summary of what happened in this conversation session.
   * Used by the right-panel AI Teacher for display.
   */
  getSessionSummary(conversationId: string): string | null {
    try {
      return memoryEngine.getSummaryForPrompt(conversationId)
    } catch {
      return null
    }
  },

  /**
   * Get the top-N quick prompts based on profile + recommendations.
   */
  getQuickPrompts(ctx: StudentContext, userId: string): readonly string[] {
    try {
      const profile = this.getProfile(ctx, userId)
      return recommendationEngine.getQuickPrompts(profile)
    } catch {
      return []
    }
  },
}
