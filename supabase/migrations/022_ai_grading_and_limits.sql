-- ════════════════════════════════════════════════════════════════════════════
-- 022_ai_grading_and_limits.sql
-- YordamchiAI — AI assignment checking + Freemium AI usage limits + AI reviews
--
-- Yangi jadvallar:
--   • ai_reviews              — AI baholash natijalari (submission bo'yicha)
--   • subscriptions           — foydalanuvchi rejasi (free / premium / education)
--   • ai_usage                — kunlik/haftalik AI ishlatilishi hisobi
--   • organization_ai_limits  — muassasa (tashkilot) oylik AI krediti
--
-- assignment_submissions ga qo'shimcha ustunlar: answer_text, file_type,
-- ai_checked, teacher_checked.
--
-- Idempotent: qayta ishga tushirsa xato bermaydi (IF NOT EXISTS / DROP POLICY).
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. assignment_submissions — yangi ustunlar ──────────────────────────────
alter table public.assignment_submissions
  add column if not exists answer_text     text,
  add column if not exists file_type       text,
  add column if not exists ai_checked       boolean not null default false,
  add column if not exists teacher_checked  boolean not null default false;

-- ── 2. ai_reviews ───────────────────────────────────────────────────────────
create table if not exists public.ai_reviews (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references public.assignment_submissions(id) on delete cascade,
  ai_score        integer,                          -- 0..100
  feedback        text,
  mistakes        jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  weak_topics     jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists ai_reviews_submission_idx on public.ai_reviews(submission_id);

-- ── 3. subscriptions ────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  plan_type   text not null default 'free' check (plan_type in ('free','premium','education')),
  status      text not null default 'active' check (status in ('active','expired','cancelled')),
  started_at  timestamptz not null default now(),
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);
create unique index if not exists subscriptions_user_active_idx
  on public.subscriptions(user_id) where status = 'active';

-- ── 4. ai_usage ─────────────────────────────────────────────────────────────
create table if not exists public.ai_usage (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  feature_type  text not null check (feature_type in
                  ('ai_chat','image_solving','pdf_analysis','voice','assignment_check')),
  used_count    integer not null default 0,
  limit_count   integer not null default 0,
  reset_date    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, feature_type)
);
create index if not exists ai_usage_user_idx on public.ai_usage(user_id);

-- ── 5. organization_ai_limits ───────────────────────────────────────────────
create table if not exists public.organization_ai_limits (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  monthly_limit   integer not null default 0,
  used_amount     integer not null default 0,
  reset_date      timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (organization_id)
);

-- ── 6. RLS ──────────────────────────────────────────────────────────────────
alter table public.ai_reviews             enable row level security;
alter table public.subscriptions          enable row level security;
alter table public.ai_usage               enable row level security;
alter table public.organization_ai_limits enable row level security;

-- ai_reviews: talaba o'z topshirig'ining AI bahosini ko'radi; o'qituvchi/admin ham
drop policy if exists ai_reviews_select on public.ai_reviews;
create policy ai_reviews_select on public.ai_reviews for select using (
  exists (
    select 1 from public.assignment_submissions s
    where s.id = ai_reviews.submission_id and s.student_id = auth.uid()
  )
  or public.get_my_profile_role() in ('teacher','admin')
);
drop policy if exists ai_reviews_insert on public.ai_reviews;
create policy ai_reviews_insert on public.ai_reviews for insert with check (
  exists (
    select 1 from public.assignment_submissions s
    where s.id = ai_reviews.submission_id and s.student_id = auth.uid()
  )
);

-- subscriptions: foydalanuvchi o'z rejasini ko'radi
drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions for select
  using (user_id = auth.uid() or public.get_my_profile_role() = 'admin');

-- ai_usage: foydalanuvchi o'z hisobini ko'radi/yangilaydi
drop policy if exists ai_usage_all on public.ai_usage;
create policy ai_usage_all on public.ai_usage for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- organization_ai_limits: faqat admin
drop policy if exists org_limits_admin on public.organization_ai_limits;
create policy org_limits_admin on public.organization_ai_limits for all
  using (public.get_my_profile_role() = 'admin')
  with check (public.get_my_profile_role() = 'admin');
