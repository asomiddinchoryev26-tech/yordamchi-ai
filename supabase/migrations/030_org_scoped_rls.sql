-- ============================================================================
-- 030_org_scoped_rls.sql   (PHASE 2 — organization data isolation)
--
-- Closes cross-tenant leaks by making the GLOBAL admin/teacher policies
-- organization-scoped. Ownership/enrollment/self policies are left untouched —
-- they are already tenant-safe (a teacher's own groups / a student's enrollments
-- are always within their own organization).
--
-- Also:
--   • tg_set_org_id() BEFORE-INSERT trigger auto-fills organization_id on content
--     rows from the creator's org (my_org_id()), so the app needs no changes.
--   • super_admin (is_super_admin()) retains cross-org access.
--
-- Rollback: 030_org_scoped_rls_rollback.sql
-- ============================================================================

-- 0. Auto-populate organization_id on INSERT for content tables --------------
create or replace function public.tg_set_org_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.organization_id is null then
    new.organization_id := my_org_id();
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['subjects','groups','lessons','tests','assignments','attendance','student_groups','announcements']
  loop
    execute format('drop trigger if exists trg_set_org_id on public.%I', t);
    execute format('create trigger trg_set_org_id before insert on public.%I for each row execute function public.tg_set_org_id()', t);
  end loop;
end $$;

-- 1. PROFILES ---------------------------------------------------------------
drop policy if exists "Admin: read all profiles"   on public.profiles;
drop policy if exists "Admin: update all profiles" on public.profiles;
drop policy if exists "Admin: delete profiles"     on public.profiles;
drop policy if exists "Teacher: read all profiles" on public.profiles;
drop policy if exists admin_profiles_all           on public.profiles;

create policy profiles_staff_read_org on public.profiles for select
  using (organization_id = my_org_id() and get_my_profile_role() in ('admin','teacher'));
create policy profiles_admin_manage_org on public.profiles for all
  using (get_my_profile_role() = 'admin' and organization_id = my_org_id())
  with check (get_my_profile_role() = 'admin' and organization_id = my_org_id());
create policy profiles_super on public.profiles for all
  using (is_super_admin()) with check (is_super_admin());

-- 2. SUBJECTS (was globally readable — scope to org) -------------------------
drop policy if exists "Admin: all subjects"    on public.subjects;
drop policy if exists admin_subjects_all       on public.subjects;
drop policy if exists "Subjects: admin delete" on public.subjects;
drop policy if exists "Subjects: admin insert" on public.subjects;
drop policy if exists "Subjects: admin update" on public.subjects;
drop policy if exists "Anyone: read subjects"  on public.subjects;
drop policy if exists "Subjects: read"         on public.subjects;
drop policy if exists all_subjects_read        on public.subjects;

create policy subjects_org_read on public.subjects for select
  using (organization_id = my_org_id());
create policy subjects_staff_manage_org on public.subjects for all
  using (get_my_profile_role() in ('admin','teacher') and organization_id = my_org_id())
  with check (get_my_profile_role() in ('admin','teacher') and organization_id = my_org_id());
create policy subjects_super on public.subjects for all
  using (is_super_admin()) with check (is_super_admin());

-- 3. GROUPS -----------------------------------------------------------------
drop policy if exists "Admin: all groups" on public.groups;
drop policy if exists admin_groups_all    on public.groups;

create policy groups_admin_org on public.groups for all
  using (get_my_profile_role() = 'admin' and organization_id = my_org_id())
  with check (get_my_profile_role() = 'admin' and organization_id = my_org_id());
create policy groups_super on public.groups for all
  using (is_super_admin()) with check (is_super_admin());
create policy groups_teacher_insert on public.groups for insert
  with check (get_my_profile_role() = 'teacher' and teacher_id = auth.uid());
create policy groups_teacher_delete on public.groups for delete
  using (teacher_id = auth.uid());

-- 4. LESSONS ----------------------------------------------------------------
drop policy if exists "Admin: all lessons" on public.lessons;

create policy lessons_admin_org on public.lessons for all
  using (get_my_profile_role() = 'admin' and organization_id = my_org_id())
  with check (get_my_profile_role() = 'admin' and organization_id = my_org_id());
create policy lessons_super on public.lessons for all
  using (is_super_admin()) with check (is_super_admin());

-- 5. TESTS ------------------------------------------------------------------
drop policy if exists "Admin: all tests"        on public.tests;
drop policy if exists "Teacher: read all tests" on public.tests;

create policy tests_admin_org on public.tests for all
  using (get_my_profile_role() = 'admin' and organization_id = my_org_id())
  with check (get_my_profile_role() = 'admin' and organization_id = my_org_id());
create policy tests_teacher_read_org on public.tests for select
  using (get_my_profile_role() = 'teacher' and organization_id = my_org_id());
-- students can read published tests for the groups they are enrolled in
create policy tests_student_read on public.tests for select
  using (is_published = true and exists (
    select 1 from student_groups sg
    where sg.student_id = auth.uid() and sg.group_id = tests.group_id));
create policy tests_super on public.tests for all
  using (is_super_admin()) with check (is_super_admin());

-- 6. ASSIGNMENTS ------------------------------------------------------------
drop policy if exists "Admin: manage all assignments" on public.assignments;

create policy assignments_admin_org on public.assignments for all
  using (get_my_profile_role() = 'admin' and organization_id = my_org_id())
  with check (get_my_profile_role() = 'admin' and organization_id = my_org_id());
create policy assignments_super on public.assignments for all
  using (is_super_admin()) with check (is_super_admin());

-- 7. ATTENDANCE -------------------------------------------------------------
drop policy if exists "Admin: all attendance" on public.attendance;

create policy attendance_admin_org on public.attendance for all
  using (get_my_profile_role() = 'admin' and organization_id = my_org_id())
  with check (get_my_profile_role() = 'admin' and organization_id = my_org_id());
create policy attendance_super on public.attendance for all
  using (is_super_admin()) with check (is_super_admin());

-- 8. STUDENT_GROUPS ---------------------------------------------------------
drop policy if exists "Admin: all student_groups" on public.student_groups;

create policy student_groups_admin_org on public.student_groups for all
  using (get_my_profile_role() = 'admin' and organization_id = my_org_id())
  with check (get_my_profile_role() = 'admin' and organization_id = my_org_id());
create policy student_groups_super on public.student_groups for all
  using (is_super_admin()) with check (is_super_admin());

-- 9. ANNOUNCEMENTS (was readable by ANY logged-in user — scope to org) ------
drop policy if exists announcements_read on public.announcements;

create policy announcements_org_read on public.announcements for select
  using (organization_id = my_org_id());
create policy announcements_staff_manage on public.announcements for all
  using (get_my_profile_role() in ('admin','teacher') and organization_id = my_org_id())
  with check (get_my_profile_role() in ('admin','teacher') and organization_id = my_org_id());
