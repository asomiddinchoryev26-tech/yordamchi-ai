-- ============================================================================
-- 050_academic_structure.sql  (3a: institut akademik strukturasi — DB)
--
-- YANGI jadvallar (institut turi uchun). Maktab/markaz ularni ishlatmaydi
-- (UI feature-gate) → MAVJUD FUNKSIYALAR BUZILMAYDI. Org bo'yicha ajratilган
-- RLS (subjects naqshi). Recursion bo'lmasligi uchun cross-table SECURITY
-- DEFINER helper'lar.
--   semesters          — o'quv semestri / yili
--   courses            — kurs (kredit soati bilan)
--   course_enrollments — talaba kursга yozilishi
-- ============================================================================

-- ── Semestrlar ───────────────────────────────────────────────────────────────
create table if not exists public.semesters (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  start_date      date,
  end_date        date,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);
alter table public.semesters enable row level security;
drop trigger if exists set_org on public.semesters;
create trigger set_org before insert on public.semesters for each row execute function public.tg_set_org_id();

create policy semesters_org_read on public.semesters for select using (organization_id = my_org_id());
create policy semesters_admin on public.semesters for all
  using      (get_my_profile_role() = 'admin' and organization_id = my_org_id())
  with check (get_my_profile_role() = 'admin' and organization_id = my_org_id());
create policy semesters_super on public.semesters for all using (is_super_admin()) with check (is_super_admin());

-- ── Kurslar ──────────────────────────────────────────────────────────────────
create table if not exists public.courses (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  semester_id     uuid references public.semesters(id) on delete set null,
  teacher_id      uuid references public.profiles(id) on delete set null,
  name            text not null,
  code            text,
  credits         int  not null default 0,
  description     text,
  status          text not null default 'active',
  created_at      timestamptz not null default now()
);
alter table public.courses enable row level security;
drop trigger if exists set_org on public.courses;
create trigger set_org before insert on public.courses for each row execute function public.tg_set_org_id();
create index if not exists idx_courses_org on public.courses(organization_id);
create index if not exists idx_courses_teacher on public.courses(teacher_id);

create policy courses_org_read on public.courses for select using (organization_id = my_org_id());
create policy courses_admin on public.courses for all
  using      (get_my_profile_role() = 'admin' and organization_id = my_org_id())
  with check (get_my_profile_role() = 'admin' and organization_id = my_org_id());
create policy courses_teacher on public.courses for all
  using      (teacher_id = auth.uid())
  with check (teacher_id = auth.uid() and organization_id = my_org_id());
create policy courses_super on public.courses for all using (is_super_admin()) with check (is_super_admin());

-- ── Cross-table helper'lar (RLS recursion'сiz) ──────────────────────────────
create or replace function public.org_of_course(p uuid) returns uuid
  language sql stable security definer set search_path = public as $$
  select organization_id from public.courses where id = p $$;
grant execute on function public.org_of_course(uuid) to authenticated;

create or replace function public.teacher_of_course(p uuid) returns uuid
  language sql stable security definer set search_path = public as $$
  select teacher_id from public.courses where id = p $$;
grant execute on function public.teacher_of_course(uuid) to authenticated;

-- ── Kursга yozilish ──────────────────────────────────────────────────────────
create table if not exists public.course_enrollments (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (course_id, student_id)
);
alter table public.course_enrollments enable row level security;
create index if not exists idx_ce_student on public.course_enrollments(student_id);

create policy ce_student_read on public.course_enrollments for select using (student_id = auth.uid());
create policy ce_teacher on public.course_enrollments for all
  using      (teacher_of_course(course_id) = auth.uid())
  with check (teacher_of_course(course_id) = auth.uid());
create policy ce_admin on public.course_enrollments for all
  using      (get_my_profile_role() = 'admin' and org_of_course(course_id) = my_org_id())
  with check (get_my_profile_role() = 'admin' and org_of_course(course_id) = my_org_id());
create policy ce_super on public.course_enrollments for all using (is_super_admin()) with check (is_super_admin());
