-- ============================================================================
-- 039_ai_usage_server_enforce.sql
--
-- AI limitini SERVER tomonda majburlash (chin manba). Ilgari limit faqat client
-- tomonda edi → to'g'ridan-to'g'ri edge-funksiyaga so'rov yuborib chetlab o'tish
-- mumkin edi. Endi edge-funksiyalar shu funksiyani chaqiradi (atomik check+consume).
--
--   check_and_consume_ai(p_user, p_feature, p_consume default true)
--     → json { allowed, used, limit, plan }
--     • reja: org rejasi (aktiv) → aks holda subscription → aks holda 'free'
--     • limit: plans.ai_limits[p_feature]  (kuzatilmasa — bloklamaydi)
--     • p_consume=true bo'lsa ruxsat berilганда ishlatilishni +1 qiladi (atomik)
--     • oyna: pdf_analysis = 7 kun, qolganlari = 1 kun
-- ============================================================================

create or replace function public.check_and_consume_ai(p_user uuid, p_feature text, p_consume boolean default true)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_plan     text := 'free';
  v_org_plan text; v_org_exp timestamptz;
  v_sub_plan text; v_sub_exp timestamptz;
  v_limit    int;
  v_used     int := 0;
  v_expired  boolean;
  v_window   interval;
  v_row      public.ai_usage%rowtype;
begin
  if p_user is null or p_feature is null then
    return json_build_object('allowed', false, 'used', 0, 'limit', 0, 'plan', 'free');
  end if;

  -- 1) Reja — avval tashkilot rejasi (aktiv), keyin subscription, aks holda free
  select o.plan_type, o.plan_expires_at into v_org_plan, v_org_exp
    from public.profiles pr
    join public.organizations o on o.id = pr.organization_id
    where pr.id = p_user;
  if v_org_plan is not null and v_org_plan <> 'free' and (v_org_exp is null or v_org_exp > now()) then
    v_plan := v_org_plan;
  else
    select plan_type, expires_at into v_sub_plan, v_sub_exp
      from public.subscriptions
      where user_id = p_user and status = 'active'
      order by created_at desc limit 1;
    if v_sub_plan is not null and (v_sub_exp is null or v_sub_exp > now()) then
      v_plan := v_sub_plan;
    end if;
  end if;

  -- 2) Limit — plans.ai_limits'dan. Kuzatilmaydigan funksiya bo'lsa bloklamaymiz.
  select (ai_limits ->> p_feature)::int into v_limit from public.plans where key = v_plan;
  if v_limit is null then
    return json_build_object('allowed', true, 'used', 0, 'limit', -1, 'plan', v_plan);
  end if;

  -- 3) Joriy ishlatilish (period tugagan bo'lsa 0)
  select * into v_row from public.ai_usage where user_id = p_user and feature_type = p_feature;
  v_expired := (v_row.user_id is null) or (v_row.reset_date <= now());
  v_used    := case when v_expired then 0 else v_row.used_count end;

  if v_used >= v_limit then
    return json_build_object('allowed', false, 'used', v_used, 'limit', v_limit, 'plan', v_plan);
  end if;

  if not p_consume then
    return json_build_object('allowed', true, 'used', v_used, 'limit', v_limit, 'plan', v_plan);
  end if;

  -- 4) Consume (+1, atomik)
  v_window := case when p_feature = 'pdf_analysis' then interval '7 days' else interval '1 day' end;
  insert into public.ai_usage (user_id, feature_type, used_count, limit_count, reset_date, updated_at)
    values (p_user, p_feature, 1, v_limit, now() + v_window, now())
  on conflict (user_id, feature_type) do update
    set used_count = case when public.ai_usage.reset_date <= now() then 1 else public.ai_usage.used_count + 1 end,
        reset_date = case when public.ai_usage.reset_date <= now() then now() + v_window else public.ai_usage.reset_date end,
        limit_count = v_limit,
        updated_at  = now();

  return json_build_object('allowed', true, 'used', v_used + 1, 'limit', v_limit, 'plan', v_plan);
end $$;

grant execute on function public.check_and_consume_ai(uuid, text, boolean) to service_role;
grant execute on function public.check_and_consume_ai(uuid, text, boolean) to authenticated;
