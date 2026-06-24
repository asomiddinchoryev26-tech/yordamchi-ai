-- ============================================================
-- YordamchiAI — Migration 005: Fix Student Access to Groups
--
-- Muammo: talabalar groups va profiles jadvallarini o'qiy
-- olmaydi, shuning uchun dashboard va my-groups sahifalarida
-- kurslar ko'rinmaydi.
--
-- Tuzatishlar:
-- 1. groups jadvali uchun student read policy
-- 2. profiles jadvali uchun student read policy (o'qituvchi ma'lumoti)
-- 3. subjects jadvali uchun umumiy read policy (agar yo'q bo'lsa)
-- ============================================================

-- ── 1. GROUPS jadvali ────────────────────────────────────────────────────────

-- RLS yoqilganligini ta'minlash (idempotent)
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Admin: barcha guruhlarni boshqarish
DO $$
BEGIN
  CREATE POLICY "Admin: all groups"
    ON public.groups FOR ALL
    USING (public.get_my_profile_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- O'qituvchi: o'ziga biriktirilgan guruhlarni o'qish
DO $$
BEGIN
  CREATE POLICY "Teacher: read own groups"
    ON public.groups FOR SELECT
    USING (teacher_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Talaba: ro'yxatdan o'tgan guruhlarini o'qish
DO $$
BEGIN
  CREATE POLICY "Student: read enrolled groups"
    ON public.groups FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.student_groups sg
        WHERE sg.group_id = groups.id
          AND sg.student_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. PROFILES jadvali ──────────────────────────────────────────────────────
-- Talabalar o'qituvchilarning profillarini ko'ra olishi kerak
-- (Dashboard va My Groups da teacher_name ko'rinishi uchun)

DO $$
BEGIN
  CREATE POLICY "Student: read teacher profiles"
    ON public.profiles FOR SELECT
    USING (
      -- O'qituvchi bo'lsa VA talaba shu o'qituvchining guruhida bo'lsa
      role = 'teacher'
      AND EXISTS (
        SELECT 1
        FROM public.groups g
        JOIN public.student_groups sg ON sg.group_id = g.id
        WHERE g.teacher_id = profiles.id
          AND sg.student_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 3. SUBJECTS jadvali ──────────────────────────────────────────────────────
-- Barcha foydalanuvchilar fanlarni o'qiy olishi kerak (ko'rsatish uchun)

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Anyone: read subjects"
    ON public.subjects FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Admin: all subjects"
    ON public.subjects FOR ALL
    USING (public.get_my_profile_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 4. Indekslar ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS groups_teacher_id_idx ON public.groups (teacher_id);
CREATE INDEX IF NOT EXISTS groups_status_idx     ON public.groups (status);
