/**
 * ai-brain/tutor/engine.ts
 * AI Tutor Engine — manages teaching modes and generates mode-specific instructions.
 */

import type { TutorMode, TutorModeConfig, TutorSession, TutorStep } from './types'
import type { StudentIntelligenceProfile } from '../intelligence/types'
import type { Language } from '../core/types'

// ─── Mode Configurations ──────────────────────────────────────────────────────

export const TUTOR_MODE_CONFIGS: Record<TutorMode, TutorModeConfig> = {

  explain: {
    mode: 'explain', icon: '📖', maxTurns: 8, checkComprehension: true, guidedOnly: false,
    label: { uz: 'Tushuntirish', ru: 'Объяснение', en: 'Explain' },
    description: {
      uz: 'Mavzuni bosqichma-bosqich tushuntiradi',
      ru: 'Объясняет тему шаг за шагом',
      en: 'Explains the topic step by step',
    },
    systemInstruction: `
You are in EXPLAIN mode. Rules:
1. Start with the simplest possible explanation
2. Use concrete real-world examples
3. Break complex ideas into numbered steps
4. After explaining, ask "Did this make sense? Can I clarify anything?"
5. Never skip steps — assume the student has no prior knowledge
6. Use markdown formatting for clarity
`.trim(),
  },

  practice: {
    mode: 'practice', icon: '✏️', maxTurns: 12, checkComprehension: true, guidedOnly: false,
    label: { uz: 'Amaliyot', ru: 'Практика', en: 'Practice' },
    description: {
      uz: 'Mashq topshiriqlari beradi',
      ru: 'Даёт практические задания',
      en: 'Gives practice exercises',
    },
    systemInstruction: `
You are in PRACTICE mode. Rules:
1. Generate 3-5 practice problems of increasing difficulty
2. After each answer, provide immediate feedback
3. If the answer is wrong, show the correct method step by step
4. Track which problems the student gets right vs wrong
5. Adjust difficulty based on performance
6. End with a summary of what was mastered
`.trim(),
  },

  quiz: {
    mode: 'quiz', icon: '📝', maxTurns: 10, checkComprehension: false, guidedOnly: false,
    label: { uz: 'Test', ru: 'Тест', en: 'Quiz' },
    description: {
      uz: 'Ko\'p tanlovli testlar beradi',
      ru: 'Даёт тесты с несколькими вариантами',
      en: 'Multiple-choice assessment',
    },
    systemInstruction: `
You are in QUIZ mode. Rules:
1. Generate multiple-choice questions (A/B/C/D format)
2. Ask one question at a time
3. After each answer: reveal correct answer + brief explanation
4. Keep score (X/Y correct)
5. At the end: show score + list topics to review
6. Do NOT give hints during the quiz — wait for the answer first
`.trim(),
  },

  hint: {
    mode: 'hint', icon: '💡', maxTurns: 6, checkComprehension: false, guidedOnly: true,
    label: { uz: 'Maslahat', ru: 'Подсказка', en: 'Hint' },
    description: {
      uz: 'To\'liq javob bermay maslahat beradi',
      ru: 'Даёт подсказку без полного ответа',
      en: 'Gives hints without full answers',
    },
    systemInstruction: `
You are in HINT mode. Rules:
1. NEVER give the direct answer
2. Give progressive hints: start very vague, get more specific if asked
3. Each hint should be one small step closer to the answer
4. Ask "Does that help? Want another hint?"
5. Maximum 3 hints per problem, then offer the full solution
`.trim(),
  },

  step_by_step: {
    mode: 'step_by_step', icon: '🪜', maxTurns: 15, checkComprehension: true, guidedOnly: false,
    label: { uz: 'Bosqich-bosqich', ru: 'Шаг за шагом', en: 'Step-by-step' },
    description: {
      uz: 'Har bir qadamni birga o\'tadi',
      ru: 'Проходит каждый шаг вместе',
      en: 'Works through each step together',
    },
    systemInstruction: `
You are in STEP-BY-STEP mode. Rules:
1. Break the problem into numbered micro-steps (Step 1, Step 2...)
2. Present ONE step at a time
3. Wait for student confirmation ("Ready for next step?" / "Does this step make sense?")
4. Only proceed when student confirms understanding
5. If student is stuck on a step, explain that step differently before moving on
6. At the end, summarize all steps together
`.trim(),
  },

  socratic: {
    mode: 'socratic', icon: '🤔', maxTurns: 12, checkComprehension: true, guidedOnly: true,
    label: { uz: 'Sokratik usul', ru: 'Сократический метод', en: 'Socratic Method' },
    description: {
      uz: 'Savollar orqali o\'qitadi',
      ru: 'Обучает через вопросы',
      en: 'Teaches through questions',
    },
    systemInstruction: `
You are in SOCRATIC mode. Rules:
1. NEVER give direct answers — only ask guiding questions
2. Start with "What do you already know about X?"
3. Use each student answer to formulate the next guiding question
4. Questions should progressively lead the student to discover the answer themselves
5. Celebrate when student reaches the right conclusion
6. This mode takes longer — be patient
`.trim(),
  },

  revision: {
    mode: 'revision', icon: '🔄', maxTurns: 10, checkComprehension: true, guidedOnly: false,
    label: { uz: 'Takrorlash', ru: 'Повторение', en: 'Revision' },
    description: {
      uz: 'O\'tilgan mavzularni takrorlaydi',
      ru: 'Повторяет пройденные темы',
      en: 'Reviews previously covered material',
    },
    systemInstruction: `
You are in REVISION mode. Rules:
1. Focus on topics the student has already studied
2. Start with a quick comprehension check: "Tell me what you remember about X"
3. Fill gaps in knowledge with brief explanations
4. Use spaced repetition: go back to forgotten concepts
5. End with a confidence rating request (1-10) for each reviewed topic
6. Prioritize weak topics the student has struggled with before
`.trim(),
  },

  exam: {
    mode: 'exam', icon: '📋', maxTurns: 20, checkComprehension: false, guidedOnly: false,
    label: { uz: 'Imtihon', ru: 'Экзамен', en: 'Exam Simulation' },
    description: {
      uz: 'Imtihon sharoitini modellashtiradi',
      ru: 'Симулирует условия экзамена',
      en: 'Simulates exam conditions',
    },
    systemInstruction: `
You are in EXAM SIMULATION mode. Rules:
1. Simulate real exam conditions: no hints, no help, time pressure
2. Present a full set of exam questions
3. Student completes ALL questions before seeing any answers
4. After submission: detailed scoring + analysis of wrong answers
5. Identify which topics need more work
6. Provide a study plan based on exam performance
`.trim(),
  },

  conversation: {
    mode: 'conversation', icon: '💬', maxTurns: 999, checkComprehension: false, guidedOnly: false,
    label: { uz: 'Suhbat', ru: 'Разговор', en: 'Conversation' },
    description: {
      uz: 'Erkin ta\'limiy suhbat',
      ru: 'Свободный учебный разговор',
      en: 'Free-form educational conversation',
    },
    systemInstruction: `
You are in CONVERSATION mode. Rules:
1. Respond naturally to any question within the educational domain
2. Be encouraging, supportive and patient
3. Gently redirect off-topic questions back to learning
4. Adapt your language complexity to the student's level
5. Occasionally ask "What would you like to learn next?"
`.trim(),
  },
}

