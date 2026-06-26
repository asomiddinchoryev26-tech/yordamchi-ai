/**
 * ai-brain/vision/index.ts
 * Public API for the AI Vision module.
 * Sprint 3.2 Phase 1 — AI Vision Foundation
 */

// ── Types ──────────────────────────────────────────────────────────────────────
export type {
  ImageMimeType, VisionInput,
  OCRResult, DetectedLanguage,
  Formula, FormulaType, FormulaDetectionResult,
  SubjectArea, DifficultyLevel, QuestionType, QuestionClassification,
  SolutionStep, MiniQuizItem, VisionSolution,
  VisionResult, VisionHistoryEntry,
  VisionProcessingStep, VisionProcessingState,
  VisionErrorCode, VisionErrorMessages,
} from './types'

export {
  VISION_ERRORS, VISION_XP_REWARDS,
  SUPPORTED_MIME_TYPES, MAX_FILE_SIZE_BYTES, MAX_GEMINI_BASE64_BYTES,
} from './types'

// ── Image Processor ────────────────────────────────────────────────────────────
export { processImage, validateFile, createPreviewUrl, detectMimeType } from './imageProcessor'

// ── OCR ────────────────────────────────────────────────────────────────────────
export { processOCRResult, isOCRSufficientForSolving, detectLanguageFromText } from './ocr'

// ── Formula Detector ───────────────────────────────────────────────────────────
export { processFormulas, parseFormula } from './formulaDetector'

// ── Prompt Builder ─────────────────────────────────────────────────────────────
export { buildVisionPrompt } from './promptBuilder'
export type { VisionPrompt } from './promptBuilder'

// ── Vision Service (main API) ─────────────────────────────────────────────────
export { visionService } from './visionService'
export type { VisionServiceOptions, ProgressCallback } from './visionService'
