/**
 * ai-brain/intelligence/builder.ts
 * Transforms the existing StudentContext into a rich StudentIntelligenceProfile.
 * All computation is deterministic — same input → same output.
 * Future: pull additional fields from Supabase in Sprint 3.1.
 */

import type { StudentContext } from '@/services/ai-provider.service'
import type { Language } from '../core/types'
import {
  LEVELS, STREAK_THRESHOLDS, XP_WEIGHTS, MASTERY_WEIGHTS, WEAK_TOPIC_THRESHOLD,
  DEFAULT_LEARNING_STYLE,
} from '../core/constants'
import type {
  StudentIntelligenceProfile, CourseEnrollment, TopicMastery,
  StudentLevel, LearningGoal, TeacherNote, HomeworkItem,
} from './types'

// ─── XP Calculation ──────────────────────────────────────────────────────────

function computeXP(ctx: StudentContext): number {
  return Math.max(0, Math.round(
    (ctx.attPct ?? 50) * XP_WEIGHTS.ATTENDANCE_MULTIPLIER +
    ctx.testStats.passed  * XP_WEIGHTS.TEST_PASSED_BONUS +
    ctx.testStats.avgPct  * XP_WEIGHTS.AVG_SCORE_BONUS +
    ctx.groups.length     * XP_WEIGHTS.COURSE_BONUS,
  ))
}

// ─── Level Computation ────────────────────────────────────────────────────────

function computeLevel(xp: number): StudentLevel {
  const definition = LEVELS.find(l => xp >= l.minXP && xp < l.maxXP) ?? LEVELS[LEVELS.length - 1]
  const xpInLevel  = xp - definition.minXP
  const range      = definition.maxXP - definition.minXP
  return {
    definition,
    currentXP:   xp,
    xpInLevel,
    xpToNext:    range - xpInLevel,
    progressPct: Math.round((xpInLevel / range) * 100),
  }
}

// ─── Streak Computation ───────────────────────────────────────────────────────

function computeStreak(attPct: number | null): number {
  if (attPct === null) return 3
  const threshold = STREAK_THRESHOLDS.find(t => attPct >= t.minAtt)
  return threshold?.streak ?? 3
}

// ─── Mastery Score ────────────────────────────────────────────────────────────

function computeMastery(ctx: StudentContext): number {
  const attScore      = ctx.attPct ?? 50
  const testScore     = ctx.testStats.avgPct
  const activityScore = Math.min(ctx.groups.length * 20, 100)
  return Math.round(
    attScore      * MASTERY_WEIGHTS.ATTENDANCE +
    testScore     * MASTERY_WEIGHTS.TEST_SCORE +
    activityScore * MASTERY_WEIGHTS.ACTIVITY,
  )
}

// ─── Weak Topics (mock-derived, real data in Sprint 3.1) ─────────────────────

function deriveWeakTopics(ctx: StudentContext): readonly TopicMastery[] {
  if (ctx.testStats.avgPct >= WEAK_TOPIC_THRESHOLD) return []
  const avg = ctx.testStats.avgPct
  // Deterministic mock generation based on real performance data
  return [
    {
      topicId:    'discriminant',
      title:      'Diskriminant hisoblash',
      mastery:    Math.max(15, avg - 27),
      courseId:   ctx.groups[0]?.name ?? 'unknown',
      assessedAt: new Date().toISOString(),
      isWeak:     true,
    },
    {
      topicId:    'negative_roots',
      title:      'Manfiy ildizlar',
      mastery:    Math.max(25, avg - 16),
      courseId:   ctx.groups[0]?.name ?? 'unknown',
      assessedAt: new Date().toISOString(),
      isWeak:     true,
    },
  ].filter(t => t.mastery < WEAK_TOPIC_THRESHOLD)
}

// ─── Strong Topics (Sprint 3.1 will use real test data) ──────────────────────

function deriveStrongTopics(ctx: StudentContext): readonly TopicMastery[] {
  if (ctx.testStats.avgPct < 75) return []
  return [
    {
      topicId:    'linear_equations',
      title:      'Chiziqli tenglamalar',
      mastery:    Math.min(95, ctx.testStats.avgPct + 12),
      courseId:   ctx.groups[0]?.name ?? 'unknown',
      assessedAt: new Date().toISOString(),
      isWeak:     false,
    },
  ]
}

