-- ROLLBACK for 030_org_scoped_rls.sql
-- Re-creates the exact global policies that 030 drops, and drops 030's additions.
-- Apply this ONLY if org-scoped RLS breaks access for existing users.

-- drop 030 additions -------------------------------------------------------
drop policy if exists profiles_staff_read_org     on public.profiles;
drop policy if exists profiles_admin_manage_org   on public.profiles;
drop policy if exists profiles_super              on public.profiles;
drop policy if exists subjects_org_read           on public.subjects;
drop policy if exists subjects_staff_manage_org   on public.subjects;
drop policy if exists subjects_super              on public.subjects;
drop policy if exists groups_admin_org            on public.groups;
drop policy if exists groups_super                on public.groups;
drop policy if exists groups_teacher_insert       on public.groups;
drop policy if exists groups_teacher_delete       on public.groups;
drop policy if exists lessons_admin_org           on public.lessons;
drop policy if exists lessons_super               on public.lessons;
drop policy if exists tests_admin_org             on public.tests;
drop policy if exists tests_teacher_read_org      on public.tests;
drop policy if exists tests_student_read          on public.tests;
drop policy if exists tests_super                 on public.tests;
drop policy if exists assignments_admin_org       on public.assignments;
drop policy if exists assignments_super           on public.assignments;
drop policy if exists attendance_admin_org        on public.attendance;
drop policy if exists attendance_super            on public.attendance;
drop policy if exists student_groups_admin_org    on public.student_groups;
drop policy if exists student_groups_super        on public.student_groups;
drop policy if exists announcements_org_read      on public.announcements;
drop policy if exists announcements_staff_manage  on public.announcements;

-- recreate the original global policies ------------------------------------
create policy "Admin: read all profiles"   on public.profiles for select using (get_my_profile_role() = 'admin');
create policy "Admin: update all profiles" on public.profiles for update using (get_my_profile_role() = 'admin') with check (get_my_profile_role() = 'admin');
create policy "Admin: delete profiles"     on public.profiles for delete using (get_my_profile_role() = 'admin');
create policy "Teacher: read all profiles" on public.profiles for select using (get_my_profile_role() = 'teacher');
create policy admin_profiles_all           on public.profiles for all using (get_my_role() = 'admin') with check (get_my_role() = 'admin');

create policy "Admin: all subjects"        on public.subjects for all using (get_my_profile_role() = 'admin');
create policy admin_subjects_all           on public.subjects for all using (get_my_role() = 'admin') with check (get_my_role() = 'admin');
create policy "Subjects: admin delete"     on public.subjects for delete using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "Subjects: admin insert"     on public.subjects for insert with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "Subjects: admin update"     on public.subjects for update using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "Anyone: read subjects"      on public.subjects for select using (true);
create policy "Subjects: read"             on public.subjects for select using (true);
create policy all_subjects_read            on public.subjects for select using (get_my_role() = any (array['teacher','student']));

create policy "Admin: all groups"          on public.groups for all using (get_my_profile_role() = 'admin');
create policy admin_groups_all             on public.groups for all using (get_my_role() = 'admin') with check (get_my_role() = 'admin');

create policy "Admin: all lessons"         on public.lessons for all using (get_my_profile_role() = 'admin');

create policy "Admin: all tests"           on public.tests for all using (get_my_profile_role() = 'admin');
create policy "Teacher: read all tests"    on public.tests for select using (get_my_profile_role() = 'teacher');

create policy "Admin: manage all assignments" on public.assignments for all using (get_my_profile_role() = 'admin') with check (get_my_profile_role() = 'admin');
create policy "Admin: all attendance"      on public.attendance for all using (get_my_profile_role() = 'admin');
create policy "Admin: all student_groups"  on public.student_groups for all using (get_my_profile_role() = 'admin');
create policy announcements_read           on public.announcements for select using (auth.uid() is not null);
