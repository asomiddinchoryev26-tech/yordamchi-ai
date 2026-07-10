-- Rollback for 043 — original policies (NOTE: re-introduces the recursion bug).
-- Emergency use only.

drop policy if exists "Teacher: manage own assignment group links" on public.assignment_groups;
create policy "Teacher: manage own assignment group links" on public.assignment_groups
  for all
  using      (exists (select 1 from assignments a where a.id = assignment_groups.assignment_id and a.teacher_id = auth.uid()))
  with check (exists (select 1 from assignments a where a.id = assignment_groups.assignment_id and a.teacher_id = auth.uid()));

drop policy if exists "Student: read own group assignment links" on public.assignment_groups;
create policy "Student: read own group assignment links" on public.assignment_groups
  for select
  using (exists (select 1 from student_groups sg where sg.group_id = assignment_groups.group_id and sg.student_id = auth.uid()));

drop policy if exists "Student: read published assignments for own groups" on public.assignments;
create policy "Student: read published assignments for own groups" on public.assignments
  for select
  using (deleted_at is null and status = 'published' and exists (
    select 1 from assignment_groups ag join student_groups sg on sg.group_id = ag.group_id
    where ag.assignment_id = assignments.id and sg.student_id = auth.uid()));

drop policy if exists "Student: read attachments for visible assignments" on public.assignment_attachments;
create policy "Student: read attachments for visible assignments" on public.assignment_attachments
  for select
  using (exists (
    select 1 from assignments a join assignment_groups ag on ag.assignment_id = a.id join student_groups sg on sg.group_id = ag.group_id
    where a.id = assignment_attachments.assignment_id and a.status = 'published' and a.deleted_at is null and sg.student_id = auth.uid()));

drop policy if exists "Student: insert own submissions" on public.assignment_submissions;
create policy "Student: insert own submissions" on public.assignment_submissions
  for insert
  with check (student_id = auth.uid() and exists (
    select 1 from assignments a join assignment_groups ag on ag.assignment_id = a.id join student_groups sg on sg.group_id = ag.group_id
    where a.id = assignment_submissions.assignment_id and a.status = 'published' and a.deleted_at is null and sg.student_id = auth.uid()));
