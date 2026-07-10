-- ============================================================================
-- 042_revoke_public_execute.sql
--
-- 041 to'liq yopmadi: `revoke ... from anon, authenticated` PUBLIC grantni
-- olib tashlamaydi. check_and_consume_ai (039) yaratilganda `revoke from public`
-- qilinmagan edi → proacl'da `=X/postgres` (PUBLIC) qoldi, ya'ni anon/authenticated
-- PUBLIC orqali hali chaqira olardi. To'g'ri yechim — PUBLIC'dan revoke.
-- ============================================================================

revoke execute on function public.check_and_consume_ai(uuid, text, boolean) from public;

-- create_payment_order: PUBLIC keraksiz (authenticated aniq grant bilan saqlanadi).
revoke execute on function public.create_payment_order(text, text) from public;
