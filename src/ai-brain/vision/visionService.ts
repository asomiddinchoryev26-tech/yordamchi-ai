/**
 * ai-brain/vision/visionService.ts
 * Main Vision Service — orchestrates the complete AI Vision pipeline.
 *
 * Pipeline:
 *   File → validate → process → build prompt → Gemini Vision
 *        → parse response → enrich → record memory → award XP → save history
 *
 * Integrates with existing AI Brain (Sprint 3.0–3.1):
 *   - intelligenceService (profile, cache)
 *   - memoryEngine (topic tracking, mistake recording)
 *   - recommendationEngine (next steps)
 */

import { supabase }           from '@/lib/supabase'
import { intelligenceService } from '../services/intelligence-service'
import { memoryEngine }        from '../memory/engine'
import type { StudentContext } from '@/services/ai-provider.service'
import type { Language }       from '../core/types'
import type {
  VisionInput, VisionSolution, VisionResult, VisionHistoryEntry,
  VisionProcessingState, VisionProcessingStep, VisionErrorCode,
  SubjectArea, DifficultyLevel,
} from './types'
import { VISION_XP_REWARDS, VISION_ERRORS } from './types'
import { processImage }     from './imageProcessor'
import { processOCRResult, isOCRSufficientForSolving } from './ocr'
import { processFormulas }  from './formulaDetector'
import { buildVisionPrompt } from './promptBuilder'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProgressCallback = (state: VisionProcessingState) => void

export interface VisionServiceOptions {
  readonly file:     File
  readonly userId:   string
  readonly ctx:      StudentContext
  readonly language: Language
  /** Called at each pipeline step with progress info */
  readonly onProgress?: ProgressCallback
  /** Retry count for Gemini call (default: 2) */
  readonly maxRetries?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emit(
  cb:       ProgressCallback | undefined,
  step:     VisionProcessingStep,
  progress: number,
  message:  string,
): void {
  cb?.({ step, progress, message })
}

function validSubject(raw: unknown): SubjectArea {
  const VALID: SubjectArea[] = [
    'math','physics','chemistry','biology','history','literature',
    'language','geography','computer_science','mixed','unknown',
  ]
  return VALID.includes(raw as SubjectArea) ? (raw as SubjectArea) : 'unknown'
}

function validDifficulty(raw: unknown): DifficultyLevel {
  const VALID: DifficultyLevel[] = ['elementary','middle','high_school','university','unknown']
  return VALID.includes(raw as DifficultyLevel) ? (raw as DifficultyLevel) : 'unknown'
}

// ─── Response parser ──────────────────────────────────────────────────────────

function parseGeminiResponse(text: string, _lang: Language): VisionSolution {
  // Try to extract JSON block from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('parse_failed')

  let raw: Record<string, unknown>
  try {
    raw = JSON.parse(jsonMatch[0]) as Record<string, unknown>
  } catch {
    throw new Error('parse_failed')
  }

  const detectedText   = String(raw['detectedText']   ?? '')
  const rawFormulas    = Array.isArray(raw['detectedFormulas']) ? raw['detectedFormulas'] as string[] : []
  const rawSteps       = Array.isArray(raw['steps'])   ? raw['steps'] : []
  const rawMiniQuiz    = Array.isArray(raw['miniQuiz']) ? raw['miniQuiz'] : []
  const rawMistakes    = Array.isArray(raw['commonMistakes']) ? raw['commonMistakes'] as string[] : []

  // Post-process OCR result
  const ocrResult = processOCRResult(detectedText)

  // Post-process formulas
  processFormulas(rawFormulas)

  const subject    = validSubject(raw['subject'])
  const difficulty = validDifficulty(raw['difficulty'])

  const solution: VisionSolution = {
    detectedText:     ocrResult.rawText,
    detectedFormulas: rawFormulas.filter(f => typeof f === 'string'),
    subject,
    difficulty,
    topic:            String(raw['topic'] ?? 'Unknown Topic'),
    steps:            rawSteps.map((s: unknown, i: number) => {
      const step = s as Record<string, unknown>
      return {
        stepNumber:  Number(step['stepNumber']  ?? i + 1),
        description: String(step['description'] ?? ''),
        formula:     typeof step['formula']      === 'string' ? step['formula']      : undefined,
        result:      typeof step['result']       === 'string' ? step['result']       : undefined,
        explanation: typeof step['explanation']  === 'string' ? step['explanation']  : undefined,
      }
    }),
    finalAnswer:        String(raw['finalAnswer']        ?? ''),
    commonMistakes:     rawMistakes,
    miniQuiz:           rawMiniQuiz.map((q: unknown) => {
      const item = q as Record<string, unknown>
      return {
        question: String(item['question'] ?? ''),
        answer:   String(item['answer']   ?? ''),
        hint:     typeof item['hint'] === 'string' ? item['hint'] : undefined,
      }
    }),
    nextRecommendation: String(raw['nextRecommendation'] ?? ''),
    confidence:         typeof raw['confidence'] === 'number' ? raw['confidence'] : 0.7,
    xpEarned:           VISION_XP_REWARDS[difficulty],
    language:           ocrResult.language,
  }

  // Validate OCR result sufficiency
  if (!isOCRSufficientForSolving(ocrResult) && solution.steps.length === 0) {
    throw new Error('no_text_detected')
  }

  return solution
}

// ─── Gemini Vision API call (via Edge Function) ───────────────────────────────

async function callGeminiVision(
  input:             VisionInput,
  systemInstruction: string,
  userMessage:       string,
  retryCount:        number,
): Promise<string> {
  const attempt = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('ai-vision', {
      body: {
        imageBase64:       input.base64,
        mimeType:          input.mimeType,
        systemInstruction,
        userMessage,
      },
    })

    if (error) {
      const errCtx = (error as unknown as { context?: { error?: string } }).context
      throw new Error(errCtx?.error ?? error.message)
    }

    if (data?.error) throw new Error(data.error as string)
    if (!data?.response) throw new Error('gemini_error')

    return data.response as string
  }

