import { useState, useEffect } from 'react'
import { BookOpen, AlertCircle, Search, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { lessonService } from '@/services/lesson.service'
import type { LessonWithDetails } from '@/services/lesson.service'

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktyabr','Noyabr','Dekabr']
function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

export default function StudentLessonsPage() {
  const auth = useAuth()

  const [lessons,    setLessons]    = useState<LessonWithDetails[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [search,     setSearch]     = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

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

  // Noyob guruhlar filtri uchun
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
      <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-5 pb-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Darslarim</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {loading ? 'Yuklanmoqda...' : `${lessons.length} ta dars`}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
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
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          {uniqueGroups.length > 1 && (
            <div className="relative">
              <select
                value={groupFilter}
                onChange={e => setGroupFilter(e.target.value)}
                className="appearance-none px-3 py-2.5 pr-8 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
      {!loading && lessons.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Darslar yo'q</p>
          <p className="text-xs text-gray-400 mt-1">O'qituvchi dars qo'shgach bu yerda ko'rinadi</p>
        </div>
      )}

      {/* Filtr natijalari */}
      {!loading && lessons.length > 0 && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-sm text-gray-500">Qidiruv natijalari topilmadi</p>
        </div>
      )}

      {/* Darslar ro'yxati */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((lesson) => {
            const isExpanded = expandedId === lesson.id
            const subj = lesson.subject as any
            const grp  = lesson.group  as any

            return (
              <div
                key={lesson.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : lesson.id)}
                  className="w-full text-left flex items-start gap-4 p-5"
                >
                  {/* Raqam + Subject ikonkasi */}
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
                      <span className="font-semibold text-gray-900">{lesson.title}</span>
                      {!lesson.content && (
                        <span className="text-[11px] text-gray-400 italic">Matn yo'q</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                      {grp  && <span className="text-blue-600 font-medium">{grp.name}</span>}
                      {subj && <span style={{ color: subj.color }}>{subj.name}</span>}
                      {lesson.lesson_date && <span>{fmtDate(lesson.lesson_date)}</span>}
                    </div>
                  </div>

                  <ChevronDown className={cn(
                    'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform mt-1',
                    isExpanded ? 'rotate-180' : ''
                  )} />
                </button>

                {/* Kengaytirilgan: dars matni */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    {lesson.content ? (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {lesson.content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Bu dars uchun matn qo'shilmagan</p>
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