// ─── Tutor Engine ─────────────────────────────────────────────────────────────

export const tutorEngine = {

  /** Create a new tutor session */
  createSession(
    mode: TutorMode,
    topic: string,
    profile: StudentIntelligenceProfile,
  ): TutorSession {
    return {
      sessionId:      `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      mode,
      topic,
      studentProfile: profile,
      language:       profile.preferredLanguage,
      history:        [],
      currentTurn:    0,
      isComplete:     false,
      startedAt:      new Date().toISOString(),
    }
  },

  /** Get the system instruction for this session's mode */
  getModeInstruction(session: TutorSession): string {
    return TUTOR_MODE_CONFIGS[session.mode].systemInstruction
  },

  /** Get the mode config */
  getModeConfig(mode: TutorMode): TutorModeConfig {
    return TUTOR_MODE_CONFIGS[mode]
  },

  /** Get all available modes with labels in the given language */
  getAvailableModes(lang: Language): Array<{ mode: TutorMode; label: string; description: string; icon: string }> {
    return Object.values(TUTOR_MODE_CONFIGS).map(cfg => ({
      mode:        cfg.mode,
      label:       cfg.label[lang],
      description: cfg.description[lang],
      icon:        cfg.icon,
    }))
  },

  /**
   * Determine what the AI should do in the next turn.
   * Returns a step instruction to inject into the prompt.
   */
  getNextStep(session: TutorSession): TutorStep {
    const cfg  = TUTOR_MODE_CONFIGS[session.mode]
    const turn = session.currentTurn
    const isLast = turn >= cfg.maxTurns - 1

    return {
      stepIndex:   turn,
      instruction: isLast
        ? `This is the final turn. Wrap up with a summary and next steps.`
        : cfg.checkComprehension && turn > 0 && turn % 3 === 0
          ? `Turn ${turn}: Check if the student understood the last explanation before continuing.`
          : `Turn ${turn}: Continue with ${cfg.mode} mode on topic: "${session.topic}".`,
      isLast,
    }
  },

  /** Detect tutor mode from a user message (simple heuristic) */
  detectModeFromMessage(message: string): TutorMode {
    const m = message.toLowerCase()
    if (/test|quiz|sinov|проверь/.test(m))          return 'quiz'
    if (/mashq|amaliy|практика|practice/.test(m))   return 'practice'
    if (/tushunt|объясни|explain/.test(m))           return 'explain'
    if (/maslahat|подсказ|hint/.test(m))             return 'hint'
    if (/qadam|шаг|step/.test(m))                   return 'step_by_step'
    if (/takrorla|повтор|revise/.test(m))            return 'revision'
    if (/imtihon|экзамен|exam/.test(m))              return 'exam'
    return 'conversation'
  },
}
