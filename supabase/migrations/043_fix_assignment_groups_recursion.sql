-- ============================================================================
-- 043_fix_assignment_groups_recursion.sql
--
-- FIX: "infinite recursion detected in policy for relation assignment_groups"
--      (Postgres 42P17) — also affected "assignments".
--
-- CAUSE — mutually recursive RLS policies that read each other's table UNDER RLS:
--   • assignment_groups  "Teacher: manage own assignment group links"
--         → subquery on assignments        (triggers assignments RLS)
--   • assignments        "Student: read published assignments for own groups"
--         → subquery on assignment_groups  (triggers assignment_groups RLS)
--   assignment_groups → assignments → assignment_groups → …  (Postgres aborts).
--   assignment_attachments / assignment_submissions Student policies join the
--   same three tables, so they were pulled into the same cycle.
--
-- FIX — the exact pattern this codebase already uses (is_enrolled_in_group,
-- teacher_owns_group, get_my_profile_role): move every cross-table lookup into
-- SECURITY DEFINER helpers. A SECURITY DEFINER function runs with the owner's
-- rights and does NOT re-trigger the caller's RLS, so no policy re-enters
-- another table's policy → the cycle is broken.
--
-- Access semantics are IDENTICAL to before — RLS stays enabled, nothing is
-- weakened. student / teacher / admin / super-admin all keep the same rights.
-- ============================================================================

-- ── Helpers (SECURITY DEFINER → bypass RLS, break every cycle) ────────────────

-- O'qituvchi shu topshiriq egasimi?  (assignments RLS'ni chetlab o'tadi)
create or replace function public.teacher_owns_assignment(p_assignment_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.assignments a
    where a.id = p_assignment_id
      and a.teacher_id = auth.uid()
  );
$$;
grant execute on function public.teacher_owns_assignment(uuid) to authenticated;

-- Talaba shu topshiriqni ko'ra oladimi?  (published + o'chirilmagan + a'zo bo'lgan
-- guruhига biriktirilgan).  assignments + assignment_groups + student_groups
-- RLS'ini chetlab o'tadi — mana shu sikldan xalos qiladi.
create or replace function public.student_can_see_assignment(p_assignment_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.assignments a
    join public.assignment_groups ag on ag.assignment_id = a.id
    join public.student_groups   sg on sg.group_id       = ag.group_id
    where a.id = p_assignment_id
      and a.status = 'published'
      and a.deleted_at is null
      and sg.student_id = auth.uid()
  );
$$;
grant execute on function public.student_can_see_assignment(uuid) to authenticated;

-- ── assignment_groups — rekursiv subquery'larni helper'ga almashtirish ────────

-- Teacher: assignments subquery (RLS) → teacher_owns_assignment() (definer)
drop policy if exists "Teacher: manage own assignment group links" on public.assignment_groups;
create policy "Teacher: manage own assignment group links" on public.assignment_groups
  for all
  using      (public.teacher_owns_assignment(assignment_id))
  with check (public.teacher_owns_assignment(assignment_id));

-- Student: student_groups subquery (RLS) → is_enrolled_in_group() (mavjud definer)
drop policy if exists "Student: read own group assignment links" on public.assignment_groups;
create policy "Student: read own group assignment links" on public.assignment_groups
  for select
  using (public.is_enrolled_in_group(group_id));

-- ── assignments — siklning ikkinchi tomoni ───────────────────────────────────
-- Student: assignment_groups subquery (RLS) → student_can_see_assignment() (definer)
drop policy if exists "Student: read published assignments for own groups" on public.assignments;
create policy "Student: read published assignments for own groups" on public.assignments
  for select
  using (public.student_can_see_assignment(id));

-- ── assignment_attachments — xuddi shu join, helper bilan ─────────────────────
drop policy if exists "Student: read attachments for visible assignments" on public.assignment_attachments;
create policy "Student: read attachments for visible assignments" on public.assignment_attachments
  for select
  using (public.student_can_see_assignment(assignment_id));

-- ── assignment_submissions — o'z topshirig'ini yuborish (INSERT) ──────────────
drop policy if exists "Student: insert own submissions" on public.assignment_submissions;
create policy "Student: insert own submissions" on public.assignment_submissions
  for insert
  with check (
    student_id = auth.uid()
    and public.student_can_see_assignment(assignment_id)
  );

notify pgrst, 'reload schema';
