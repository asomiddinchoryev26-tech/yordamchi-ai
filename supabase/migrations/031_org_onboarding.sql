-- ============================================================================
-- 031_org_onboarding.sql   (PHASE 3 — self-service organization onboarding)
--
-- Lets a new institution provision itself and lets students/teachers join it,
-- assigning organization_id on the profile — all server-side and org-safe:
--   • join_code on organizations (short, unique, shareable)
--   • create_organization(name)      → caller becomes that org's admin
--   • join_organization(code, role)  → caller joins an existing org
--
-- Both refuse if the caller already belongs to an organization. SECURITY DEFINER
-- so they can write the caller's own profile / create the org under RLS.
-- ============================================================================

alter table public.organizations add column if not exists join_code text;
create unique index if not exists organizations_join_code_key on public.organizations(join_code);

-- 6-char code, unambiguous alphabet (no 0/O/1/I) ----------------------------
create or replace function public.gen_join_code()
returns text language plpgsql set search_path = public as $$
declare code text; chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.organizations where join_code = code);
  end loop;
  return code;
end $$;

-- give the existing (demo) org a join code
update public.organizations set join_code = public.gen_join_code() where join_code is null;

-- Create a new organization; the caller becomes its admin -------------------
create or replace function public.create_organization(p_name text)
returns json language plpgsql security definer set search_path = public as $$
declare new_org uuid; code text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if (select organization_id from public.profiles where id = auth.uid()) is not null then
    raise exception 'already_in_org';
  end if;
  if coalesce(btrim(p_name), '') = '' then raise exception 'name_required'; end if;

  code := public.gen_join_code();
  insert into public.organizations (name, join_code, created_by, plan_type, status)
  values (btrim(p_name), code, auth.uid(), 'free', 'active')
  returning id into new_org;

  update public.profiles set organization_id = new_org, role = 'admin' where id = auth.uid();
  return json_build_object('organization_id', new_org, 'join_code', code, 'role', 'admin');
end $$;

-- Join an existing organization by code -------------------------------------
create or replace function public.join_organization(p_code text, p_role text)
returns json language plpgsql security definer set search_path = public as $$
declare org uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if (select organization_id from public.profiles where id = auth.uid()) is not null then
    raise exception 'already_in_org';
  end if;
  if p_role not in ('student', 'teacher') then raise exception 'invalid_role'; end if;

  select id into org from public.organizations
   where join_code = upper(btrim(p_code)) and status = 'active';
  if org is null then raise exception 'invalid_code'; end if;

  update public.profiles set organization_id = org, role = p_role where id = auth.uid();
  return json_build_object('organization_id', org, 'role', p_role);
end $$;

revoke execute on function public.gen_join_code() from public;
grant execute on function public.create_organization(text) to authenticated;
grant execute on function public.join_organization(text, text) to authenticated;
