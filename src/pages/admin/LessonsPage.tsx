import { useState, useEffect } from 'react'
import { BookOpen, AlertCircle, Search, ChevronDown, Video, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { lessonService } from '@/services/lesson.service'
import { groupService } from '@/services/group.service'
import { attachmentService, getVideoEmbedUrl } from '@/services/attachment.service'
import type { AttachmentRow } from '@/services/attachment.service'
import type { LessonWithDetails } from '@/services/lesson.service'
import type { GroupWithRelations } from '@/services/group.service'
import { useLanguage, type Translations } from '@/contexts/LanguageContext'

const MONTH_KEYS: (keyof Translations)[] = [
  'mJan','mFeb','mMar','mApr','mMay','mJun','mJul','mAug','mSep','mOct','mNov','mDec',
]
function fmtDate(d: string, t: Translations) {
  const dt = new Date(d)
  return `${dt.getDate()} ${t[MONTH_KEYS[dt.getMonth()]].slice(0,3)} ${dt.getFullYear()}`
}

export default function AdminLessonsPage() {
  const { t } = useLanguage()
  const [lessons,  setLessons]  = useState<LessonWithDetails[]>([])
  const [groups,   setGroups]   = useState<GroupWithRelations[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [search,   setSearch]   = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [attachments,       setAttachments]       = useState<Record<string, AttachmentRow[]>>({})
  const [attachmentsLoaded, setAttachmentsLoaded] = useState<Set<string>>(new Set())

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [lessonsData, groupsData] = await Promise.all([
        lessonService.getAll(),
        groupService.getAll(),
      ])
      setLessons(lessonsData)
      setGroups(groupsData)
    } catch {
      setError(t.mpLoadErr)
    } finally {
      setLoading(false)
    }
  }

  const filtered = lessons.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || l.title.toLowerCase().includes(q)
      || ((l.teacher as any)?.full_name ?? '').toLowerCase().includes(q)
    const matchGroup = groupFilter === 'all' || (l.group as any)?.id === groupFilter
    return matchSearch && matchGroup
  })

  const publishedCount = lessons.filter(l => l.is_published).length

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.tdLessons}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t.alSubtitle}</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Statistika */}
      {!loading && lessons.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 font-medium">{t.alTotalLessons}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{lessons.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 font-medium">{t.alPublished}</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{publishedCount}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 font-medium">{t.tcDraft}</p>
            <p className="text-2xl font-bold text-gray-400 mt-1">{lessons.length - publishedCount}</p>
          </div>
        </div>
      )}

      {/* Filtr */}
      {!loading && lessons.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.alSearchPh}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div className="relative">
            <select
              value={groupFilter}
              onChange={e => setGroupFilter(e.target.value)}
              className="appearance-none px-3 py-2.5 pr-8 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">{t.tstAllGroups}</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse flex gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bo'sh */}
      {!loading && lessons.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">{t.alEmpty}</p>
          <p className="text-xs text-gray-400 mt-1">{t.alEmptyHint}</p>
        </div>
      )}

      {/* Ro'yxat */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map(lesson => {
            const subj    = lesson.subject  as any
            const grp     = lesson.group    as any
            const teacher = lesson.teacher  as any
            const isExp   = expandedId === lesson.id
            const embedUrl = lesson.video_url ? getVideoEmbedUrl(lesson.video_url) : null
            const lessonAtts = attachments[lesson.id] ?? []
            const attLoaded  = attachmentsLoaded.has(lesson.id)

            return (
              <div key={lesson.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <button
                  type="button"
                  onClick={async () => {
                    setExpandedId(isExp ? null : lesson.id)
                    if (!isExp && !attachmentsLoaded.has(lesson.id)) {
                      try {
                        const data = await attachmentService.getForLesson(lesson.id)
                        setAttachments(prev => ({ ...prev, [lesson.id]: data }))
                        setAttachmentsLoaded(prev => new Set(prev).add(lesson.id))
                      } catch { /* non-critical */ }
                    }
                  }}
                  className="w-full text-left flex items-start gap-4 p-4"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={subj
                      ? { backgroundColor: subj.color + '20', border: `2px solid ${subj.color}30` }
                      : { backgroundColor: '#f3f4f6', border: '2px solid #e5e7eb' }
                    }
                  >
                    {subj ? subj.icon : <BookOpen className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{lesson.title}</span>
                      <span className={cn(
                        'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                        lesson.is_published
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      )}>
                        {lesson.is_published ? t.tcPublished : t.tcDraft}
                      </span>
                      {embedUrl && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-0.5">
                          <Video className="w-3 h-3" /> Video
                        </span>
                      )}
                      {attLoaded && lessonAtts.length > 0 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-0.5">
                          <Paperclip className="w-3 h-3" /> {lessonAtts.length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                      {grp && <span className="font-medium text-gray-600 dark:text-gray-300">{grp.name}</span>}
                      {teacher && <span>{teacher.full_name ?? t.tdTeacher}</span>}
                      {subj && <span style={{ color: subj.color }}>{subj.name}</span>}
                      {lesson.lesson_date && <span>{fmtDate(lesson.lesson_date, t)}</span>}
                    </div>
                  </div>
                  <ChevronDown className={cn('w-4 h-4 text-gray-400 flex-shrink-0 transition-transform', isExp && 'rotate-180')} />
                </button>
                {isExp && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 space-y-4">
                    {lesson.content && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {lesson.content}
                      </p>
                    )}
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
                    {!lesson.content && !embedUrl && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t.alNoContent}</p>
                    )}
                    {attLoaded && lessonAtts.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5" /> {t.tcAttachments} ({lessonAtts.length})
                        </p>
                        <div className="space-y-1">
                          {lessonAtts.map(att => (
                            <div key={att.id} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <span>{att.file_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
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
