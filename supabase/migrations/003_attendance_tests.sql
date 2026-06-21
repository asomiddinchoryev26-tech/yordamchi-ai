-- ============================================================
-- YordamchiAI — Migration 003: Attendance & Tests
-- Supabase SQL Editor'da shu faylni to'liq ishga tushiring
-- ============================================================

-- ── 1. ATTENDANCE jadvali ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.attendance (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id      uuid        NOT NULL REFERENCES public.groups(id)   ON DELETE CASCADE,
  teacher_id    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  attended_date date        NOT NULL,
  status        text        NOT NULL DEFAULT 'present'
    CHECK (status IN ('present', 'absent', 'late', 'excused')),
  note          text,
  created_at    timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (student_id, group_id, attended_date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: all attendance"
  ON public.attendance FOR ALL
  USING (public.get_my_profile_role() = 'admin');

-- O'qituvchi: o'z guruhlarining davomatini boshqaradi
CREATE POLICY "Teacher: manage attendance"
  ON public.attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_id AND g.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_id AND g.teacher_id = auth.uid()
    )
  );

-- Talaba: faqat o'z davomatini ko'ra oladi
CREATE POLICY "Student: read own attendance"
  ON public.attendance FOR SELECT
  USING (student_id = auth.uid());

-- ── 2. TESTS jadvali ──────────────────────────────────────────────────────────
-- questions JSONB formati:
-- [{id: uuid, question: string, options: [A, B, C, D], correct_index: 0|1|2|3}]

CREATE TABLE IF NOT EXISTS public.tests (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text        NOT NULL,
  description      text,
  group_id         uuid        REFERENCES public.groups(id)   ON DELETE SET NULL,
  subject_id       uuid        REFERENCES public.subjects(id) ON DELETE SET NULL,
  created_by       uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  duration_minutes int         NOT NULL DEFAULT 30,
  is_published     boolean     NOT NULL DEFAULT false,
  questions        jsonb       NOT NULL DEFAULT '[]'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: all tests"
  ON public.tests FOR ALL
  USING (public.get_my_profile_role() = 'admin');

-- O'qituvchi: o'z testlarini yaratadi va boshqaradi
CREATE POLICY "Teacher: insert own test"
  ON public.tests FOR INSERT
  WITH CHECK (public.get_my_profile_role() = 'teacher' AND created_by = auth.uid());

CREATE POLICY "Teacher: update own test"
  ON public.tests FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Teacher: delete own test"
  ON public.tests FOR DELETE
  USING (created_by = auth.uid());

CREATE POLICY "Teacher: read all tests"
  ON public.tests FOR SELECT
  USING (public.get_my_profile_role() = 'teacher');

-- Talaba: guruhiga tegishli nashr qilingan testlarni ko'ra oladi
CREATE POLICY "Student: read published tests"
  ON public.tests FOR SELECT
  USING (
    is_published = true
    AND (
      group_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.student_groups sg
        WHERE sg.student_id = auth.uid() AND sg.group_id = tests.group_id
      )
    )
  );

-- ── 3. TEST_RESULTS jadvali ───────────────────────────────────────────────────
-- answers JSONB formati: {"question_id": selected_index}

CREATE TABLE IF NOT EXISTS public.test_results (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id         uuid        NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  student_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answers         jsonb       NOT NULL DEFAULT '{}'::jsonb,
  score           int         NOT NULL DEFAULT 0,
  total_questions int         NOT NULL DEFAULT 0,
  submitted_at    timestamptz,
  started_at      timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (test_id, student_id)
);

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: all test_results"
  ON public.test_results FOR ALL
  USING (public.get_my_profile_role() = 'admin');

-- O'qituvchi: o'z testlarining natijalarini ko'ra oladi
CREATE POLICY "Teacher: read test results"
  ON public.test_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_id AND t.created_by = auth.uid()
    )
  );

-- Talaba: o'z natijalarini boshqaradi (yozish + o'qish)
CREATE POLICY "Student: manage own results"
  ON public.test_results FOR ALL
  USING  (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ── 4. Indekslar ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS attendance_student_idx   ON public.attendance (student_id);
CREATE INDEX IF NOT EXISTS attendance_group_idx     ON public.attendance (group_id);
CREATE INDEX IF NOT EXISTS attendance_date_idx      ON public.attendance (attended_date DESC);
CREATE INDEX IF NOT EXISTS tests_group_idx          ON public.tests (group_id);
CREATE INDEX IF NOT EXISTS tests_created_by_idx     ON public.tests (created_by);
CREATE INDEX IF NOT EXISTS tests_published_idx      ON public.tests (is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS test_results_test_idx    ON public.test_results (test_id);
CREATE INDEX IF NOT EXISTS test_results_student_idx ON public.test_results (student_id);
