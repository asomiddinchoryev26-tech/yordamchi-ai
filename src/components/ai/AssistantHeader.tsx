/**
 * AssistantHeader — text-only identity block inside AIMessageCard.
 * NO avatar. Avatar is always the outer AsomiddinAvatar in the message layout.
 * Renders: ASOMIDDIN AI + Powered by Gemini 2.5 Flash
 */

import { memo } from 'react'

export const AssistantHeader = memo(function AssistantHeader() {
  return (
    <div
      className="mb-2 pb-2 border-b border-gray-100/80 dark:border-gray-700/50"
    >
      <p className="text-[13px] font-bold leading-tight text-gray-900 dark:text-gray-100 tracking-tight">
        ASOMIDDIN AI
      </p>
      <p
        className="text-[11px] leading-tight mt-[3px] font-medium"
        style={{ color: 'inherit', opacity: 0.55 }}
      >
        Powered by Gemini 2.5 Flash
      </p>
    </div>
  )
})
