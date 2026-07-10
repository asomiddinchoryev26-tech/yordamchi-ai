import { useState, useEffect } from 'react'
import {
  Plus, Pencil, Trash2, X, AlertCircle, FileText,
  Eye, EyeOff, ChevronLeft, Users, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { testService } from '@/services/test.service'
import { subjectService } from '@/services/subject.service'
import { supabase } from '@/lib/supabase'
import type { TestWithDetails, TestResultWithStudent, TestQuestion } from '@/services/test.service'
import type { SubjectRow } from '@/services/subject.service'
import { useLanguage } from '@/contexts/LanguageContext'

// ─── Tiplari ──────────────────────────────────────────────────────────────────

type GroupOption = { id: string; name: string }
type View = 'list' | 'form' | 'results'

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const

function newQuestion(): TestQuestion {
  return { id: crypto.randomUUID(), question: '', options: ['', '', '', ''], correct_index: 0 }
}

const EMPTY_FORM = {
  title:            '',
  description:      '',
  group_id:         '',
  subject_id:       '',
  duration_minutes: 30,
  is_published:     false,
  questions:        [] as TestQuestion[],
}

const MONTHS = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek']
function fmtDate(d: string) {
  const dt = new Date(d)
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`
}

// ═════════════════════════════════════════════════════════════════════════════

export default function TeacherTestsPage() {
  const auth = useAuth()
  const { t } = useLanguage()

  const [tests,    setTests]    = useState<TestWithDetails[]>([])
  const [groups,   setGroups]   = useState<GroupOption[]>([])
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  const [view,      setView]      = useState<View>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [formError,   setFormError]   = useState<string | null>(null)

  const [resultsTestId, setResultsTestId] = useState<string | null>(null)
  const [results,       setResults]       = useState<TestResultWithStudent[]>([])
  const [resultsLoading, setResultsLoading] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only load; loadAll() is intentionally unmemoized
  useEffect(() => { void loadAll() }, [])

  async function loadAll() {
    if (!auth.user?.id) return
    setLoading(true)
    setPageError(null)
    try {
      const [testsData, groupsRes, subjectsData] = await Promise.all([
        testService.getByTeacher(auth.user.id),
        supabase.from('groups').select('id, name').eq('teacher_id', auth.user.id).order('name'),
        subjectService.getAll(),
      ])
      setTests(testsData)
      setGroups((groupsRes.data ?? []) as GroupOption[])
      setSubjects(subjectsData)
    } catch {
      setPageError(t.mpLoadErr)
    } finally {
      setLoading(false)
    }
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  function openCreate() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, questions: [newQuestion()] })
    setFormError(null)
    setView('form')
  }

  function openEdit(t: TestWithDetails) {
    setEditingId(t.id)
    setForm({
      title:            t.title,
      description:      t.description ?? '',
      group_id:         t.group_id    ?? '',
      subject_id:       t.subject_id  ?? '',
      duration_minutes: t.duration_minutes,
      is_published:     t.is_published,
      questions:        t.questions.length ? t.questions : [newQuestion()],
    })
    setFormError(null)
    setView('form')
  }

  function addQuestion() {
    setForm(f => ({ ...f, questions: [...f.questions, newQuestion()] }))
  }

  function removeQuestion(id: string) {
    setForm(f => ({ ...f, questions: f.questions.filter(q => q.id !== id) }))
  }

  function updateQuestion(id: string, field: 'question', value: string): void
  function updateQuestion(id: string, field: 'correct_index', value: number): void
  function updateQuestion(id: string, field: 'option', optIdx: number, value: string): void
  function updateQuestion(id: string, field: string, valOrIdx: string | number, optVal?: string) {
    setForm(f => ({
      ...f,
      questions: f.questions.map(q => {
        if (q.id !== id) return q
        if (field === 'question')      return { ...q, question: valOrIdx as string }
        if (field === 'correct_index') return { ...q, correct_index: valOrIdx as 0|1|2|3 }
        if (field === 'option') {
          const opts = [...q.options] as [string,string,string,string]
          opts[valOrIdx as number] = optVal!
          return { ...q, options: opts }
        }
        return q
      }),
    }))
  }

  async function handleSave() {
    if (!auth.user?.id) return
    if (!form.title.trim()) { setFormError(t.ttNameRequired); return }
    if (!form.questions.length) { setFormError(t.ttMinQuestion); return }

    for (const q of form.questions) {
      if (!q.question.trim()) { setFormError(t.ttFillAllQ); return }
      if (q.options.some(o => !o.trim())) { setFormError(t.ttFillAllOpts); return }
    }

    setFormLoading(true)
    setFormError(null)

    try {
      const payload = {
        title:            form.title.trim(),
        description:      form.description.trim() || null,
        group_id:         form.group_id   || null,
        subject_id:       form.subject_id || null,
        created_by:       auth.user.id,
        duration_minutes: form.duration_minutes,
        is_published:     form.is_published,
        questions:        form.questions,
      }

      if (editingId) {
        await testService.update(editingId, payload)
      } else {
        await testService.create(payload)
      }
      await loadAll()
      setView('list')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.tcSaveErr)
    } finally {
      setFormLoading(false)
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

  async function togglePublish(tst: TestWithDetails) {
    try {
      await testService.update(tst.id, { is_published: !tst.is_published })
      setTests(prev => prev.map(x => x.id === tst.id ? { ...x, is_published: !tst.is_published } : x))
    } catch {
      setPageError(t.ttPublishStatusErr)
    }
  }

  async function openResults(testId: string) {
    setResultsTestId(testId)
    setResultsLoading(true)
    setView('results')
    try {
      setResults(await testService.getResults(testId))
    } catch {
      setPageError(t.mpLoadErr)
    } finally {
      setResultsLoading(false)
    }
  }

  // ── NATIJALAR ko'rinishi ──────────────────────────────────────────────────
  if (view === 'results') {
    const test = tests.find(t => t.id === resultsTestId)
    return (
      <div className="space-y-5 pb-8 max-w-3xl">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setView('list')} className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200">
            <ChevronLeft className="w-4 h-4" /> Testlar
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{test?.title}</span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.ttResults}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {test?.title} — {results.length} ta talaba topshirgan
          </p>
        </div>

        {resultsLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-14 text-center">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">{t.ttNoSubmissions}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">{t.tdColStudent}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">{t.ttScore}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">{t.ttPercent}</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">{t.tcDate}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {results.map((r, i) => {
                  const pct = r.total_questions ? Math.round((r.score / r.total_questions) * 100) : 0
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 text-gray-400 font-medium">{i + 1}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{(r.student as any)?.full_name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{(r.student as any)?.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-gray-900 dark:text-gray-100">{r.score}</span>
                        <span className="text-gray-400">/{r.total_questions}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn(
                          'text-xs font-bold px-2 py-0.5 rounded-full',
                          pct >= 80 ? 'bg-emerald-100 text-emerald-700' :
                          pct >= 60 ? 'bg-amber-100 text-amber-700'     :
                          'bg-red-100 text-red-700'
                        )}>
                          {pct}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                        {r.submitted_at ? fmtDate(r.submitted_at) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── FORMA ko'rinishi ──────────────────────────────────────────────────────
  if (view === 'form') {
    return (
      <div className="space-y-5 pb-8 max-w-3xl">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setView('list')} className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200">
            <ChevronLeft className="w-4 h-4" /> Testlar
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {editingId ? t.ttEditTest : t.ttNewTest}
          </span>
        </div>

        {/* Test asosiy ma'lumotlari */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{t.ttTestInfo}</h2>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              {t.ttTestName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder={t.ttTestNamePh}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t.ttDesc}</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder={t.ttDescPh}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t.tfGroup}</label>
              <select
                value={form.group_id}
                onChange={e => setForm(f => ({ ...f, group_id: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">{t.ttNoGroupSel}</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t.tcSubject}</label>
              <select
                value={form.subject_id}
                onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">{t.tcNoSubject}</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t.ttDuration}</label>
              <input
                type="number"
                min={5}
                max={180}
                value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
              className="w-4 h-4 rounded accent-indigo-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">{t.ttPublish}</span>
          </label>
        </div>

        {/* Savollar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {t.ttQuestions} <span className="text-sm font-normal text-gray-400">({form.questions.length} {t.tdCount})</span>
            </h2>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {t.ttAddQuestion}
            </button>
          </div>

          {form.questions.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              <p className="text-sm text-gray-400">{t.ttNoQuestions}</p>
            </div>
          )}

          <div className="space-y-4">
            {form.questions.map((q, idx) => (
              <div key={q.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3 bg-gray-50/50">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-gray-400 mt-2.5 flex-shrink-0 w-5 text-right">
                    {idx + 1}.
                  </span>
                  <textarea
                    value={q.question}
                    onChange={e => updateQuestion(q.id, 'question', e.target.value)}
                    placeholder={t.ttQuestionPh}
                    rows={2}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    disabled={form.questions.length === 1}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={q.correct_index === oi}
                        onChange={() => updateQuestion(q.id, 'correct_index', oi as 0|1|2|3)}
                        className="w-4 h-4 accent-emerald-600 flex-shrink-0"
                      />
                      <span className="text-xs font-bold text-gray-400 w-4">{OPTION_LABELS[oi]})</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => updateQuestion(q.id, 'option', oi, e.target.value)}
                        placeholder={`${t.ttVariant} ${OPTION_LABELS[oi]}`}
                        className={cn(
                          'flex-1 px-2.5 py-1.5 rounded-lg border text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-300 focus:outline-none transition-colors',
                          q.correct_index === oi
                            ? 'border-emerald-300 bg-emerald-50 focus:ring-2 focus:ring-emerald-500/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
                        )}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {formError && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{formError}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={formLoading}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {formLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {editingId ? t.admSave : t.ttCreateTest}
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            disabled={formLoading}
            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/40 dark:bg-gray-800/50 transition-colors"
          >
            {t.fpCancel}
          </button>
        </div>
      </div>
    )
  }

  // ── RO'YXAT ko'rinishi ────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t.tsTitle}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {loading ? t.notifLoading : `${tests.length} ${t.ttCountWord}`}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t.ttNewTest}
        </button>
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
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{t.ttEmpty}</h3>
          <p className="text-sm text-gray-400 mb-5">{t.ttEmptyHint}</p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t.ttNewTest}
          </button>
        </div>
      )}

      {!loading && tests.length > 0 && (
        <div className="space-y-3">
          {tests.map(test => (
            <div key={test.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm',
                  test.is_published ? 'bg-indigo-600' : 'bg-gray-200',
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
                      {test.is_published ? t.ttPublished : t.tcDraft}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                    {test.group   && <span>{(test.group as any).name}</span>}
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
                      <span className="text-indigo-500 font-medium">{test.results_count} ta natija</span>
                    )}
                  </div>

                  {test.description && (
                    <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">{test.description}</p>
                  )}
                </div>

                <div className="flex-shrink-0 flex flex-col gap-1.5 items-end">
                  {deletingId === test.id ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleDelete(test.id)}
                        className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        O'chir
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        className="px-3 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/40 dark:bg-gray-800/50 rounded-lg transition-colors"
                      >
                        Bekor
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => void openResults(test.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title={t.ttResults}
                        >
                          <Users className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePublish(test)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title={test.is_published ? t.ttUnpublish : t.ttPublishAction}
                        >
                          {test.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(test)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title={t.tcEditT}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(test.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title={t.admDisable}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
