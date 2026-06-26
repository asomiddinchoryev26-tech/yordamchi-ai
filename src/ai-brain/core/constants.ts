/**
 * ai-brain/core/constants.ts
 * Platform-wide constants for the AI Brain.
 * All thresholds and rules live here — change once, affect all modules.
 */

import type { BloomsLevel } from './types'

// ─── XP Level Thresholds ─────────────────────────────────────────────────────

export interface LevelDefinition {
  readonly level:     number
  readonly label:     { uz: string; ru: string; en: string }
  readonly emoji:     string
  readonly minXP:     number
  readonly maxXP:     number
  readonly colorFrom: string   // CSS gradient start
  readonly colorTo:   string   // CSS gradient end
}

export const LEVELS: readonly LevelDefinition[] = [
  {
    level: 1, emoji: '🌱', minXP: 0, maxXP: 150,
    label: { uz: 'Yangi boshlovchi', ru: 'Новичок',       en: 'Beginner'        },
    colorFrom: '#10B981', colorTo: '#059669',
  },
  {
    level: 2, emoji: '📚', minXP: 150, maxXP: 400,
    label: { uz: "O'rganuvchi",      ru: 'Студент',        en: 'Learner'         },
    colorFrom: '#3B82F6', colorTo: '#2563EB',
  },
  {
    level: 3, emoji: '⭐', minXP: 400, maxXP: 750,
    label: { uz: 'Bilimdon',         ru: 'Знающий',        en: 'Knowledgeable'   },
    colorFrom: '#8B5CF6', colorTo: '#7C3AED',
  },
  {
    level: 4, emoji: '🎓', minXP: 750, maxXP: 1200,
    label: { uz: 'Ustoz shogird',    ru: 'Подмастерье',    en: 'Apprentice'      },
    colorFrom: '#F59E0B', colorTo: '#D97706',
  },
  {
    level: 5, emoji: '🏆', minXP: 1200, maxXP: 99999,
    label: { uz: 'Ekspert',          ru: 'Эксперт',        en: 'Expert'          },
    colorFrom: '#EF4444', colorTo: '#DC2626',
  },
] as const

// ─── XP Rewards ──────────────────────────────────────────────────────────────

export const XP_REWARDS = {
  ATTENDANCE_PER_LESSON:   5,
  TEST_PASSED:             25,
  TEST_PERFECT:            50,    // 100%
  LESSON_COMPLETED:        10,
  AI_CONVERSATION:         3,
  DAILY_STREAK_BONUS:      15,
  WEEKLY_MISSION_COMPLETE: 100,
} as const

// ─── XP Computation Weights ──────────────────────────────────────────────────

export const XP_WEIGHTS = {
  ATTENDANCE_MULTIPLIER: 7,   // attPct * 7
  TEST_PASSED_BONUS:     30,  // per passed test
  AVG_SCORE_BONUS:       2,   // avgPct * 2
  COURSE_BONUS:          50,  // per enrolled course
} as const

// ─── Mastery Score Weights ────────────────────────────────────────────────────

export const MASTERY_WEIGHTS = {
  ATTENDANCE: 0.40,
  TEST_SCORE: 0.40,
  ACTIVITY:   0.20,
} as const

// ─── Streak Calculation Thresholds ───────────────────────────────────────────

export const STREAK_THRESHOLDS = [
  { minAtt: 95, streak: 21 },
  { minAtt: 85, streak: 14 },
  { minAtt: 75, streak: 10 },
  { minAtt: 60, streak: 6  },
  { minAtt: 0,  streak: 3  },
] as const

// ─── Weakness Thresholds ──────────────────────────────────────────────────────

/** Below this average score → student is considered to have weak topics */
export const WEAK_TOPIC_THRESHOLD = 65

/** Below this score on a specific topic → topic is "weak" */
export const WEAK_NODE_THRESHOLD = 60

// ─── Bloom's Level Ordering ──────────────────────────────────────────────────

export const BLOOMS_ORDER: readonly BloomsLevel[] = [
  'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create',
] as const

// ─── Default Learning Style ──────────────────────────────────────────────────

export const DEFAULT_LEARNING_STYLE = 'reading' as const
