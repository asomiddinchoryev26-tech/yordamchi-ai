-- ============================================================
-- YordamchiAI — Migration 027: Premium Plans + Manual Payments
--
-- Bu migratsiya MAVJUD tizimni KENGAYTIRADI (dublikat yaratmaydi):
--   • subscriptions (022) va payments (026) allaqachon mavjud.
--   • Bu yerda faqat YETISHMAYOTGAN qismlar qo'shiladi:
--       1) plans — reja katalogi (Free / Premium / Pro)
--       2) is_premium(uid) — server tomonidagi ruxsat yordamchisi
--       3) payments — qo'lda to'lov oqimi (chek yuklash + admin tasdiqi)
--       4) approve_payment / reject_payment — admin-only, premium'ni aktivlashtiradi
--       5) receipts storage bucket
--
-- XAVFSIZLIK: foydalanuvchi O'ZINI premium qila OLMAYDI.
--   • subscriptions ustida user yozish policy'si YO'Q (faqat admin — 025).
--   • payments'ga user faqat status='pending' bilan INSERT qila oladi.
--   • approve/reject faqat admin (SECURITY DEFINER, ichida rol tekshiriladi).
--
-- Idempotent: qayta ishga tushirish xavfsiz.
-- ============================================================

-- ── 1. PLANS — reja katalogi (Free / Premium / Pro) ──────────────────────────
create table if not exists public.plans (
  key         text primary key,               -- 'free' | 'premium' | 'pro' | 'education'
  name        text not null,
  price_uzs   numeric(12,2) not null default 0,
  period      text not null default 'month' check (period in ('month','year','once')),
  features    jsonb   not null default '[]'::jsonb,
  ai_limits   jsonb   not null default '{}'::jsonb,
  is_active   boolean not null default true,
  sort_order  int     not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.plans enable row level security;

-- Hamma faol rejalarni o'qiy oladi (narx/xususiyat ko'rsatish uchun)
drop policy if exists plans_public_read on public.plans;
create policy plans_public_read on public.plans for select
  using (is_active = true);

-- Faqat admin rejalarni boshqaradi
drop policy if exists plans_admin_manage on public.plans;
create policy plans_admin_manage on public.plans for all
  using (public.get_my_profile_role() = 'admin')
  with check (public.get_my_profile_role() = 'admin');

-- Boshlang'ich rejalar (mavjud bo'lsa yangilanadi)
insert into public.plans (key, name, price_uzs, period, features, ai_limits, sort_order) values
  ('free',    'Bepul',   0,      'month',
    '["AI suhbat (kuniga 20)", "Asosiy darslar", "Test yechish"]'::jsonb,
    '{"ai_chat":20,"image_solving":3,"pdf_analysis":3}'::jsonb, 0),
  ('premium', 'Premium', 49000,  'month',
    '["AI suhbat (kuniga 300)", "AI Vision (rasm/PDF)", "QR davomat", "Premium kurslar", "Ustuvor yordam"]'::jsonb,
    '{"ai_chat":300,"image_solving":50,"pdf_analysis":30}'::jsonb, 1),
  ('pro',     'Pro',     99000,  'month',
    '["Premium hammasi", "Cheksiz AI Vision", "Kengaytirilgan analitika", "Sertifikatlar", "1-1 mentor"]'::jsonb,
    '{"ai_chat":1000,"image_solving":200,"pdf_analysis":100}'::jsonb, 2)
on conflict (key) do update set
  name = excluded.name, price_uzs = excluded.price_uzs, period = excluded.period,
  features = excluded.features, ai_limits = excluded.ai_limits, sort_order = excluded.sort_order;

-- ── 2. subscriptions — 'pro' rejasini qo'llab-quvvatlash (Pro-ready) ─────────
-- 022 dagi CHECK faqat free/premium/education edi. 'pro' ni qo'shamiz (kengaytirish).
alter table public.subscriptions drop constraint if exists subscriptions_plan_type_check;
alter table public.subscriptions add constraint subscriptions_plan_type_check
  check (plan_type in ('free','premium','education','pro'));

