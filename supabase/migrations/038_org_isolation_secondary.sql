-- ============================================================================
-- 038_org_isolation_secondary.sql
--
-- Tashkilotlararo izolyatsiya sizishini yopish (ikkilamchi jadvallar).
-- 030 asosiy jadvallarni org bo'yicha ajratgan; bular hali global policy'da edi:
--   video_lessons · qr_attendance_sessions · test_results ·
--   teacher_subjects · user_achievements · lesson_views
--
-- Yondashuv: schema o'zgarmaydi (xavfsiz) — faqat policy almashtiriladi.
-- RLS rekursiyasidan qochish uchun org SECURITY DEFINER helper'lar orqali olinadi.
-- Egalik (o'z yozuvi) policy'lari saqlanadi; global admin/authenticated'lar
-- org-scoped variantga almashtiriladi (+ super-admin bypass).
-- ============================================================================

-- ── Helper'lar: yozuvning tashkilotini RLS'siz aniqlash ─────────────────────
create or replace function public.org_of_user(p uuid) returns uuid
  language sql stable security definer set search_path = public as $$
  select organization_id from public.profiles where id = p $$;
grant execute on function public.org_of_user(uuid) to authenticated;

create or replace function public.org_of_lesson(p uuid) returns uuid
  language sql stable security definer set search_path = public as $$
  select organization_id from public.lessons where id = p $$;
grant execute on function public.org_of_lesson(uuid) to authenticated;

create or replace function public.org_of_test(p uuid) returns uuid
  language sql stable security definer set search_path = public as $$
  select organization_id from public.tests where id = p $$;
grant execute on function public.org_of_test(uuid) to authenticated;

-- ── video_lessons ───────────────────────────────────────────────────────────
drop policy if exists video_lessons_select on public.video_lessons;
create policy video_lessons_select on public.video_lessons for select
  using (org_of_user(teacher_id) = my_org_id() or is_super_admin());

drop policy if exists video_lessons_manage on public.video_lessons;
create policy video_lessons_manage on public.video_lessons for all
  using      ((teacher_id = auth.uid()) or (get_my_profile_role() = 'admin' and org_of_user(teacher_id) = my_org_id()) or is_super_admin())
  with check ((teacher_id = auth.uid()) or (get_my_profile_role() = 'admin' and org_of_user(teacher_id) = my_org_id()) or is_super_admin());

-- ── qr_attendance_sessions ──────────────────────────────────────────────────
drop policy if exists qr_sessions_student_read on public.qr_attendance_sessions;
create policy qr_sessions_student_read on public.qr_attendance_sessions for select
  using (status = 'active' and org_of_user(teacher_id) = my_org_id());

drop policy if exists qr_sessions_manage on public.qr_attendance_sessions;
create policy qr_sessions_manage on public.qr_attendance_sessions for all
  using      ((teacher_id = auth.uid()) or (get_my_profile_role() = 'admin' and org_of_user(teacher_id) = my_org_id()) or is_super_admin())
  with check ((teacher_id = auth.uid()) or (get_my_profile_role() = 'admin' and org_of_user(teacher_id) = my_org_id()) or is_super_admin());

-- ── teacher_subjects ────────────────────────────────────────────────────────
drop policy if exists "Admin: all teacher_subjects" on public.teacher_subjects;
create policy teacher_subjects_admin_org on public.teacher_subjects for all
  using      ((get_my_profile_role() = 'admin' and org_of_user(teacher_id) = my_org_id()) or is_super_admin())
  with check ((get_my_profile_role() = 'admin' and org_of_user(teacher_id) = my_org_id()) or is_super_admin());

-- ── test_results ────────────────────────────────────────────────────────────
drop policy if exists "Admin: all test_results" on public.test_results;
create policy test_results_admin_org on public.test_results for all
  using      ((get_my_profile_role() = 'admin' and org_of_test(test_id) = my_org_id()) or is_super_admin())
  with check ((get_my_profile_role() = 'admin' and org_of_test(test_id) = my_org_id()) or is_super_admin());

-- ── user_achievements ───────────────────────────────────────────────────────
drop policy if exists "Admin: manage all achievements" on public.user_achievements;
create policy user_achievements_admin_org on public.user_achievements for all
  using      ((get_my_profile_role() = 'admin' and org_of_user(user_id) = my_org_id()) or is_super_admin())
  with check ((get_my_profile_role() = 'admin' and org_of_user(user_id) = my_org_id()) or is_super_admin());

-- ── lesson_views ────────────────────────────────────────────────────────────
drop policy if exists lesson_views_staff on public.lesson_views;
create policy lesson_views_staff on public.lesson_views for select
  using (((get_my_profile_role() = any (array['teacher', 'admin'])) and org_of_lesson(lesson_id) = my_org_id()) or is_super_admin());
