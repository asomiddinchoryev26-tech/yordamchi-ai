/**
 * ai-brain/recommendations/rules.ts
 * Rule definitions for the recommendation engine.
 * Each rule is independent and testable.
 * Add new rules here — no changes needed in the engine.
 */

import type { RecommendationRule } from './types'
import { WEAK_TOPIC_THRESHOLD } from '../core/constants'

export const RECOMMENDATION_RULES: readonly RecommendationRule[] = [

  // ── Rule 1: Weak topic revision ────────────────────────────────────────────
  {
    id: 'weak_topic_revision',
    name: 'Weak Topic Revision',
    description: 'Fire when student has topics below mastery threshold',
    condition: (p) => p.weakTopics.length > 0,
    generate: (p) => {
      const topic = p.weakTopics[0]
      return {
        type:        'weak_topic_revision',
        priority:    'urgent',
        title:       `"${topic.title}" ni takrorlang`,
        description: `Bu mavzuda ${topic.mastery}% o'zlashtirish — kuchaytirishingiz kerak`,
        reason:      `Test natijalari ${topic.title} bo'yicha ${topic.mastery}% ko'rsatdi (chegaradan past: ${WEAK_TOPIC_THRESHOLD}%)`,
        relatedTopics:    [topic.title],
        estimatedMin:     20,
        xpReward:         15,
        suggestedPrompt:  `"${topic.title}" mavzusini bosqichma-bosqich tushuntir va menga mashq topshiriqlari ber`,
      }
    },
  },

  // ── Rule 2: Low attendance warning ────────────────────────────────────────
  {
    id: 'attendance_warning',
    name: 'Low Attendance Warning',
    description: 'Fire when attendance drops below 70%',
    condition: (p) => p.attPct !== null && p.attPct < 70,
    generate: (p) => ({
      type:        'attendance_warning',
      priority:    'high',
      title:       `Davomat ${p.attPct}% — diqqat!`,
      description: 'Muntazam qatnashish yakuniy balingizga to\'g\'ridan-to\'g\'ri ta\'sir qiladi',
      reason:      `Davomat ${p.attPct}% (tavsiya: kamida 80%)`,
      relatedTopics:    [],
      estimatedMin:     0,
      xpReward:         0,
      suggestedPrompt:  'Davomatimni qanday yaxshilay olaman? Maslahat ber',
    }),
  },

  // ── Rule 3: Test performance improvement ──────────────────────────────────
  {
    id: 'test_practice',
    name: 'Practice Quiz Needed',
    description: 'Fire when test average is below 65%',
    condition: (p) => p.testsTotal > 0 && p.weeklyAvgPct < 65,
    generate: (p) => ({
      type:        'practice_quiz',
      priority:    'high',
      title:       'Mashq testini yechib ko\'ring',
      description: `O'rtacha natijangiz ${p.weeklyAvgPct}% — amaliyot sizga yordam beradi`,
      reason:      `Test o'rtachasi ${p.weeklyAvgPct}% (maqsad: 70%+)`,
      relatedTopics:    p.weakTopics.map(t => t.title),
      estimatedMin:     15,
      xpReward:         20,
      suggestedPrompt:  p.weakTopics.length > 0
        ? `"${p.weakTopics[0].title}" bo'yicha 5 ta test savoli ber`
        : 'Joriy kursim bo\'yicha test savollari ber',
    }),
  },

  // ── Rule 4: Streak maintenance ────────────────────────────────────────────
  {
    id: 'streak_maintenance',
    name: 'Maintain Daily Streak',
    description: 'Fire to encourage daily engagement',
    condition: (p) => p.streak > 0 && p.streak < 30,
    generate: (p) => ({
      type:        'streak_maintenance',
      priority:    'medium',
      title:       `${p.streak} kunlik streak — davom eting! 🔥`,
      description: 'Bugun ham biror savol bering yoki darsni takrorlang',
      reason:      `${p.streak} kunlik ketma-ket faollik — yo'qotmang`,
      relatedTopics:    [],
      estimatedMin:     5,
      xpReward:         p.streak * 2,
      suggestedPrompt:  null,
    }),
  },

  // ── Rule 5: Next lesson recommendation ───────────────────────────────────
  {
    id: 'next_lesson',
    name: 'Next Lesson Ready',
    description: 'Fire when student is performing well and ready to advance',
    condition: (p) => p.weeklyAvgPct >= 75 && p.testsTotal > 0 && p.weakTopics.length === 0,
    generate: (p) => ({
      type:        'next_lesson',
      priority:    'medium',
      title:       'Keyingi darsga tayor siz',
      description: 'Joriy mavzularni yaxshi o\'zlashtirdingiz',
      reason:      `Barcha mavzularni ${p.weeklyAvgPct}% darajasida o'zlashtirgansiz`,
      relatedTopics:    [],
      estimatedMin:     30,
      xpReward:         25,
      suggestedPrompt:  p.currentCourse
        ? `${p.currentCourse.subjectName ?? p.currentCourse.name} bo'yicha keyingi mavzuni tushuntir`
        : null,
    }),
  },

  // ── Rule 6: First test encouragement ─────────────────────────────────────
  {
    id: 'first_test',
    name: 'First Test Encouragement',
    description: 'Fire for students who have not taken any tests yet',
    condition: (p) => p.testsTotal === 0,
    generate: () => ({
      type:        'practice_quiz',
      priority:    'medium',
      title:       'Birinchi testingizni sinab ko\'ring',
      description: 'Testlar o\'quv darajangizni aniqlab beradi',
      reason:      'Hali hech qanday test topshirilmagan',
      relatedTopics:    [],
      estimatedMin:     10,
      xpReward:         25,
      suggestedPrompt:  'Menga qisqa test bering — bilimimni aniqlaylik',
    }),
  },

  // ── Rule 7: XP level up challenge ─────────────────────────────────────────
  {
    id: 'xp_challenge',
    name: 'XP Level Up Challenge',
    description: 'Fire when student is close to leveling up',
    condition: (p) => p.level.progressPct >= 75,
    generate: (p) => ({
      type:        'xp_challenge',
      priority:    'low',
      title:       `Daraja oshirishga ${p.level.xpToNext} XP qoldi`,
      description: `${p.level.definition.label.uz} dan keyingi darajaga yaqin`,
      reason:      `${p.level.progressPct}% progress — ${p.level.xpToNext} XP kerak`,
      relatedTopics:    [],
      estimatedMin:     20,
      xpReward:         p.level.xpToNext,
      suggestedPrompt:  'Qanday qilib tez XP yig\'a olaman?',
    }),
  },

  // ── Rule 8: No courses enrolled ───────────────────────────────────────────
  {
    id: 'no_courses',
    name: 'No Courses Enrolled',
    description: 'Fire for students with no active courses',
    condition: (p) => p.enrolledCourses.length === 0,
    generate: () => ({
      type:        'next_lesson',
      priority:    'high',
      title:       'Birinchi kursga yoziling',
      description: 'Hali hech qanday kursga yozilmagansiz',
      reason:      'Kurslar yo\'q — o\'qituvchi sizni guruhga qo\'shishi kerak',
      relatedTopics:    [],
      estimatedMin:     0,
      xpReward:         50,
      suggestedPrompt:  'Matematika kursini qanday boshlasam bo\'ladi?',
    }),
  },

  // ── Rule 9: Homework due soon ─────────────────────────────────────────────
  {
    id: 'homework_due',
    name: 'Homework Due Soon',
    description: 'Fire when incomplete homework items exist',
    condition: (p) => p.homeworkSummary.some(h => !h.isCompleted),
    generate: (p) => {
      const pending = p.homeworkSummary.filter(h => !h.isCompleted)
      const first   = pending[0]
      return {
        type:        'homework_due',
        priority:    'high',
        title:       `${pending.length} ta vazifa kutmoqda`,
        description: first ? `Eng yaqin: "${first.title}"` : 'Bajarilmagan vazifalar bor',
        reason:      `${pending.length} ta uy vazifasi bajarilmagan`,
        relatedTopics:    first ? [first.title] : [],
        estimatedMin:     30,
        xpReward:         15,
        suggestedPrompt:  first ? `"${first.title}" vazifasida menga yordam ber` : null,
      }
    },
  },

  // ── Rule 10: Perfect attendance praise ────────────────────────────────────
  {
    id: 'perfect_attendance',
    name: 'Perfect Attendance Praise',
    description: 'Fire when attendance is above 90% to reinforce behavior',
    condition: (p) => p.attPct !== null && p.attPct >= 90,
    generate: (p) => ({
      type:        'mastery_boost',
      priority:    'low',
      title:       `${p.attPct}% davomat — ajoyib! 🌟`,
      description: 'Muntazam qatnashish muvaffaqiyatning asosiy garovidir',
      reason:      `Davomat ${p.attPct}% — barcha darsga qatnashmoqdasiz`,
      relatedTopics:    [],
      estimatedMin:     0,
      xpReward:         10,
      suggestedPrompt:  null,
    }),
  },
]
