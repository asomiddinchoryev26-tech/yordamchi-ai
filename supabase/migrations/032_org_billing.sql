-- ============================================================================
-- 032_org_billing.sql   (Per-organization billing)
--
-- The organization is the billing unit. Its plan lives on organizations.plan_type
-- (already added in 029). Every user in the org inherits the org's plan.
--
--   • organizations.plan_expires_at / plan_seats
--   • payments.organization_id (org-level manual payments)
--   • my_org_plan()            → the caller's effective org plan ('free' if expired)
--   • submit_org_payment()     → org admin requests a plan upgrade (pending payment)
--   • approve_org_payment()    → platform super-admin approves → upgrades the org
--   • reject_org_payment()     → platform super-admin rejects
-- ============================================================================

alter table public.organizations add column if not exists plan_expires_at timestamptz;
alter table public.organizations add column if not exists plan_seats      int;   -- null = unlimited

alter table public.payments add column if not exists organization_id uuid references public.organizations(id);
create index if not exists idx_payments_org on public.payments(organization_id);

-- Effective org plan: downgrade to 'free' when a paid plan has expired ---------
create or replace function public.my_org_plan()
returns text language sql stable security definer set search_path = public as $$
  select case
    when o.plan_type is null or o.plan_type = 'free' then 'free'
    when o.plan_expires_at is not null and o.plan_expires_at < now() then 'free'
    else o.plan_type
  end
  from public.organizations o
  where o.id = my_org_id();
$$;
grant execute on function public.my_org_plan() to authenticated;

-- Org admin requests an upgrade (creates a pending payment) --------------------
create or replace function public.submit_org_payment(p_plan text, p_receipt_url text)
returns uuid language plpgsql security definer set search_path = public as $$
declare pid uuid; org uuid := my_org_id(); price numeric;
begin
  if get_my_profile_role() <> 'admin' then raise exception 'admin_only'; end if;
  if org is null then raise exception 'no_org'; end if;
  if p_plan not in ('premium','pro') then raise exception 'invalid_plan'; end if;

  select price_uzs into price from public.plans where key = p_plan;
  -- provider must be one of click/payme/card (manual receipt → 'card'); status 'pending'
  insert into public.payments (user_id, organization_id, amount, currency, provider, status, plan_type, receipt_url)
  values (auth.uid(), org, coalesce(price, 0), 'UZS', 'card', 'pending', p_plan, p_receipt_url)
  returning id into pid;
  return pid;
end $$;
grant execute on function public.submit_org_payment(text, text) to authenticated;

-- Platform super-admin approves → upgrade the org's plan (+1 month) ------------
create or replace function public.approve_org_payment(p_payment_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare pay record;
begin
  if not is_super_admin() then raise exception 'super_admin_only'; end if;
  select * into pay from public.payments
   where id = p_payment_id and status = 'pending' and organization_id is not null;
  if not found then raise exception 'payment_not_found'; end if;

  update public.payments set status = 'success', reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_payment_id;
  update public.organizations
     set plan_type = pay.plan_type, plan_expires_at = now() + interval '1 month'
   where id = pay.organization_id;
end $$;
grant execute on function public.approve_org_payment(uuid) to authenticated;

create or replace function public.reject_org_payment(p_payment_id uuid, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_super_admin() then raise exception 'super_admin_only'; end if;
  update public.payments
     set status = 'failed', reviewed_by = auth.uid(), reviewed_at = now(), review_note = p_note
   where id = p_payment_id and status = 'pending' and organization_id is not null;
end $$;
grant execute on function public.reject_org_payment(uuid, text) to authenticated;

-- RLS: org admin can read their org's payments; super-admin sees all -----------
drop policy if exists payments_org_admin_read on public.payments;
create policy payments_org_admin_read on public.payments for select
  using (organization_id = my_org_id() and get_my_profile_role() = 'admin');

drop policy if exists payments_super on public.payments;
create policy payments_super on public.payments for all
  using (is_super_admin()) with check (is_super_admin());
