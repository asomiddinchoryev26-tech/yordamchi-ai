/**
 * components/materials/FilePreviewModal.tsx
 * Lesson Materials Center — professional in-app file preview.
 *
 * Preview (no download): PDF (native viewer), image (zoom/rotate/fullscreen),
 * video/audio (native players), DOCX/PPTX/XLSX (Microsoft Office Online viewer),
 * text (inline). File info + statistics + actions. AI-ready placeholder.
 * Reusable across student & teacher. Strict types, a11y, responsive, skeleton.
 */

import { useState, useEffect, useRef, useCallback, forwardRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  X, Download, Link2, Bot, Pencil, RefreshCw, Trash2,
  ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, Loader2,
  AlertTriangle, Check, Calendar, User as UserIcon, Clock, Eye, FileText,
} from 'lucide-react'
import {
  attachmentService, formatFileSize, fileExtension, previewKind, officeViewerUrl,
  type AttachmentWithMeta, type PreviewKind,
} from '@/services/attachment.service'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

const GLASS = {
  background:           'rgba(11,15,28,0.92)',
  backdropFilter:       'blur(28px) saturate(180%)',
  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
  border:               '1px solid rgba(255,255,255,0.10)',
} as const

const KIND_LABEL: Record<PreviewKind, keyof Translations> = {
  pdf: 'fpPdf', image: 'fpImage', video: 'fpVideo', audio: 'fpAudio',
  office: 'fpDocument', text: 'fpText', other: 'fpFile',
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('uz', {
    timeZone: 'Asia/Tashkent', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d)
}

export interface FilePreviewModalProps {
  attachment:        AttachmentWithMeta
  canManage?:        boolean
  onClose:           () => void
  onChanged?:        () => void                       // stats/rename/required changed → parent refresh
  onReplace?:        (att: AttachmentWithMeta) => void
  onDelete?:         (att: AttachmentWithMeta) => void
}

export function FilePreviewModal({
  attachment, canManage = false, onClose, onChanged, onReplace, onDelete,
}: FilePreviewModalProps) {
  const { t } = useLanguage()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [loadError,  setLoadError]  = useState(false)
  const [zoom,       setZoom]       = useState(1)
  const [rotate,     setRotate]     = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [copied,     setCopied]     = useState(false)
  const [officeFailed, setOfficeFailed] = useState(false)
  const [renaming,   setRenaming]   = useState(false)
  const [nameInput,  setNameInput]  = useState(attachment.file_name)
  const [required,   setRequired]   = useState(attachment.is_required)
  const [busy,       setBusy]       = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const closeRef     = useRef<HTMLButtonElement>(null)

  const kind = previewKind(attachment.mime_type, attachment.file_name)
  const ext  = fileExtension(attachment.file_name)
  const canZoom = kind === 'image' || kind === 'pdf'

  // Preview URL + view stat (once)
  useEffect(() => {
    let alive = true
    setLoading(true); setLoadError(false)
    attachmentService.getPreviewUrl(attachment.file_path)
      .then(url => { if (alive) { setPreviewUrl(url); setLoading(false) } })
      .catch(() => { if (alive) { setLoadError(true); setLoading(false) } })
    void attachmentService.bumpStat(attachment.id, 'view').then(() => onChanged?.())
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment.id, attachment.file_path])

  // Esc to close + focus close button
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Fullscreen API sync
  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void el.requestFullscreen?.()
  }, [])

  const handleDownload = useCallback(async () => {
    setBusy(true)
    try {
      const url = await attachmentService.getSignedUrl(attachment.file_path)
      const a = document.createElement('a')
      a.href = url; a.style.display = 'none'
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      await attachmentService.bumpStat(attachment.id, 'download')
      onChanged?.()
    } catch { /* ignore */ } finally { setBusy(false) }
  }, [attachment.id, attachment.file_path, onChanged])

  const handleCopyLink = useCallback(async () => {
    if (!previewUrl) return
    try {
      await navigator.clipboard.writeText(previewUrl)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }, [previewUrl])

  const handleRename = useCallback(async () => {
    const trimmed = nameInput.trim()
    if (!trimmed || trimmed === attachment.file_name) { setRenaming(false); return }
    setBusy(true)
    try { await attachmentService.rename(attachment.id, trimmed); onChanged?.() }
    catch { /* ignore */ } finally { setBusy(false); setRenaming(false) }
  }, [nameInput, attachment.id, attachment.file_name, onChanged])

  const handleToggleRequired = useCallback(async () => {
    const next = !required
    setRequired(next)
    try { await attachmentService.setRequired(attachment.id, next); onChanged?.() }
    catch { setRequired(!next) }
  }, [required, attachment.id, onChanged])

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      role="dialog" aria-modal="true" aria-label={`${t.fpFilePrefix} ${attachment.file_name}`}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <motion.div
        initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }}
        className="relative w-full h-full sm:h-[88vh] sm:max-w-6xl flex flex-col lg:flex-row overflow-hidden sm:rounded-[22px]"
        style={GLASS}
      >
        {/* ─── Preview area ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col bg-black/30">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-3 sm:px-4 h-14 flex-shrink-0 border-b border-white/8">
            <span className="text-lg" aria-hidden="true">{iconFor(kind)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-white/90 truncate">{attachment.file_name}</p>
              <p className="text-[10.5px] text-white/40">{t[KIND_LABEL[kind]]}{ext ? ` · ${ext}` : ''}</p>
            </div>
            {canZoom && (
              <>
                <ToolbarBtn label={t.fpZoomOut} onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}><ZoomOut className="w-4 h-4" /></ToolbarBtn>
                <span className="text-[11px] text-white/50 tabular-nums w-10 text-center">{Math.round(zoom * 100)}%</span>
                <ToolbarBtn label={t.fpZoomIn} onClick={() => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))}><ZoomIn className="w-4 h-4" /></ToolbarBtn>
              </>
            )}
            {kind === 'image' && (
              <ToolbarBtn label={t.fpRotate} onClick={() => setRotate(r => (r + 90) % 360)}><RotateCw className="w-4 h-4" /></ToolbarBtn>
            )}
            <ToolbarBtn label={fullscreen ? t.fpFsExit : t.fpFsEnter} onClick={toggleFullscreen}>
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </ToolbarBtn>
            <ToolbarBtn label={t.fpClose} onClick={onClose} ref={closeRef}><X className="w-4 h-4" /></ToolbarBtn>
          </div>

          {/* Content */}
          <div ref={containerRef} className="flex-1 min-h-0 relative overflow-auto flex items-center justify-center bg-black/40">
            {loading ? (
              <div className="w-full h-full p-6">
                <div className="w-full h-full rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} aria-hidden="true" />
                <span className="sr-only">{t.notifLoading}</span>
              </div>
            ) : loadError || !previewUrl ? (
              <FallbackCard icon={<AlertTriangle className="w-7 h-7 text-red-400" />} title={t.fpCantPreview} onDownload={handleDownload} />
            ) : (
              <PreviewBody
                kind={kind} url={previewUrl} name={attachment.file_name}
                zoom={zoom} rotate={rotate}
                officeFailed={officeFailed} onOfficeFail={() => setOfficeFailed(true)}
                onDownload={handleDownload}
              />
            )}
          </div>
        </div>

        {/* ─── Info + actions sidebar ───────────────────────────────────── */}
        <aside className="w-full lg:w-[320px] flex-shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-white/8 overflow-y-auto">
          <div className="p-4 sm:p-5 space-y-5">
            {/* Required / optional badge */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={required
                  ? { background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.10)' }}>
                {required ? t.fpRequired : t.fpOptional}
              </span>
              {canManage && (
                <button type="button" onClick={() => void handleToggleRequired()}
                  className="text-[11px] text-white/40 hover:text-white/70 underline decoration-dotted">
                  {required ? t.fpMakeOptional : t.fpMakeRequired}
                </button>
              )}
            </div>

            {/* File info */}
            <section aria-label={t.fpFileInfo} className="space-y-2.5">
              <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-wide">{t.fpInfo}</h3>
              {renaming ? (
                <div className="flex items-center gap-1.5">
                  <input value={nameInput} onChange={e => setNameInput(e.target.value)} autoFocus
                    className="flex-1 px-2.5 py-1.5 rounded-lg text-[12.5px] text-white bg-white/5 border border-white/15 outline-none focus:border-brand" />
                  <button type="button" onClick={() => void handleRename()} disabled={busy}
                    className="p-1.5 rounded-lg text-emerald-300 hover:bg-emerald-500/10" aria-label={t.admSave}>
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button type="button" onClick={() => { setRenaming(false); setNameInput(attachment.file_name) }}
                    className="p-1.5 rounded-lg text-white/40 hover:bg-white/10" aria-label={t.fpCancel}><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <StatRow icon={<FileText className="w-3.5 h-3.5" />} label={t.fpName} value={attachment.file_name} />
              )}
              <StatRow icon={<span className="text-[11px] font-bold">.{ext || '?'}</span>} label={t.fpExtension} value={ext || '—'} />
              <StatRow icon={<span aria-hidden>💾</span>} label={t.fpSize} value={formatFileSize(attachment.file_size) || '—'} />
              <StatRow icon={<Calendar className="w-3.5 h-3.5" />} label={t.fpUploaded} value={fmtDateTime(attachment.created_at)} />
              <StatRow icon={<UserIcon className="w-3.5 h-3.5" />} label={t.fpUploader} value={attachment.uploader_name ?? '—'} />
            </section>

            {/* Statistics */}
            <section aria-label={t.navStats} className="space-y-2.5">
              <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-wide">{t.navStats}</h3>
              <div className="grid grid-cols-2 gap-2">
                <StatChip icon={<Eye className="w-3.5 h-3.5" />} label={t.fpViewed}  value={attachment.view_count} color="#5B7FFF" />
                <StatChip icon={<Download className="w-3.5 h-3.5" />} label={t.fpDownloaded} value={attachment.download_count} color="#22C55E" />
              </div>
              <StatRow icon={<Clock className="w-3.5 h-3.5" />} label={t.fpLastView}  value={fmtDateTime(attachment.last_viewed_at)} />
              <StatRow icon={<Clock className="w-3.5 h-3.5" />} label={t.fpLastDownload} value={fmtDateTime(attachment.last_downloaded_at)} />
            </section>

            {/* Actions */}
            <section aria-label={t.fpActions} className="space-y-2">
              <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-wide">{t.fpActions}</h3>
              <div className="grid grid-cols-2 gap-2">
                <ActionBtn icon={busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} label={t.achDownload} onClick={handleDownload} disabled={busy} primary />
                <ActionBtn icon={copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />} label={copied ? t.fpCopied : t.fpLink} onClick={handleCopyLink} disabled={!previewUrl} />
                {canManage && <>
                  <ActionBtn icon={<Pencil className="w-4 h-4" />} label={t.fpRename} onClick={() => setRenaming(true)} />
                  <ActionBtn icon={<RefreshCw className="w-4 h-4" />} label={t.fpReplace} onClick={() => onReplace?.(attachment)} disabled={!onReplace} />
                  <ActionBtn icon={<Trash2 className="w-4 h-4" />} label={t.admDisable} onClick={() => onDelete?.(attachment)} disabled={!onDelete} danger />
                </>}
              </div>

              {/* AI-ready placeholder (disabled — arxitektura tayyor, AI keyin) */}
              <button type="button" disabled aria-disabled="true" title={t.fpComingSoon}
                className="w-full mt-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12.5px] font-bold cursor-not-allowed opacity-60"
                style={{ background: 'linear-gradient(135deg, rgba(91,127,255,0.18), rgba(124,58,237,0.18))', border: '1px solid rgba(124,58,237,0.28)', color: '#C4B5FD' }}>
                <Bot className="w-4 h-4" aria-hidden="true" />
                {t.fpAskAI}
              </button>
            </section>
          </div>
        </aside>
      </motion.div>
    </motion.div>
  )
}

