/**
 * types/lms.types.ts
 * AI grading + Freemium limit tizimi uchun tiplar.
 * Bu jadvallar 022_ai_grading_and_limits.sql migratsiyasida yaratiladi
 * (hali generatsiya qilingan database.types.ts ga qo'shilmagan).
 */

export type PlanType = 'free' | 'premium' | 'pro' | 'education'

export type AIFeature =
  | 'ai_chat'
  | 'image_solving'
  | 'pdf_analysis'
  | 'voice'
  | 'assignment_check'

export type UsageWindow = 'day' | 'week'

// ── Jadval qatorlari ──────────────────────────────────────────────────────────

export type AiReviewRow = {
  id:              string
  submission_id:   string
  ai_score:        number | null
  feedback:        string | null
  mistakes:        string[]
  recommendations: string[]
  weak_topics:     string[]
  created_at:      string
}

export type SubscriptionRow = {
  id:         string
  user_id:    string
  plan_type:  PlanType
  status:     'active' | 'expired' | 'cancelled'
  started_at: string
  expires_at: string | null
}

export type AiUsageRow = {
  id:           string
  user_id:      string
  feature_type: AIFeature
  used_count:   number
  limit_count:  number
  reset_date:   string
}

export type OrganizationAiLimitRow = {
  id:              string
  organization_id: string
  monthly_limit:   number
  used_amount:     number
  reset_date:      string
}

// ── Premium plans (027 — plans katalogi) ──────────────────────────────────────

export type PlanKey = 'free' | 'premium' | 'pro' | 'education'

export type PlanRow = {
  key:        PlanKey
  name:       string
  price_uzs:  number
  period:     'month' | 'year' | 'once'
  features:   string[]
  ai_limits:  Record<string, number>
  is_active:  boolean
  sort_order: number
}

// ── Payments (026 + 027 qo'lda to'lov oqimi) ──────────────────────────────────

export type PaymentStatus   = 'pending' | 'success' | 'failed' | 'refunded'
export type PaymentProvider = 'click' | 'payme' | 'card'

export type PaymentRow = {
  id:          string
  user_id:     string
  amount:      number
  currency:    string
  provider:    PaymentProvider | null
  status:      PaymentStatus
  plan_type:   string | null
  receipt_url: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
  metadata:    Record<string, unknown>
  created_at:  string
}
