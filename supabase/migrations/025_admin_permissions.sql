-- ════════════════════════════════════════════════════════════════════════════
-- 025_admin_permissions.sql
-- YordamchiAI — Super Admin + Limited Admin ruxsat tizimi (additiv, xavfsiz).
--
-- Mavjud auth/role tizimi o'zgarmaydi ('admin' roli qoladi). Qo'shiladi:
--   • profiles.is_super_admin — to'liq huquqli super admin
--   • admin_permissions       — cheklangan adminlar uchun ruxsatlar + status
--   • is_super_admin()        — RLS yordamchisi
--   • subscriptions ga admin YOZISH policy (Premium boshqaruvi — mavjud jadval)
--
-- Cheklangan adminlar ruxsatlari bo'lim darajasida app tomonida ham tekshiriladi.
-- Student/Teacher paneli RLS'iga tegilmaydi. Idempotent.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Super admin bayrog'i ──────────────────────────────────────────────────
alter table public.profiles add column if not exists is_super_admin boolean not null default false;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_super_admin from public.profiles where id = auth.uid()), false);
$$;

-- ── 2. admin_permissions ─────────────────────────────────────────────────────
-- permissions: 'users_manage','teachers_manage','students_manage','courses_manage',
--              'payments_manage','premium_manage','analytics_view','settings_manage'
create table if not exists public.admin_permissions (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null unique references public.profiles(id) on delete cascade,
  permissions text[] not null default '{}',
  status      text not null default 'active' check (status in ('active','disabled')),
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── 3. RLS ──────────────────────────────────────────────────────────────────
alter table public.admin_permissions enable row level security;

-- Super admin: barcha admin ruxsatlarini boshqaradi
drop policy if exists admin_perm_super on public.admin_permissions;
create policy admin_perm_super on public.admin_permissions for all
  using (public.is_super_admin()) with check (public.is_super_admin());

-- Admin: o'z ruxsatlarini o'qiy oladi
drop policy if exists admin_perm_self on public.admin_permissions;
create policy admin_perm_self on public.admin_permissions for select
  using (admin_id = auth.uid());

-- ── 4. subscriptions — admin YOZISH (Premium boshqaruvi, mavjud jadval) ──────
-- 022 da faqat SELECT bor edi; admin uchun to'liq boshqaruv qo'shamiz.
drop policy if exists subscriptions_admin_manage on public.subscriptions;
create policy subscriptions_admin_manage on public.subscriptions for all
  using (public.get_my_profile_role() = 'admin')
  with check (public.get_my_profile_role() = 'admin');

-- ── 5. Profil is_super_admin ni faqat super admin o'zgartira oladi (yozuv himoyasi)
-- (profiles select/update policylari mavjud — bu yerda faqat super admin uchun
--  qo'shimcha update policy, mavjudlarni buzmasdan.)
drop policy if exists profiles_superadmin_update on public.profiles;
create policy profiles_superadmin_update on public.profiles for update
  using (public.is_super_admin()) with check (public.is_super_admin());