  // Retry with exponential backoff
  let lastError: Error = new Error('gemini_error')
  for (let i = 0; i <= retryCount; i++) {
    try {
      return await attempt()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('gemini_error')
      if (i < retryCount) {
        await new Promise(r => setTimeout(r, Math.min(1000 * Math.pow(2, i), 5000)))
      }
    }
  }
  throw lastError
}

// ─── History storage ──────────────────────────────────────────────────────────

async function saveToHistory(
  userId:      string,
  solution:    VisionSolution,
  durationMs:  number,
): Promise<string> {
  const { data, error } = await supabase
    .from('ai_vision_results')
    .insert({
      student_id:       userId,
      topic:            solution.topic,
      subject:          solution.subject,
      difficulty:       solution.difficulty,
      detected_text:    solution.detectedText.slice(0, 500),
      solution_json:    {
        steps:              solution.steps,
        finalAnswer:        solution.finalAnswer,
        commonMistakes:     solution.commonMistakes,
        miniQuiz:           solution.miniQuiz,
        nextRecommendation: solution.nextRecommendation,
        confidence:         solution.confidence,
      },
      xp_earned:        solution.xpEarned,
      duration_ms:      durationMs,
    })
    .select('id')
    .single()

  if (error) console.warn('[VisionService] History save failed (non-critical):', error.message)
  return (data as { id: string } | null)?.id ?? `local_${Date.now()}`
}

// ─── Memory integration ───────────────────────────────────────────────────────

function recordVisionInMemory(
  userId:   string,
  solution: VisionSolution,
  resultId: string,
): void {
  const memoryKey = `vision_${resultId}`

  try {
    // Record topic visit
    memoryEngine.recordTopic(
      memoryKey,
      solution.topic.toLowerCase().replace(/\s+/g, '_'),
      solution.topic,
      solution.confidence > 0.7,
    )

    // If common mistakes detected, record as weak concept
    if (solution.commonMistakes.length > 0 && solution.difficulty !== 'elementary') {
      memoryEngine.recordMistake(memoryKey, {
        topicId:       solution.topic.toLowerCase().replace(/\s+/g, '_'),
        topicTitle:    solution.topic,
        wrongAnswer:   solution.commonMistakes[0] ?? '',
        correctAnswer: solution.finalAnswer.slice(0, 100),
        explanation:   solution.commonMistakes[0] ?? '',
        correctedAt:   null,
      })
    }

    // Update intelligence profile cache
    intelligenceService.invalidateCache(userId)
  } catch {
    /* non-critical */
  }
}

