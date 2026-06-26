-- ============================================================
-- YordamchiAI — Migration 013: Profiles table enhancements
--               + Storage policies for avatars bucket
--
-- Safe to run multiple times (idempotent).
-- ============================================================

-- ── 1. PROFILES TABLE — Add missing columns ───────────────────────────────────

-- updated_at: tracks last modification time
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL
    DEFAULT timezone('utc', now());

-- phone: user contact number (already exists on some installs, safe)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text;

-- bio: short user biography
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text;

-- status: account status
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive'));

-- ── 2. AUTO-UPDATE updated_at TRIGGER ────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 3. STORAGE POLICIES — avatars bucket ─────────────────────────────────────
-- Bucket is public (reads are open).
-- Write access is restricted to the owner only.

-- Allow authenticated user to upload their own avatar
DO $$
BEGIN
  CREATE POLICY "Users: upload own avatar"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow authenticated user to update (replace) their own avatar
DO $$
BEGIN
  CREATE POLICY "Users: update own avatar"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow authenticated user to delete their own avatar
DO $$
BEGIN
  CREATE POLICY "Users: delete own avatar"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow public read of all avatars (bucket is public, but explicit policy is safer)
DO $$
BEGIN
  CREATE POLICY "Public: read avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 4. INDEX for updated_at lookups ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS profiles_updated_at_idx
  ON public.profiles (updated_at DESC);

-- ── 5. Admin policy: read all profiles ───────────────────────────────────────
DO $$
BEGIN
  CREATE POLICY "Admin: read all profiles"
    ON public.profiles FOR SELECT
    USING (public.get_my_profile_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
