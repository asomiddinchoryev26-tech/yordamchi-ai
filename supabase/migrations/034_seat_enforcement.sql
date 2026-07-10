-- ============================================================================
-- 034_seat_enforcement.sql
--
-- Enforce per-organization seat limits when a user joins via code. The limit is
-- the org's explicit plan_seats override, else a per-plan default. 'pro' and
-- 'education' are unlimited. Raises 'seats_full' when the org is at capacity.
-- ============================================================================

create or replace function public.join_organization(p_code text, p_role text)
returns json language plpgsql security definer set search_path = public as $$
declare org uuid; org_plan text; seat_limit int; member_count int;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if (select organization_id from public.profiles where id = auth.uid()) is not null then
    raise exception 'already_in_org';
  end if;
  if p_role not in ('student', 'teacher') then raise exception 'invalid_role'; end if;

  select id, plan_type into org, org_plan from public.organizations
   where join_code = upper(btrim(p_code)) and status = 'active';
  if org is null then raise exception 'invalid_code'; end if;

  -- Seat limit: explicit org override, else per-plan default (pro/education = unlimited)
  select coalesce(
    (select plan_seats from public.organizations where id = org),
    case org_plan when 'free' then 50 when 'premium' then 200 else null end
  ) into seat_limit;

  if seat_limit is not null then
    select count(*) into member_count from public.profiles where organization_id = org;
    if member_count >= seat_limit then raise exception 'seats_full'; end if;
  end if;

  update public.profiles set organization_id = org, role = p_role where id = auth.uid();
  return json_build_object('organization_id', org, 'role', p_role);
end $$;
