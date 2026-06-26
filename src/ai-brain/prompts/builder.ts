/**
 * ai-brain/prompts/builder.ts
 *
 * CENTRALIZED PROMPT BUILDER — the most critical piece of Sprint 3.0.
 *
 * Transforms StudentIntelligenceProfile + AIMemory + context
 * into a rich, structured system prompt for Gemini.
 *
 * The result dramatically improves AI response quality by injecting:
 *   • Student identity & level
 *   • Academic performance data
 *   • Weak topics (with targeted attention flags)
 *   • Recent lessons
 *   • Teacher notes
 *   • Session memory summary
 *   • Mode-specific behavioral instructions
 *   • Personalized engagement rules
 *
 * Integration path (Sprint 3.1):
 *   Pass PromptBuildResult.systemPrompt to the Supabase Edge Function
 *   as `context.systemPrompt` — the Edge Function will use it instead of
 *   its default generic prompt.
 */

import type { PromptBuilderInput, PromptBuildResult, PromptSection } from './types'
import { AI_IDENTITY, BEHAVIORAL_RULES, MODE_OPENINGS, weakTopicWarning } from './templates'
import { TUTOR_MODE_CONFIGS } from '../tutor/engine'
import type { TutorMode } from '../tutor/types'
import type { Language } from '../core/types'
import type { StudentIntelligenceProfile } from '../intelligence/types'
import type { AIMemory } from '../memory/types'
import type { Recommendation } from '../recommendations/types'

// ─── Section Builders ─────────────────────────────────────────────────────────

function buildIdentitySection(lang: Language): PromptSection {
  return {
    heading: 'AI Teacher Identity',
    content: AI_IDENTITY[lang],
    order:   0,
  }
}

function buildStudentSection(
  profile: StudentIntelligenceProfile,
  lang: Language,
): PromptSection {
  const levelLabel = profile.level.definition.label[lang]
  const lines: string[] = []

  const headers: Record<Language, string> = {
    uz: '## O\'quvchi Profili',
    ru: '## Профиль Студента',
    en: '## Student Profile',
  }

  lines.push(headers[lang])
  lines.push(`- **${lang === 'ru' ? 'Имя' : lang === 'en' ? 'Name' : 'Ism'}:** ${profile.name}`)
  lines.push(`- **${lang === 'ru' ? 'Уровень' : lang === 'en' ? 'Level' : 'Daraja'}:** ${profile.level.definition.emoji} ${levelLabel} (${profile.xp} XP)`)

  if (profile.streak > 0) {
    const streakLabel = lang === 'ru' ? 'Серия' : lang === 'en' ? 'Streak' : 'Streak'
    lines.push(`- **${streakLabel}:** 🔥 ${profile.streak} ${lang === 'ru' ? 'дней подряд' : lang === 'en' ? 'days' : 'kun'}`)
  }

  lines.push(`- **${lang === 'ru' ? 'Язык' : lang === 'en' ? 'Language' : 'Til'}:** ${lang === 'uz' ? "O'zbek" : lang === 'ru' ? 'Русский' : 'English'}`)

  return { heading: 'Student Profile', content: lines.join('\n'), order: 1 }
}

function buildAcademicSection(
  profile: StudentIntelligenceProfile,
  lang: Language,
): PromptSection {
  const headers: Record<Language, string> = {
    uz: '## Akademik Ko\'rsatkichlar',
    ru: '## Академическая Успеваемость',
    en: '## Academic Performance',
  }

  const labels: Record<Language, { att: string; test: string; mastery: string; passed: string }> = {
    uz: { att: 'Davomat', test: "Test o'rtachasi", mastery: "O'zlashtirish", passed: "O'tdi" },
    ru: { att: 'Посещаемость', test: 'Ср. балл тестов', mastery: 'Успеваемость', passed: 'Сдал' },
    en: { att: 'Attendance', test: 'Test average', mastery: 'Mastery', passed: 'Passed' },
  }

  const lbl = labels[lang]
  const lines: string[] = [headers[lang]]

  if (profile.attPct !== null) {
    const attEmoji = profile.attPct >= 85 ? '✅' : profile.attPct >= 70 ? '⚠️' : '❌'
    lines.push(`- **${lbl.att}:** ${attEmoji} ${profile.attPct}% (${profile.attTotal} dars)`)
  }

  if (profile.testsTotal > 0) {
    const testEmoji = profile.weeklyAvgPct >= 75 ? '✅' : profile.weeklyAvgPct >= 60 ? '⚠️' : '❌'
    lines.push(`- **${lbl.test}:** ${testEmoji} ${profile.weeklyAvgPct}%`)
    lines.push(`- **${lbl.passed}:** ${profile.testsPassed}/${profile.testsTotal}`)
  } else {
    lines.push(`- **${lbl.test}:** ${lang === 'uz' ? 'Hali test topshirilmagan' : lang === 'ru' ? 'Тестов ещё не было' : 'No tests yet'}`)
  }

  lines.push(`- **${lbl.mastery}:** ${profile.masteryScore}/100`)

  return { heading: 'Academic Performance', content: lines.join('\n'), order: 2 }
}

