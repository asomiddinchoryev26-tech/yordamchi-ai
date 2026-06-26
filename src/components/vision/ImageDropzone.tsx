/**
 * components/vision/ImageDropzone.tsx
 * Drag & Drop + Camera + Gallery + PDF upload zone.
 * Handles preview, validation feedback, and mobile camera capture.
 */

import { useState, useRef, useCallback, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ImageIcon, FileText, X, Upload, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { validateFile, createPreviewUrl, detectMimeType } from '@/ai-brain/vision/imageProcessor'
import { VISION_ERRORS } from '@/ai-brain/vision/types'
import type { Language } from '@/ai-brain/core/types'
import type { VisionErrorCode } from '@/ai-brain/vision/types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImageDropzoneProps {
  onFile:     (file: File, previewUrl: string) => void
  disabled?:  boolean
  language?:  Language
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImageDropzone({
  onFile,
  disabled = false,
  language = 'uz',
  className,
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError]           = useState<VisionErrorCode | null>(null)
  const [preview, setPreview]       = useState<string | null>(null)
  const [previewName, setPreviewName] = useState<string>('')

  const fileInputId   = useId()
  const cameraInputId = useId()
  const pdfInputId    = useId()
  const fileRef       = useRef<HTMLInputElement>(null)
  const cameraRef     = useRef<HTMLInputElement>(null)
  const pdfRef        = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    setError(null)

    // Detect and validate mime type
    const mime = detectMimeType(file)
    if (!mime) { setError('unsupported_format'); return }

    const validation = validateFile(file)
    if (!validation.valid && validation.errorCode) {
      setError(validation.errorCode)
      return
    }

    // Create preview and notify parent
    const url = createPreviewUrl(file)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(url)
    setPreviewName(file.name)
    onFile(file, url)
  }, [onFile, preview])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setIsDragging(false)
  }
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setIsDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const clearPreview = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setPreviewName('')
    setError(null)
  }

  const LABELS: Record<Language, { drag: string; or: string; camera: string; gallery: string; pdf: string; maxSize: string }> = {
    uz: { drag: "Rasm yoki PDF ni bu yerga tashlang", or: 'yoki', camera: 'Kamera', gallery: 'Galereya', pdf: 'PDF', maxSize: '20 MB gacha' },
    ru: { drag: "Перетащите изображение или PDF сюда", or: 'или', camera: 'Камера', gallery: 'Галерея', pdf: 'PDF', maxSize: 'до 20 МБ' },
    en: { drag: "Drag and drop an image or PDF here", or: 'or', camera: 'Camera', gallery: 'Gallery', pdf: 'PDF', maxSize: 'up to 20 MB' },
  }
  const lbl = LABELS[language]

  return (
    <div className={cn('flex flex-col gap-3', className)}>

      {/* Dropzone */}
      <motion.div
        className={cn(
          'relative rounded-[24px] border-2 border-dashed transition-all duration-200 overflow-hidden',
          'min-h-[220px] flex flex-col items-center justify-center',
          disabled
            ? 'border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-50'
            : isDragging
              ? 'border-brand bg-brand/5 dark:bg-brand/10 cursor-copy'
              : 'border-gray-200 dark:border-white/10 hover:border-brand/60 dark:hover:border-brand/40 cursor-pointer',
        )}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => !disabled && !preview && fileRef.current?.click()}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        transition={{ duration: 0.15 }}
      >
        <AnimatePresence mode="wait">
          {preview ? (
            // ── Preview state ───────────────────────────────────────────────
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full h-full flex items-center justify-center p-4"
            >
              {previewName.endsWith('.pdf') ? (
                <div className="flex flex-col items-center gap-3">
                  <FileText className="w-16 h-16 text-brand" aria-hidden="true" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center truncate max-w-[200px]">
                    {previewName}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">PDF · Birinchi sahifa</p>
                </div>
              ) : (
                <img
                  src={preview}
                  alt="Uploaded preview"
                  className="max-h-48 max-w-full rounded-xl object-contain shadow-md"
                />
              )}
              {/* Clear button */}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); clearPreview() }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-gray-900/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            // ── Empty state ─────────────────────────────────────────────────
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 p-6 text-center"
            >
              <motion.div
                className="w-14 h-14 rounded-2xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center"
                animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
              >
                <Upload className="w-7 h-7 text-brand" aria-hidden="true" />
              </motion.div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {lbl.drag}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  JPG · PNG · WEBP · PDF · {lbl.maxSize}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file inputs */}
        <input
          ref={fileRef}
          id={fileInputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="sr-only"
          onChange={onInputChange}
          disabled={disabled}
        />
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-[12px] px-3 py-2.5 rounded-xl border border-red-200/60 dark:border-red-800/30"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{VISION_ERRORS[error][language]}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">

        {/* Camera — mobile-first */}
        <label htmlFor={cameraInputId} className={cn(
          'flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border border-gray-100 dark:border-white/[0.07] cursor-pointer transition-all duration-150',
          'bg-white dark:bg-gray-900/80 hover:border-brand/40 dark:hover:border-brand/30 hover:bg-brand/4 dark:hover:bg-brand/8',
          disabled && 'opacity-50 cursor-not-allowed',
        )}>
          <Camera className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">{lbl.camera}</span>
          <input
            ref={cameraRef}
            id={cameraInputId}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={onInputChange}
            disabled={disabled}
          />
        </label>

        {/* Gallery */}
        <label htmlFor={fileInputId + '_gallery'} className={cn(
          'flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border border-gray-100 dark:border-white/[0.07] cursor-pointer transition-all duration-150',
          'bg-white dark:bg-gray-900/80 hover:border-brand/40 dark:hover:border-brand/30 hover:bg-brand/4 dark:hover:bg-brand/8',
          disabled && 'opacity-50 cursor-not-allowed',
        )}>
          <ImageIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">{lbl.gallery}</span>
          <input
            id={fileInputId + '_gallery'}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={onInputChange}
            disabled={disabled}
          />
        </label>

        {/* PDF */}
        <label htmlFor={pdfInputId} className={cn(
          'flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border border-gray-100 dark:border-white/[0.07] cursor-pointer transition-all duration-150',
          'bg-white dark:bg-gray-900/80 hover:border-brand/40 dark:hover:border-brand/30 hover:bg-brand/4 dark:hover:bg-brand/8',
          disabled && 'opacity-50 cursor-not-allowed',
        )}>
          <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">{lbl.pdf}</span>
          <input
            ref={pdfRef}
            id={pdfInputId}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={onInputChange}
            disabled={disabled}
          />
        </label>
      </div>
    </div>
  )
}
