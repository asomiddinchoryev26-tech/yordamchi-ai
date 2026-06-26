-- ============================================================
-- YordamchiAI — Migration 014: Fix avatar storage RLS policies
--
-- Problem:  Migration 013 used storage.foldername() which can be
--           unreliable. Replace with split_part() — battle-tested,
--           always available in PostgreSQL.
--
-- Idempotent: safe to run multiple times.
-- ============================================================

-- Drop old policies (if they exist)
DROP POLICY IF EXISTS "Users: upload own avatar"  ON storage.objects;
DROP POLICY IF EXISTS "Users: update own avatar"  ON storage.objects;
DROP POLICY IF EXISTS "Users: delete own avatar"  ON storage.objects;
DROP POLICY IF EXISTS "Public: read avatars"       ON storage.objects;

-- ── INSERT (upload / replace) ────────────────────────────────────────────────
-- Authenticated users can only upload to their own folder: {user_id}/avatar.jpg
CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- ── UPDATE (replace existing file) ──────────────────────────────────────────
CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND split_part(name, '/', 1) = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- ── DELETE ───────────────────────────────────────────────────────────────────
CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- ── SELECT (public read — bucket is already public) ──────────────────────────
-- Explicit policy for clarity and cross-version compatibility
CREATE POLICY "avatars_select_public"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );
