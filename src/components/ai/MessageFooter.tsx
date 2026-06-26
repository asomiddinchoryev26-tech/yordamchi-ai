/**
 * MessageFooter — completion indicator.
 * Shown ONLY after AI response is fully generated.
 * Fades in after streaming completes.
 */

import { Check } from 'lucide-react'

interface MessageFooterProps {
  visible: boolean
}

export function MessageFooter({ visible }: MessageFooterProps) {
  return (
    <div
      className="flex items-center gap-1.5 mt-2 px-0.5"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 500ms ease 100ms' }}
    >
      <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
      <span className="text-[10px] text-gray-400 dark:text-gray-600 font-medium">Generated successfully</span>
      <span className="text-[10px] text-gray-300 dark:text-gray-700 mx-0.5">·</span>
      <span className="text-[10px] text-gray-400 dark:text-gray-600">Powered by Gemini 2.5 Flash</span>
    </div>
  )
}
