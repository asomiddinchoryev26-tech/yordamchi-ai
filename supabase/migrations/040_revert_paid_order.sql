-- ============================================================================
-- 040_revert_paid_order.sql
--
-- To'langan buyurtma bekor qilinganda (Payme refund — state -2) tashkilot
-- rejasini qaytarish. Ilgari refund'da org premium bo'lib qolar edi.
--
--   revert_paid_order(p_order)  → org rejasini 'free' qiladi + to'lovni 'refunded'
--   (service_role — payme-callback edge funksiyasi chaqiradi)
-- ============================================================================

create or replace function public.revert_paid_order(p_order uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select organization_id into v_org from public.payment_orders where id = p_order;
  if v_org is null then return; end if;

  -- Rejani bepulга qaytarish (scaffold: refund → premium bekor)
  update public.organizations set plan_type = 'free', plan_expires_at = null where id = v_org;

  -- Tegishli to'lov yozuvini 'refunded' qilish
  update public.payments set status = 'refunded' where (metadata ->> 'order_id') = p_order::text;
end $$;

revoke all    on function public.revert_paid_order(uuid) from public;
grant execute on function public.revert_paid_order(uuid) to service_role;
