-- ============================================================
-- YordamchiAI — profiles table
-- Supabase SQL Editor'da shu faylni to'liq ishga tushiring
-- ============================================================

-- 1. Profiles jadvali
create table if not exists public.profiles (
  id         uuid        primary key references auth.users on delete cascade,
  full_name  text,
  email      text,
  role       text        not null default 'student'
                         check (role in ('student', 'teacher', 'admin')),
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now())
);

-- 2. Row Level Security yoqish
alter table public.profiles enable row level security;

-- 3. Policies

-- Foydalanuvchi faqat o'z profilini ko'ra oladi
create policy "Users: read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Foydalanuvchi faqat o'z profilini yangilay oladi
create policy "Users: update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Foydalanuvchi o'z profilini qo'sha oladi (trigger ham ishlatadi)
create policy "Users: insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- 4. Auto-profile trigger: ro'yxatdan o'tgandan so'ng profil yaratish
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger: auth.users'ga yangi qator qo'shilganda ishga tushadi
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 5. Indekslar (izlash tezligi uchun)
create index if not exists profiles_role_idx  on public.profiles (role);
create index if not exists profiles_email_idx on public.profiles (email);
