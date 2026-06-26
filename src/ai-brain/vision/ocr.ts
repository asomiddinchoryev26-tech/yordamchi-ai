/**
 * ai-brain/vision/ocr.ts
 * OCR result validation and post-processing utilities.
 * Gemini Vision performs the actual text extraction.
 * This module validates and enriches the extracted text.
 */

import type { OCRResult, DetectedLanguage } from './types'

// ─── Language detection (post-OCR) ───────────────────────────────────────────

const CYRILLIC_PATTERN = /[а-яёА-ЯЁ]/
const ARABIC_UZ_PATTERN = /[o'g'O'G']|sh|ch|ng|oʻ|gʻ/i
const MATH_SYMBOL_PATTERN = /[=+\-*/^∫∑√π×÷≤≥≠∞]/
const FORMULA_PATTERN = /\b(?:x|y|z|a|b|c)\s*(?:[²³]|[=+\-*/^])/i

export function detectLanguageFromText(text: string): DetectedLanguage {
  if (!text || text.trim().length === 0) return 'unknown'

  const hasCyrillic = CYRILLIC_PATTERN.test(text)
  const hasLatinUz  = ARABIC_UZ_PATTERN.test(text)
  const hasLatin    = /[a-zA-Z]/.test(text)

  if (hasCyrillic && (hasLatin || hasLatinUz)) return 'mixed'
  if (hasCyrillic) return 'ru'
  if (hasLatinUz)  return 'uz'
  if (hasLatin)    return 'en'

  // Mostly numbers/symbols
  if (/\d/.test(text)) return 'mixed'

  return 'unknown'
}

// ─── Formula presence check ───────────────────────────────────────────────────

export function hasFormulaIndicators(text: string): boolean {
  return MATH_SYMBOL_PATTERN.test(text) || FORMULA_PATTERN.test(text)
}

// ─── Text quality scoring ─────────────────────────────────────────────────────

export function scoreTextQuality(text: string): number {
  if (!text || text.trim().length === 0) return 0

  const trimmed = text.trim()
  let score = 0.5  // base

  // Reward meaningful length
  if (trimmed.length > 10) score += 0.1
  if (trimmed.length > 30) score += 0.1
  if (trimmed.length > 100) score += 0.1

  // Reward proper word structure
  const wordCount = trimmed.split(/\s+/).length
  if (wordCount >= 3) score += 0.1
  if (wordCount >= 10) score += 0.1

  // Penalize if mostly non-printable or garbage characters
  const printableRatio = (trimmed.match(/[\x20-\x7EÀ-ɏЀ-ӿ]/g) ?? []).length
    / trimmed.length
  if (printableRatio < 0.5) score -= 0.3

  return Math.min(1, Math.max(0, score))
}

// ─── Main OCR result validator ────────────────────────────────────────────────

/**
 * Validates and enriches a raw text string from Gemini Vision.
 * Returns a structured OCRResult with confidence metrics.
 */
export function processOCRResult(rawText: string): OCRResult {
  const cleaned = (rawText ?? '').trim()
  const isEmpty  = cleaned.length === 0

  if (isEmpty) {
    return {
      rawText:     '',
      confidence:  0,
      language:    'unknown',
      hasText:     false,
      hasFormulas: false,
      isEmpty:     true,
      lineCount:   0,
    }
  }

  const lines      = cleaned.split('\n').filter(l => l.trim().length > 0)
  const confidence = scoreTextQuality(cleaned)
  const language   = detectLanguageFromText(cleaned)
  const hasFormulas = hasFormulaIndicators(cleaned)

  return {
    rawText:     cleaned,
    confidence,
    language,
    hasText:     true,
    hasFormulas,
    isEmpty:     false,
    lineCount:   lines.length,
  }
}

/**
 * Check if the OCR result indicates a solvable problem was found.
 */
export function isOCRSufficientForSolving(result: OCRResult): boolean {
  if (result.isEmpty) return false
  if (result.confidence < 0.2) return false
  if (result.lineCount === 0 && !result.hasFormulas) return false
  return true
}
