-- ============================================================================
-- 046_telegram_triggers_rest.sql  (6-bosqich: teacher/admin/super + muddat)
--
-- Barcha triggerlar notify_telegram (045) orqali → xato asosiy amalni buzmaydi.
--   teacher:  topshiriq yuborildi · yangi talaba
--   admin:    yangi a'zo · to'lov holati
--   super:    yangi tashkilot · yangi to'lov (pending)
--   cron:     muddat eslatmasi (topshiriqdan 1 kun oldin, topshirmaganlarga)
-- ============================================================================

-- ── Teacher: topshiriq yuborildi ─────────────────────────────────────────────
create or replace function public.tg_notify_submission()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_teacher uuid; v_title text; v_student text;
begin
  select teacher_id, title into v_teacher, v_title from public.assignments where id = NEW.assignment_id;
  if v_teacher is null then return NEW; end if;
  select full_name into v_student from public.profiles where id = NEW.student_id;
  perform public.notify_telegram(array[v_teacher], 'submission',
    '📥 <b>Topshiriq yuborildi</b>' || E'\n' || coalesce(v_student, '') || coalesce(E'\n' || v_title, ''));
  return NEW;
end $$;
drop trigger if exists trg_notify_submission on public.assignment_submissions;
create trigger trg_notify_submission after insert on public.assignment_submissions
  for each row execute function public.tg_notify_submission();

-- ── Teacher: yangi talaba guruhга qo'shildi ─────────────────────────────────
create or replace function public.tg_notify_new_student()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_teacher uuid; v_student text; v_group text;
begin
  select teacher_id, name into v_teacher, v_group from public.groups where id = NEW.group_id;
  if v_teacher is null then return NEW; end if;
  select full_name into v_student from public.profiles where id = NEW.student_id;
  perform public.notify_telegram(array[v_teacher], 'new_student',
    '👥 <b>Yangi talaba</b>' || E'\n' || coalesce(v_student, '') || coalesce(E'\nGuruh: ' || v_group, ''));
  return NEW;
end $$;
drop trigger if exists trg_notify_new_student on public.student_groups;
create trigger trg_notify_new_student after insert on public.student_groups
  for each row execute function public.tg_notify_new_student();

-- ── Admin: yangi a'zo tashkilotга qo'shildi ─────────────────────────────────
create or replace function public.tg_notify_new_member()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_admins uuid[];
begin
  if NEW.organization_id is not null and NEW.organization_id is distinct from OLD.organization_id then
    select array_agg(id) into v_admins from public.profiles
      where organization_id = NEW.organization_id and role = 'admin' and id <> NEW.id;
    perform public.notify_telegram(v_admins, 'new_member',
      '👤 <b>Yangi a''zo qo''shildi</b>' || E'\n' || coalesce(NEW.full_name, '') || coalesce(E'\nRol: ' || NEW.role, ''));
  end if;
  return NEW;
end $$;
drop trigger if exists trg_notify_new_member on public.profiles;
create trigger trg_notify_new_member after update on public.profiles
  for each row execute function public.tg_notify_new_member();

-- ── Admin/user: to'lov holati (tasdiq/rad) ──────────────────────────────────
create or replace function public.tg_notify_payment()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_rec uuid[]; v_msg text;
begin
  if NEW.status is distinct from OLD.status and NEW.status in ('success', 'failed') then
    if NEW.organization_id is not null then
      select array_agg(id) into v_rec from public.profiles where organization_id = NEW.organization_id and role = 'admin';
    else
      v_rec := array[NEW.user_id];
    end if;
    v_msg := case when NEW.status = 'success' then '💳 <b>To''lov tasdiqlandi</b>' else '💳 <b>To''lov rad etildi</b>' end
             || coalesce(E'\nReja: ' || NEW.plan_type, '');
    perform public.notify_telegram(v_rec, 'payment', v_msg);
  end if;
  return NEW;
end $$;
drop trigger if exists trg_notify_payment on public.payments;
create trigger trg_notify_payment after update on public.payments
  for each row execute function public.tg_notify_payment();

-- ── Super-admin: yangi to'lov (pending) ─────────────────────────────────────
create or replace function public.tg_notify_payment_pending()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_supers uuid[];
begin
  if NEW.status = 'pending' then
    select array_agg(id) into v_supers from public.profiles where is_super_admin = true;
    perform public.notify_telegram(v_supers, 'new_payment',
      '💰 <b>Yangi to''lov — tasdiqlash kutilmoqda</b>' || coalesce(E'\nReja: ' || NEW.plan_type, '') || coalesce(E'\nSumma: ' || NEW.amount::text, ''));
  end if;
  return NEW;
end $$;
drop trigger if exists trg_notify_payment_pending on public.payments;
create trigger trg_notify_payment_pending after insert on public.payments
  for each row execute function public.tg_notify_payment_pending();

-- ── Super-admin: yangi tashkilot ────────────────────────────────────────────
create or replace function public.tg_notify_new_org()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_supers uuid[];
begin
  select array_agg(id) into v_supers from public.profiles where is_super_admin = true;
  perform public.notify_telegram(v_supers, 'new_org', '🏢 <b>Yangi tashkilot</b>' || E'\n' || coalesce(NEW.name, ''));
  return NEW;
end $$;
drop trigger if exists trg_notify_new_org on public.organizations;
create trigger trg_notify_new_org after insert on public.organizations
  for each row execute function public.tg_notify_new_org();

-- ── Muddat eslatmasi (cron) — ertaga tugaydigan topshiriqlar, topshirmaganlarга ─
create or replace function public.notify_upcoming_deadlines()
returns void language plpgsql security definer set search_path = public as $$
declare r record; v_students uuid[];
begin
  for r in
    select a.id, a.title from public.assignments a
    where a.status = 'published' and a.deleted_at is null
      and a.deadline is not null and a.deadline::date = (current_date + 1)
  loop
    select array_agg(distinct sg.student_id) into v_students
      from public.assignment_groups ag
      join public.student_groups sg on sg.group_id = ag.group_id
      where ag.assignment_id = r.id
        and not exists (
          select 1 from public.assignment_submissions s
          where s.assignment_id = r.id and s.student_id = sg.student_id and s.deleted_at is null
        );
    perform public.notify_telegram(v_students, 'deadline',
      '⏰ <b>Muddat yaqinlashdi</b>' || E'\n' || r.title || E'\nErtaga topshirish kerak!');
  end loop;
end $$;

-- Har kuni 05:00 UTC (Toshkent 10:00) ishga tushadi
do $$ begin perform cron.unschedule('telegram-deadlines'); exception when others then null; end $$;
select cron.schedule('telegram-deadlines', '0 5 * * *', $$ select public.notify_upcoming_deadlines(); $$);
