import { useState, useEffect } from 'react'
import {
  FileText, Clock, AlertCircle, CheckCircle,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { testService } from '@/services/test.service'
import type { TestForStudent, TestQuestion, TestResultRow } from '@/services/test.service'

// ─── Ko'rinish holati ─────────────────────────────────────────────────────────

type View = 'list' | 'taking' | 'done'

export default function StudentTestsPage() {
  const auth = useAuth()

  const [tests,   setTests]   = useState<TestForStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  // Test olish holati
  const [view,        setView]        = useState<View>('list')
  const [activeTest,  setActiveTest]  = useState<TestForStudent | null>(null)
  const [answers,     setAnswers]     = useState<Record<string, number>>({})
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [finalResult, setFinalResult] = useState<TestResultRow | null>(null)

  useEffect(() => {
    if (!auth.user?.id) return
    void load()
  }, [auth.user?.id])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setTests(await testService.getForStudent(auth.user!.id))
    } catch {
      setError("Testlarni yuklashda xatolik")
    } finally {
      setLoading(false)
    }
  }

  function startTest(test: TestForStudent) {
    setActiveTest(test)
    setAnswers({})
    setSubmitError(null)
    setView('taking')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function selectAnswer(questionId: string, optionIndex: number) {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
  }

  async function handleSubmit() {
    if (!activeTest || !auth.user?.id) return

    const unanswered = activeTest.questions.filter(q => answers[q.id] === undefined)
    if (unanswered.length > 0) {
      setSubmitError(`${unanswered.length} ta savolga javob berilmagan`)
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await testService.submitResult(
        activeTest.id,
        auth.user.id,
        answers,
        activeTest.questions,
      )
      setFinalResult(result)
      setView('done')
      // Ro'yxatni yangilash
      setTests(prev => prev.map(t =>
        t.id === activeTest.id ? { ...t, result } : t
      ))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Xatolik yuz berdi')
    } finally {
      setSubmitting(false)
    }
  }

  // ── TEST TOPSHIRISH ko'rinishi ─────────────────────────────────────────────
  if (view === 'taking' && activeTest) {
    const answered = Object.keys(answers).length
    const total    = activeTest.questions.length
    const pct      = total ? Math.round((answered / total) * 100) : 0

    return (
      <div className="space-y-5 pb-8 max-w-2xl">
        {/* Sarlavha */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setView('list')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="w-4 h-4" /> Testlar
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">{activeTest.title}</h2>
          {activeTest.description && (
            <p className="text-sm text-gray-500 mt-1">{activeTest.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {activeTest.duration_minutes} daqiqa
            </span>
            <span>{total} ta savol</span>
            <span className="text-blue-600 font-medium">{answered}/{total} javoblangan</span>
          </div>
          {/* Progress */}
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Savollar */}
        <div className="space-y-4">
          {activeTest.questions.map((q: TestQuestion, idx: number) => (
            <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-900 mb-3">
                {idx + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const selected = answers[q.id] === oi
                  return (
                    <label
                      key={oi}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                        selected
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                      )}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={selected}
                        onChange={() => selectAnswer(q.id, oi)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className={cn(
                        'text-xs font-bold w-5 flex-shrink-0',
                        selected ? 'text-blue-700' : 'text-gray-400',
                      )}>
                        {['A', 'B', 'C', 'D'][oi]})
                      </span>
                      <span className={cn(
                        'text-sm',
                        selected ? 'text-blue-800 font-medium' : 'text-gray-700',
                      )}>
                        {opt}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {submitError && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        <div className="sticky bottom-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <ChevronRight className="w-4 h-4" />
            }
            Testni topshirish
          </button>
        </div>
      </div>
    )
  }

  // ── NATIJA ko'rinishi ──────────────────────────────────────────────────────
  if (view === 'done' && activeTest && finalResult) {
    const pct     = finalResult.total_questions
      ? Math.round((finalResult.score / finalResult.total_questions) * 100)
      : 0
    const passed  = pct >= 60

    return (
      <div className="space-y-5 pb-8 max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm text-center">
          <div className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl font-bold',
            passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600',
          )}>
            {passed ? '🎉' : '📚'}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{pct}%</h2>
          <p className="text-gray-500 mt-1">
            {finalResult.score} ta to'g'ri / {finalResult.total_questions} ta savol
          </p>
          <p className={cn(
            'mt-3 text-sm font-semibold',
            passed ? 'text-emerald-600' : 'text-red-600',
          )}>
            {passed ? "Tabriklaymiz! Muvaffaqiyatli topshirdingiz" : "Qaytalab ko'ring. 60% dan past"}
          </p>
        </div>

        {/* Savollar tahlili */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-gray-900 px-1">Tahlil</h3>
          {activeTest.questions.map((q: TestQuestion, idx: number) => {
            const selected  = finalResult.answers[q.id]
            const isCorrect = selected === q.correct_index
            return (
              <div
                key={q.id}
                className={cn(
                  'bg-white rounded-xl border p-4',
                  isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30',
                )}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className={cn(
                    'text-xs font-bold mt-0.5 flex-shrink-0',
                    isCorrect ? 'text-emerald-600' : 'text-red-600',
                  )}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                  <p className="text-sm font-medium text-gray-900">{idx + 1}. {q.question}</p>
                </div>
                <div className="space-y-1 pl-4">
                  {q.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className={cn(
                        'text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-2',
                        oi === q.correct_index ? 'bg-emerald-100 text-emerald-700 font-semibold' :
                        oi === selected && !isCorrect ? 'bg-red-100 text-red-700' :
                        'text-gray-500',
                      )}
                    >
                      <span className="font-bold w-4">{['A','B','C','D'][oi]})</span>
                      {opt}
                      {oi === q.correct_index && <span className="ml-auto text-emerald-600 font-bold">✓ To'g'ri</span>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setView('list')}
          className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          Testlar ro'yxatiga qaytish
        </button>
      </div>
    )
  }

  // ── RO'YXAT ko'rinishi ────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Testlar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Mavjud online testlar</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse flex gap-4">
              <div className="w-11 h-11 bg-gray-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tests.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Mavjud test yo'q</p>
          <p className="text-xs text-gray-400 mt-1">O'qituvchi test nashr qilsa, bu yerda ko'rinadi</p>
        </div>
      )}

      {!loading && tests.length > 0 && (
        <div className="space-y-3">
          {tests.map(test => {
            const done    = !!test.result?.submitted_at
            const pct     = done && test.result
              ? Math.round((test.result.score / test.result.total_questions) * 100)
              : null

            return (
              <div
                key={test.id}
                className={cn(
                  'bg-white rounded-2xl border p-5 transition-shadow',
                  done ? 'border-gray-100' : 'border-gray-100 hover:shadow-md',
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm',
                    done ? (pct! >= 60 ? 'bg-emerald-600' : 'bg-red-500') : 'bg-blue-600',
                  )}>
                    {done
                      ? <CheckCircle className="w-5 h-5 text-white" />
                      : <FileText className="w-5 h-5 text-white" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">{test.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                      {test.group && <span>{(test.group as any).name}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {test.duration_minutes} daqiqa
                      </span>
                      <span>{test.questions.length} ta savol</span>
                    </div>
                    {test.description && (
                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">{test.description}</p>
                    )}
                  </div>

                  <div className="flex-shrink-0 text-right">
                    {done && test.result ? (
                      <div>
                        <p className={cn(
                          'text-lg font-bold',
                          pct! >= 80 ? 'text-emerald-600' : pct! >= 60 ? 'text-amber-600' : 'text-red-600',
                        )}>
                          {pct}%
                        </p>
                        <p className="text-xs text-gray-400">
                          {test.result.score}/{test.result.total_questions}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTest(test)
                            setAnswers(test.result!.answers)
                            setFinalResult(test.result)
                            setView('done')
                          }}
                          className="text-xs text-blue-600 hover:underline mt-1"
                        >
                          Ko'rish
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startTest(test)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                      >
                        Boshlash
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
