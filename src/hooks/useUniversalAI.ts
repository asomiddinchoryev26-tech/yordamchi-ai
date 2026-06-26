/**
 * hooks/useUniversalAI.ts
 * Sprint 3.2 Phase 2 — Universal AI hook.
 *
 * Manages the universal AI conversation:
 *   • Text-only  → aiProvider.complete()  (ai-chat Edge Function)
 *   • Image+text → Gemini Vision chat mode (ai-vision Edge Function, markdown)
 *   • Automatic routing — no manual switching required
 *
 * Preserves full multi-turn chat history for text messages.
 * Session memory recorded via memoryEngine (Sprint 3.0).
 */

import { useState, useCallback, useRef } from 'react'
import { supabase }               from '@/lib/supabase'
import { aiProvider }             from '@/services/ai-provider.service'
import { intelligenceService }    from '@/ai-brain/services/intelligence-service'
import { memoryEngine }           from '@/ai-brain/memory/engine'
import { processImage }           from '@/ai-brain/vision/imageProcessor'
import { buildVisionChatPrompt }  from '@/ai-brain/vision/promptBuilder'
import type { StudentContext }    from '@/services/ai-provider.service'
import type { Language }          from '@/ai-brain/core/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant'

export interface AttachedFile {
  readonly name:       string
  readonly mimeType:   string
  readonly previewUrl: string   // blob URL — MUST be revoked when no longer needed
  readonly sizeBytes:  number
}

export interface UniversalMessage {
  readonly id:           string
  readonly role:         MessageRole
  readonly content:      string
  readonly timestamp:    string
  readonly attachedFile?: AttachedFile
  readonly isLoading?:   boolean
  readonly hasError?:    boolean
  readonly errorCode?:   string
}

export interface UseUniversalAIOptions {
  userId:   string
  ctx:      StudentContext
  language: Language
}

// ─── Mode detection ───────────────────────────────────────────────────────────

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

// ─── Vision endpoint (chat mode, returns markdown) ────────────────────────────

async function callVisionChatEndpoint(
  imageBase64:       string,
  mimeType:          string,
  systemInstruction: string,
  userQuestion:      string,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-vision', {
    body: { imageBase64, mimeType, systemInstruction, userMessage: userQuestion },
  })

  if (error) {
    const ctx = (error as unknown as { context?: { error?: string } }).context
    throw new Error(ctx?.error ?? error.message)
  }
  if (!data?.response) throw new Error('ai_empty_response')
  return data.response as string
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useUniversalAI({ userId, ctx, language }: UseUniversalAIOptions) {
  const [messages,    setMessages]    = useState<UniversalMessage[]>([])
  const [isChatMode,  setIsChatMode]  = useState(false)
  const [isLoading,   setIsLoading]   = useState(false)
  const sessionId = useRef(makeId('vision_session'))

  // ── Setters ─────────────────────────────────────────────────────────────────

  const appendMessage = useCallback((msg: UniversalMessage) => {
    setMessages(prev => [...prev, msg])
  }, [])

  const replaceLastMessage = useCallback((updater: (m: UniversalMessage) => UniversalMessage) => {
    setMessages(prev => {
      if (prev.length === 0) return prev
      const copy = [...prev]
      copy[copy.length - 1] = updater(copy[copy.length - 1])
      return copy
    })
  }, [])

  // ── Main send ────────────────────────────────────────────────────────────────

  /**
   * Send a message (text + optional file) to the AI.
   * Automatically routes to vision or text endpoint.
   */
  const sendMessage = useCallback(async (
    text:  string,
    file?: File | null,
  ): Promise<void> => {
    const trimmed = text.trim()
    if (!trimmed && !file) return

    // ── 1. Add user message to chat ──────────────────────────────────────────
    const attachedFile: AttachedFile | undefined = file
      ? {
          name:       file.name,
          mimeType:   file.type,
          previewUrl: URL.createObjectURL(file),
          sizeBytes:  file.size,
        }
      : undefined

    const userMsg: UniversalMessage = {
      id:           makeId('user'),
      role:         'user',
      content:      trimmed,
      timestamp:    new Date().toISOString(),
      attachedFile,
    }
    appendMessage(userMsg)

    // ── 2. Add loading placeholder ───────────────────────────────────────────
    const loadingId = makeId('ai')
    appendMessage({
      id:        loadingId,
      role:      'assistant',
      content:   '',
      timestamp: new Date().toISOString(),
      isLoading: true,
    })

    setIsLoading(true)
    setIsChatMode(true)

    // ── 3. Call the appropriate AI endpoint ──────────────────────────────────
    try {
      let response: string

      if (file) {
        // ── Vision path ────────────────────────────────────────────────────
        const input   = await processImage(file)
        const profile = intelligenceService.getProfile(ctx, userId)
        const { systemInstruction } = buildVisionChatPrompt(input, profile, language)

        const question = trimmed || (
          language === 'uz' ? "Bu rasmni tahlil qiling va tushuntiring"
          : language === 'ru' ? "Проанализируйте и объясните это изображение"
          : "Analyze and explain this image"
        )

        response = await callVisionChatEndpoint(
          input.base64,
          input.mimeType,
          systemInstruction,
          question,
        )

      } else {
        // ── Text path ──────────────────────────────────────────────────────
        // Build chat history from previous messages (multi-turn support)
        const chatHistory = messages
          .filter(m => !m.isLoading && !m.hasError)
          .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

        response = await aiProvider.complete(
          [...chatHistory, { role: 'user', content: trimmed }],
          ctx,
          { userId, conversationId: sessionId.current, lastUserMessage: trimmed },
        )

        // Record in session memory
        try {
          memoryEngine.addMessage(sessionId.current, {
            role: 'user', content: trimmed,
            topicTags: [], timestamp: new Date().toISOString(),
          })
          memoryEngine.addMessage(sessionId.current, {
            role: 'assistant', content: response,
            topicTags: [], timestamp: new Date().toISOString(),
          })
        } catch { /* non-critical */ }
      }

      replaceLastMessage(() => ({
        id:        loadingId,
        role:      'assistant',
        content:   response,
        timestamp: new Date().toISOString(),
        isLoading: false,
      }))

    } catch (err) {
      const code = err instanceof Error ? err.message : 'processing_failed'
      replaceLastMessage(m => ({
        ...m,
        isLoading: false,
        hasError:  true,
        errorCode: code,
        content:   '',
      }))
    } finally {
      setIsLoading(false)
    }
  }, [messages, ctx, userId, language, appendMessage, replaceLastMessage])

  // ── Retry last failed message ────────────────────────────────────────────────

  const retryLast = useCallback(async () => {
    const last = messages[messages.length - 1]
    if (!last || last.role !== 'assistant' || !last.hasError) return

    // Remove failed AI message
    setMessages(prev => prev.slice(0, -1))

    // Find the last user message to resend
    const lastUser = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUser) return

    await sendMessage(lastUser.content)
  }, [messages, sendMessage])

  // ── Reset session ────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    // Revoke all blob URLs to prevent memory leaks
    messages.forEach(m => {
      if (m.attachedFile?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(m.attachedFile.previewUrl)
      }
    })
    setMessages([])
    setIsChatMode(false)
    setIsLoading(false)
    sessionId.current = makeId('vision_session')
  }, [messages])

  return {
    messages,
    isChatMode,
    isLoading,
    sendMessage,
    retryLast,
    reset,
  } as const
}
