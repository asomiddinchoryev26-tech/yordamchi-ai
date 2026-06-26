/**
 * components/vision/UniversalInput.tsx
 * Sprint 3.2 Phase 2 — Unified text + file input.
 *
 * Features:
 *   • Auto-resize textarea (max 6 lines)
 *   • File attachment with inline preview (camera / gallery / PDF)
 *   • 4 action buttons: Camera, Gallery, PDF, Text
 *   • Gradient send button
 *   • Enter = send, Shift+Enter = new line
 *   • Mobile keyboard-safe via padding-bottom
 *   • Drag-and-drop file onto the input
 */

import {
  useRef, useId, useEffect, useCallback,
  useState, type KeyboardEvent, type ChangeEvent, type DragEvent,
} from 'react'
import { motion } from 'framer-motion'
import { Camera, ImageIcon, FileText, PenLine, Send, X, Loader2, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { validateFile, detectMimeType } from '@/ai-brain/vision/imageProcessor'
import { VISION_ERRORS } from '@/ai-brain/vision/types'
import type { Language } from '@/ai-brain/core/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface UniversalInputProps {
  onSend:      (text: string, file: File | null) => void
  disabled?:   boolean
  language?:   Language
  className?:  string
  /** Show compact layout (for chat bottom bar) */
  compact?:    boolean
}

// ─── Language labels ──────────────────────────────────────────────────────────

const LABELS = {
  uz: {
    placeholder: "Savolingizni yozing yoki rasm/PDF yuklang…",
    send:        'Yuborish',
    camera:      'Kamera',
    gallery:     'Galereya',
    pdf:         'PDF',
    text:        'Matn',
    remove:      'Olib tashlash',
    fileTooLarge: 'Fayl juda katta (max 20 MB)',
    invalidFormat: 'Bu format qo\'llab-quvvatlanmaydi',
  },
  ru: {
    placeholder: "Напишите вопрос или загрузите фото/PDF…",
    send:        'Отправить',
    camera:      'Камера',
    gallery:     'Галерея',
    pdf:         'PDF',
    text:        'Текст',
    remove:      'Удалить',
    fileTooLarge: 'Файл слишком большой (макс. 20 МБ)',
    invalidFormat: 'Неподдерживаемый формат',
  },
  en: {
    placeholder: "Ask anything or upload an image/PDF…",
    send:        'Send',
    camera:      'Camera',
    gallery:     'Gallery',
    pdf:         'PDF',
    text:        'Text',
    remove:      'Remove',
    fileTooLarge: 'File too large (max 20 MB)',
    invalidFormat: 'Unsupported format',
  },
} as const

// ─── Component ────────────────────────────────────────────────────────────────

