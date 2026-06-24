-- ============================================================
-- YordamchiAI — Migration 006: Profiles SELECT policy kafolati
--
-- Muammo: login paytida resolveUser profiles jadvalini o'qiy
-- olmaydi (RLS SELECT policy yo'q yoki session hali o'rnatilmagan).
--
-- Tuzatish: "Users: read own profile" policy mavjudligini tekshir.
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Foydalanuvchi o'z profilini o'qiy olishi
DO $$
BEGIN
  CREATE POLICY "Users: read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Foydalanuvchi o'z profilini yangilay olishi
DO $$
BEGIN
  CREATE POLICY "Users: update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Foydalanuvchi o'z profilini qo'sha olishi (trigger ham ishlatadi)
DO $$
BEGIN
  CREATE POLICY "Users: insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
