/**
 * StreamingMessage — ChatGPT-style progressive text rendering.
 * Chunks the full response over ~2 seconds. Shows blinking cursor.
 * Calls onComplete when done.
 */

import { useState, useEffect, useRef, memo } from 'react'
import MarkdownContent from '@/components/chat/MarkdownContent'
import { injectAIStyles } from './config'

// Ensure cursor keyframe is present
injectAIStyles()

interface StreamingMessageProps {
  text:       string
  onComplete: () => void
}

export const StreamingMessage = memo(function StreamingMessage({ text, onComplete }: StreamingMessageProps) {
  const [idx,  setIdx]  = useState(0)
  const [done, setDone] = useState(false)
  const cbRef = useRef(onComplete)
  cbRef.current = onComplete

  useEffect(() => {
    if (done || idx >= text.length) return
    const remaining = text.length - idx
    const chunkSize = Math.max(3, Math.ceil(remaining / 45))
    const timer = setTimeout(() => {
      const next = Math.min(idx + chunkSize, text.length)
      setIdx(next)
      if (next >= text.length) { setDone(true); cbRef.current() }
    }, 42)
    return () => clearTimeout(timer)
  }, [idx, text, done])

  return (
    <div className="relative">
      <MarkdownContent text={text.slice(0, idx) || '​'} />
      {!done && (
        <span
          className="inline-block w-[2px] h-[1em] bg-gray-700 dark:bg-gray-300 ml-px align-text-bottom rounded-sm"
          style={{ animation: 'aiCursor 500ms step-end infinite' }}
        />
      )}
    </div>
  )
})
