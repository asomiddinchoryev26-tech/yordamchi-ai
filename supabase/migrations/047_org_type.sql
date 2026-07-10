-- ============================================================================
-- 047_org_type.sql  (1-bosqich: tashkilot turi — poydevor)
--
-- Har tashkilot turi: 'school' (maktab) · 'institute' (institut) · 'center'
-- (o'quv markazi). Mavjud tashkilotlar avtomatik 'school' — HECH NARSA BUZILMAYDI.
-- Bu faqat qo'shimcha ustun; eski mantiq o'zgarmaydi.
-- ============================================================================

alter table public.organizations
  add column if not exists org_type text not null default 'school'
  check (org_type in ('school', 'institute', 'center'));