export function UniversalInput({
  onSend,
  disabled  = false,
  language  = 'uz',
  className,
  compact   = false,
}: UniversalInputProps) {
  const [text,       setText]       = useState('')
  const [file,       setFile]       = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileError,  setFileError]  = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const cameraId     = useId()
  const galleryId    = useId()
  const pdfId        = useId()
  const cameraRef    = useRef<HTMLInputElement>(null)
  const galleryRef   = useRef<HTMLInputElement>(null)
  const pdfRef       = useRef<HTMLInputElement>(null)

  const lbl = LABELS[language] ?? LABELS.uz

  // ── Auto-resize textarea ──────────────────────────────────────────────────

  const resizeTextarea = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 144) + 'px'  // max ~6 lines
  }, [])

  useEffect(() => { resizeTextarea() }, [text, resizeTextarea])

  // ── File handling ─────────────────────────────────────────────────────────

  const applyFile = useCallback((f: File) => {
    setFileError(null)
    const mime = detectMimeType(f)
    if (!mime) { setFileError(lbl.invalidFormat); return }
    const { valid, errorCode } = validateFile(f)
    if (!valid && errorCode) {
      setFileError(VISION_ERRORS[errorCode][language])
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }, [language, lbl.invalidFormat, previewUrl])

  const clearFile = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setFileError(null)
  }, [previewUrl])

  // Cleanup blob URL on unmount
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) applyFile(f)
    e.target.value = ''
  }

  // ── Drag and drop ─────────────────────────────────────────────────────────

  const onDragEnter  = (e: DragEvent) => { e.preventDefault(); if (!disabled) setIsDragging(true) }
  const onDragLeave  = (e: DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const onDragOver   = (e: DragEvent) => { e.preventDefault() }
  const onDrop       = (e: DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    if (disabled) return
    const f = e.dataTransfer.files?.[0]
    if (f) applyFile(f)
  }

  // ── Send ──────────────────────────────────────────────────────────────────

  const canSend = (text.trim().length > 0 || file !== null) && !disabled

  const handleSend = useCallback(() => {
    if (!canSend) return
    onSend(text.trim(), file)
    setText('')
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setFileError(null)
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [canSend, text, file, previewUrl, onSend])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const isPdf = file?.type === 'application/pdf'

  return (
    <div className={cn('w-full', className)}>

      {/* File error */}
      {fileError && (
        <div className="mb-2 text-[12px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-xl border border-red-200/50 dark:border-red-800/30">
          {fileError}
        </div>
      )}

      {/* Main input container */}
      <div
        className={cn(
          'rounded-[20px] border transition-all duration-200 overflow-hidden bg-white dark:bg-gray-900/80',
          isDragging
            ? 'border-brand shadow-[0_0_0_3px_rgba(91,92,246,0.2)]'
            : 'border-gray-200/80 dark:border-white/[0.09] focus-within:border-brand/50 dark:focus-within:border-brand/40 focus-within:shadow-[0_0_0_3px_rgba(91,92,246,0.12)]',
        )}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >

        {/* Attached file preview (above textarea) */}
        {file && previewUrl && (
          <div className="flex items-center gap-2 px-4 pt-3 pb-0">
            <div className="relative flex-shrink-0 group">
              {isPdf ? (
                <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 flex flex-col items-center justify-center">
                  <FileText className="w-5 h-5 text-red-500" aria-hidden="true" />
                  <span className="text-[9px] font-bold text-red-500 mt-0.5">PDF</span>
                </div>
              ) : (
                <img
                  src={previewUrl}
                  alt="Attached"
                  className="w-12 h-12 rounded-xl object-cover border border-gray-200/60 dark:border-white/[0.08]"
                />
              )}
              {/* Remove button */}
              <button
                type="button"
                onClick={clearFile}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-700 dark:bg-gray-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                aria-label={lbl.remove}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11.5px] font-medium text-gray-700 dark:text-gray-300 truncate">{file.name}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
          </div>
        )}

        {/* Textarea */}
        <div className="flex items-end gap-2 px-4 py-3">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={lbl.placeholder}
            rows={1}
            disabled={disabled}
            aria-label={lbl.placeholder}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none outline-none leading-6 max-h-36 disabled:opacity-50"
          />

          {/* Send button */}
          <motion.button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            whileHover={canSend ? { scale: 1.06 } : {}}
            whileTap={canSend ? { scale: 0.94 } : {}}
            transition={{ duration: 0.12 }}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150',
              canSend
                ? 'text-white shadow-md'
                : 'bg-gray-100 dark:bg-white/[0.06] text-gray-300 dark:text-gray-600 cursor-not-allowed',
            )}
            style={canSend ? {
              background: 'linear-gradient(135deg, #5B5CF6 0%, #7C3AED 100%)',
              boxShadow:  '0 4px 12px rgba(91,92,246,0.4)',
            } : {}}
            aria-label={lbl.send}
          >
            {disabled
              ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              : <Send className="w-[15px] h-[15px]" aria-hidden="true" />
            }
          </motion.button>
        </div>

        {/* Action buttons row */}
        {!compact && (
          <div className="flex items-center gap-1 px-4 pb-3">
            {/* Camera */}
            <label
              htmlFor={cameraId}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-semibold cursor-pointer transition-all duration-150',
                'text-gray-500 dark:text-gray-400 hover:text-brand dark:hover:text-brand-light',
                'hover:bg-brand/6 dark:hover:bg-brand/10',
                disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
              )}
            >
              <Camera className="w-3.5 h-3.5" aria-hidden="true" />
              {lbl.camera}
              <input
                ref={cameraRef}
                id={cameraId}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={onInputChange}
                disabled={disabled}
              />
            </label>

            {/* Gallery */}
            <label
              htmlFor={galleryId}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-semibold cursor-pointer transition-all duration-150',
                'text-gray-500 dark:text-gray-400 hover:text-brand dark:hover:text-brand-light',
                'hover:bg-brand/6 dark:hover:bg-brand/10',
                disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
              )}
            >
              <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
              {lbl.gallery}
              <input
                ref={galleryRef}
                id={galleryId}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={onInputChange}
                disabled={disabled}
              />
            </label>

            {/* PDF */}
            <label
              htmlFor={pdfId}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-semibold cursor-pointer transition-all duration-150',
                'text-gray-500 dark:text-gray-400 hover:text-brand dark:hover:text-brand-light',
                'hover:bg-brand/6 dark:hover:bg-brand/10',
                disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
              )}
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              {lbl.pdf}
              <input
                ref={pdfRef}
                id={pdfId}
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={onInputChange}
                disabled={disabled}
              />
            </label>

            {/* Text / focus */}
            <button
              type="button"
              onClick={() => textareaRef.current?.focus()}
              disabled={disabled}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-semibold transition-all duration-150',
                'text-gray-500 dark:text-gray-400 hover:text-brand dark:hover:text-brand-light',
                'hover:bg-brand/6 dark:hover:bg-brand/10',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              <PenLine className="w-3.5 h-3.5" aria-hidden="true" />
              {lbl.text}
            </button>

            {/* Drag hint when no file */}
            {!file && (
              <div className="ml-auto flex items-center gap-1 text-[10px] text-gray-300 dark:text-gray-700 select-none">
                <Paperclip className="w-3 h-3" aria-hidden="true" />
                {language === 'uz' ? 'Sudrab tashlang' : language === 'ru' ? 'Перетащите' : 'Drag & drop'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
