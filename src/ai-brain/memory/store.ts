/**
 * ai-brain/memory/store.ts
 * Session-scoped in-memory store for AI Memory.
 * Sprint 3.1: Replace with Supabase-backed persistence.
 *
 * Design: Singleton Map keyed by conversationId.
 * Survives for the lifetime of the browser session.
 */

import type { AIMemory } from './types'
import { createEmptyMemory } from './types'

// ─── Store Interface ──────────────────────────────────────────────────────────

export interface IMemoryStore {
  get(conversationId: string): AIMemory
  set(conversationId: string, memory: AIMemory): void
  update(conversationId: string, updater: (current: AIMemory) => AIMemory): AIMemory
  clear(conversationId: string): void
  clearAll(): void
  has(conversationId: string): boolean
  /** Returns number of conversation IDs in memory */
  size(): number
}

// ─── In-Memory Implementation ─────────────────────────────────────────────────

class SessionMemoryStore implements IMemoryStore {
  private readonly _store = new Map<string, AIMemory>()

  get(conversationId: string): AIMemory {
    if (!this._store.has(conversationId)) {
      const empty = createEmptyMemory()
      this._store.set(conversationId, empty)
      return empty
    }
    return this._store.get(conversationId)!
  }

  set(conversationId: string, memory: AIMemory): void {
    this._store.set(conversationId, memory)
  }

  update(conversationId: string, updater: (current: AIMemory) => AIMemory): AIMemory {
    const current = this.get(conversationId)
    const updated = updater(current)
    this._store.set(conversationId, updated)
    return updated
  }

  clear(conversationId: string): void {
    this._store.delete(conversationId)
  }

  clearAll(): void {
    this._store.clear()
  }

  has(conversationId: string): boolean {
    return this._store.has(conversationId)
  }

  size(): number {
    return this._store.size
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

/**
 * Global singleton memory store.
 * In Sprint 3.1 this will be replaced with a Supabase-backed implementation
 * that persists memory across sessions.
 */
export const memoryStore: IMemoryStore = new SessionMemoryStore()