-- ── 3. is_premium(uid) — server tomonidagi ruxsat yordamchisi ────────────────
-- Faol, muddati o'tmagan premium/pro/education obunani tekshiradi.
create or replace function public.is_premium(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid
      and s.status  = 'active'
      and s.plan_type in ('premium','pro','education')
      and (s.expires_at is null or s.expires_at > now())
  );
$$;

-- Joriy foydalanuvchi uchun qulaylik (RLS/klient uchun)
create or replace function public.my_is_premium()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_premium(auth.uid());
$$;

grant execute on function public.is_premium(uuid) to authenticated;
grant execute on function public.my_is_premium()  to authenticated;

-- ── 4. payments — qo'lda to'lov oqimi uchun ustunlar ─────────────────────────
-- Mavjud jadval (026): id, user_id, amount, currency, provider, status, metadata, created_at
alter table public.payments add column if not exists plan_type   text;
alter table public.payments add column if not exists receipt_url text;
alter table public.payments add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;
alter table public.payments add column if not exists reviewed_at timestamptz;
alter table public.payments add column if not exists review_note text;

-- Foydalanuvchi O'Z to'lovini FAQAT 'pending' holatda yuborishi mumkin
-- (o'zini 'success' qila olmaydi — bu admin approve_payment orqali bo'ladi).
drop policy if exists payments_own_insert on public.payments;
create policy payments_own_insert on public.payments for insert
  with check (user_id = auth.uid() and status = 'pending');

-- ── 5. approve_payment — admin-only, atomik: success + premium aktivatsiya ────
create or replace function public.approve_payment(p_payment_id uuid, p_days int default 30)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pay   public.payments;
  v_plan  text;
begin
  if public.get_my_profile_role() <> 'admin' then
    raise exception 'forbidden';
  end if;

  select * into v_pay from public.payments where id = p_payment_id;
  if v_pay.id is null then raise exception 'payment_not_found'; end if;
  if v_pay.status = 'success' then return; end if;   -- allaqachon tasdiqlangan

  v_plan := coalesce(v_pay.plan_type, 'premium');
  if v_plan not in ('premium','pro','education') then v_plan := 'premium'; end if;

  -- To'lovni tasdiqlaymiz
  update public.payments
    set status = 'success', reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_payment_id;

  -- Eski faol obunani yopamiz, yangisini ochamiz (mavjud setUserPlan mantig'i)
  update public.subscriptions set status = 'expired'
    where user_id = v_pay.user_id and status = 'active';

  insert into public.subscriptions (user_id, plan_type, status, started_at, expires_at)
    values (v_pay.user_id, v_plan, 'active', now(), now() + make_interval(days => greatest(p_days, 1)));
end;
$$;

-- ── 6. reject_payment — admin-only ───────────────────────────────────────────
create or replace function public.reject_payment(p_payment_id uuid, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.get_my_profile_role() <> 'admin' then
    raise exception 'forbidden';
  end if;
  update public.payments
    set status = 'failed', reviewed_by = auth.uid(), reviewed_at = now(),
        review_note = coalesce(p_note, review_note)
    where id = p_payment_id;
end;
$$;

grant execute on function public.approve_payment(uuid, int) to authenticated;
grant execute on function public.reject_payment(uuid, text)  to authenticated;

-- ── 7. receipts storage bucket (to'lov cheklari) ─────────────────────────────
insert into storage.buckets (id, name, public)
  values ('receipts', 'receipts', true)
  on conflict (id) do nothing;

-- Foydalanuvchi O'Z papkasiga (uid/...) chek yuklaydi
drop policy if exists "Receipts: upload own" on storage.objects;
create policy "Receipts: upload own" on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Chekni o'qish: egasi yoki admin (bucket public bo'lsa ham policy aniqroq)
drop policy if exists "Receipts: read own or admin" on storage.objects;
create policy "Receipts: read own or admin" on storage.objects for select
  using (
    bucket_id = 'receipts'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.get_my_profile_role() = 'admin'
    )
  );

-- Admin chekni o'chira oladi (tozalash)
drop policy if exists "Receipts: admin delete" on storage.objects;
create policy "Receipts: admin delete" on storage.objects for delete
  using (bucket_id = 'receipts' and public.get_my_profile_role() = 'admin');
