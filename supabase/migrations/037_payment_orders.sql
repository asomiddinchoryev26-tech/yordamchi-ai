-- ============================================================================
-- 037_payment_orders.sql
--
-- Click / Payme to'lov shlyuzlari uchun karkas (merchant kalitlari kelgach ishlaydi).
--   • payment_orders   → shlyuz checkout buyurtmasi + provayder tranzaksiya holati
--   • create_payment_order()  → foydalanuvchi buyurtma ochadi (auth), summa plans'dan
--   • apply_paid_order()      → shlyuz callback'i (service_role) buyurtmani to'langan
--                                qiladi + tashkilot rejasini yoqadi (idempotent)
-- ============================================================================

create table if not exists public.payment_orders (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid references public.organizations(id) on delete cascade,
  user_id               uuid references public.profiles(id)      on delete set null,
  plan_type             text not null check (plan_type in ('premium', 'pro')),
  amount                numeric not null,                 -- so'mda
  provider              text not null check (provider in ('click', 'payme')),
  status                text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  -- provayder tranzaksiya holati (Payme state machine + Click)
  provider_trans_id     text,
  provider_state        int not null default 0,           -- 0 yangi · 1 kutilmoqda · 2 to'langan · -1/-2 bekor
  provider_create_time  bigint,
  provider_perform_time bigint,
  provider_cancel_time  bigint,
  provider_reason       int,
  created_at            timestamptz not null default now(),
  paid_at               timestamptz
);
create index if not exists payment_orders_org_idx   on public.payment_orders(organization_id);
create index if not exists payment_orders_trans_idx on public.payment_orders(provider, provider_trans_id);

alter table public.payment_orders enable row level security;

-- Faqat o'qish: tashkilot a'zolari o'z buyurtmalarini, super-admin barchasini.
-- Yozish yo'q — faqat SECURITY DEFINER RPC / service_role orqali.
drop policy if exists payment_orders_read on public.payment_orders;
create policy payment_orders_read on public.payment_orders for select
  using (organization_id = my_org_id() or is_super_admin());

-- ── Buyurtma ochish (foydalanuvchi) ─────────────────────────────────────────
create or replace function public.create_payment_order(p_plan text, p_provider text)
returns json language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_amount numeric; v_order uuid;
begin
  v_org := my_org_id();
  if v_org is null then raise exception 'no_org'; end if;
  if p_plan     not in ('premium', 'pro') then raise exception 'invalid_plan'; end if;
  if p_provider not in ('click', 'payme')  then raise exception 'invalid_provider'; end if;

  select price_uzs into v_amount from plans where key = p_plan;
  if v_amount is null then raise exception 'plan_not_found'; end if;

  insert into payment_orders (organization_id, user_id, plan_type, amount, provider, status, provider_state)
  values (v_org, auth.uid(), p_plan, v_amount, p_provider, 'pending', 0)
  returning id into v_order;

  return json_build_object('order_id', v_order, 'amount', v_amount, 'plan', p_plan, 'provider', p_provider);
end $$;
grant execute on function public.create_payment_order(text, text) to authenticated;

-- ── Buyurtmani to'langan qilish (shlyuz callback — service_role) ─────────────
-- Idempotent: allaqachon to'langan buyurtma qayta qo'llanmaydi.
create or replace function public.apply_paid_order(p_order uuid, p_trans text)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid; v_plan text;
begin
  select organization_id, plan_type into v_org, v_plan
  from payment_orders where id = p_order and status <> 'paid';
  if v_org is null then return; end if;

  update payment_orders
     set status = 'paid', provider_state = 2,
         provider_trans_id = coalesce(p_trans, provider_trans_id),
         paid_at = now(),
         provider_perform_time = (extract(epoch from now()) * 1000)::bigint
   where id = p_order;

  update organizations
     set plan_type = v_plan, plan_expires_at = now() + interval '1 month'
   where id = v_org;

  insert into payments (user_id, organization_id, amount, currency, provider, status, plan_type, metadata)
  select user_id, organization_id, amount, 'UZS', provider, 'success', plan_type,
         jsonb_build_object('order_id', p_order, 'trans', p_trans)
  from payment_orders where id = p_order;
end $$;
revoke all    on function public.apply_paid_order(uuid, text) from public;
grant execute on function public.apply_paid_order(uuid, text) to service_role;
