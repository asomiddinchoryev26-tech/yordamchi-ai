-- 049: list_organizations org_type ham qaytaradi (super-admin panelда ko'rsatish uchun)
drop function if exists public.list_organizations();
create or replace function public.list_organizations()
returns table (id uuid, name text, org_type text, plan_type text, plan_expires_at timestamptz,
  status text, join_code text, members bigint, students bigint, teachers bigint, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select o.id, o.name, o.org_type, o.plan_type, o.plan_expires_at, o.status, o.join_code,
    (select count(*) from public.profiles p where p.organization_id = o.id),
    (select count(*) from public.profiles p where p.organization_id = o.id and p.role = 'student'),
    (select count(*) from public.profiles p where p.organization_id = o.id and p.role = 'teacher'),
    o.created_at
  from public.organizations o
  where is_super_admin()
  order by o.created_at desc;
$$;
grant execute on function public.list_organizations() to authenticated;
