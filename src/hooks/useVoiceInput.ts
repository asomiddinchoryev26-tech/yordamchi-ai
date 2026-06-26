/**
 * hooks/useVoiceInput.ts
 * Web Speech API voice-to-text hook — production-ready.
 *
 * Browser support: Chrome ✓  Edge ✓  Safari 14+ ✓  iOS 14+ ✓  Firefox ✗
 * Requires HTTPS (or localhost).
 *
 * Usage:
 *   const { isListening, isSupported, error, toggle } = useVoiceInput({
 *     language: 'uz',
 *     onResult: (text) => setInput(prev => (prev + ' ' + text).trim()),
 *   })
 */

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Vendor-prefixed shim ─────────────────────────────────────────────────────
// SpeechRecognition may not be in the project's TS lib config

interface IRecognitionEvent { resultIndex: number; results: IResultList }
interface IResultList { length: number; [i: number]: IResult }
interface IResult { isFinal: boolean; [i: number]: { transcript: string } }
interface IErrorEvent { error: string }

interface IRecognition {
  lang:             string
  continuous:       boolean
  interimResults:   boolean
  maxAlternatives:  number
  onstart:   (() => void) | null
  onresult:  ((e: IRecognitionEvent) => void) | null
  onerror:   ((e: IErrorEvent) => void) | null
  onend:     (() => void) | null
  start():   void
  stop():    void
  abort():   void
}

type RecognitionCtor = new () => IRecognition

function getRecognition(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  return (w['SpeechRecognition'] ?? w['webkitSpeechRecognition'] ?? null) as RecognitionCtor | null
}

// ─── Language mapping ─────────────────────────────────────────────────────────

const LANG_MAP: Record<string, string> = {
  uz: 'uz-UZ',
  ru: 'ru-RU',
  en: 'en-US',
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseVoiceInputOptions {
  language:   string
  onResult:   (transcript: string) => void
  onInterim?: (partial: string) => void
}

export interface VoiceInputState {
  isListening: boolean
  isSupported: boolean
  interim:     string
  error:       string | null
  toggle:      () => void
  stop:        () => void
}

export function useVoiceInput({
  language,
  onResult,
  onInterim,
}: UseVoiceInputOptions): VoiceInputState {
  const [isListening, setIsListening] = useState(false)
  const [interim,     setInterim]     = useState('')
  const [error,       setError]       = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  const recRef      = useRef<IRecognition | null>(null)
  const onResultRef = useRef(onResult)
  const onInterimRef = useRef(onInterim)
  onResultRef.current  = onResult
  onInterimRef.current = onInterim

  useEffect(() => { setIsSupported(getRecognition() !== null) }, [])

  const stop = useCallback(() => {
    try { recRef.current?.stop() } catch { /* ignore */ }
    recRef.current = null
    setIsListening(false)
    setInterim('')
  }, [])

  const start = useCallback(() => {
    const Ctor = getRecognition()
    if (!Ctor) {
      setError('Bu brauzer ovozli kirishni qo\'llab-quvvatlamaydi. Chrome yoki Safari ishlatib ko\'ring.')
      return
    }

    setError(null)
    setInterim('')

    const rec = new Ctor()
    recRef.current = rec

    rec.lang           = LANG_MAP[language] ?? 'uz-UZ'
    rec.continuous     = false
    rec.interimResults = true
    rec.maxAlternatives = 1

    rec.onstart = () => setIsListening(true)

    rec.onresult = (event: IRecognitionEvent) => {
      let interimText = ''
      let finalText   = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) finalText   += result[0].transcript
        else                interimText += result[0].transcript
      }

      if (interimText) {
        setInterim(interimText)
        onInterimRef.current?.(interimText)
      }
      if (finalText) {
        setInterim('')
        onResultRef.current(finalText.trim())
      }
    }

    rec.onerror = (event: IErrorEvent) => {
      setIsListening(false)
      setInterim('')
      recRef.current = null
      switch (event.error) {
        case 'not-allowed':
          setError('Mikrofon ruxsati rad etildi. Brauzer sozlamalarida ruxsat bering.')
          break
        case 'no-speech':
          setError(null)  // user just didn't speak
          break
        case 'network':
          setError('Tarmoq xatosi. Internetni tekshiring.')
          break
        case 'audio-capture':
          setError('Mikrofon topilmadi yoki boshqa dastur tomonidan ishlatilmoqda.')
          break
        default:
          setError(`Ovoz tanishda xatolik: ${event.error}`)
      }
    }

    rec.onend = () => {
      setIsListening(false)
      setInterim('')
      recRef.current = null
    }

    try {
      rec.start()
    } catch {
      setError('Mikrofon ishga tushirishda xatolik yuz berdi.')
      setIsListening(false)
      recRef.current = null
    }
  }, [language])

  const toggle = useCallback(() => {
    if (isListening) stop(); else start()
  }, [isListening, start, stop])

  // Cleanup
  useEffect(() => () => {
    try { recRef.current?.abort() } catch { /* ignore */ }
  }, [])

  return { isListening, isSupported, interim, error, toggle, stop }
}
