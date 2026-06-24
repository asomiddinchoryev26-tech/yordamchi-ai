-- ============================================================
-- YordamchiAI — Migration 007: Fix RLS Infinite Recursion
--
-- Muammo (HTTP 500 sababi):
--   student_groups "Teacher: read group enrollments"
--     → groups jadvali so'rovi (RLS bilan)
--   groups "Student: read enrolled groups"
--     → student_groups so'rovi (RLS bilan)
--   → Cheksiz rekursiya → stack depth exceeded → 500 xato
--
-- Tuzatish:
--   SECURITY DEFINER funksiyalar orqali RLS ni chetlab o'tib
--   subquery yuboriladi — tsikl buziladi.
-- ============================================================

-- 1. Talaba guruhga yozilganmi tekshiruvchi funksiya
--    SECURITY DEFINER → student_groups da RLS ishlamaydi → rekursiya yo'q
CREATE OR REPLACE FUNCTION public.is_enrolled_in_group(gid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_groups sg
    WHERE sg.group_id = gid
      AND sg.student_id = auth.uid()
  )
$$;

-- 2. O'qituvchi guruhning egasimi tekshiruvchi funksiya
--    SECURITY DEFINER → groups da RLS ishlamaydi → rekursiya yo'q
CREATE OR REPLACE FUNCTION public.teacher_owns_group(gid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = gid
      AND teacher_id = auth.uid()
  )
$$;

-- 3. groups jadvalidagi rekursiv policy ni almashtirish
DROP POLICY IF EXISTS "Student: read enrolled groups" ON public.groups;

CREATE POLICY "Student: read enrolled groups"
  ON public.groups FOR SELECT
  USING (public.is_enrolled_in_group(id));

-- 4. student_groups jadvalidagi rekursiv policy ni almashtirish
DROP POLICY IF EXISTS "Teacher: read group enrollments" ON public.student_groups;

CREATE POLICY "Teacher: read group enrollments"
  ON public.student_groups FOR SELECT
  USING (public.teacher_owns_group(group_id));
