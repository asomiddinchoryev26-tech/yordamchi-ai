/**
 * AIMessageCard — premium glass container for all AI responses.
 * Single source of truth for AI message visual treatment.
 */

import type { ReactNode } from 'react'

interface AIMessageCardProps {
  children: ReactNode
}

export function AIMessageCard({ children }: AIMessageCardProps) {
  return (
    <div className="relative overflow-hidden bg-white/88 dark:bg-gray-800/55 backdrop-blur-md border border-white/70 dark:border-gray-700/50 rounded-2xl rounded-tl-sm px-5 py-4 shadow-md shadow-violet-500/5 dark:shadow-black/20 w-full">
      {/* Top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-400/30 dark:via-violet-500/20 to-transparent pointer-events-none" />
      {/* Corner glow */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-violet-400/6 rounded-full blur-2xl pointer-events-none" />
      {children}
    </div>
  )
}
