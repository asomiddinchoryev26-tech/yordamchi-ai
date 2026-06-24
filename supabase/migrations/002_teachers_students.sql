-- ============================================================
-- YordamchiAI — Migration 002: Teacher & Student modules
-- Supabase SQL Editor'da shu faylni to'liq ishga tushiring
-- ============================================================

-- 1. RLS siklik muammosini oldini olish uchun security definer helper
CREATE OR REPLACE FUNCTION public.get_my_profile_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1
$$;


-- 2. Profiles jadvaliga qo'shimcha ustunlar
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone  text,
  ADD COLUMN IF NOT EXISTS bio    text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive'));

-- 3. Admin — barcha profillarni o'qish
CREATE POLICY "Admin: read all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.get_my_profile_role() = 'admin');

-- Admin — barcha profillarni yangilash
CREATE POLICY "Admin: update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.get_my_profile_role() = 'admin')
  WITH CHECK (public.get_my_profile_role() = 'admin');

-- Admin — profillarni o'chirish
CREATE POLICY "Admin: delete profiles"
  ON public.profiles
  FOR DELETE
  USING (public.get_my_profile_role() = 'admin');

-- O'qituvchi — barcha profillarni o'qish (guruh a'zolari uchun)
CREATE POLICY "Teacher: read all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.get_my_profile_role() = 'teacher');

-- 4. teacher_subjects — o'qituvchi va fanlar orasidagi ko'p-ko'p aloqa
CREATE TABLE IF NOT EXISTS public.teacher_subjects (
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, subject_id)
);

ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: all teacher_subjects"
  ON public.teacher_subjects
  FOR ALL
  USING (public.get_my_profile_role() = 'admin');

CREATE POLICY "Teacher: read own teacher_subjects"
  ON public.teacher_subjects
  FOR SELECT
  USING (teacher_id = auth.uid());

-- 5. student_groups — talaba va guruhlar orasidagi ko'p-ko'p aloqa
CREATE TABLE IF NOT EXISTS public.student_groups (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id    uuid        NOT NULL REFERENCES public.groups(id)   ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (student_id, group_id)
);

ALTER TABLE public.student_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: all student_groups"
  ON public.student_groups
  FOR ALL
  USING (public.get_my_profile_role() = 'admin');

CREATE POLICY "Student: read own student_groups"
  ON public.student_groups
  FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Teacher: read group enrollments"
  ON public.student_groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_id AND g.teacher_id = auth.uid()
    )
  );

-- 6. Indekslar (tezlik uchun)
CREATE INDEX IF NOT EXISTS profiles_status_idx          ON public.profiles (status);
CREATE INDEX IF NOT EXISTS teacher_subjects_teacher_idx ON public.teacher_subjects (teacher_id);
CREATE INDEX IF NOT EXISTS teacher_subjects_subject_idx ON public.teacher_subjects (subject_id);
CREATE INDEX IF NOT EXISTS student_groups_student_idx   ON public.student_groups (student_id);
CREATE INDEX IF NOT EXISTS student_groups_group_idx     ON public.student_groups (group_id);
