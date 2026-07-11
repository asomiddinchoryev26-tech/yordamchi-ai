-- ============================================================================
-- 051_departments.sql  (4a: fakultet/kafedra + mudiri)
--
-- Institut ichida bo'linma (fakultet/kafedra) + kafedra mudiri (head_id).
-- Kurslar kafedraga biriktiriladi (courses.department_id — additiv, ixtiyoriy).
-- Faqat institut turida ishlatiladi (UI gate). Org bo'yicha RLS (subjects naqshi).
-- MAVJUD JADVALLAR/FUNKSIYALAR BUZILMAYDI (yangi jadval + ixtiyoriy ustun).
-- ============================================================================

create table if not exists public.departments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  head_id         uuid references public.profiles(id) on delete set null,  -- kafedra mudiri / dekan
  created_at      timestamptz not null default now()
);
alter table public.departments enable row level security;
drop trigger if exists set_org on public.departments;
create trigger set_org before insert on public.departments for each row execute function public.tg_set_org_id();

create policy departments_org_read on public.departments for select using (organization_id = my_org_id());
create policy departments_admin on public.departments for all
  using      (get_my_profile_role() = 'admin' and organization_id = my_org_id())
  with check (get_my_profile_role() = 'admin' and organization_id = my_org_id());
create policy departments_super on public.departments for all using (is_super_admin()) with check (is_super_admin());

-- Kurs → kafedra (ixtiyoriy)
alter table public.courses add column if not exists department_id uuid references public.departments(id) on delete set null;
