/**
 * AvatarUploader — file selection + validation + crop → upload pipeline.
 * Validates format/size before showing AvatarCropper.
 * Calls onUpload with the cropped blob ready for avatarService.upload().
 */

import { useState, useRef } from 'react'
import { Camera, Upload, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AvatarCropper } from './AvatarCropper'
import { UserAvatar } from './UserAvatar'
import type { UserProfile } from '@/types/profile.types'

const VALID_TYPES  = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_BYTES    = 5 * 1024 * 1024
const ACCEPT       = '.jpg,.jpeg,.png,.webp'

interface AvatarUploaderProps {
  profile:        UserProfile
  onUpload:       (blob: Blob) => Promise<void>
  onDelete?:      () => Promise<void>
  isUploading?:   boolean
}

export function AvatarUploader({ profile, onUpload, onDelete, isUploading }: AvatarUploaderProps) {
  const inputRef          = useRef<HTMLInputElement>(null)
  const [preview, setPreview]     = useState<string | null>(null)   // object URL for cropper
  const [cropError, setCropError] = useState<string | null>(null)
  const [showCrop, setShowCrop]   = useState(false)

  function openPicker() {
    if (isUploading) return
    inputRef.current?.click()
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''  // reset so same file can be re-selected

    // Validate
    if (!VALID_TYPES.includes(file.type)) {
      setCropError(`Format qo'llab-quvvatlanmaydi. JPG, PNG yoki WebP yuklang.`)
      return
    }
    if (file.size > MAX_BYTES) {
      setCropError(`Fayl 5 MB dan kichik bo'lishi kerak.`)
      return
    }

    setCropError(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    setShowCrop(true)
  }

  async function handleCrop(blob: Blob) {
    setShowCrop(false)
    if (preview) { URL.revokeObjectURL(preview); setPreview(null) }
    await onUpload(blob)
  }

  function handleCancelCrop() {
    setShowCrop(false)
    if (preview) { URL.revokeObjectURL(preview); setPreview(null) }
  }

  // ── Crop modal ────────────────────────────────────────────────────────────
  if (showCrop && preview) {
    return (
      <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Rasmni kesish</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">Doira ichidagi qism profil rasmingiz bo'ladi</p>
          </div>
          <AvatarCropper imageSrc={preview} onCrop={handleCrop} onCancel={handleCancelCrop} />
        </div>
      </div>
    )
  }

  // ── Upload area ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Current avatar + overlay */}
      <div className="relative group">
        <UserAvatar profile={profile} size="xl" />

        {/* Upload overlay */}
        <button
          type="button"
          onClick={openPicker}
          disabled={isUploading}
          className={cn(
            'absolute inset-0 rounded-3xl flex flex-col items-center justify-center gap-1',
            'bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
            'disabled:cursor-not-allowed',
          )}
        >
          {isUploading
            ? <Loader2 className="w-6 h-6 text-white animate-spin" />
            : <Camera className="w-6 h-6 text-white" />}
          {!isUploading && <span className="text-[10px] text-white font-medium">O'zgartirish</span>}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={openPicker}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-semibold hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors disabled:opacity-50"
        >
          {isUploading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Upload className="w-3.5 h-3.5" />}
          {isUploading ? 'Yuklanmoqda…' : 'Rasm yuklash'}
        </button>

        {profile.avatarUrl && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            O'chirish
          </button>
        )}
      </div>

      <p className="text-[11px] text-gray-400 dark:text-gray-600 text-center leading-relaxed">
        JPG, PNG yoki WebP · Maksimal hajm 5 MB
      </p>

      {/* Error */}
      {cropError && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 px-3 py-2 rounded-xl">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {cropError}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
