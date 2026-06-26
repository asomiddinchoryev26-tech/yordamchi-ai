/**
 * ai-brain/vision/formulaDetector.ts
 * Post-processing utility for detected formulas from Gemini Vision.
 * Classifies formula types and extracts variables.
 */

import type { Formula, FormulaType, FormulaDetectionResult } from './types'

// ─── Formula type classifiers ─────────────────────────────────────────────────

const TYPE_PATTERNS: ReadonlyArray<{ pattern: RegExp; type: FormulaType }> = [
  // Calculus
  { pattern: /∫|d\/dx|∂|lim|→|∞|Σ|dy\/dx/,               type: 'calculus'      },
  // Quadratic
  { pattern: /ax²|bx|discriminant|D\s*=\s*b²|quadratic/i,  type: 'quadratic'     },
  // Trigonometry
  { pattern: /sin|cos|tan|cot|sec|csc|arcsin|arccos/i,      type: 'trigonometry'  },
  // Geometry
  { pattern: /π|area|perimeter|volume|radius|diameter/i,    type: 'geometry'      },
  // Physics
  { pattern: /F\s*=\s*ma|E\s*=\s*mc²|v\s*=|λ|ω|μ|Newton/i, type: 'physics'      },
  // Chemistry
  { pattern: /mol|H₂O|CO₂|NaCl|→|⇌|pH|Ka|Kb/,             type: 'chemistry'     },
  // Statistics
  { pattern: /mean|median|mode|σ|variance|P\(/i,            type: 'statistics'    },
  // General algebra
  { pattern: /x\s*=|y\s*=|=\s*[0-9a-z]/i,                  type: 'algebra'       },
  // Arithmetic
  { pattern: /^\s*[\d\s+\-*/().,=]+\s*$/,                   type: 'arithmetic'    },
]

const VARIABLE_PATTERN = /\b([a-zA-Z][₀-₉]?)\b/g
const SUBSCRIPT_MAP: Record<string, string> = {
  '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4',
  '₅':'5','₆':'6','₇':'7','₈':'8','₉':'9',
}

// ─── Formula parsing ──────────────────────────────────────────────────────────

function classifyFormula(expression: string): FormulaType {
  for (const { pattern, type } of TYPE_PATTERNS) {
    if (pattern.test(expression)) return type
  }
  return 'unknown'
}

function extractVariables(expression: string): string[] {
  const seen = new Set<string>()
  const vars: string[] = []
  let match: RegExpExecArray | null
  const clean = expression.replace(
    /[₀-₉]/g, c => SUBSCRIPT_MAP[c] ?? c,
  )
  // Reset lastIndex for re-use
  VARIABLE_PATTERN.lastIndex = 0
  while ((match = VARIABLE_PATTERN.exec(clean)) !== null) {
    const v = match[1]
    // Exclude common math constants and single-letter keywords
    if (!seen.has(v) && !['e','i','E','I','O'].includes(v)) {
      seen.add(v)
      vars.push(v)
    }
  }
  return vars
}

function isLatexExpression(expression: string): boolean {
  return /\\[a-zA-Z]+{/.test(expression) || /\^{|_{/.test(expression)
}

/**
 * Create a Formula object from a raw expression string.
 */
export function parseFormula(expression: string): Formula {
  const trimmed = expression.trim()
  return {
    expression: trimmed,
    type:       classifyFormula(trimmed),
    variables:  extractVariables(trimmed),
    isLatex:    isLatexExpression(trimmed),
  }
}

/**
 * Determine overall complexity from an array of formulas.
 */
function assessComplexity(
  formulas: readonly Formula[],
): FormulaDetectionResult['complexity'] {
  if (formulas.length === 0) return 'unknown'

  const hasAdvanced = formulas.some(f =>
    ['calculus', 'quadratic', 'statistics'].includes(f.type),
  )
  if (hasAdvanced) return 'advanced'

  const hasIntermediate = formulas.some(f =>
    ['algebra', 'trigonometry', 'geometry', 'physics', 'chemistry'].includes(f.type),
  )
  if (hasIntermediate) return 'intermediate'

  return 'simple'
}

// ─── Main detector ────────────────────────────────────────────────────────────

/**
 * Process a list of raw formula strings (from Gemini's detectedFormulas).
 * Returns enriched FormulaDetectionResult.
 */
export function processFormulas(rawFormulas: readonly string[]): FormulaDetectionResult {
  if (!rawFormulas || rawFormulas.length === 0) {
    return {
      formulas:    [],
      hasFormulas: false,
      primaryType: null,
      complexity:  'unknown',
    }
  }

  const formulas = rawFormulas
    .filter(f => f && f.trim().length > 0)
    .map(parseFormula)

  if (formulas.length === 0) {
    return { formulas: [], hasFormulas: false, primaryType: null, complexity: 'unknown' }
  }

  // Most common type is the primary type
  const typeCounts = new Map<FormulaType, number>()
  for (const f of formulas) {
    typeCounts.set(f.type, (typeCounts.get(f.type) ?? 0) + 1)
  }

  let primaryType: FormulaType | null = null
  let maxCount = 0
  for (const [type, count] of typeCounts) {
    if (count > maxCount && type !== 'unknown') {
      maxCount    = count
      primaryType = type
    }
  }

  return {
    formulas,
    hasFormulas: true,
    primaryType,
    complexity:  assessComplexity(formulas),
  }
}
