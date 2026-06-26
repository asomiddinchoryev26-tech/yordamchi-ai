/**
 * ai-brain/index.ts
 * Public API for the YordamchiAI Brain module.
 *
 * Sprint 3.0 — Foundation Layer
 * Usage example (Sprint 3.1 integration):
 *
 *   import { buildIntelligenceProfile, promptBuilder, recommendationEngine } from '@/ai-brain'
 *
 *   const profile = buildIntelligenceProfile(studentContext, userId)
 *   const recs    = recommendationEngine.getTopN(profile, 5)
 *   const prompt  = buildSystemPrompt(profile, memory, recs, 'explain', 'Diskriminant')
 *   // → Pass `prompt` to EdgeFunctionProvider as context.systemPrompt
 */

// ── Core ──────────────────────────────────────────────────────────────────────
export type { Language, Priority, BloomsLevel, LearningStyle, ConfidenceTrend } from './core/types'
export { LEVELS, XP_WEIGHTS, MASTERY_WEIGHTS, STREAK_THRESHOLDS, WEAK_TOPIC_THRESHOLD } from './core/constants'

// ── Intelligence ──────────────────────────────────────────────────────────────
export type {
  StudentIntelligenceProfile, CourseEnrollment, TopicMastery,
  StudentLevel, LearningGoal, TeacherNote, HomeworkItem,
} from './intelligence/types'
export { buildIntelligenceProfile } from './intelligence/builder'

// ── Memory ────────────────────────────────────────────────────────────────────
export type {
  AIMemory, ConversationEntry, MistakeRecord, WeakConcept,
  GeneratedQuiz, ExplanationStylePreference,
} from './memory/types'
export { createEmptyMemory } from './memory/types'
export { memoryStore }  from './memory/store'
export { memoryEngine } from './memory/engine'

// ── Recommendations ───────────────────────────────────────────────────────────
export type { Recommendation, RecommendationRule, RecommendationQueue } from './recommendations/types'
export { recommendationEngine } from './recommendations/engine'
export { RECOMMENDATION_RULES }  from './recommendations/rules'

// ── Knowledge Graph ───────────────────────────────────────────────────────────
export type { KnowledgeNode, KnowledgeEdge, KnowledgeGraphData, LearningPathResult } from './knowledge/types'
export { KnowledgeGraph, buildGraphFromProfile } from './knowledge/graph'

// ── Tutor ─────────────────────────────────────────────────────────────────────
export type { TutorMode, TutorSession, TutorModeConfig } from './tutor/types'
export { tutorEngine, TUTOR_MODE_CONFIGS } from './tutor/engine'

// ── Prompts ───────────────────────────────────────────────────────────────────
export type { PromptBuilderInput, PromptBuildResult } from './prompts/types'
export { promptBuilder, buildSystemPrompt } from './prompts/builder'
export { AI_IDENTITY, BEHAVIORAL_RULES, MODE_OPENINGS } from './prompts/templates'

// ── Tutor Mode Selector ───────────────────────────────────────────────────────
export { selectTutorMode } from './tutor/mode-selector'

// ── Intelligence Service (Sprint 3.1 integration layer) ───────────────────────
export { intelligenceService } from './services/intelligence-service'
