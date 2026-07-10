-- ============================================================================
-- 036_superadmin_controls.sql
--
-- Kengaytirilgan super-admin nazorati (barchasi is_super_admin() bilan himoyalangan):
--   • admin_create_organization()  → yangi tashkilot yaratish (reja bilan)
--   • admin_delete_organization()  → bo'sh tashkilotni o'chirish (xavfsiz)
--   • search_users()               → butun platforma bo'yicha foydalanuvchi qidirish
--   • set_user_status()            → foydalanuvchini bloklash / faollashtirish
-- ============================================================================

-- ── Yangi tashkilot yaratish (super-admin) ──────────────────────────────────
create or replace function public.admin_create_organization(p_name text, p_plan text default 'free')
returns json language plpgsql security definer set search_path = public as $$
declare code text; new_org uuid;
begin
  if not is_super_admin() then raise exception 'super_admin_only'; end if;
  if btrim(coalesce(p_name, '')) = '' then raise exception 'name_required'; end if;
  if p_plan not in ('free', 'premium', 'pro') then raise exception 'invalid_plan'; end if;

  code := public.gen_join_code();
  insert into public.organizations (name, join_code, created_by, plan_type, status, plan_expires_at)
  values (
    btrim(p_name), code, auth.uid(), p_plan, 'active',
    case when p_plan = 'free' then null else now() + interval '1 month' end
  )
  returning id into new_org;

  return json_build_object('organization_id', new_org, 'join_code', code);
end $$;
grant execute on function public.admin_create_organization(text, text) to authenticated;

-- ── Bo'sh tashkilotni o'chirish (super-admin) ───────────────────────────────
-- Xavfsizlik: a'zosi bor tashkilot yoki Platforma tashkiloti o'chirilmaydi.
create or replace function public.admin_delete_organization(p_org uuid)
returns void language plpgsql security definer set search_path = public as $$
declare member_count int;
begin
  if not is_super_admin() then raise exception 'super_admin_only'; end if;
  if p_org = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid then raise exception 'cannot_delete_platform'; end if;

  select count(*) into member_count from profiles where organization_id = p_org;
  if member_count > 0 then raise exception 'org_not_empty'; end if;

  delete from public.organizations where id = p_org;
end $$;
grant execute on function public.admin_delete_organization(uuid) to authenticated;

-- ── Platforma bo'yicha foydalanuvchi qidirish (super-admin) ─────────────────
create or replace function public.search_users(p_query text)
returns table (
  id uuid, full_name text, email text, role text, status text,
  organization_id uuid, org_name text, created_at timestamptz
) language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.email, p.role, p.status,
         p.organization_id, o.name, p.created_at
  from profiles p
  left join organizations o on o.id = p.organization_id
  where is_super_admin()
    and (
      btrim(coalesce(p_query, '')) = ''
      or p.full_name ilike '%' || p_query || '%'
      or p.email     ilike '%' || p_query || '%'
    )
  order by p.created_at desc
  limit 50;
$$;
grant execute on function public.search_users(text) to authenticated;

-- ── Foydalanuvchini bloklash / faollashtirish (super-admin) ─────────────────
create or replace function public.set_user_status(p_user uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_super_admin() then raise exception 'super_admin_only'; end if;
  if p_status not in ('active', 'suspended') then raise exception 'invalid_status'; end if;
  if p_user = auth.uid() then raise exception 'cannot_change_self'; end if;
  update profiles set status = p_status where id = p_user;
end $$;
grant execute on function public.set_user_status(uuid, text) to authenticated;