// ─── Preview body (per kind) ──────────────────────────────────────────────────

function PreviewBody({ kind, url, name, zoom, rotate, officeFailed, onOfficeFail, onDownload }: {
  kind: PreviewKind; url: string; name: string; zoom: number; rotate: number
  officeFailed: boolean; onOfficeFail: () => void; onDownload: () => void
}) {
  const { t } = useLanguage()
  if (kind === 'image') {
    return (
      <img src={url} alt={name} draggable={false}
        className="max-w-full max-h-full object-contain transition-transform duration-150"
        style={{ transform: `scale(${zoom}) rotate(${rotate}deg)` }} />
    )
  }
  if (kind === 'pdf') {
    return (
      <div className="w-full h-full origin-top-left transition-transform duration-150"
        style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%`, height: `${100 / zoom}%` }}>
        <iframe src={url} title={name} className="w-full h-full border-0 bg-white" />
      </div>
    )
  }
  if (kind === 'video') {
    return <video src={url} controls className="max-w-full max-h-full" style={{ outline: 'none' }} />
  }
  if (kind === 'audio') {
    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <span className="text-5xl" aria-hidden="true">🎵</span>
        <p className="text-[13px] text-white/60 max-w-xs truncate">{name}</p>
        <audio src={url} controls className="w-72 max-w-full" />
      </div>
    )
  }
  if (kind === 'text') {
    return <iframe src={url} title={name} className="w-full h-full border-0 bg-white" />
  }
  if (kind === 'office') {
    if (officeFailed) {
      return <FallbackCard icon={<FileText className="w-7 h-7 text-white/40" />} title={t.fpCantPreviewDl} onDownload={onDownload} />
    }
    return <iframe src={officeViewerUrl(url)} title={name} className="w-full h-full border-0 bg-white" onError={onOfficeFail} />
  }
  return <FallbackCard icon={<FileText className="w-7 h-7 text-white/40" />} title={t.fpCantPreviewType} onDownload={onDownload} />
}

function FallbackCard({ icon, title, onDownload }: { icon: ReactNode; title: string; onDownload: () => void }) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center gap-3 text-center p-8">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {icon}
      </div>
      <p className="text-[13px] font-semibold text-white/60">{title}</p>
      <button type="button" onClick={onDownload}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-bold text-white"
        style={{ background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)' }}>
        <Download className="w-4 h-4" /> {t.achDownload}
      </button>
    </div>
  )
}

// ─── Small reusable bits ──────────────────────────────────────────────────────

const ToolbarBtn = forwardRef<HTMLButtonElement, { label: string; onClick: () => void; children: ReactNode }>(
  function ToolbarBtn({ label, onClick, children }, ref) {
    return (
      <button ref={ref} type="button" onClick={onClick} title={label} aria-label={label}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
        {children}
      </button>
    )
  },
)

function StatRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-5 h-5 flex items-center justify-center text-white/35 flex-shrink-0 mt-0.5" aria-hidden="true">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] text-white/35">{label}</p>
        <p className="text-[12.5px] text-white/80 font-medium break-words">{value}</p>
      </div>
    </div>
  )
}

function StatChip({ icon, label, value, color }: { icon: ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ color }} aria-hidden="true">{icon}</span>
      <span className="text-[16px] font-black tabular-nums mt-1" style={{ color }}>{value}</span>
      <span className="text-[9.5px] text-white/40 font-semibold">{label}</span>
    </div>
  )
}

function ActionBtn({ icon, label, onClick, disabled, primary, danger }: {
  icon: ReactNode; label: string; onClick: () => void; disabled?: boolean; primary?: boolean; danger?: boolean
}) {
  const base = 'inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11.5px] font-bold transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50'
  const style = primary
    ? { background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)', color: '#fff' }
    : danger
      ? { background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.22)' }
      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.10)' }
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className={base} style={style}>
      {icon}{label}
    </button>
  )
}

function iconFor(kind: PreviewKind): string {
  switch (kind) {
    case 'pdf':   return '📕'
    case 'image': return '🖼️'
    case 'video': return '🎬'
    case 'audio': return '🎵'
    case 'office':return '📊'
    case 'text':  return '📄'
    default:      return '📎'
  }
}
