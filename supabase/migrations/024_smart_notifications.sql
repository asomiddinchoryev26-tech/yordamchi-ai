-- ════════════════════════════════════════════════════════════════════════════
-- 024_smart_notifications.sql
-- YordamchiAI — Smart LMS notification event triggers (server-side).
--
-- Mavjud notifications jadvali + RLS (018) o'zgarmaydi — faqat `type` CHECK
-- kengaytiriladi va yangi trigger'lar qo'shiladi (018 dagi
-- notify_assignment_published pattern'i bilan bir xil, SECURITY DEFINER).
--
-- Hodisalar: yangi dars, yangi test, test natijasi, davomat (absent + past %),
--            yutuq, premium video. Dublikat tizim yaratilmaydi.
-- Idempotent.
-- ════════════════════════════════════════════════════════════════════════════

-- ── type CHECK ni kengaytiramiz (yangi turlar) ──────────────────────────────
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'assignment_new','assignment_graded','assignment_deadline',
  'attendance','lesson','video','test','achievement','system'
));

-- ── 1) Yangi dars ────────────────────────────────────────────────────────────
create or replace function public.notify_new_lesson()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_teacher text;
begin
  if NEW.is_published and NEW.group_id is not null
     and (TG_OP = 'INSERT' or OLD.is_published is distinct from true) then
    select full_name into v_teacher from public.profiles where id = NEW.teacher_id;
    insert into public.notifications (user_id, type, title, body, data)
    select sg.student_id, 'lesson',
           '📚 Yangi dars qo''shildi',
           coalesce(v_teacher, 'O''qituvchi') || ' yangi "' || NEW.title || '" darsini yukladi',
           jsonb_build_object('lesson_id', NEW.id, 'group_id', NEW.group_id)
    from public.student_groups sg where sg.group_id = NEW.group_id;
  end if;
  return NEW;
end; $$;
drop trigger if exists trg_notify_new_lesson on public.lessons;
create trigger trg_notify_new_lesson
  after insert or update of is_published on public.lessons
  for each row execute function public.notify_new_lesson();

-- ── 2) Premium video dars ────────────────────────────────────────────────────
create or replace function public.notify_video_lesson()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_group uuid;
begin
  select group_id into v_group from public.lessons where id = NEW.lesson_id;
  if v_group is not null then
    insert into public.notifications (user_id, type, title, body, data)
    select sg.student_id, 'video',
           '🎥 Premium video dars',
           'Yangi video dars mavjud',
           jsonb_build_object('lesson_id', NEW.lesson_id, 'video_lesson_id', NEW.id)
    from public.student_groups sg where sg.group_id = v_group;
  end if;
  return NEW;
end; $$;
drop trigger if exists trg_notify_video_lesson on public.video_lessons;
create trigger trg_notify_video_lesson
  after insert on public.video_lessons
  for each row execute function public.notify_video_lesson();

-- ── 3) Yangi test ────────────────────────────────────────────────────────────
create or replace function public.notify_new_test()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if NEW.is_published and NEW.group_id is not null
     and (TG_OP = 'INSERT' or OLD.is_published is distinct from true) then
    insert into public.notifications (user_id, type, title, body, data)
    select sg.student_id, 'test',
           '📝 Yangi test',
           'Sizga yangi test topshirildi: ' || NEW.title,
           jsonb_build_object('test_id', NEW.id, 'group_id', NEW.group_id)
    from public.student_groups sg where sg.group_id = NEW.group_id;
  end if;
  return NEW;
end; $$;
drop trigger if exists trg_notify_new_test on public.tests;
create trigger trg_notify_new_test
  after insert or update of is_published on public.tests
  for each row execute function public.notify_new_test();

-- ── 4) Test natijasi tayyor ──────────────────────────────────────────────────
create or replace function public.notify_test_result()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_pct int;
begin
  if NEW.submitted_at is not null and OLD.submitted_at is null then
    v_pct := case when NEW.total_questions > 0
             then round((NEW.score::numeric / NEW.total_questions) * 100) else 0 end;
    insert into public.notifications (user_id, type, title, body, data)
    values (NEW.student_id, 'test',
            'Test natijangiz tayyor',
            'Test natijangiz: ' || v_pct || '%',
            jsonb_build_object('test_id', NEW.test_id, 'result_id', NEW.id, 'score', v_pct));
  end if;
  return NEW;
end; $$;
drop trigger if exists trg_notify_test_result on public.test_results;
create trigger trg_notify_test_result
  after update of submitted_at on public.test_results
  for each row execute function public.notify_test_result();

-- ── 5) Davomat ogohlantirishi (absent + past %) ──────────────────────────────
create or replace function public.notify_attendance()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_present int; v_total int; v_pct int;
begin
  if NEW.status = 'absent' then
    insert into public.notifications (user_id, type, title, body, data)
    values (NEW.student_id, 'attendance',
            '⚠️ Davomat ogohlantirish',
            'Siz bugungi darsga qatnashmadingiz',
            jsonb_build_object('group_id', NEW.group_id, 'date', NEW.attended_date));

    -- Umumiy davomat foizi 75% dan pastga tushsa — qo'shimcha ogohlantirish
    select count(*) filter (where status = 'present'), count(*)
      into v_present, v_total
      from public.attendance
      where student_id = NEW.student_id and group_id = NEW.group_id;
    v_pct := case when v_total > 0 then round(v_present::numeric / v_total * 100) else 100 end;
    if v_pct < 75 then
      insert into public.notifications (user_id, type, title, body, data)
      values (NEW.student_id, 'attendance',
              '⚠️ Diqqat!',
              'Davomatingiz ' || v_pct || '% ga tushdi',
              jsonb_build_object('group_id', NEW.group_id, 'percent', v_pct));
    end if;
  end if;
  return NEW;
end; $$;
drop trigger if exists trg_notify_attendance on public.attendance;
create trigger trg_notify_attendance
  after insert on public.attendance
  for each row execute function public.notify_attendance();

-- ── 6) Yangi yutuq / badge ───────────────────────────────────────────────────
create or replace function public.notify_achievement()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body, data)
  values (NEW.user_id, 'achievement',
          '🏆 Yangi yutuq',
          'Siz yangi yutuqqa erishdingiz! Natijalarim bo''limida ko''ring.',
          jsonb_build_object('achievement_id', NEW.id));
  return NEW;
end; $$;
drop trigger if exists trg_notify_achievement on public.user_achievements;
create trigger trg_notify_achievement
  after insert on public.user_achievements
  for each row execute function public.notify_achievement();