// ─── Courses ──────────────────────────────────────────────────────────────────

function buildCourses(ctx: StudentContext): readonly CourseEnrollment[] {
  return ctx.groups.map((g, i) => ({
    courseId:    `course_${i}`,
    name:        g.name,
    subjectName: g.subjectName,
    subjectIcon: g.subjectIcon,
    enrolledAt:  new Date().toISOString(),
    status:      'active' as const,
    attPct:      i === 0 ? ctx.attPct : null,
  }))
}

// ─── Goals (derived from profile) ────────────────────────────────────────────

function buildDailyGoal(ctx: StudentContext): LearningGoal {
  const subject = ctx.groups[0]?.subjectName ?? ctx.groups[0]?.name ?? "Dars"
  return {
    id:          'daily_1',
    title:       `${subject} — 1 soat mashg'ulot`,
    description: 'AI bilan birga takrorlash va mashq qilish',
    deadline:    new Date().toISOString().split('T')[0] + 'T23:59:59Z',
    progress:    ctx.testStats.total > 0 ? 40 : 0,
    isComplete:  false,
  }
}

function buildWeeklyGoal(ctx: StudentContext): LearningGoal {
  const done = (ctx.testStats.total >= 2 ? 1 : 0) +
               (ctx.groups.length >= 1 ? 1 : 0) +
               ((ctx.attPct ?? 0) >= 80 ? 1 : 0)
  return {
    id:          'weekly_1',
    title:       'Haftalik missiya',
    description: '5 vazifani bajaring — 100 XP + Nishon',
    deadline:    null,
    progress:    Math.round((done / 5) * 100),
    isComplete:  done >= 5,
  }
}

// ─── Language Detection ───────────────────────────────────────────────────────

function detectPreferredLanguage(name: string): Language {
  const cyrillic = /[а-яёА-ЯЁ]/.test(name)
  if (cyrillic) return 'ru'
  return 'uz'  // default for Uzbekistan
}

// ─── Confidence Trend ────────────────────────────────────────────────────────

function computeConfidenceTrend(ctx: StudentContext) {
  if (ctx.testStats.total === 0) return 'unknown' as const
  if (ctx.testStats.avgPct >= 75) return 'rising' as const
  if (ctx.testStats.avgPct >= 60) return 'stable' as const
  return 'declining' as const
}

// ─── Public Builder ───────────────────────────────────────────────────────────

/** Placeholder arrays — populated from DB in Sprint 3.1 */
const NO_TEACHER_NOTES: readonly TeacherNote[] = []
const NO_HOMEWORK: readonly HomeworkItem[] = []

/**
 * Builds a complete StudentIntelligenceProfile from the minimal StudentContext.
 * All computations are pure and deterministic.
 *
 * @param ctx     - Loaded StudentContext (from loadStudentContext)
 * @param userId  - Auth user ID (for profile identification)
 * @returns       - Complete intelligence profile
 */
export function buildIntelligenceProfile(
  ctx: StudentContext,
  userId: string,
): StudentIntelligenceProfile {
  const xp        = computeXP(ctx)
  const courses   = buildCourses(ctx)
  const weakTopics = deriveWeakTopics(ctx)

  return {
    userId,
    name:              ctx.studentName,
    language:          detectPreferredLanguage(ctx.studentName),
    preferredLanguage: detectPreferredLanguage(ctx.studentName),
    learningStyle:     DEFAULT_LEARNING_STYLE,
    confidenceTrend:   computeConfidenceTrend(ctx),

    enrolledCourses: courses,
    currentCourse:   courses[0] ?? null,

    masteryScore: computeMastery(ctx),
    weeklyAvgPct: ctx.testStats.avgPct,
    testsPassed:  ctx.testStats.passed,
    testsTotal:   ctx.testStats.total,
    attPct:       ctx.attPct,
    attTotal:     ctx.attTotal,
    weakTopics,
    strongTopics: deriveStrongTopics(ctx),

    xp,
    level:  computeLevel(xp),
    streak: computeStreak(ctx.attPct),

    dailyGoal:  buildDailyGoal(ctx),
    weeklyGoal: buildWeeklyGoal(ctx),

    teacherNotes:    NO_TEACHER_NOTES,
    homeworkSummary: NO_HOMEWORK,

    builtAt: new Date().toISOString(),
  }
}
