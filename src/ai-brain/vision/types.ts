/**
 * ai-brain/vision/types.ts
 * All types for the AI Vision module.
 * Sprint 3.2 Phase 1 — AI Vision Foundation
 */

import type { Language } from '../core/types'

// ─── Image Input ──────────────────────────────────────────────────────────────

export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf'

export interface VisionInput {
  readonly file:       File
  readonly mimeType:   ImageMimeType
  readonly sizeBytes:  number
  readonly dataUrl:    string   // base64 data URL for display
  readonly base64:     string   // pure base64 (no prefix) for Gemini
  readonly compressed: boolean
  readonly originalSizeBytes: number
}

// ─── OCR Result ───────────────────────────────────────────────────────────────

export type DetectedLanguage = Language | 'mixed' | 'unknown'

export interface OCRResult {
  readonly rawText:     string
  readonly confidence:  number         // 0–1
  readonly language:    DetectedLanguage
  readonly hasText:     boolean
  readonly hasFormulas: boolean
  readonly isEmpty:     boolean
  readonly lineCount:   number
}

// ─── Formula Detection ────────────────────────────────────────────────────────

export type FormulaType =
  | 'arithmetic'
  | 'algebra'
  | 'quadratic'
  | 'calculus'
  | 'geometry'
  | 'trigonometry'
  | 'physics'
  | 'chemistry'
  | 'statistics'
  | 'unknown'

export interface Formula {
  readonly expression: string
  readonly type:       FormulaType
  readonly variables:  readonly string[]
  readonly isLatex:    boolean
}

export interface FormulaDetectionResult {
  readonly formulas:    readonly Formula[]
  readonly hasFormulas: boolean
  readonly primaryType: FormulaType | null
  readonly complexity:  'simple' | 'intermediate' | 'advanced' | 'unknown'
}

// ─── Question Classification ──────────────────────────────────────────────────

export type SubjectArea =
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'history'
  | 'literature'
  | 'language'
  | 'geography'
  | 'computer_science'
  | 'mixed'
  | 'unknown'

export type DifficultyLevel = 'elementary' | 'middle' | 'high_school' | 'university' | 'unknown'

export type QuestionType =
  | 'problem_solve'
  | 'proof'
  | 'explain'
  | 'translate'
  | 'essay'
  | 'multiple_choice'
  | 'fill_blank'
  | 'unknown'

export interface QuestionClassification {
  readonly subject:              SubjectArea
  readonly difficulty:           DifficultyLevel
  readonly questionType:         QuestionType
  readonly requiresCalculation:  boolean
  readonly requiresGraph:        boolean
  readonly multipleQuestions:    boolean
  readonly estimatedSolveMinutes: number
}

// ─── Solution (from Gemini) ───────────────────────────────────────────────────

export interface SolutionStep {
  readonly stepNumber:   number
  readonly description:  string
  readonly formula?:     string
  readonly result?:      string
  readonly explanation?: string
}

export interface MiniQuizItem {
  readonly question: string
  readonly answer:   string
  readonly hint?:    string
}

export interface VisionSolution {
  // What Gemini extracted
  readonly detectedText:     string
  readonly detectedFormulas: readonly string[]

  // Classification
  readonly subject:    SubjectArea
  readonly difficulty: DifficultyLevel
  readonly topic:      string

  // Solution content
  readonly steps:              readonly SolutionStep[]
  readonly finalAnswer:        string
  readonly commonMistakes:     readonly string[]
  readonly miniQuiz:           readonly MiniQuizItem[]
  readonly nextRecommendation: string

  // Metadata
  readonly confidence: number   // 0–1 (Gemini's self-assessment)
  readonly xpEarned:  number    // computed after classification
  readonly language:  DetectedLanguage
}

// ─── Vision Result (full session result) ─────────────────────────────────────

export interface VisionResult {
  readonly id:           string
  readonly input:        Pick<VisionInput, 'mimeType' | 'sizeBytes' | 'compressed'>
  readonly solution:     VisionSolution
  readonly processingMs: number
  readonly createdAt:    string
}

// ─── History Entry (stored in Supabase) ──────────────────────────────────────

export interface VisionHistoryEntry {
  readonly id:              string
  readonly studentId:       string
  readonly topic:           string
  readonly subject:         SubjectArea
  readonly difficulty:      DifficultyLevel
  readonly detectedText:    string
  readonly solutionSummary: string
  readonly xpEarned:        number
  readonly durationMs:      number
  readonly createdAt:       string
}

