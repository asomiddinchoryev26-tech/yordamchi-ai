/**
 * ai-brain/knowledge/types.ts
 * Knowledge Graph types for representing topic relationships.
 * Designed for Sprint 3.1+ where topics will be stored in Supabase.
 */

import type { BloomsLevel, Proficiency } from '../core/types'

// ─── Knowledge Node ───────────────────────────────────────────────────────────

/** A single topic/concept in the knowledge graph */
export interface KnowledgeNode {
  readonly id:              string
  readonly title:           string
  readonly subject:         string
  readonly description:     string
  /** Current student mastery, 0–100 */
  readonly mastery:         Proficiency
  /** IDs of nodes that must be mastered before this one */
  readonly dependencies:    readonly string[]
  /** IDs of nodes this one unlocks */
  readonly unlocks:         readonly string[]
  readonly isCompleted:     boolean
  /** Locked = dependencies not met */
  readonly isLocked:        boolean
  /** mastery < WEAK_NODE_THRESHOLD */
  readonly isWeak:          boolean
  /** Recommended as the next topic to study */
  readonly isRecommendedNext: boolean
  readonly bloomsLevel:     BloomsLevel
  readonly estimatedMinutes: number
  /** Sequence position within its subject */
  readonly order:           number
}

// ─── Knowledge Edge ───────────────────────────────────────────────────────────

export interface KnowledgeEdge {
  readonly fromId: string   // prerequisite
  readonly toId:   string   // unlocked topic
  /** 'requires' = strict dependency, 'recommends' = helpful but not required */
  readonly type:   'requires' | 'recommends'
}

// ─── Knowledge Graph Data ─────────────────────────────────────────────────────

export interface KnowledgeGraphData {
  readonly nodes: readonly KnowledgeNode[]
  readonly edges: readonly KnowledgeEdge[]
  readonly subject: string
}

// ─── Graph Query Results ──────────────────────────────────────────────────────

export interface TopicPath {
  readonly nodes:        readonly KnowledgeNode[]
  readonly totalMinutes: number
  readonly isComplete:   boolean
}

export interface LearningPathResult {
  readonly completed:  readonly KnowledgeNode[]
  readonly current:    KnowledgeNode | null
  readonly upcoming:   readonly KnowledgeNode[]
  readonly locked:     readonly KnowledgeNode[]
}
