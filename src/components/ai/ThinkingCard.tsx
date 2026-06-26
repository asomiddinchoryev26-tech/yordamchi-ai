/**
 * ThinkingCard — premium AI thinking state.
 * ONE outer AsomiddinAvatar (md=40px) + text-only AssistantHeader inside card.
 * No duplicate avatar rendering.
 */

import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { AsomiddinAvatar } from './AsomiddinAvatar'
import { AIMessageCard }   from './AIMessageCard'
import { AssistantHeader } from './AssistantHeader'

const SUBTITLES: Record<string, string> = {
  uz: 'Asomiddin AI javob tayyorlamoqda…',
  ru: 'Asomiddin AI готовит ответ…',
  en: 'Asomiddin AI is thinking…',
}

export function ThinkingCard() {
  const { language } = useLanguage()
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = requestAnimationFrame(() => setShow(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 5), 380)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      className="flex items-start"
      style={{
        gap:        '10px',    /* avatar → bubble */
        opacity:    show ? 1 : 0,
        transform:  show ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.98)',
        transition: 'opacity 250ms cubic-bezier(.22,1,.36,1), transform 250ms cubic-bezier(.22,1,.36,1)',
        willChange: 'opacity, transform',
      }}
    >
      {/* ONE avatar — 40px, never repeated inside card */}
      <AsomiddinAvatar size="md" showStatus />

      <div className="flex-1 min-w-0">
        <AIMessageCard>
          {/* Text-only header — no duplicate photo */}
          <AssistantHeader />

          {/* Status */}
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400 flex-shrink-0" />
            <span className="text-[13px] text-gray-600 dark:text-gray-400 font-medium">
              {SUBTITLES[language] ?? SUBTITLES.uz}
            </span>
          </div>

          {/* Animated segmented progress */}
          <div className="flex gap-1.5">
            {[0,1,2,3,4].map(i => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors duration-300',
                  i <= step
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-500'
                    : 'bg-gray-200 dark:bg-gray-700',
                )}
              />
            ))}
          </div>
        </AIMessageCard>
      </div>
    </div>
  )
}
