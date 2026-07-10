-- Rollback for 038_org_isolation_secondary.sql — original (leaky) policalarni tiklaydi.
-- Faqat favqulodda holatda ishlatiladi.

drop policy if exists video_lessons_select on public.video_lessons;
create policy video_lessons_select on public.video_lessons for select using (auth.uid() is not null);
drop policy if exists video_lessons_manage on public.video_lessons;
create policy video_lessons_manage on public.video_lessons for all
  using ((teacher_id = auth.uid()) or (get_my_profile_role() = 'admin'))
  with check ((teacher_id = auth.uid()) or (get_my_profile_role() = 'admin'));

drop policy if exists qr_sessions_student_read on public.qr_attendance_sessions;
create policy qr_sessions_student_read on public.qr_attendance_sessions for select using (status = 'active');
drop policy if exists qr_sessions_manage on public.qr_attendance_sessions;
create policy qr_sessions_manage on public.qr_attendance_sessions for all
  using ((teacher_id = auth.uid()) or (get_my_profile_role() = 'admin'))
  with check ((teacher_id = auth.uid()) or (get_my_profile_role() = 'admin'));

drop policy if exists teacher_subjects_admin_org on public.teacher_subjects;
create policy "Admin: all teacher_subjects" on public.teacher_subjects for all using (get_my_profile_role() = 'admin');

drop policy if exists test_results_admin_org on public.test_results;
create policy "Admin: all test_results" on public.test_results for all using (get_my_profile_role() = 'admin');

drop policy if exists user_achievements_admin_org on public.user_achievements;
create policy "Admin: manage all achievements" on public.user_achievements for all using (get_my_profile_role() = 'admin');

drop policy if exists lesson_views_staff on public.lesson_views;
create policy lesson_views_staff on public.lesson_views for select
  using (get_my_profile_role() = any (array['teacher', 'admin']));
