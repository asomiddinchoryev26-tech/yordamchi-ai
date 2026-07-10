-- ============================================================================
-- 033_superadmin_org_read.sql
--
-- Platform super-admins manage billing across ALL organizations, so they need to
-- read every organization (e.g. to show which org a pending payment belongs to).
-- Regular org members remain scoped to their own org (organizations_read_own).
-- ============================================================================

drop policy if exists organizations_super on public.organizations;
create policy organizations_super on public.organizations for all
  using (is_super_admin()) with check (is_super_admin());
