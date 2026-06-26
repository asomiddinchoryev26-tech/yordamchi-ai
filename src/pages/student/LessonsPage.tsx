import { useState, useEffect } from 'react'
import { BookOpen, AlertCircle, Search, ChevronDown, Download, Loader2, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { lessonService } from '@/services/lesson.service'
import {
  attachmentService,
  formatFileSize,
  getVideoEmbedUrl,
  getMimeIcon,
} from '@/services/attachment.service'
import type { AttachmentRow } from '@/services/attachment.service'
import type { LessonWithDetails } from '@/services/lesson.service'

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktyabr','Noyabr','Dekabr']
function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

export default function StudentLessonsPage() {
  const auth = useAuth()

  const [lessons,     setLessons]     = useState<LessonWithDetails[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [search,      setSearch]      = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [expandedId,  setExpandedId]  = useState<string | null>(null)

  // Attachment state
  const [attachments,       setAttachments]       = useState<Record<string, AttachmentRow[]>>({})
  const [attachmentsLoaded, setAttachmentsLoaded] = useState<Set<string>>(new Set())
  const [downloadingId,     setDownloadingId]     = useState<string | null>(null)

  useEffect(() => {
    if (!auth.user?.id) return
    void load()
  }, [auth.user?.id])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setLessons(await lessonService.getForStudent(auth.user!.id))
    } catch {
      setError("Darslarni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }

  async function handleExpand(lessonId: string) {
    setExpandedId(prev => prev === lessonId ? null : lessonId)
    if (!attachmentsLoaded.has(lessonId)) {
      try {
        const data = await attachmentService.getForLesson(lessonId)
        setAttachments(prev => ({ ...prev, [lessonId]: data }))
        setAttachmentsLoaded(prev => new Set(prev).add(lessonId))
      } catch {
        setAttachments(prev => ({ ...prev, [lessonId]: [] }))
        setAttachmentsLoaded(prev => new Set(prev).add(lessonId))
      }
    }
  }

  async function handleDownload(att: AttachmentRow) {
    setDownloadingId(att.id)
    try {
      const url = await attachmentService.getSignedUrl(att.file_path)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      // Download URL generation failed — silent fail
    } finally {
      setDownloadingId(null)
    }
  }

  const uniqueGroupsMap = new Map<string, string>()
  lessons.forEach(l => {
    const grp = l.group as any
    if (grp?.id) uniqueGroupsMap.set(grp.id as string, (grp.name ?? grp.id) as string)
  })
  const uniqueGroups = Array.from(uniqueGroupsMap.entries()).map(([id, name]) => ({ id, name }))

  const filtered = lessons.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || l.title.toLowerCase().includes(q)
      || (l.content ?? '').toLowerCase().includes(q)
    const matchGroup = groupFilter === 'all' || (l.group as any)?.id === groupFilter
    return matchSearch && matchGroup
  })

  if (loading) return (
    <div className="space-y-4 pb-8">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-5 pb-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Darslarim</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {`${lessons.length} ta dars`}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Qidiruv + filtr */}
      {lessons.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Dars nomi bo'yicha qidirish..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          {uniqueGroups.length > 1 && (
            <div className="relative">
              <select
                value={groupFilter}
                onChange={e => setGroupFilter(e.target.value)}
                className="appearance-none px-3 py-2.5 pr-8 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">Barcha guruhlar</option>
                {uniqueGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>
      )}

      {/* Bo'sh holat */}
      {lessons.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-14 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Darslar yo'q</p>
          <p className="text-xs text-gray-400 mt-1">O'qituvchi dars qo'shgach bu yerda ko'rinadi</p>
        </div>
      )}

      {lessons.length > 0 && filtered.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Qidiruv natijalari topilmadi</p>
        </div>
      )}

      {/* Darslar ro'yxati */}
      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((lesson) => {
            const isExpanded = expandedId === lesson.id
            const subj       = lesson.subject as any
            const grp        = lesson.group  as any
            const embedUrl   = lesson.video_url ? getVideoEmbedUrl(lesson.video_url) : null
            const lessonAtts = attachments[lesson.id] ?? []
            const attLoaded  = attachmentsLoaded.has(lesson.id)
            const hasContent = !!lesson.content || !!embedUrl || !!lesson.video_url

            return (
              <div
                key={lesson.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-sm transition-shadow"
              >
                {/* Header */}
                <button
                  type="button"
                  onClick={() => void handleExpand(lesson.id)}
                  className="w-full text-left flex items-start gap-4 p-5"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={subj
                      ? { backgroundColor: subj.color + '20', border: `2px solid ${subj.color}30` }
                      : { backgroundColor: '#f3f4f6', border: '2px solid #e5e7eb' }
                    }
                  >
                    {subj ? subj.icon : <BookOpen className="w-5 h-5 text-gray-400" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{lesson.title}</span>
                      {!hasContent && (
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 italic">Kontent yo'q</span>
                      )}
                      {embedUrl && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          📹 Video
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                      {grp  && <span className="text-blue-600 dark:text-blue-400 font-medium">{grp.name}</span>}
                      {subj && <span style={{ color: subj.color }}>{subj.name}</span>}
                      {lesson.lesson_date && <span>{fmtDate(lesson.lesson_date)}</span>}
                    </div>
                  </div>

                  <ChevronDown className={cn(
                    'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform mt-1',
                    isExpanded && 'rotate-180',
                  )} />
                </button>

                {/* Kengaytirilgan kontent */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-4 space-y-5">

                    {/* Video player */}
                    {embedUrl && (
                      <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                        <iframe
                          src={embedUrl}
                          title={lesson.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full"
                          style={{ aspectRatio: '16/9', display: 'block' }}
                        />
                      </div>
                    )}

                    {/* Dars matni */}
                    {lesson.content && (
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {lesson.content}
                        </p>
                      </div>
                    )}

                    {/* Biriktirmalar */}
                    {!attLoaded ? (
                      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Materiallar yuklanmoqda...
                      </div>
                    ) : lessonAtts.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5" />
                          Dars materiallari ({lessonAtts.length})
                        </p>
                        <div className="space-y-1.5">
                          {lessonAtts.map(att => (
                            <div
                              key={att.id}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700"
                            >
                              <span className="text-lg flex-shrink-0">{getMimeIcon(att.mime_type)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {att.file_name}
                                </p>
                                {att.file_size && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {formatFileSize(att.file_size)}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                disabled={downloadingId === att.id}
                                onClick={() => void handleDownload(att)}
                                className={cn(
                                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                                  'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
                                  'hover:bg-blue-100 dark:hover:bg-blue-900/40',
                                  'disabled:opacity-50',
                                )}
                              >
                                {downloadingId === att.id
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : <Download className="w-3.5 h-3.5" />
                                }
                                Yuklab olish
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hech narsa yo'q holati */}
                    {!lesson.content && !embedUrl && !lesson.video_url && attLoaded && lessonAtts.length === 0 && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                        Bu dars uchun kontent qo'shilmagan
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
