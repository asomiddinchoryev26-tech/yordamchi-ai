/**
 * ai-brain/vision/promptBuilder.ts
 * Builds the structured Gemini Vision system prompt and user message.
 * Injects student profile for personalized teaching responses.
 * Expected JSON output format is strictly enforced.
 */

import type { Language } from '../core/types'
import type { StudentIntelligenceProfile } from '../intelligence/types'
import type { VisionInput } from './types'

// ─── JSON Schema the model must follow ────────────────────────────────────────

const RESPONSE_JSON_SCHEMA = `{
  "detectedText": "exact text from the image",
  "detectedFormulas": ["formula1", "formula2"],
  "subject": "math|physics|chemistry|biology|history|literature|language|geography|computer_science|mixed|unknown",
  "difficulty": "elementary|middle|high_school|university|unknown",
  "topic": "specific topic name (e.g. Quadratic Equations)",
  "steps": [
    {
      "stepNumber": 1,
      "description": "what to do in this step",
      "formula": "optional formula used",
      "result": "optional intermediate result",
      "explanation": "why this step is needed"
    }
  ],
  "finalAnswer": "the complete final answer",
  "commonMistakes": ["mistake 1", "mistake 2"],
  "miniQuiz": [
    { "question": "follow-up question", "answer": "correct answer", "hint": "optional hint" }
  ],
  "nextRecommendation": "what to study next based on this topic",
  "confidence": 0.95
}`

// ─── System Prompt ────────────────────────────────────────────────────────────

function buildSystemInstruction(profile: StudentIntelligenceProfile | null, lang: Language): string {
  const name     = profile?.name ?? 'Student'
  const level    = profile?.level?.definition?.label[lang] ?? 'Unknown'
  const weakList = profile?.weakTopics?.map(t => t.title).join(', ') ?? ''
  const langName = lang === 'uz' ? "O'zbek" : lang === 'ru' ? 'Русский' : 'English'

  const profileSection = profile
    ? `## Student Profile
- Name: ${name}
- Level: ${level} (${profile.xp} XP)
- Mastery: ${profile.masteryScore}/100
${weakList ? `- Needs attention: ${weakList}` : ''}
- Preferred language: ${langName}`
    : `## Student Profile
- Language: ${langName}`

  return `You are an AI Teacher solving homework and exam questions from images.
You specialize in providing clear, step-by-step educational explanations.

${profileSection}

## Your Task
Analyze the image and:
1. Extract ALL visible text and formulas exactly as written
2. Solve the problem completely, step by step
3. Explain WHY each step is done (not just what)
4. Highlight common mistakes students make on this type of problem
5. Create 1-2 follow-up questions to check understanding
6. Recommend what topic to study next

## CRITICAL: Language Rule
RESPOND IN ${langName.toUpperCase()} (${lang}).
ALL fields in the JSON must be in ${langName}.

## Output Format
You MUST respond with ONLY valid JSON matching this exact schema:
${RESPONSE_JSON_SCHEMA}

IMPORTANT RULES:
- Return ONLY the JSON object, nothing else
- Every field is required
- steps array must have at least 1 step for any solvable problem
- If no text/formula detected, set detectedText to "" and confidence to 0.1
- confidence is your self-assessment of extraction quality (0.0–1.0)
- finalAnswer must be a complete, standalone answer (not "see above")
`
}

// ─── User Message ─────────────────────────────────────────────────────────────

function buildUserMessage(input: VisionInput, lang: Language): string {
  const fileType = input.mimeType === 'application/pdf' ? 'PDF document' : 'image'
  const size = (input.sizeBytes / 1024).toFixed(0)

  const prompts: Record<Language, string> = {
    uz: `Bu ${fileType}da savol yoki masala bor (${size} KB). Iltimos, uni hal qiling va tushuntiring.`,
    ru: `В этом ${fileType === 'PDF document' ? 'PDF документе' : 'изображении'} есть задача или вопрос (${size} КБ). Решите и объясните.`,
    en: `This ${fileType} contains a problem or question (${size} KB). Please solve it and explain step by step.`,
  }

  return prompts[lang]
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export interface VisionPrompt {
  readonly systemInstruction: string
  readonly userMessage:       string
  readonly language:          Language
}

/**
 * Build the complete vision prompt for Gemini.
 * Phase 1 mode: returns strict JSON schema (for structured solve).
 */
export function buildVisionPrompt(
  input:   VisionInput,
  profile: StudentIntelligenceProfile | null,
  lang:    Language,
): VisionPrompt {
  return {
    systemInstruction: buildSystemInstruction(profile, lang),
    userMessage:       buildUserMessage(input, lang),
    language:          lang,
  }
}

// ─── Phase 2: Chat mode prompt (returns markdown, not JSON) ──────────────────

/**
 * Build a CHAT-MODE vision prompt for Gemini.
 * Returns markdown text instead of JSON — used in Universal AI chat.
 * The caller provides the user's actual question as userMessage.
 */
export function buildVisionChatPrompt(
  _input:  VisionInput,   // kept for future image metadata injection
  profile: StudentIntelligenceProfile | null,
  lang:    Language,
): VisionPrompt {
  const langName = lang === 'uz' ? "O'zbek" : lang === 'ru' ? 'Русский' : 'English'
  const level    = profile?.level?.definition?.label[lang] ?? ''
  const weakList = profile?.weakTopics?.map(t => t.title).join(', ') ?? ''

  const systemInstruction = [
    `You are YordamchiAI — a personalized AI Teacher powered by Gemini 2.5 Flash.`,
    profile
      ? `Student: ${profile.name} | Level: ${level} | Mastery: ${profile.masteryScore}/100`
      : '',
    weakList ? `Needs extra attention on: ${weakList}` : '',
    ``,
    `The student has shared an image/PDF with a question. Be their personal tutor.`,
    ``,
    `## RESPONSE RULES`,
    `- RESPOND IN ${langName.toUpperCase()} ONLY`,
    `- Use markdown formatting throughout:`,
    `  • **bold** for key terms and answers`,
    `  • Numbered lists (1. 2. 3.) for step-by-step solutions`,
    `  • Code blocks: \`\`\`python\\n...\\n\`\`\``,
    `  • LaTeX math inline: $formula$ or block: $$formula$$`,
    `  • Tables when comparing multiple items`,
    `- For math problems: solve step-by-step, show all work`,
    `- For text/essays: analyze clearly, give structured feedback`,
    `- Be encouraging: celebrate correct reasoning before correcting errors`,
    `- End with ONE follow-up question to deepen understanding`,
    `- Keep total response under 600 words unless the problem requires more`,
  ].filter(Boolean).join('\n')

  return {
    systemInstruction,
    userMessage: '', // overridden by caller's actual question
    language:    lang,
  }
}
