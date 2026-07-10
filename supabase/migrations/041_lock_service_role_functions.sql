-- ============================================================================
-- 041_lock_service_role_functions.sql
--
-- KRITIK xavfsizlik tuzatishi.
-- Supabase default-privileges YANGI funksiyalarga EXECUTE'ni anon + authenticated
-- rollariga avtomatik beradi. `revoke all ... from public` bu ANIQ (explicit)
-- grantlarni olib tashlamaydi. Natijada quyidagi service_role-only funksiyalar
-- oddiy foydalanuvchiga ochiq qolgan edi:
--   • apply_paid_order      → to'lovsiz reja ko'tarish (billing bypass)
--   • revert_paid_order     → boshqa org rejasini bekor qilish (griefing)
--   • check_and_consume_ai  → boshqa foydalanuvchi AI kvotasini yoqib yuborish
--
-- Bu funksiyalar faqat edge-funksiyalar (service_role) tomonidan chaqiriladi.
-- ============================================================================

revoke execute on function public.apply_paid_order(uuid, text)              from anon, authenticated;
revoke execute on function public.revert_paid_order(uuid)                   from anon, authenticated;
revoke execute on function public.check_and_consume_ai(uuid, text, boolean) from anon, authenticated;

-- create_payment_order authenticated uchun to'g'ri (my_org_id()/auth.uid() bilan
-- scoped), lekin anon uchun keraksiz — olib tashlaymiz.
revoke execute on function public.create_payment_order(text, text) from anon;
