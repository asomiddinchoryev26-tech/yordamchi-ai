-- ============================================================================
-- 029_multitenancy_foundation.sql   (PHASE 1 — additive, backward-compatible)
--
-- Introduces the organization (tenant) layer WITHOUT changing any existing RLS
-- and WITHOUT touching app behaviour:
--   • organizations table
--   • organization_id (NULLABLE) on tenant-scoped tables
--   • all pre-existing data backfilled into one default organization
--   • my_org_id() helper for the org-scoped RLS added in Phase 2
--
-- Columns are nullable, no existing policy is modified, and the app does not yet
-- read organization_id — so the live app and the pilot data keep working exactly
-- as before. Phase 2 (RLS) and Phase 3 (onboarding) build on top of this.
-- ============================================================================

-- 1. Organizations (tenants) ------------------------------------------------
create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique,
  plan_type   text not null default 'free',
  status      text not null default 'active',
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

-- 2. Default organization to hold all pre-existing data ---------------------
insert into public.organizations (id, name, slug, plan_type, status)
values ('00000000-0000-0000-0000-000000000001', 'Demo Tashkilot', 'demo', 'free', 'active')
on conflict (id) do nothing;

-- 3. Add organization_id (nullable) to tenant-scoped tables -----------------
alter table public.profiles       add column if not exists organization_id uuid references public.organizations(id);
alter table public.subjects       add column if not exists organization_id uuid references public.organizations(id);
alter table public.groups         add column if not exists organization_id uuid references public.organizations(id);
alter table public.lessons        add column if not exists organization_id uuid references public.organizations(id);
alter table public.tests          add column if not exists organization_id uuid references public.organizations(id);
alter table public.assignments    add column if not exists organization_id uuid references public.organizations(id);
alter table public.attendance     add column if not exists organization_id uuid references public.organizations(id);
alter table public.student_groups add column if not exists organization_id uuid references public.organizations(id);
alter table public.announcements  add column if not exists organization_id uuid references public.organizations(id);

-- 4. Backfill all existing rows into the default organization ---------------
update public.profiles       set organization_id = '00000000-0000-0000-0000-000000000001' where organization_id is null;
update public.subjects       set organization_id = '00000000-0000-0000-0000-000000000001' where organization_id is null;
update public.groups         set organization_id = '00000000-0000-0000-0000-000000000001' where organization_id is null;
update public.lessons        set organization_id = '00000000-0000-0000-0000-000000000001' where organization_id is null;
update public.tests          set organization_id = '00000000-0000-0000-0000-000000000001' where organization_id is null;
update public.assignments    set organization_id = '00000000-0000-0000-0000-000000000001' where organization_id is null;
update public.attendance     set organization_id = '00000000-0000-0000-0000-000000000001' where organization_id is null;
update public.student_groups set organization_id = '00000000-0000-0000-0000-000000000001' where organization_id is null;
update public.announcements  set organization_id = '00000000-0000-0000-0000-000000000001' where organization_id is null;

update public.organizations o
   set created_by = (select id from public.profiles where is_super_admin = true limit 1)
 where o.id = '00000000-0000-0000-0000-000000000001' and o.created_by is null;

-- 5. Indexes for the upcoming org-scoped RLS --------------------------------
create index if not exists idx_profiles_org       on public.profiles(organization_id);
create index if not exists idx_subjects_org       on public.subjects(organization_id);
create index if not exists idx_groups_org         on public.groups(organization_id);
create index if not exists idx_lessons_org        on public.lessons(organization_id);
create index if not exists idx_tests_org          on public.tests(organization_id);
create index if not exists idx_assignments_org    on public.assignments(organization_id);
create index if not exists idx_attendance_org     on public.attendance(organization_id);
create index if not exists idx_student_groups_org on public.student_groups(organization_id);
create index if not exists idx_announcements_org  on public.announcements(organization_id);

-- 6. Helper: the caller's organization --------------------------------------
-- SECURITY DEFINER so it reads profiles regardless of RLS. Used by Phase-2 policies.
create or replace function public.my_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

grant execute on function public.my_org_id() to authenticated;

-- 7. RLS on the NEW organizations table only (does not affect existing tables)
alter table public.organizations enable row level security;

drop policy if exists organizations_read_own on public.organizations;
create policy organizations_read_own on public.organizations
  for select using (id = my_org_id());
