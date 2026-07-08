import { supabase } from '@/lib/supabase'
import type { TestRow, TestInsert, TestUpdate, TestResultRow, TestQuestion } from '@/types/database.types'

export type { TestQuestion, TestResultRow }

// ─── Tiplari ──────────────────────────────────────────────────────────────────

export type TestWithDetails = TestRow & {
  group:         { id: string; name: string } | null
  subject:       { id: string; name: string; color: string; icon: string } | null
  results_count: number
}

// Talabaga yuboriladigan savol — `correct_index` FAQAT topshirilgandan keyin bo'ladi
// (server RPC topshirilmagan testda uni umuman yubormaydi). Shu sabab optional.
export type StudentQuestion = Omit<TestQuestion, 'correct_index'> & { correct_index?: 0 | 1 | 2 | 3 }

export type TestForStudent = Omit<TestRow, 'questions'> & {
  questions: StudentQuestion[]
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

  // Talaba: guruhlariga tegishli nashr qilingan testlar.
  // Xavfsizlik: to'g'ridan-to'g'ri jadval o'qish o'rniga SECURITY DEFINER RPC —
  // `correct_index` topshirilmagan testlarda mijozga UMUMAN yuborilmaydi.
  getForStudent: async (): Promise<TestForStudent[]> => {
    const { data, error } = await supabase.rpc('get_student_tests')
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as TestForStudent[]
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

  // Talaba testni topshiradi — baholash BUTUNLAY SERVERDA (submit_test RPC).
  // Mijoz score/total yubormaydi va yoza olmaydi. RPC natija + review uchun
  // to'liq savollarni (topshirilgandan keyin javoblar bilan) qaytaradi.
  submitTest: async (
    testId:  string,
    answers: Record<string, number>,
  ): Promise<{ result: TestResultRow; questions: TestQuestion[] }> => {
    const { data, error } = await supabase.rpc('submit_test', {
      p_test_id: testId,
      p_answers: answers,
    })
    if (error) throw new Error(error.message)
    return data as unknown as { result: TestResultRow; questions: TestQuestion[] }
  },

  // Talabaning o'z natijalari + test nomi (dashboard / progress uchun) — xavfsiz RPC
  getMyResults: async (): Promise<unknown[]> => {
    const { data, error } = await supabase.rpc('get_my_test_results')
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown[]
  },
}