function buildCurrentCourseSection(
  profile: StudentIntelligenceProfile,
  lang: Language,
): PromptSection | null {
  const course = profile.currentCourse
  if (!course) return null

  const headers: Record<Language, string> = {
    uz: '## Joriy Kurs',
    ru: '## Текущий Курс',
    en: '## Current Course',
  }

  const lines: string[] = [headers[lang]]
  lines.push(`📚 **${course.name}**`)
  if (course.subjectName) {
    lines.push(`${lang === 'uz' ? 'Fan' : lang === 'ru' ? 'Предмет' : 'Subject'}: ${course.subjectName}`)
  }

  return { heading: 'Current Course', content: lines.join('\n'), order: 3 }
}

function buildWeakTopicsSection(
  profile: StudentIntelligenceProfile,
  lang: Language,
): PromptSection | null {
  if (profile.weakTopics.length === 0) return null

  const headers: Record<Language, string> = {
    uz: '## Zaif Tomonlar ⚠️',
    ru: '## Слабые Темы ⚠️',
    en: '## Weak Topics ⚠️',
  }

  const introLines: Record<Language, string> = {
    uz: 'Bu mavzularda talaba qiynaladi — ALOHIDA e\'tibor ber:',
    ru: 'Студент испытывает трудности в этих темах — обращай ОСОБОЕ внимание:',
    en: 'Student struggles with these topics — pay EXTRA attention:',
  }

  const lines = [headers[lang], introLines[lang]]

  for (const topic of profile.weakTopics) {
    lines.push(weakTopicWarning(topic.title, topic.mastery, lang))
  }

  return { heading: 'Weak Topics', content: lines.join('\n'), order: 4 }
}

function buildMemorySection(
  memory: AIMemory,
  lang: Language,
): PromptSection | null {
  const parts: string[] = []

  const headers: Record<Language, string> = {
    uz: '## AI Xotira',
    ru: '## Память ИИ',
    en: '## AI Memory',
  }

  if (memory.sessionSummary) {
    parts.push(memory.sessionSummary)
  }

  if (memory.weakConcepts.length > 0) {
    const unresolvedConcepts = memory.weakConcepts.filter(c => !c.isResolved)
    if (unresolvedConcepts.length > 0) {
      const titles = unresolvedConcepts.map(c => c.title).join(', ')
      const noteLabel: Record<Language, string> = {
        uz: `Talaba quyidagilarda qiynaldi: ${titles}`,
        ru: `Студент испытывал трудности с: ${titles}`,
        en: `Student struggled with: ${titles}`,
      }
      parts.push(noteLabel[lang])
    }
  }

  if (memory.mistakes.length > 0) {
    const lastMistake = memory.mistakes.at(-1)!
    const mistakeLabel: Record<Language, string> = {
      uz: `Oxirgi xato: "${lastMistake.wrongAnswer}" — "${lastMistake.topicTitle}" mavzusida`,
      ru: `Последняя ошибка: "${lastMistake.wrongAnswer}" по теме "${lastMistake.topicTitle}"`,
      en: `Last mistake: "${lastMistake.wrongAnswer}" on topic "${lastMistake.topicTitle}"`,
    }
    parts.push(mistakeLabel[lang])
  }

  if (parts.length === 0) return null

  return {
    heading: 'AI Memory',
    content: [headers[lang], ...parts].join('\n'),
    order:   5,
  }
}

function buildRecommendationsSection(
  recommendations: readonly Recommendation[],
  lang: Language,
): PromptSection | null {
  const urgent = recommendations.filter(r => r.priority === 'urgent' || r.priority === 'high').slice(0, 2)
  if (urgent.length === 0) return null

  const headers: Record<Language, string> = {
    uz: '## Tavsiyalar',
    ru: '## Рекомендации',
    en: '## Recommendations',
  }

  const lines = [headers[lang]]
  for (const r of urgent) {
    lines.push(`• **${r.title}** — ${r.reason}`)
  }

  return { heading: 'Recommendations', content: lines.join('\n'), order: 6 }
}

function buildTeacherNotesSection(
  profile: StudentIntelligenceProfile,
  lang: Language,
): PromptSection | null {
  if (profile.teacherNotes.length === 0) return null

  const headers: Record<Language, string> = {
    uz: "## O'qituvchi Izohlari",
    ru: '## Заметки Учителя',
    en: '## Teacher Notes',
  }

  const lines = [headers[lang]]
  for (const note of profile.teacherNotes.slice(0, 3)) {
    lines.push(`• ${note.content}`)
  }

  return { heading: 'Teacher Notes', content: lines.join('\n'), order: 7 }
}

