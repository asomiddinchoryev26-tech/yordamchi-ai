/**
 * ThinkingCard — premium AI thinking state.
 * Uses the approved loading illustration when available, avatar fallback.
 */

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { AsomiddinAvatar } from './AsomiddinAvatar'
import { IllustrationImage, ILLUS } from '@/components/illustration'

const SUBTITLES: Record<string, string> = {
  uz: 'AI o\'ylamoqda…',
  ru: 'AI думает…',
  en: 'AI is thinking…',
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
      className="flex items-start gap-2.5"
      style={{
        opacity:    show ? 1 : 0,
        transform:  show ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 280ms cubic-bezier(.22,1,.36,1), transform 280ms cubic-bezier(.22,1,.36,1)',
      }}
    >
      {/* Loading illustration (small) or avatar fallback */}
      <IllustrationImage
        src={ILLUS.LOADING}
        alt="AI o'ylamoqda"
        width={36}
        height={36}
        style={{ borderRadius: '50%', flexShrink: 0 }}
        fallback={<AsomiddinAvatar size="md" showStatus />}
      />

      <div
        className="px-4 py-3.5 rounded-[4px_18px_18px_18px]"
        style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}
      >
        <p className="text-[10.5px] font-bold text-brand-light/70 mb-2 uppercase tracking-widest leading-none">
          ASOMIDDIN AI
        </p>

        {/* Status row */}
        <div className="flex items-center gap-2 mb-3">
          <Loader2 className="w-3.5 h-3.5 text-brand-light/60 animate-spin flex-shrink-0" aria-hidden="true" />
          <span className="text-[13px] text-white/50 font-medium">
            {SUBTITLES[language] ?? SUBTITLES.uz}
          </span>
        </div>

        {/* Animated progress dots */}
        <div className="flex gap-1.5">
          {[0,1,2,3,4].map(i => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{
                background: i <= step
                  ? 'linear-gradient(90deg, #5B7FFF, #7C3AED)'
                  : 'rgba(255,255,255,0.08)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
