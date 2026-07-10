import { useState, useEffect } from 'react'
import { FileText, AlertCircle, Trash2, X, Search, Clock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { testService } from '@/services/test.service'
import type { TestWithDetails } from '@/services/test.service'

export default function AdminTestsPage() {
  const { t } = useLanguage()
  const [tests,      setTests]      = useState<TestWithDetails[]>([])
  const [loading,    setLoading]    = useState(true)
  const [pageError,  setPageError]  = useState<string | null>(null)
  const [search,     setSearch]     = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filterPublished, setFilterPublished] = useState<'all' | 'published' | 'draft'>('all')

  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only load; load() is intentionally unmemoized
  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    setPageError(null)
    try {
      setTests(await testService.getAll())
    } catch {
      setPageError(t.mpLoadErr)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await testService.delete(id)
      setTests(prev => prev.filter(t => t.id !== id))
      setDeletingId(null)
    } catch {
      setPageError(t.aiDeleteErr)
    }
  }

  const filtered = tests.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || t.title.toLowerCase().includes(q)
      || ((t.group as any)?.name ?? '').toLowerCase().includes(q)
    const matchPublish =
      filterPublished === 'all'       ? true :
      filterPublished === 'published' ? t.is_published :
      !t.is_published
    return matchSearch && matchPublish
  })

  const totalPublished = tests.filter(t => t.is_published).length
  const totalDraft     = tests.filter(t => !t.is_published).length

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.tsTitle}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t.atSubtitle}</p>
      </div>

      {pageError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {pageError}
          <button type="button" onClick={() => setPageError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Statistika */}
      {!loading && tests.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-400 font-medium">{t.thTotal}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{tests.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-400 font-medium">{t.alPublished}</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{totalPublished}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-400 font-medium">{t.tcDraft}</p>
            <p className="text-2xl font-bold text-gray-400 mt-1">{totalDraft}</p>
          </div>
        </div>
      )}

      {/* Filtr */}
      {!loading && tests.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.atSearchPh}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'published', 'draft'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterPublished(f)}
                className={cn(
                  'px-3 py-2 text-xs font-semibold rounded-xl border transition-colors',
                  filterPublished === f
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-emerald-300',
                )}
              >
                {f === 'all' ? t.adAll : f === 'published' ? t.tcPublished : t.tcDraft}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 animate-pulse flex gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tests.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-14 text-center">
          <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">{t.atEmpty}</p>
          <p className="text-xs text-gray-400 mt-1">{t.atEmptyHint}</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(test => (
            <div key={test.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                  test.is_published ? 'bg-emerald-600' : 'bg-gray-200',
                )}>
                  <FileText className={cn('w-5 h-5', test.is_published ? 'text-white' : 'text-gray-400')} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{test.title}</h3>
                    <span className={cn(
                      'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                      test.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
                    )}>
                      {test.is_published ? t.tcPublished : t.tcDraft}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                    {test.group && <span>{(test.group as any).name}</span>}
                    {test.subject && (
                      <span style={{ color: (test.subject as any).color }}>
                        {(test.subject as any).icon} {(test.subject as any).name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {test.duration_minutes} {t.tsMinutes}
                    </span>
                    <span>{test.questions.length} {t.tsQuestionWord}</span>
                    {test.results_count > 0 && (
                      <span className="flex items-center gap-1 text-indigo-500 font-medium">
                        <Users className="w-3 h-3" />
                        {test.results_count} {t.atResults}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {deletingId === test.id ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleDelete(test.id)}
                        className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        {t.tcDeleteShort}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        className="px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40 dark:bg-gray-800/50 rounded-lg transition-colors"
                      >
                        {t.fpCancel}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeletingId(test.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title={t.admDisable}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tests.length > 0 && filtered.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.atFilterNotFound}</p>
        </div>
      )}
    </div>
  )
}
