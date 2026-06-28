export { IllustrationImage, IllustrationShimmer } from './IllustrationImage'

/**
 * Illustration paths — all served from /public/illustrations/
 * Drop the PNG files there and they activate automatically.
 */
export const ILLUS = {
  HERO:          '/illustrations/hero-student.png',
  AI_CHAT:       '/illustrations/ai-chat.png',
  LOADING:       '/illustrations/loading.png',
  EMPTY_STATE:   '/illustrations/empty-state.png',
  SUCCESS:       '/illustrations/success.png',
  ACHIEVEMENT:   '/illustrations/achievement.png',
  ERROR:         '/illustrations/error.png',
  LOGIN:         '/illustrations/login.png',
  PREMIUM:       '/illustrations/premium.png',
  ONBOARDING_1:  '/illustrations/onboarding-1.png',
  ONBOARDING_2:  '/illustrations/onboarding-2.png',
  ONBOARDING_3:  '/illustrations/onboarding-3.png',
} as const