// ─── Processing State ─────────────────────────────────────────────────────────

export type VisionProcessingStep =
  | 'idle'
  | 'compressing'
  | 'validating'
  | 'analyzing'
  | 'solving'
  | 'saving'
  | 'complete'
  | 'error'

export interface VisionProcessingState {
  readonly step:      VisionProcessingStep
  readonly progress:  number   // 0–100
  readonly message:   string
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export type VisionErrorCode =
  | 'file_too_large'
  | 'unsupported_format'
  | 'low_quality'
  | 'blurry_image'
  | 'no_text_detected'
  | 'multiple_questions'
  | 'processing_failed'
  | 'gemini_error'
  | 'upload_failed'
  | 'parse_failed'
  | 'quota_exceeded'

export interface VisionErrorMessages {
  readonly uz: string
  readonly ru: string
  readonly en: string
}

export const VISION_ERRORS: Record<VisionErrorCode, VisionErrorMessages> = {
  file_too_large: {
    uz: "Fayl 20 MB dan katta. Iltimos, kichikroq rasm yuboring.",
    ru: "Файл превышает 20 МБ. Пожалуйста, отправьте меньший файл.",
    en: "File exceeds 20 MB. Please upload a smaller image.",
  },
  unsupported_format: {
    uz: "Bu format qo'llab-quvvatlanmaydi. JPG, PNG, WEBP yoki PDF yuboring.",
    ru: "Этот формат не поддерживается. Отправьте JPG, PNG, WEBP или PDF.",
    en: "Unsupported format. Please upload JPG, PNG, WEBP or PDF.",
  },
  low_quality: {
    uz: "Rasm sifati past. Aniqroq rasm yuboring.",
    ru: "Изображение низкого качества. Пожалуйста, загрузите более чёткое фото.",
    en: "Image quality is too low. Please upload a clearer photo.",
  },
  blurry_image: {
    uz: "Rasm xiralashgan. Kameraning fokusini moslashtiring.",
    ru: "Изображение размытое. Отрегулируйте фокус камеры.",
    en: "Image is blurry. Please adjust your camera focus.",
  },
  no_text_detected: {
    uz: "Rasmda matn yoki formula topilmadi. Boshqa rasm yuboring.",
    ru: "В изображении не найден текст или формула. Загрузите другое изображение.",
    en: "No text or formula detected. Please upload a different image.",
  },
  multiple_questions: {
    uz: "Rasmda bir nechta savol aniqlandi. Har bir savolni alohida yuboring.",
    ru: "Обнаружено несколько вопросов. Отправляйте по одному вопросу.",
    en: "Multiple questions detected. Please send one question at a time.",
  },
  processing_failed: {
    uz: "Qayta ishlashda xatolik yuz berdi. Qayta urinib ko'ring.",
    ru: "Ошибка обработки. Попробуйте ещё раз.",
    en: "Processing failed. Please try again.",
  },
  gemini_error: {
    uz: "AI xizmatida xatolik. Bir daqiqadan so'ng urinib ko'ring.",
    ru: "Ошибка AI сервиса. Попробуйте через минуту.",
    en: "AI service error. Please try again in a moment.",
  },
  upload_failed: {
    uz: "Yuklash muvaffaqiyatsiz bo'ldi. Internetni tekshiring.",
    ru: "Ошибка загрузки. Проверьте подключение к интернету.",
    en: "Upload failed. Please check your internet connection.",
  },
  parse_failed: {
    uz: "AI javobini o'qib bo'lmadi. Qayta urinib ko'ring.",
    ru: "Не удалось прочитать ответ AI. Попробуйте ещё раз.",
    en: "Failed to read AI response. Please try again.",
  },
  quota_exceeded: {
    uz: "Bugunlik limit tugadi. Ertaga qayta urinib ko'ring.",
    ru: "Дневной лимит исчерпан. Попробуйте завтра.",
    en: "Daily limit reached. Please try again tomorrow.",
  },
}

// ─── XP Rewards by difficulty ─────────────────────────────────────────────────

export const VISION_XP_REWARDS: Record<DifficultyLevel, number> = {
  elementary:  5,
  middle:      10,
  high_school: 15,
  university:  20,
  unknown:     5,
}

// ─── Supported MIME types ─────────────────────────────────────────────────────

export const SUPPORTED_MIME_TYPES: readonly ImageMimeType[] = [
  'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
]

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  // 20 MB
export const MAX_GEMINI_BASE64_BYTES = 4 * 1024 * 1024  // 4 MB after compression