// ─── Main Service ─────────────────────────────────────────────────────────────

export const visionService = {

  /**
   * Full vision pipeline: file → solution + history entry.
   * Reports progress via onProgress callback.
   *
   * @throws Error with VisionErrorCode message on failure.
   */
  async solve(options: VisionServiceOptions): Promise<VisionResult> {
    const {
      file, userId, ctx, language,
      onProgress: cb,
      maxRetries = 2,
    } = options

    const startMs = Date.now()

    // ── Step 1: Compress ─────────────────────────────────────────────────────
    emit(cb, 'compressing', 15, 'Rasm siqilmoqda…')
    let input: VisionInput
    try {
      input = await processImage(file)
    } catch (err) {
      const code = (err instanceof Error ? err.message : 'processing_failed') as VisionErrorCode
      throw new Error(code)
    }

    // ── Step 2: Build profile + prompt ───────────────────────────────────────
    emit(cb, 'analyzing', 35, 'Profil tayyorlanmoqda…')
    const profile = (() => {
      try { return intelligenceService.getProfile(ctx, userId) }
      catch { return null }
    })()

    const { systemInstruction, userMessage } = buildVisionPrompt(input, profile, language)

    // ── Step 3: Call Gemini Vision ────────────────────────────────────────────
    emit(cb, 'solving', 55, 'AI hal qilmoqda…')
    let rawResponse: string
    try {
      rawResponse = await callGeminiVision(input, systemInstruction, userMessage, maxRetries)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'gemini_error'
      throw new Error(VISION_ERRORS[msg as VisionErrorCode] ? msg : 'gemini_error')
    }

    // ── Step 4: Parse response ────────────────────────────────────────────────
    emit(cb, 'solving', 75, 'Javob tahlil qilinmoqda…')
    let solution: VisionSolution
    try {
      solution = parseGeminiResponse(rawResponse, language)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'parse_failed'
      throw new Error(msg)
    }

    // ── Step 5: Save + record ─────────────────────────────────────────────────
    emit(cb, 'saving', 88, 'Natija saqlanmoqda…')
    const durationMs = Date.now() - startMs
    const resultId   = await saveToHistory(userId, solution, durationMs)
    recordVisionInMemory(userId, solution, resultId)

    // ── Done ──────────────────────────────────────────────────────────────────
    emit(cb, 'complete', 100, 'Tayyor!')

    return {
      id:           resultId,
      input:        { mimeType: input.mimeType, sizeBytes: input.sizeBytes, compressed: input.compressed },
      solution,
      processingMs: durationMs,
      createdAt:    new Date().toISOString(),
    }
  },

  /**
   * Load vision history for a student (last N entries, newest first).
   */
  async loadHistory(userId: string, limit = 20): Promise<VisionHistoryEntry[]> {
    try {
      const { data } = await supabase
        .from('ai_vision_results')
        .select('id,topic,subject,difficulty,detected_text,xp_earned,duration_ms,created_at')
        .eq('student_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      return ((data ?? []) as Array<Record<string, unknown>>).map(row => ({
        id:              String(row['id']),
        studentId:       userId,
        topic:           String(row['topic']),
        subject:         row['subject'] as SubjectArea,
        difficulty:      row['difficulty'] as DifficultyLevel,
        detectedText:    String(row['detected_text'] ?? ''),
        solutionSummary: String(row['topic']),
        xpEarned:        Number(row['xp_earned'] ?? 0),
        durationMs:      Number(row['duration_ms'] ?? 0),
        createdAt:       String(row['created_at']),
      }))
    } catch {
      return []
    }
  },
}
