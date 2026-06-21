import { supabase } from '@/lib/supabase'
import type { TestRow, TestInsert, TestUpdate, TestResultRow, TestQuestion } from '@/types/database.types'

export type { TestQuestion, TestResultRow }

// ─── Tiplari ──────────────────────────────────────────────────────────────────

export type TestWithDetails = TestRow & {
  group:         { id: string; name: string } | null
  subject:       { id: string; name: string; color: string; icon: string } | null
  results_count: number
}

export type TestForStudent = TestRow & {
  group:  { id: string; name: string } | null
  result: TestResultRow | null
}

export type TestResultWithStudent = TestResultRow & {
  student: { id: string; full_name: string | null; email: string | null } | null
}

// ─── Servis ───────────────────────────────────────────────────────────────────

export const testService = {
  // O'qituvchi: o'z testlarini olish
  getByTeacher: async (teacherId: string): Promise<TestWithDetails[]> => {
    const { data: tests, error } = await supabase
      .from('tests')
      .select('*, group:groups(id, name), subject:subjects(id, name, color, icon)')
      .eq('created_by', teacherId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    if (!tests?.length) return []

    // Natijalar sonini alohida hisoblash
    const { data: counts } = await supabase
      .from('test_results')
      .select('test_id')
      .in('test_id', tests.map(t => t.id))
      .not('submitted_at', 'is', null)

    const countMap = new Map<string, number>()
    for (const c of counts ?? []) {
      countMap.set(c.test_id, (countMap.get(c.test_id) ?? 0) + 1)
    }

    return tests.map((t: any) => ({
      ...t,
      questions:     (t.questions ?? []) as TestQuestion[],
      results_count: countMap.get(t.id) ?? 0,
    })) as TestWithDetails[]
  },

  // Talaba: guruhlariga tegishli nashr qilingan testlar
  getForStudent: async (studentId: string): Promise<TestForStudent[]> => {
    // 1. Talabaning guruh IDlari
    const { data: enrollments } = await supabase
      .from('student_groups')
      .select('group_id')
      .eq('student_id', studentId)

    const groupIds = (enrollments ?? []).map((e: any) => e.group_id)
    if (!groupIds.length) return []

    // 2. Nashr qilingan testlar
    const { data: tests, error } = await supabase
      .from('tests')
      .select('*, group:groups(id, name)')
      .eq('is_published', true)
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    if (!tests?.length) return []

    // 3. Talabaning natijalari
    const { data: results } = await supabase
      .from('test_results')
      .select('*')
      .eq('student_id', studentId)
      .in('test_id', tests.map((t: any) => t.id))

    const resultMap = new Map((results ?? []).map(r => [r.test_id, r]))

    return tests.map((t: any) => ({
      ...t,
      questions: (t.questions ?? []) as TestQuestion[],
      result:    resultMap.get(t.id) ?? null,
    })) as TestForStudent[]
  },

  // Admin: barcha testlar
  getAll: async (): Promise<TestWithDetails[]> => {
    const { data: tests, error } = await supabase
      .from('tests')
      .select('*, group:groups(id, name), subject:subjects(id, name, color, icon)')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    if (!tests?.length) return []

    const { data: counts } = await supabase
      .from('test_results')
      .select('test_id')
      .in('test_id', tests.map((t: any) => t.id))
      .not('submitted_at', 'is', null)

    const countMap = new Map<string, number>()
    for (const c of counts ?? []) {
      countMap.set(c.test_id, (countMap.get(c.test_id) ?? 0) + 1)
    }

    return tests.map((t: any) => ({
      ...t,
      questions:     (t.questions ?? []) as TestQuestion[],
      results_count: countMap.get(t.id) ?? 0,
    })) as TestWithDetails[]
  },

  // Test natijalarini olish (o'qituvchi/admin uchun)
  getResults: async (testId: string): Promise<TestResultWithStudent[]> => {
    const { data, error } = await supabase
      .from('test_results')
      .select('*, student:profiles(id, full_name, email)')
      .eq('test_id', testId)
      .not('submitted_at', 'is', null)
      .order('score', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as TestResultWithStudent[]
  },

  create: async (payload: TestInsert): Promise<TestRow> => {
    const { data, error } = await supabase
      .from('tests')
      .insert(payload)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  update: async (id: string, payload: TestUpdate): Promise<TestRow> => {
    const { data, error } = await supabase
      .from('tests')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('tests').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  // Talaba testni topshiradi
  submitResult: async (
    testId:    string,
    studentId: string,
    answers:   Record<string, number>,
    questions: TestQuestion[],
  ): Promise<TestResultRow> => {
    const score = questions.reduce((acc, q) => {
      return answers[q.id] === q.correct_index ? acc + 1 : acc
    }, 0)

    const { data, error } = await supabase
      .from('test_results')
      .upsert({
        test_id:         testId,
        student_id:      studentId,
        answers,
        score,
        total_questions: questions.length,
        submitted_at:    new Date().toISOString(),
      }, { onConflict: 'test_id,student_id' })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },
}
