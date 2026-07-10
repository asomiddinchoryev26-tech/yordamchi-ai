-- ============================================================================
-- 035_platform_superadmin.sql
--
-- Platform-owner (super-admin) control functions. All gated on is_super_admin().
--   • platform_stats()        → platform-wide totals (orgs, users, revenue…)
--   • list_organizations()    → every org with member counts, plan, status
--   • set_org_status()        → suspend / activate an organization
--   • set_org_plan()          → grant / change an org's plan directly (comp/override)
-- ============================================================================

create or replace function public.platform_stats()
returns json language sql stable security definer set search_path = public as $$
  select case when is_super_admin() then json_build_object(
    'organizations',    (select count(*) from organizations),
    'total_users',      (select count(*) from profiles),
    'students',         (select count(*) from profiles where role = 'student'),
    'teachers',         (select count(*) from profiles where role = 'teacher'),
    'admins',           (select count(*) from profiles where role = 'admin'),
    'paid_orgs',        (select count(*) from organizations
                          where plan_type <> 'free'
                            and (plan_expires_at is null or plan_expires_at > now())),
    'total_revenue',    (select coalesce(sum(amount), 0) from payments where status = 'success'),
    'pending_payments', (select count(*) from payments where status = 'pending')
  ) else null end;
$$;
grant execute on function public.platform_stats() to authenticated;

create or replace function public.list_organizations()
returns table (
  id uuid, name text, plan_type text, plan_expires_at timestamptz,
  status text, join_code text, members bigint, students bigint, teachers bigint, created_at timestamptz
) language sql stable security definer set search_path = public as $$
  select o.id, o.name, o.plan_type, o.plan_expires_at, o.status, o.join_code,
    (select count(*) from profiles p where p.organization_id = o.id),
    (select count(*) from profiles p where p.organization_id = o.id and p.role = 'student'),
    (select count(*) from profiles p where p.organization_id = o.id and p.role = 'teacher'),
    o.created_at
  from organizations o
  where is_super_admin()
  order by o.created_at desc;
$$;
grant execute on function public.list_organizations() to authenticated;

create or replace function public.set_org_status(p_org uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_super_admin() then raise exception 'super_admin_only'; end if;
  if p_status not in ('active', 'suspended') then raise exception 'invalid_status'; end if;
  update organizations set status = p_status where id = p_org;
end $$;
grant execute on function public.set_org_status(uuid, text) to authenticated;

create or replace function public.set_org_plan(p_org uuid, p_plan text, p_months int default 1)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_super_admin() then raise exception 'super_admin_only'; end if;
  if p_plan not in ('free', 'premium', 'pro') then raise exception 'invalid_plan'; end if;
  update organizations
     set plan_type = p_plan,
         plan_expires_at = case when p_plan = 'free' then null
                                else now() + (p_months || ' months')::interval end
   where id = p_org;
end $$;
grant execute on function public.set_org_plan(uuid, text, int) to authenticated;
