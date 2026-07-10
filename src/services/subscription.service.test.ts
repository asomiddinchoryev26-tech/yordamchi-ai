import { describe, it, expect } from 'vitest'
import { PLAN_LIMITS, subscriptionService } from '@/services/subscription.service'
import type { PlanType, AIFeature } from '@/types/lms.types'

const PLANS: PlanType[] = ['free', 'premium', 'pro', 'education']
const FEATURES: AIFeature[] = ['ai_chat', 'image_solving', 'pdf_analysis', 'voice', 'assignment_check']

describe('PLAN_LIMITS', () => {
  it('defines every feature for every plan', () => {
    for (const plan of PLANS) {
      for (const feature of FEATURES) {
        const entry = PLAN_LIMITS[plan][feature]
        expect(entry, `${plan}.${feature}`).toBeDefined()
        expect(entry.limit).toBeGreaterThan(0)
        expect(['day', 'week']).toContain(entry.window)
      }
    }
  })

  it('gives premium and pro strictly higher limits than free', () => {
    for (const feature of FEATURES) {
      expect(PLAN_LIMITS.premium[feature].limit).toBeGreaterThan(PLAN_LIMITS.free[feature].limit)
      expect(PLAN_LIMITS.pro[feature].limit).toBeGreaterThanOrEqual(PLAN_LIMITS.premium[feature].limit)
    }
  })
})

describe('subscriptionService.limitsFor', () => {
  it('returns the limit table for the given plan', () => {
    expect(subscriptionService.limitsFor('free')).toBe(PLAN_LIMITS.free)
    expect(subscriptionService.limitsFor('pro').ai_chat.limit).toBe(1000)
  })
})
