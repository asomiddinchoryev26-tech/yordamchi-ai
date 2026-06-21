-- ============================================================
-- YordamchiAI — Migration 004: Lessons & Settings
-- ============================================================

-- ── 1. LESSONS jadvali ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lessons (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  content      text,
  group_id     uuid        REFERENCES public.groups(id)   ON DELETE CASCADE,
  subject_id   uuid        REFERENCES public.subjects(id) ON DELETE SET NULL,
  teacher_id   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  lesson_date  date,
  order_num    int         NOT NULL DEFAULT 0,
  is_published boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: all lessons"
  ON public.lessons FOR ALL
  USING (public.get_my_profile_role() = 'admin');

-- O'qituvchi: o'z guruhlarining darslarini ko'ra oladi
CREATE POLICY "Teacher: read group lessons"
  ON public.lessons FOR SELECT
  USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_id AND g.teacher_id = auth.uid()
    )
  );

-- O'qituvchi: yangi dars yaratadi (o'zi teacher_id bo'lishi shart)
CREATE POLICY "Teacher: insert lesson"
  ON public.lessons FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid()
    AND public.get_my_profile_role() = 'teacher'
  );

-- O'qituvchi: o'z darslarini yangilaydi va o'chiradi
CREATE POLICY "Teacher: update own lesson"
  ON public.lessons FOR UPDATE
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teacher: delete own lesson"
  ON public.lessons FOR DELETE
  USING (teacher_id = auth.uid());

-- Talaba: ro'yxatdan o'tgan guruhlarning nashr qilingan darslarini o'qiydi
CREATE POLICY "Student: read published lessons"
  ON public.lessons FOR SELECT
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.student_groups sg
      WHERE sg.student_id = auth.uid() AND sg.group_id = lessons.group_id
    )
  );

-- ── 2. SETTINGS jadvali ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.settings (
  key        text        PRIMARY KEY,
  value      text,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: manage settings"
  ON public.settings FOR ALL
  USING (public.get_my_profile_role() = 'admin');

-- Hamma o'qiy oladi (tizim nomi kabi umumiy ma'lumotlar)
CREATE POLICY "Anyone: read settings"
  ON public.settings FOR SELECT
  USING (true);

-- Default sozlamalar
INSERT INTO public.settings (key, value) VALUES
  ('org_name',        'YordamchiAI'),
  ('org_description', 'Online ta''lim platformasi'),
  ('support_email',   'support@yordamchai.uz'),
  ('max_group_size',  '30')
ON CONFLICT (key) DO NOTHING;

-- ── 3. Indekslar ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS lessons_group_idx     ON public.lessons (group_id);
CREATE INDEX IF NOT EXISTS lessons_teacher_idx   ON public.lessons (teacher_id);
CREATE INDEX IF NOT EXISTS lessons_date_idx      ON public.lessons (lesson_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS lessons_published_idx ON public.lessons (is_published) WHERE is_published = true;
