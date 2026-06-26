/**
 * ai-brain/knowledge/graph.ts
 * Knowledge Graph implementation with topic dependency resolution.
 * In Sprint 3.1, nodes will be loaded from Supabase `topics` table.
 */

import type {
  KnowledgeNode, KnowledgeEdge, KnowledgeGraphData,
  LearningPathResult, TopicPath,
} from './types'
import { WEAK_NODE_THRESHOLD } from '../core/constants'
import type { StudentIntelligenceProfile } from '../intelligence/types'

// ─── Knowledge Graph Class ────────────────────────────────────────────────────

export class KnowledgeGraph {
  private readonly _nodes: Map<string, KnowledgeNode>
  private readonly _edges: readonly KnowledgeEdge[]
  private readonly _subject: string

  constructor(data: KnowledgeGraphData) {
    this._nodes   = new Map(data.nodes.map(n => [n.id, n]))
    this._edges   = data.edges
    this._subject = data.subject
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  get subject(): string { return this._subject }

  getNode(id: string): KnowledgeNode | null {
    return this._nodes.get(id) ?? null
  }

  getAllNodes(): readonly KnowledgeNode[] {
    return [...this._nodes.values()].sort((a, b) => a.order - b.order)
  }

  getWeakNodes(): readonly KnowledgeNode[] {
    return this.getAllNodes().filter(n => n.isWeak && !n.isLocked)
  }

  getCompletedNodes(): readonly KnowledgeNode[] {
    return this.getAllNodes().filter(n => n.isCompleted)
  }

  getLockedNodes(): readonly KnowledgeNode[] {
    return this.getAllNodes().filter(n => n.isLocked)
  }

  getRecommendedNext(): KnowledgeNode | null {
    // 1st priority: explicitly recommended
    const explicit = this.getAllNodes().find(n => n.isRecommendedNext)
    if (explicit) return explicit

    // 2nd priority: lowest mastery non-locked incomplete node
    const candidates = this.getAllNodes()
      .filter(n => !n.isCompleted && !n.isLocked)
      .sort((a, b) => a.mastery - b.mastery)

    return candidates[0] ?? null
  }

  /** Check if a node is unlocked (all dependencies completed) */
  isUnlocked(nodeId: string): boolean {
    const node = this._nodes.get(nodeId)
    if (!node) return false
    const deps = this._edges
      .filter(e => e.toId === nodeId && e.type === 'requires')
      .map(e => e.fromId)
    return deps.every(depId => this._nodes.get(depId)?.isCompleted ?? false)
  }

  /** Get shortest path from one node to another */
  getPath(fromId: string, toId: string): TopicPath {
    const visited  = new Set<string>()
    const queue: string[][] = [[fromId]]

    while (queue.length > 0) {
      const path   = queue.shift()!
      const current = path[path.length - 1]

      if (current === toId) {
        const nodes = path.map(id => this._nodes.get(id)!).filter(Boolean)
        return {
          nodes,
          totalMinutes: nodes.reduce((sum, n) => sum + n.estimatedMinutes, 0),
          isComplete:   nodes.every(n => n.isCompleted),
        }
      }

      if (visited.has(current)) continue
      visited.add(current)

      const neighbours = this._edges
        .filter(e => e.fromId === current)
        .map(e => e.toId)

      for (const neighbour of neighbours) {
        if (!visited.has(neighbour)) {
          queue.push([...path, neighbour])
        }
      }
    }

    // No path found
    return { nodes: [], totalMinutes: 0, isComplete: false }
  }

  /** Structured learning path: completed / current / upcoming / locked */
  getLearningPath(): LearningPathResult {
    const all        = this.getAllNodes()
    const completed  = all.filter(n => n.isCompleted)
    const active     = all.filter(n => !n.isCompleted && !n.isLocked)
    const locked     = all.filter(n => n.isLocked)

    return {
      completed,
      current:  active[0] ?? null,
      upcoming: active.slice(1),
      locked,
    }
  }

  // ── Mutation (returns new graph) ───────────────────────────────────────────

  /** Update node mastery and recompute derived state */
  withMasteryUpdate(nodeId: string, mastery: number): KnowledgeGraph {
    const node = this._nodes.get(nodeId)
    if (!node) return this

    const updatedNode: KnowledgeNode = {
      ...node,
      mastery,
      isCompleted: mastery >= 60,
      isWeak:      mastery < WEAK_NODE_THRESHOLD,
    }

    const newNodes = [...this._nodes.values()].map(n => n.id === nodeId ? updatedNode : n)

    // Recompute locked state for all nodes
    const tempMap = new Map(newNodes.map(n => [n.id, n]))
    const recomputed = newNodes.map(n => ({
      ...n,
      isLocked: this._edges
        .filter(e => e.toId === n.id && e.type === 'requires')
        .some(e => !(tempMap.get(e.fromId)?.isCompleted ?? false)),
    }))

    return new KnowledgeGraph({ nodes: recomputed, edges: this._edges, subject: this._subject })
  }
}

// ─── Factory: Build from StudentIntelligenceProfile ──────────────────────────

/**
 * Creates a mock KnowledgeGraph from real student data.
 * In Sprint 3.1, this will load actual topics from Supabase.
 */
export function buildGraphFromProfile(profile: StudentIntelligenceProfile): KnowledgeGraph {
  const subjectName = profile.currentCourse?.subjectName
    ?? profile.currentCourse?.name
    ?? 'Mathematics'

  // Build mock nodes from recent lessons + weak topics
  const lessonNodes: KnowledgeNode[] = profile.enrolledCourses.length > 0
    ? [
        {
          id: 'topic_1', title: 'Chiziqli tenglamalar', subject: subjectName,
          description: 'Birinchi darajali tenglamalar va ularning yechilishi',
          mastery: Math.min(100, profile.masteryScore + 15), dependencies: [], unlocks: ['topic_2'],
          isCompleted: profile.masteryScore >= 70, isLocked: false, isWeak: false, isRecommendedNext: false,
          bloomsLevel: 'understand', estimatedMinutes: 30, order: 1,
        },
        {
          id: 'topic_2', title: 'Kvadrat tenglamalar', subject: subjectName,
          description: 'Ikkinchi darajali tenglamalar va ularni yechish usullari',
          mastery: profile.masteryScore, dependencies: ['topic_1'], unlocks: ['topic_3'],
          isCompleted: profile.masteryScore >= 75,
          isLocked: profile.masteryScore < 50,
          isWeak: profile.masteryScore < WEAK_NODE_THRESHOLD, isRecommendedNext: true,
          bloomsLevel: 'apply', estimatedMinutes: 45, order: 2,
        },
        {
          id: 'topic_3', title: 'Diskriminant', subject: subjectName,
          description: 'Diskriminant orqali ildizlar sonini aniqlash',
          mastery: profile.weakTopics[0]?.mastery ?? profile.masteryScore - 20,
          dependencies: ['topic_2'], unlocks: ['topic_4'],
          isCompleted: false,
          isLocked: profile.masteryScore < 60,
          isWeak: (profile.weakTopics[0]?.mastery ?? 0) < WEAK_NODE_THRESHOLD,
          isRecommendedNext: false,
          bloomsLevel: 'analyze', estimatedMinutes: 30, order: 3,
        },
        {
          id: 'topic_4', title: 'Manfiy ildizlar', subject: subjectName,
          description: 'Kompleks ildizlar va ular bilan ishlash',
          mastery: profile.weakTopics[1]?.mastery ?? 0,
          dependencies: ['topic_3'], unlocks: ['topic_5'],
          isCompleted: false, isLocked: true, isWeak: true, isRecommendedNext: false,
          bloomsLevel: 'analyze', estimatedMinutes: 40, order: 4,
        },
        {
          id: 'topic_5', title: 'Funksiyalar va grafiklar', subject: subjectName,
          description: 'Kvadrat funksiyasining grafigi va xususiyatlari',
          mastery: 0, dependencies: ['topic_4'], unlocks: [],
          isCompleted: false, isLocked: true, isWeak: false, isRecommendedNext: false,
          bloomsLevel: 'evaluate', estimatedMinutes: 60, order: 5,
        },
      ]
    : []

  const edges: KnowledgeEdge[] = [
    { fromId: 'topic_1', toId: 'topic_2', type: 'requires' },
    { fromId: 'topic_2', toId: 'topic_3', type: 'requires' },
    { fromId: 'topic_3', toId: 'topic_4', type: 'requires' },
    { fromId: 'topic_4', toId: 'topic_5', type: 'requires' },
  ]

  return new KnowledgeGraph({ nodes: lessonNodes, edges, subject: subjectName })
}
