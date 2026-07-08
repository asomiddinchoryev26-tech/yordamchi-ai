/**
 * services/assignmentAI.service.ts
 * Topshiriqni HAQIQIY AI bilan tekshirish — mavjud `aiProvider` (Gemini Edge Function)
 * orqali. Yangi AI yaratilmaydi; faqat baholash prompti + natijani ajratib olish.
 *
 * Oqim:
 *   1. subscription.getPlan → reja
 *   2. aiUsage.check('assignment_check') → limit
 *   3. limit yetsa → { limited: true } (chaqiruvchi premium modal ochadi)
 *   4. aiProvider.complete(...) → baholash
 *   5. aiUsage.consume + aiReview.save
 */

import { aiProvider, loadStudentContext } from './ai-provider.service'
import { subscriptionService } from './subscription.service'
import { aiUsageService } from './aiUsage.service'
import { aiReviewService, type AIReviewResult } from './aiReview.service'

export type CheckParams = {
  studentId:   string
  studentName: string
  title:       string
  description: string | null
  maxScore:    number
  answerText:  string
  submissionId?: string        // bo'lsa — natija ai_reviews'ga saqlanadi
}

export type CheckOutcome =
  | { ok: true;  result: AIReviewResult }
  | { ok: false; limited: true;  used: number; limit: number }
  | { ok: false; limited: false; error: string }

function buildPrompt(p: CheckParams): string {
  return [
    'Siz tajribali o\'qituvchi va AI baholovchisiz. Talabaning topshiriq javobini baholang.',
    '',
    `TOPSHIRIQ: ${p.title}`,
    p.description ? `TAVSIF: ${p.description}` : '',
    `MAKSIMAL BALL: ${p.maxScore}`,
    '',
    'TALABA JAVOBI:',
    p.answerText,
    '',
    'Javobni tahlil qiling: to\'g\'rilik, xatolar, tushuntirish sifati, zaif mavzular.',
    'FAQAT quyidagi JSON formatida javob bering (boshqa matnsiz):',
    '{',
    '  "score": <0 dan 100 gacha butun son — foizdagi baho>,',
    '  "feedback": "<2-4 gap o\'zbek tilida umumiy tahlil>",',
    '  "mistakes": ["<xato 1>", "<xato 2>"],',
    '  "recommendations": ["<tavsiya 1>", "<tavsiya 2>"],',
    '  "weak_topics": ["<zaif mavzu>"]',
    '}',
  ].filter(Boolean).join('\n')
}

// AI matnidan JSON ajratib olish (ba'zan ```json ... ``` bilan o'raladi)
function parseResult(raw: string, maxScore: number): AIReviewResult {
  const asArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter(x => typeof x === 'string').map(String) : []

  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const o = JSON.parse(jsonMatch[0]) as Record<string, unknown>
      const rawScore = typeof o.score === 'number' ? o.score : Number(o.score)
      const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore))) : 0
      return {
        score,
        feedback:        typeof o.feedback === 'string' ? o.feedback : raw.slice(0, 400),
        mistakes:        asArr(o.mistakes),
        recommendations: asArr(o.recommendations),
        weakTopics:      asArr((o as Record<string, unknown>).weak_topics),
      }
    } catch {
      /* fall through */
    }
  }
  // Zaxira: JSON topilmasa — matndan foizni izlaymiz
  const pct = raw.match(/(\d{1,3})\s*%/)
  void maxScore
  return {
    score:           pct ? Math.min(100, Number(pct[1])) : 0,
    feedback:        raw.trim().slice(0, 500) || 'AI tahlilni yakunlay olmadi.',
    mistakes:        [],
    recommendations: [],
    weakTopics:      [],
  }
}

export const assignmentAIService = {
  check: async (p: CheckParams): Promise<CheckOutcome> => {
    if (!p.answerText.trim()) {
      return { ok: false, limited: false, error: "Tekshirish uchun avval matnli javob kiriting" }
    }
    const plan = await subscriptionService.getPlan(p.studentId)

    // Limit tekshiruvi
    const gate = await aiUsageService.check(p.studentId, 'assignment_check', plan)
    if (!gate.allowed) {
      return { ok: false, limited: true, used: gate.used, limit: gate.limit }
    }

    try {
      const ctx = await loadStudentContext(p.studentId, p.studentName)
      const raw = await aiProvider.complete(
        [{ role: 'user', content: buildPrompt(p) }],
        ctx,
        { userId: p.studentId, lastUserMessage: p.answerText },
      )
      const result = parseResult(raw, p.maxScore)

      // Ishlatilishni yangilaymiz + natijani saqlaymiz
      await aiUsageService.consume(p.studentId, 'assignment_check', plan)
      if (p.submissionId) await aiReviewService.save(p.submissionId, result)

      return { ok: true, result }
    } catch (e) {
      return { ok: false, limited: false, error: e instanceof Error ? e.message : 'AI tekshirishda xatolik' }
    }
  },
}
