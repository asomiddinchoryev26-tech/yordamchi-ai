/**
 * ai-brain/memory/engine.ts
 * High-level memory operations built on top of the store.
 * All mutations return the new AIMemory (immutable update pattern).
 */

import type { AIMemory, ConversationEntry, MistakeRecord, WeakConcept } from './types'
import { memoryStore } from './store'

// ─── Memory Engine ────────────────────────────────────────────────────────────

export const memoryEngine = {

  // ── Read Operations ─────────────────────────────────────────────────────────

  /** Get current memory for a conversation (auto-creates if missing) */
  get(conversationId: string): AIMemory {
    return memoryStore.get(conversationId)
  },

  /** Get recent message history (last N turns) */
  getRecentHistory(conversationId: string, turns = 10): readonly ConversationEntry[] {
    const memory = memoryStore.get(conversationId)
    return memory.conversationHistory.slice(-turns)
  },

  /** Get weak concepts sorted by fail count descending */
  getWeakConcepts(conversationId: string): readonly WeakConcept[] {
    const memory = memoryStore.get(conversationId)
    return [...memory.weakConcepts].sort((a, b) => b.failCount - a.failCount)
  },

  /** Get topics the student has discussed, sorted by most recent */
  getRecentTopics(conversationId: string, limit = 5): readonly string[] {
    const memory = memoryStore.get(conversationId)
    return memory.topicHistory
      .slice()
      .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))
      .slice(0, limit)
      .map(t => t.title)
  },

  /**
   * Get a plain-language summary of what the AI should remember.
   * This is injected into the system prompt.
   */
  getSummaryForPrompt(conversationId: string): string | null {
    const memory = memoryStore.get(conversationId)
    if (memory.conversationHistory.length === 0) return null

    const parts: string[] = []

    if (memory.sessionSummary) {
      parts.push(`Session summary: ${memory.sessionSummary}`)
    }

    if (memory.weakConcepts.length > 0) {
      const titles = memory.weakConcepts.map(c => c.title).join(', ')
      parts.push(`Student has struggled with: ${titles}`)
    }

    if (memory.topicHistory.length > 0) {
      const recent = memory.topicHistory.slice(-3).map(t => t.title).join(', ')
      parts.push(`Recently discussed topics: ${recent}`)
    }

    if (memory.mistakes.length > 0) {
      const lastMistake = memory.mistakes[memory.mistakes.length - 1]
      parts.push(`Last mistake: "${lastMistake.wrongAnswer}" on topic "${lastMistake.topicTitle}"`)
    }

    return parts.length > 0 ? parts.join('\n') : null
  },

  // ── Write Operations (immutable) ─────────────────────────────────────────────

  /** Add a conversation message to memory */
  addMessage(
    conversationId: string,
    entry: Omit<ConversationEntry, 'id' | 'conversationId'>,
  ): AIMemory {
    return memoryStore.update(conversationId, mem => ({
      ...mem,
      lastInteractionAt: new Date().toISOString(),
      conversationHistory: [
        ...mem.conversationHistory,
        {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          conversationId,
          ...entry,
        },
      ],
    }))
  },

  /** Record a topic the student discussed */
  recordTopic(conversationId: string, topicId: string, title: string, understood: boolean): AIMemory {
    return memoryStore.update(conversationId, mem => {
      const existing = mem.topicHistory.find(t => t.topicId === topicId)
      if (existing) {
        return {
          ...mem,
          topicHistory: mem.topicHistory.map(t =>
            t.topicId === topicId
              ? { ...t, interactions: t.interactions + 1, understood, visitedAt: new Date().toISOString() }
              : t,
          ),
        }
      }
      return {
        ...mem,
        topicHistory: [
          ...mem.topicHistory,
          { topicId, title, visitedAt: new Date().toISOString(), interactions: 1, understood },
        ],
      }
    })
  },

  /** Record a student mistake */
  recordMistake(conversationId: string, mistake: Omit<MistakeRecord, 'id' | 'createdAt' | 'updatedAt'>): AIMemory {
    return memoryStore.update(conversationId, mem => {
      const now = new Date().toISOString()
      // Also update weak concepts
      const existingConcept = mem.weakConcepts.find(c => c.conceptId === mistake.topicId)
      const updatedConcepts: WeakConcept[] = existingConcept
        ? mem.weakConcepts.map(c =>
            c.conceptId === mistake.topicId
              ? { ...c, failCount: c.failCount + 1, lastSeenAt: now }
              : c,
          )
        : [
            ...mem.weakConcepts,
            {
              conceptId:   mistake.topicId,
              title:       mistake.topicTitle,
              firstSeenAt: now,
              lastSeenAt:  now,
              failCount:   1,
              isResolved:  false,
            },
          ]

      return {
        ...mem,
        weakConcepts: updatedConcepts,
        mistakes: [
          ...mem.mistakes,
          { ...mistake, id: `mist_${Date.now()}`, createdAt: now, updatedAt: now },
        ],
      }
    })
  },

  /** Mark a weak concept as resolved */
  resolveWeakConcept(conversationId: string, conceptId: string): AIMemory {
    return memoryStore.update(conversationId, mem => ({
      ...mem,
      weakConcepts: mem.weakConcepts.map(c =>
        c.conceptId === conceptId ? { ...c, isResolved: true } : c,
      ),
    }))
  },

  /** Update the session summary (called periodically to compress history) */
  updateSummary(conversationId: string, summary: string): AIMemory {
    return memoryStore.update(conversationId, mem => ({ ...mem, sessionSummary: summary }))
  },

  /** Clear memory for a conversation (e.g., when conversation is deleted) */
  clear(conversationId: string): void {
    memoryStore.clear(conversationId)
  },
}