function buildModeSection(
  input: PromptBuilderInput,
  lang: Language,
): PromptSection {
  const cfg     = TUTOR_MODE_CONFIGS[input.tutorMode]
  const opening = MODE_OPENINGS[input.tutorMode][lang]

  const headers: Record<Language, string> = {
    uz: `## Joriy Rejim: ${cfg.icon} ${cfg.label[lang]}`,
    ru: `## Текущий Режим: ${cfg.icon} ${cfg.label[lang]}`,
    en: `## Current Mode: ${cfg.icon} ${cfg.label[lang]}`,
  }

  const topicLine = input.currentTopic
    ? `\n${lang === 'uz' ? 'Mavzu' : lang === 'ru' ? 'Тема' : 'Topic'}: **${input.currentTopic}**`
    : ''

  return {
    heading: 'Mode',
    content: [headers[lang], opening + topicLine, '', cfg.systemInstruction].join('\n'),
    order:   8,
  }
}

function buildBehavioralSection(lang: Language): PromptSection {
  const headers: Record<Language, string> = {
    uz: '## Majburiy Qoidalar',
    ru: '## Обязательные Правила',
    en: '## Mandatory Rules',
  }

  const rules = BEHAVIORAL_RULES[lang].map(r => `• ${r}`).join('\n')

  return {
    heading: 'Behavioral Rules',
    content: [headers[lang], rules].join('\n'),
    order:   9,
  }
}

// ─── Public Prompt Builder ────────────────────────────────────────────────────

export const promptBuilder = {

  /**
   * Build a complete, structured system prompt from all available context.
   *
   * @param input - All context needed to build the prompt
   * @returns     - Structured build result with the final system prompt string
   */
  build(input: PromptBuilderInput): PromptBuildResult {
    const lang = input.language

    const sectionsRaw: Array<PromptSection | null> = [
      buildIdentitySection(lang),
      buildStudentSection(input.profile, lang),
      buildAcademicSection(input.profile, lang),
      buildCurrentCourseSection(input.profile, lang),
      buildWeakTopicsSection(input.profile, lang),
      input.memory ? buildMemorySection(input.memory, lang) : null,
      buildRecommendationsSection(input.recommendations, lang),
      buildTeacherNotesSection(input.profile, lang),
      buildModeSection(input, lang),
      buildBehavioralSection(lang),
    ]

    const sections = sectionsRaw
      .filter((s): s is PromptSection => s !== null)
      .sort((a, b) => a.order - b.order)

    const systemPrompt = [
      '# YORDAMCHAI — AI TEACHER SYSTEM PROMPT',
      '---',
      ...sections.map(s => s.content),
      '---',
      this.buildClosingInstruction(input.profile, lang),
    ].join('\n\n')

    return {
      systemPrompt,
      sections,
      tokenEstimate: Math.round(systemPrompt.split(/\s+/).length / 0.75),
      builtAt:       new Date().toISOString(),
    }
  },

  /** Closing instruction personalized to the student */
  buildClosingInstruction(profile: StudentIntelligenceProfile, lang: Language): string {
    const closings: Record<Language, string> = {
      uz: `Esla: Sen ${profile.name}ning shaxsiy o'qituvchisisan. Uning ma'lumotlarini bilasin va shaxsiylashtirilgan yordam ber. Har bir javob uning o'quv darajasiga mos bo'lsin.`,
      ru: `Помни: ты персональный учитель ${profile.name}. Ты знаешь его/её данные — давай персонализированную помощь. Каждый ответ должен соответствовать его/её уровню обучения.`,
      en: `Remember: you are ${profile.name}'s personal teacher. You know their data — give personalized help. Every response should match their learning level.`,
    }
    return closings[lang]
  },

  /**
   * Build a minimal prompt (for when profile is not fully loaded).
   * Fallback for the existing EdgeFunctionProvider.
   */
  buildMinimal(
    studentName: string,
    lang: Language = 'uz',
  ): string {
    return [
      AI_IDENTITY[lang],
      `${lang === 'uz' ? 'O\'quvchi' : lang === 'ru' ? 'Студент' : 'Student'}: ${studentName}`,
      BEHAVIORAL_RULES[lang].slice(0, 3).map(r => `• ${r}`).join('\n'),
    ].join('\n\n')
  },
}

// ─── Convenience function for direct use ──────────────────────────────────────

export function buildSystemPrompt(
  profile: StudentIntelligenceProfile,
  memory: AIMemory | null,
  recommendations: readonly Recommendation[],
  tutorMode: TutorMode = 'conversation',
  currentTopic: string | null = null,
  userMessage = '',
): string {
  const result = promptBuilder.build({
    profile,
    memory,
    recommendations,
    tutorMode,
    currentTopic,
    userMessage,
    language: profile.preferredLanguage,
  })
  return result.systemPrompt
}
