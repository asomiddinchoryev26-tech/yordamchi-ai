/**
 * services/aiReview.service.ts
 * AI baholash natijalarini saqlash / o'qish (`ai_reviews` jadvali, 022 migratsiya).
 */

import { supabase } from '@/lib/supabase'
import type { AiReviewRow } from '@/types/lms.types'

const sb = supabase as unknown as { from: (t: string) => any }

export type AIReviewResult = {
  score:           number      // 0..100
  feedback:        string
  mistakes:        string[]
  recommendations: string[]
  weakTopics:      string[]
}

export const aiReviewService = {
  save: async (submissionId: string, r: AIReviewResult): Promise<AiReviewRow | null> => {
    try {
      const { data } = await sb.from('ai_reviews').insert({
        submission_id:   submissionId,
        ai_score:        r.score,
        feedback:        r.feedback,
        mistakes:        r.mistakes,
        recommendations: r.recommendations,
        weak_topics:     r.weakTopics,
      }).select().single()
      return (data ?? null) as AiReviewRow | null
    } catch {
      return null
    }
  },

  getForSubmission: async (submissionId: string): Promise<AiReviewRow | null> => {
    try {
      const { data } = await sb.from('ai_reviews')
        .select('*')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return (data ?? null) as AiReviewRow | null
    } catch {
      return null
    }
  },
}
