-- ════════════════════════════════════════════════════════════════════════════
-- 023_teacher_features.sql
-- YordamchiAI — Teacher panel: lesson analytics, video lessons (Premium),
-- QR attendance (Premium), test AI analysis.
--
-- Mavjud: profiles, groups, lessons, attendance, assignments, ai_reviews,
--         subscriptions, tests, test_results. (tests.questions JSON — savollar
--         shu yerda saqlanadi, alohida test_questions jadvali shart emas.)
--
-- Yangi:  lesson_views, video_lessons, qr_attendance_sessions
--         + test_results ga AI ustunlari.
--
-- Idempotent (IF NOT EXISTS / DROP POLICY).
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. test_results — AI tahlil ustunlari ───────────────────────────────────
alter table public.test_results
  add column if not exists mistakes     jsonb not null default '[]'::jsonb,
  add column if not exists ai_analysis  text;

-- ── 2. lesson_views — kim darsni ochgani / ko'rish vaqti ────────────────────
create table if not exists public.lesson_views (
  id            uuid primary key default gen_random_uuid(),
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  watch_seconds integer not null default 0,
  completed     boolean not null default false,
  first_viewed_at timestamptz not null default now(),
  last_viewed_at  timestamptz not null default now(),
  unique (lesson_id, student_id)
);
create index if not exists lesson_views_lesson_idx on public.lesson_views(lesson_id);

-- ── 3. video_lessons — Premium video darslar (video lessons.video_url ustida
--       ham bo'lishi mumkin; bu jadval metadata + Premium nazorati uchun) ────
create table if not exists public.video_lessons (
  id               uuid primary key default gen_random_uuid(),
  lesson_id        uuid references public.lessons(id) on delete cascade,
  teacher_id       uuid not null references public.profiles(id) on delete cascade,
  video_url        text not null,
  duration_seconds integer,
  created_at       timestamptz not null default now()
);
create index if not exists video_lessons_teacher_idx on public.video_lessons(teacher_id);

-- ── 4. qr_attendance_sessions — Premium QR davomat ──────────────────────────
create table if not exists public.qr_attendance_sessions (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  group_id    uuid not null references public.groups(id) on delete cascade,
  lesson_id   uuid references public.lessons(id) on delete set null,
  code        text not null unique,
  status      text not null default 'active' check (status in ('active','closed')),
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index if not exists qr_sessions_group_idx on public.qr_attendance_sessions(group_id);

-- ── 5. RLS ──────────────────────────────────────────────────────────────────
alter table public.lesson_views            enable row level security;
alter table public.video_lessons           enable row level security;
alter table public.qr_attendance_sessions  enable row level security;

-- lesson_views: talaba o'zinikini yozadi/ko'radi; o'qituvchi/admin ko'radi
drop policy if exists lesson_views_student on public.lesson_views;
create policy lesson_views_student on public.lesson_views for all
  using (student_id = auth.uid())
  with check (student_id = auth.uid());
drop policy if exists lesson_views_staff on public.lesson_views;
create policy lesson_views_staff on public.lesson_views for select
  using (public.get_my_profile_role() in ('teacher','admin'));

-- video_lessons: o'qituvchi o'zinikini boshqaradi; admin hammasini; barcha auth select
drop policy if exists video_lessons_manage on public.video_lessons;
create policy video_lessons_manage on public.video_lessons for all
  using (teacher_id = auth.uid() or public.get_my_profile_role() = 'admin')
  with check (teacher_id = auth.uid() or public.get_my_profile_role() = 'admin');
drop policy if exists video_lessons_select on public.video_lessons;
create policy video_lessons_select on public.video_lessons for select using (auth.uid() is not null);

-- qr_attendance_sessions: o'qituvchi/admin boshqaradi; talaba faol sessiyani o'qiy oladi (skan uchun)
drop policy if exists qr_sessions_manage on public.qr_attendance_sessions;
create policy qr_sessions_manage on public.qr_attendance_sessions for all
  using (teacher_id = auth.uid() or public.get_my_profile_role() = 'admin')
  with check (teacher_id = auth.uid() or public.get_my_profile_role() = 'admin');
drop policy if exists qr_sessions_student_read on public.qr_attendance_sessions;
create policy qr_sessions_student_read on public.qr_attendance_sessions for select
  using (status = 'active');
