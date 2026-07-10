-- ============================================================================
-- 044_telegram_links.sql   (Telegram bildirishnoma — 1-bosqich: poydevor)
--
-- Telegram bog'lash + bildirishnoma sozlamalari ALOHIDA jadvalда saqlanadi
-- (profiles'да emas): profiles'ni org a'zolari o'qiy oladi, shu sabab bog'lash
-- kodi/chat_id u yerда bo'lса — o'g'irlanishi mumkin. Bu jadval faqat o'z
-- qatorини o'qishга ruxsat beradi; barcha yozuvlar SECURITY DEFINER RPC'lar
-- yoki webhook (service_role) orqali.
-- ============================================================================

create table if not exists public.telegram_links (
  user_id     uuid primary key references public.profiles(id) on delete cascade,
  chat_id     text,                       -- webhook (service_role) o'rnatadi
  tg_username text,
  link_code   text,                       -- vaqtinchalik bog'lash kodi (deep-link)
  prefs       jsonb not null default '{}'::jsonb,   -- {} = barchasi yoqilgan (default)
  linked_at   timestamptz,
  updated_at  timestamptz not null default now()
);

create index if not exists idx_tg_links_code on public.telegram_links(link_code) where link_code is not null;
create index if not exists idx_tg_links_chat on public.telegram_links(chat_id)   where chat_id   is not null;

alter table public.telegram_links enable row level security;

-- Faqat o'z qatorини O'QISH (yozuv yo'q — RPC/webhook orqali). super-admin ham ko'radi.
drop policy if exists telegram_links_read_own on public.telegram_links;
create policy telegram_links_read_own on public.telegram_links
  for select using (user_id = auth.uid() or is_super_admin());

-- ── RPC: bog'lashni boshlash — kod yaratadi (UI deep-link uchun) ──────────────
create or replace function public.telegram_start_link()
returns text language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  -- pgcrypto (extensions sxeması) search_path'да yo'q → gen_random_uuid ishlatamiz
  v_code := replace(gen_random_uuid()::text, '-', '');
  insert into public.telegram_links (user_id, link_code, updated_at)
    values (auth.uid(), v_code, now())
  on conflict (user_id) do update set link_code = excluded.link_code, updated_at = now();
  return v_code;
end $$;
grant execute on function public.telegram_start_link() to authenticated;

-- ── RPC: bildirishnoma sozlamalarини yangilash ───────────────────────────────
create or replace function public.telegram_set_prefs(p_prefs jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  insert into public.telegram_links (user_id, prefs, updated_at)
    values (auth.uid(), coalesce(p_prefs, '{}'::jsonb), now())
  on conflict (user_id) do update set prefs = coalesce(p_prefs, '{}'::jsonb), updated_at = now();
end $$;
grant execute on function public.telegram_set_prefs(jsonb) to authenticated;

-- ── RPC: Telegram'ni uzish ───────────────────────────────────────────────────
create or replace function public.telegram_unlink()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  update public.telegram_links
     set chat_id = null, tg_username = null, link_code = null, linked_at = null, updated_at = now()
   where user_id = auth.uid();
end $$;
grant execute on function public.telegram_unlink() to authenticated;
