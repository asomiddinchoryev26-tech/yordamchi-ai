-- ============================================================================
-- 028_leaderboard_rpc.sql
--
-- Real student leaderboard ranking.
--
-- `user_score_snapshots` is not yet populated, so ranking is computed on the fly
-- from real activity, mirroring the client-side XP formula:
--     score = completedLessons*30 + presentAttendance*10 + gradedSubmissions*50
--
-- The function is SECURITY DEFINER (must read across students, bypassing RLS)
-- but returns ONLY the caller's own rank numbers — never other students' data —
-- so it is privacy-safe. Ties share the same competition rank.
-- ============================================================================

drop function if exists public.get_my_leaderboard();

create function public.get_my_leaderboard()
returns table (class_rank int, class_total int, school_rank int, school_total int)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  return query
  with
  today as (
    select (now() at time zone 'Asia/Tashkent')::date as d
  ),
  -- Completed (past, published) lessons available to each student via their groups
  lesson_counts as (
    select sg.student_id, count(*) as n
    from student_groups sg
    join lessons l on l.group_id = sg.group_id and l.is_published
    where l.lesson_date is not null
      and l.lesson_date < (select d from today)
    group by sg.student_id
  ),
  present_counts as (
    select student_id, count(*) as n
    from attendance
    where status = 'present'
    group by student_id
  ),
  graded_counts as (
    select student_id, count(*) as n
    from assignment_submissions
    where status = 'graded' and deleted_at is null
    group by student_id
  ),
  -- Per-student computed score across ALL students
  scores as (
    select
      p.id as student_id,
      coalesce(lc.n, 0) * 30
        + coalesce(pc.n, 0) * 10
        + coalesce(gc.n, 0) * 50 as score
    from profiles p
    left join lesson_counts  lc on lc.student_id = p.id
    left join present_counts pc on pc.student_id = p.id
    left join graded_counts  gc on gc.student_id = p.id
    where p.role = 'student'
  ),
  my_score as (
    select coalesce((select score from scores where student_id = uid), 0) as sc
  ),
  my_groups as (
    select group_id from student_groups where student_id = uid
  ),
  classmates as (
    select distinct sg.student_id
    from student_groups sg
    where sg.group_id in (select group_id from my_groups)
  ),
  class_calc as (
    select
      count(*)::int as total,
      (count(*) filter (where s.score > (select sc from my_score)) + 1)::int as rnk
    from classmates c
    join scores s on s.student_id = c.student_id
  ),
  school_calc as (
    select
      count(*)::int as total,
      (count(*) filter (where s.score > (select sc from my_score)) + 1)::int as rnk
    from scores s
  )
  select
    -- class rank only if the caller actually belongs to a group
    case when uid in (select student_id from classmates)
         then (select rnk from class_calc) end,
    nullif((select total from class_calc), 0),
    (select rnk from school_calc),
    (select total from school_calc);
end;
$$;

revoke all on function public.get_my_leaderboard() from public;
grant execute on function public.get_my_leaderboard() to authenticated;
