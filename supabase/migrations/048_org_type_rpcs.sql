-- ============================================================================
-- 048_org_type_rpcs.sql  (1b: org yaratish RPC'lariга org_type)
--
-- create_organization / admin_create_organization endi org_type qabul qiladi
-- (default 'school'). Eski chaqiruvlar (p_type'siz) ishlab turaveradi — default
-- 'school'. Eski 1/2-argumentli versiyalar olib tashlanadi (ambiguity bo'lmasin).
-- ============================================================================

-- ── Onboarding: o'zi tashkilot yaratadi ─────────────────────────────────────
drop function if exists public.create_organization(text);
create or replace function public.create_organization(p_name text, p_type text default 'school')
returns json language plpgsql security definer set search_path = public as $$
declare new_org uuid; code text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if (select organization_id from public.profiles where id = auth.uid()) is not null then
    raise exception 'already_in_org';
  end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'name_required'; end if;
  if p_type not in ('school', 'institute', 'center') then p_type := 'school'; end if;

  code := public.gen_join_code();
  insert into public.organizations (name, join_code, created_by, plan_type, status, org_type)
  values (btrim(p_name), code, auth.uid(), 'free', 'active', p_type)
  returning id into new_org;

  update public.profiles set organization_id = new_org, role = 'admin' where id = auth.uid();
  return json_build_object('organization_id', new_org, 'join_code', code, 'role', 'admin');
end $$;
grant execute on function public.create_organization(text, text) to authenticated;

-- ── Super-admin: tashkilot yaratadi ─────────────────────────────────────────
drop function if exists public.admin_create_organization(text, text);
create or replace function public.admin_create_organization(p_name text, p_plan text default 'free', p_type text default 'school')
returns json language plpgsql security definer set search_path = public as $$
declare code text; new_org uuid;
begin
  if not is_super_admin() then raise exception 'super_admin_only'; end if;
  if btrim(coalesce(p_name, '')) = '' then raise exception 'name_required'; end if;
  if p_plan not in ('free', 'premium', 'pro') then raise exception 'invalid_plan'; end if;
  if p_type not in ('school', 'institute', 'center') then p_type := 'school'; end if;

  code := public.gen_join_code();
  insert into public.organizations (name, join_code, created_by, plan_type, status, plan_expires_at, org_type)
  values (
    btrim(p_name), code, auth.uid(), p_plan, 'active',
    case when p_plan = 'free' then null else now() + interval '1 month' end,
    p_type
  )
  returning id into new_org;

  return json_build_object('organization_id', new_org, 'join_code', code);
end $$;
grant execute on function public.admin_create_organization(text, text, text) to authenticated;
