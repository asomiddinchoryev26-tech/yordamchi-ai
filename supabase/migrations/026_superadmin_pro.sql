-- ════════════════════════════════════════════════════════════════════════════
-- 026_superadmin_pro.sql
-- YordamchiAI — Super Admin PRO: activity logs, role templates, system health,
-- payments (tayyorgarlik), global announcements (mavjud notification tizimiga
-- ulanadi), promo kodlar (mavjud subscription bilan).
--
-- Mavjud tizimlar o'zgarmaydi. is_super_admin() (025) + get_my_profile_role()
-- ishlatiladi. Idempotent.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1) activity_logs (audit) ─────────────────────────────────────────────────
create table if not exists public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  action      text not null,
  target_type text,
  target_id   uuid,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists activity_logs_created_idx on public.activity_logs(created_at desc);
alter table public.activity_logs enable row level security;
-- Adminlar o'z harakatini yozadi; ko'rish/o'chirish faqat super admin
drop policy if exists activity_logs_insert on public.activity_logs;
create policy activity_logs_insert on public.activity_logs for insert
  with check (actor_id = auth.uid() and public.get_my_profile_role() = 'admin');
drop policy if exists activity_logs_super_read on public.activity_logs;
create policy activity_logs_super_read on public.activity_logs for select using (public.is_super_admin());
drop policy if exists activity_logs_super_delete on public.activity_logs;
create policy activity_logs_super_delete on public.activity_logs for delete using (public.is_super_admin());

-- ── 2) admin_role_templates ──────────────────────────────────────────────────
create table if not exists public.admin_role_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  permissions text[] not null default '{}',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
alter table public.admin_role_templates enable row level security;
drop policy if exists role_templates_super on public.admin_role_templates;
create policy role_templates_super on public.admin_role_templates for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ── 3) announcements (+ notification fan-out) ────────────────────────────────
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text,
  target     text not null default 'all' check (target in ('all','students','teachers','admins')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists announcements_super on public.announcements;
create policy announcements_super on public.announcements for all
  using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists announcements_read on public.announcements;
create policy announcements_read on public.announcements for select using (auth.uid() is not null);

-- E'lon yaratilganda maqsadli foydalanuvchilarga MAVJUD notifications orqali xabar
create or replace function public.notify_announcement()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body, data)
  select p.id, 'system', NEW.title, NEW.body, jsonb_build_object('announcement_id', NEW.id)
  from public.profiles p
  where NEW.target = 'all'
     or (NEW.target = 'students' and p.role = 'student')
     or (NEW.target = 'teachers' and p.role = 'teacher')
     or (NEW.target = 'admins'   and p.role = 'admin');
  return NEW;
end; $$;
drop trigger if exists trg_notify_announcement on public.announcements;
create trigger trg_notify_announcement
  after insert on public.announcements
  for each row execute function public.notify_announcement();

-- ── 4) payments (tayyorgarlik — real integratsiya yo'q) ──────────────────────
create table if not exists public.payments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  amount     numeric(12,2) not null default 0,
  currency   text not null default 'UZS',
  provider   text check (provider in ('click','payme','card')),
  status     text not null default 'pending' check (status in ('pending','success','failed','refunded')),
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists payments_user_idx on public.payments(user_id);
alter table public.payments enable row level security;
drop policy if exists payments_admin on public.payments;
create policy payments_admin on public.payments for all
  using (public.get_my_profile_role() = 'admin')
  with check (public.get_my_profile_role() = 'admin');
drop policy if exists payments_own_read on public.payments;
create policy payments_own_read on public.payments for select using (user_id = auth.uid());

-- ── 5) promo_codes + promo_code_usage ────────────────────────────────────────
create table if not exists public.promo_codes (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  discount_type text not null check (discount_type in ('percentage','free_days')),
  discount_value integer not null default 0,   -- % yoki kunlar soni
  usage_limit   integer,                        -- null = cheksiz
  used_count    integer not null default 0,
  expires_at    timestamptz,
  is_active     boolean not null default true,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create table if not exists public.promo_code_usage (
  id       uuid primary key default gen_random_uuid(),
  promo_id uuid not null references public.promo_codes(id) on delete cascade,
  user_id  uuid not null references public.profiles(id) on delete cascade,
  used_at  timestamptz not null default now(),
  unique (promo_id, user_id)
);
alter table public.promo_codes      enable row level security;
alter table public.promo_code_usage enable row level security;
-- Super admin promo yaratadi/boshqaradi; barcha auth faol promoni o'qiy oladi (tekshirish)
drop policy if exists promo_codes_super on public.promo_codes;
create policy promo_codes_super on public.promo_codes for all
  using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists promo_codes_read on public.promo_codes;
create policy promo_codes_read on public.promo_codes for select
  using (is_active = true and (expires_at is null or expires_at > now()));
-- Foydalanuvchi o'z ishlatishini yozadi/ko'radi; super admin hammasini
drop policy if exists promo_usage_own on public.promo_code_usage;
create policy promo_usage_own on public.promo_code_usage for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists promo_usage_super on public.promo_code_usage;
create policy promo_usage_super on public.promo_code_usage for select using (public.is_super_admin());
