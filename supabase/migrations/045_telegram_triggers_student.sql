-- ============================================================================
-- 045_telegram_triggers_student.sql  (5-bosqich: talaba bildirishnomalari)
--
-- DB hodisalari → telegram-notify edge-funksiya (pg_net orqali):
--   • yangi topshiriq (published)   → guruh talabalari
--   • topshiriq baholandi           → o'sha talaba
--   • davomat belgilandi            → o'sha talaba
--
-- MUHIM: notify_telegram xatosi ASOSIY amalni (topshiriq/davomat yaratish)
-- BUZMAYDI — exception ushlanadi. net.http_post async (bloklamaydi).
-- Notify sirini gitga qo'ymaymiz — telegram_runtime jadvalіга ALOHIDA yoziladi.
-- ============================================================================

-- ── Runtime config (notify_secret + notify_url) — RLS: hech kimga ochiq emas ──
create table if not exists public.telegram_runtime (
  key   text primary key,
  value text not null
);
alter table public.telegram_runtime enable row level security;
-- policy yo'q → anon/authenticated o'qiy olmaydi; SECURITY DEFINER (postgres) o'qiydi

-- ── Yordamchi: berilgan foydalanuvchilarга bildirishnoma yuborish ────────────
create or replace function public.notify_telegram(p_user_ids uuid[], p_event text, p_text text)
returns void language plpgsql security definer set search_path = public, net, extensions as $$
declare v_secret text; v_url text;
begin
  if p_user_ids is null or array_length(p_user_ids, 1) is null or coalesce(p_text,'') = '' then return; end if;
  select value into v_secret from public.telegram_runtime where key = 'notify_secret';
  select value into v_url    from public.telegram_runtime where key = 'notify_url';
  if v_secret is null or v_url is null then return; end if;
  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-notify-secret', v_secret),
    body    := jsonb_build_object('user_ids', to_jsonb(p_user_ids), 'event', p_event, 'text', p_text)
  );
exception when others then
  return;  -- bildirishnoma xatosi asosiy tranzaksiyani buzmasin
end $$;

-- ── 1) Yangi topshiriq — guruh talabalarига ─────────────────────────────────
-- (a) published topshiriq guruhга biriktirilganда
create or replace function public.tg_notify_assignment_group()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_title text; v_students uuid[];
begin
  select title into v_title from public.assignments
    where id = NEW.assignment_id and status = 'published' and deleted_at is null;
  if v_title is null then return NEW; end if;
  select array_agg(student_id) into v_students from public.student_groups where group_id = NEW.group_id;
  perform public.notify_telegram(v_students, 'new_assignment', '📝 <b>Yangi topshiriq</b>' || E'\n' || v_title);
  return NEW;
end $$;
drop trigger if exists trg_notify_assignment_group on public.assignment_groups;
create trigger trg_notify_assignment_group after insert on public.assignment_groups
  for each row execute function public.tg_notify_assignment_group();

-- (b) topshiriq draftдан published'га o'tганда (allaqachon biriktirilган guruhлар)
create or replace function public.tg_notify_assignment_published()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_students uuid[];
begin
  if NEW.status = 'published' and OLD.status is distinct from 'published' and NEW.deleted_at is null then
    select array_agg(distinct sg.student_id) into v_students
      from public.assignment_groups ag join public.student_groups sg on sg.group_id = ag.group_id
      where ag.assignment_id = NEW.id;
    perform public.notify_telegram(v_students, 'new_assignment', '📝 <b>Yangi topshiriq</b>' || E'\n' || NEW.title);
  end if;
  return NEW;
end $$;
drop trigger if exists trg_notify_assignment_published on public.assignments;
create trigger trg_notify_assignment_published after update on public.assignments
  for each row execute function public.tg_notify_assignment_published();

-- ── 2) Topshiriq baholandi — o'sha talабага ─────────────────────────────────
create or replace function public.tg_notify_grade()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_title text;
begin
  if NEW.graded_at is not null and (OLD.graded_at is null or NEW.score is distinct from OLD.score) then
    select title into v_title from public.assignments where id = NEW.assignment_id;
    perform public.notify_telegram(array[NEW.student_id], 'grade',
      '✅ <b>Topshiriq baholandi</b>' || E'\n' || coalesce(v_title, '')
      || coalesce(E'\nBaho: ' || NEW.score::text, ''));
  end if;
  return NEW;
end $$;
drop trigger if exists trg_notify_grade on public.assignment_submissions;
create trigger trg_notify_grade after update on public.assignment_submissions
  for each row execute function public.tg_notify_grade();

-- ── 3) Davomat belgilandi — o'sha talабага ──────────────────────────────────
create or replace function public.tg_notify_attendance()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_telegram(array[NEW.student_id], 'attendance',
    '📅 <b>Davomat belgilandi</b>' || E'\nHolat: ' || coalesce(NEW.status, '—')
    || E'\nSana: ' || NEW.attended_date::text);
  return NEW;
end $$;
drop trigger if exists trg_notify_attendance on public.attendance;
create trigger trg_notify_attendance after insert on public.attendance
  for each row execute function public.tg_notify_attendance();
