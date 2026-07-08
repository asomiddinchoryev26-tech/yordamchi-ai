/**
 * AvatarCropper — canvas-based circular image crop.
 * Drag to reposition, scroll/pinch to zoom.
 * Outputs a 256×256 JPEG blob, ready for upload.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

const OUT_SIZE = 256   // output canvas size

interface AvatarCropperProps {
  imageSrc: string          // object URL from file input
  onCrop:   (blob: Blob) => void
  onCancel: () => void
}

export function AvatarCropper({ imageSrc, onCrop, onCancel }: AvatarCropperProps) {
  const { t }        = useLanguage()
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef       = useRef(new Image())

  const [scale,    setScale]    = useState(1)
  const [offset,   setOffset]   = useState({ x: 0, y: 0 })
  const [imgReady, setImgReady] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragOrigin = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })

  // Load image and set initial scale to fill the crop area
  useEffect(() => {
    const img = imgRef.current
    img.onload = () => {
      const minScale = Math.max(OUT_SIZE / img.width, OUT_SIZE / img.height)
      setScale(minScale)
      setOffset({ x: 0, y: 0 })
      setImgReady(true)
    }
    img.src = imageSrc
    return () => { img.onload = null }
  }, [imageSrc])

  // Redraw whenever scale/offset change
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imgReady) return
    const ctx = canvas.getContext('2d')!
    const img = imgRef.current

    ctx.clearRect(0, 0, OUT_SIZE, OUT_SIZE)

    // Draw image centered with current offset/scale
    const w  = img.width  * scale
    const h  = img.height * scale
    const dx = offset.x + (OUT_SIZE - w) / 2
    const dy = offset.y + (OUT_SIZE - h) / 2
    ctx.drawImage(img, dx, dy, w, h)

    // Circular clip overlay (darkens outside circle)
    ctx.save()
    ctx.globalCompositeOperation = 'destination-in'
    ctx.beginPath()
    ctx.arc(OUT_SIZE / 2, OUT_SIZE / 2, OUT_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }, [imgReady, scale, offset])

  useEffect(() => { draw() }, [draw])

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const startDrag = (mx: number, my: number) => {
    setDragging(true)
    dragOrigin.current = { mx, my, ox: offset.x, oy: offset.y }
  }
  const moveDrag = (mx: number, my: number) => {
    if (!dragging) return
    const { mx: ox, my: oy, ox: startX, oy: startY } = dragOrigin.current
    const img = imgRef.current
    const maxX = Math.max(0, (img.width  * scale - OUT_SIZE) / 2)
    const maxY = Math.max(0, (img.height * scale - OUT_SIZE) / 2)
    setOffset({
      x: Math.min(maxX, Math.max(-maxX, startX + mx - ox)),
      y: Math.min(maxY, Math.max(-maxY, startY + my - oy)),
    })
  }
  const endDrag = () => setDragging(false)

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const zoom = useCallback((delta: number) => {
    const img = imgRef.current
    if (!img.complete) return
    const minScale = Math.max(OUT_SIZE / img.width, OUT_SIZE / img.height)
    setScale(s => Math.min(4, Math.max(minScale, s + delta)))
  }, [])

  const resetCrop = () => {
    const img = imgRef.current
    if (!img.complete) return
    const minScale = Math.max(OUT_SIZE / img.width, OUT_SIZE / img.height)
    setScale(minScale)
    setOffset({ x: 0, y: 0 })
  }

  // ── Export ────────────────────────────────────────────────────────────────
  const handleCrop = () => {
    const canvas = canvasRef.current!
    canvas.toBlob(blob => { if (blob) onCrop(blob) }, 'image/jpeg', 0.92)
  }

  return (
    <div className="flex flex-col items-center gap-5 p-4">
      {/* Crop area */}
      <div
        ref={containerRef}
        className={cn(
          'relative select-none overflow-hidden rounded-full',
          'ring-4 ring-violet-400/40 shadow-2xl shadow-violet-500/20',
          dragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
        style={{ width: OUT_SIZE, height: OUT_SIZE }}
        onMouseDown={e => startDrag(e.clientX, e.clientY)}
        onMouseMove={e => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={e => { const t = e.touches[0]!; startDrag(t.clientX, t.clientY) }}
        onTouchMove={e  => { const t = e.touches[0]!; moveDrag(t.clientX, t.clientY) }}
        onTouchEnd={endDrag}
        onWheel={e => { e.preventDefault(); zoom(e.deltaY < 0 ? 0.05 : -0.05) }}
      >
        <canvas
          ref={canvasRef}
          width={OUT_SIZE}
          height={OUT_SIZE}
          className="block"
        />
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => zoom(-0.1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Zoom slider */}
        <input
          type="range"
          min={0.5}
          max={4}
          step={0.01}
          value={scale}
          onChange={e => setScale(parseFloat(e.target.value))}
          className="w-32 accent-violet-600"
        />

        <button
          type="button"
          onClick={() => zoom(0.1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={resetCrop}
          title={t.avReset}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 w-full">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
          {t.avCancel}
        </button>
        <button
          type="button"
          onClick={handleCrop}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white text-sm font-semibold shadow-md shadow-violet-500/25 transition-all active:scale-95"
        >
          <Check className="w-4 h-4" />
          {t.avConfirm}
        </button>
      </div>

      <p className="text-[11px] text-gray-400 dark:text-gray-600 text-center">
        {t.avCropHint}
      </p>
    </div>
  )
}
