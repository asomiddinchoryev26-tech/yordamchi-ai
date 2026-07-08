/**
 * services/teacherPremium.service.ts
 * O'qituvchi uchun Premium imkoniyatlarni tekshirish — mavjud subscription/limit
 * tizimiga ulanadi. Video dars yuklash va QR davomat faqat Premium/Education'da.
 */

import { subscriptionService } from './subscription.service'
import type { PlanType } from '@/types/lms.types'

export type PremiumFeature = 'video_upload' | 'qr_attendance'

export const PREMIUM_FEATURE_LABELS: Record<PremiumFeature, string> = {
  video_upload:  'Video dars yuklash',
  qr_attendance: 'QR davomat',
}

export const teacherPremiumService = {
  getPlan: (userId: string): Promise<PlanType> => subscriptionService.getPlan(userId),

  /** Premium/Education rejalarida ochiq; Free'da qulflangan. */
  canUse: async (userId: string): Promise<boolean> => {
    const plan = await subscriptionService.getPlan(userId)
    return plan === 'premium' || plan === 'education'
  },

  canUseVideoUpload:  (userId: string) => teacherPremiumService.canUse(userId),
  canUseQRAttendance: (userId: string) => teacherPremiumService.canUse(userId),
}
