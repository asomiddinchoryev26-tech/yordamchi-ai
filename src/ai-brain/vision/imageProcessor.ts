/**
 * ai-brain/vision/imageProcessor.ts
 * Client-side image processing: validation, compression, format conversion.
 * Uses only browser-native APIs (Canvas, FileReader, URL).
 * No external dependencies.
 */

import type { VisionInput, ImageMimeType, VisionErrorCode } from './types'
import {
  SUPPORTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_GEMINI_BASE64_BYTES,
} from './types'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_DIMENSION    = 1920   // px — readable by Gemini, reasonable size
const QUALITY_STEPS    = [0.92, 0.80, 0.65, 0.50, 0.35] as const
const MIN_DIMENSION    = 100    // px — below this is likely garbage
const MIN_PIXEL_COUNT  = 10000  // 100×100 min area

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  errorCode?: VisionErrorCode
}

export function validateFile(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, errorCode: 'file_too_large' }
  }

  const mime = file.type as ImageMimeType
  if (!SUPPORTED_MIME_TYPES.includes(mime)) {
    return { valid: false, errorCode: 'unsupported_format' }
  }

  return { valid: true }
}

// ─── Image loading ────────────────────────────────────────────────────────────

function loadImageElement(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src     = objectUrl
  })
}

function dataUrlToBase64(dataUrl: string): string {
  const comma = dataUrl.indexOf(',')
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
}

function estimateBase64Size(dataUrl: string): number {
  const base64 = dataUrlToBase64(dataUrl)
  return Math.ceil(base64.length * 0.75)
}

// ─── Dimension calculation ────────────────────────────────────────────────────

function scaleDimensions(
  w: number, h: number, maxDim: number,
): { width: number; height: number } {
  if (w <= maxDim && h <= maxDim) return { width: w, height: h }
  const ratio = Math.min(maxDim / w, maxDim / h)
  return {
    width:  Math.max(1, Math.round(w * ratio)),
    height: Math.max(1, Math.round(h * ratio)),
  }
}

// ─── Canvas compression ───────────────────────────────────────────────────────

async function compressImageToDataUrl(
  img: HTMLImageElement,
  targetSizeBytes: number,
): Promise<{ dataUrl: string; compressed: boolean }> {
  const { width, height } = scaleDimensions(
    img.naturalWidth, img.naturalHeight, MAX_DIMENSION,
  )

  const canvas = document.createElement('canvas')
  canvas.width  = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(img, 0, 0, width, height)

  const originalShrunk = width < img.naturalWidth || height < img.naturalHeight

  for (const quality of QUALITY_STEPS) {
    const dataUrl  = canvas.toDataURL('image/jpeg', quality)
    const sizePx   = estimateBase64Size(dataUrl)
    if (sizePx <= targetSizeBytes) {
      return { dataUrl, compressed: originalShrunk || quality < QUALITY_STEPS[0] }
    }
  }

  // Last resort — minimum quality
  const dataUrl = canvas.toDataURL('image/jpeg', 0.30)
  return { dataUrl, compressed: true }
}

// ─── Image quality check ──────────────────────────────────────────────────────

async function checkImageQuality(img: HTMLImageElement): Promise<VisionErrorCode | null> {
  const { naturalWidth: w, naturalHeight: h } = img

  if (w < MIN_DIMENSION || h < MIN_DIMENSION) return 'low_quality'
  if (w * h < MIN_PIXEL_COUNT) return 'low_quality'

  // Basic blur detection via variance on a small sample
  const sampleCanvas = document.createElement('canvas')
  const SAMPLE_SIZE  = Math.min(200, w, h)
  sampleCanvas.width  = SAMPLE_SIZE
  sampleCanvas.height = SAMPLE_SIZE
  const ctx = sampleCanvas.getContext('2d')
  if (!ctx) return null  // skip check if canvas unavailable

  ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
  const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)

  // Compute grayscale variance
  let sum = 0, sumSq = 0
  const n = data.length / 4
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    sum   += gray
    sumSq += gray * gray
  }
  const mean     = sum / n
  const variance = sumSq / n - mean * mean

  if (variance < 80) return 'blurry_image'  // very little contrast → likely blurry

  return null
}

// ─── PDF processing ───────────────────────────────────────────────────────────

async function processPDF(file: File): Promise<VisionInput> {
  const originalSizeBytes = file.size

  // Read PDF as base64 — Gemini accepts PDFs natively
  const arrayBuffer = await file.arrayBuffer()
  const uint8 = new Uint8Array(arrayBuffer)
  let binary  = ''
  for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i])
  const base64  = btoa(binary)
  const dataUrl = `data:application/pdf;base64,${base64}`

  return {
    file,
    mimeType:          'application/pdf',
    sizeBytes:         originalSizeBytes,
    originalSizeBytes,
    dataUrl,
    base64,
    compressed:        false,
  }
}

// ─── Main processor ───────────────────────────────────────────────────────────

/**
 * Full image processing pipeline:
 *   File → validate → load → quality check → compress → VisionInput
 *
 * @throws Error with VisionErrorCode as message on any validation failure.
 */
export async function processImage(file: File): Promise<VisionInput> {
  // 1. Validate
  const validation = validateFile(file)
  if (!validation.valid) throw new Error(validation.errorCode)

  // 2. PDF fast-path
  if (file.type === 'application/pdf') return processPDF(file)

  const originalSizeBytes = file.size
  const objectUrl = URL.createObjectURL(file)

  try {
    // 3. Load image
    const img = await loadImageElement(objectUrl)

    // 4. Quality check
    const qualityError = await checkImageQuality(img)
    if (qualityError) throw new Error(qualityError)

    // 5. Compress
    const { dataUrl, compressed } = await compressImageToDataUrl(img, MAX_GEMINI_BASE64_BYTES)

    return {
      file,
      mimeType:          'image/jpeg',  // canvas always outputs jpeg
      sizeBytes:         estimateBase64Size(dataUrl),
      originalSizeBytes,
      dataUrl,
      base64:            dataUrlToBase64(dataUrl),
      compressed,
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/**
 * Quick preview: create an object URL for display only (no compression needed).
 * Always revoke the returned URL when done.
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * Detect MIME type from file (more reliable than relying on file.type alone).
 */
export function detectMimeType(file: File): ImageMimeType | null {
  const type = file.type.toLowerCase() as ImageMimeType
  return SUPPORTED_MIME_TYPES.includes(type) ? type : null
}
