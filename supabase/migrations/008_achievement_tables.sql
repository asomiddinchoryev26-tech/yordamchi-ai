-- ============================================================
-- YordamchiAI — Migration 008: Achievement System Tables
--
-- 3 ta yangi jadval:
--   1. achievement_definitions  — statik ro'yxat (seed data)
--   2. user_score_snapshots     — hisoblangan ballar (snapshot model)
--   3. user_achievements        — topshirilgan yutuqlar
--
-- Faza 1 doirasi:
--   Student: gold_student, silver_student, bronze_student
--   Teacher: best_teacher, top_mentor, excellence_award
-- ============================================================

-- ── 1. ACHIEVEMENT_DEFINITIONS ───────────────────────────────────────────────
--
-- condition_type va condition_config field'lari achievement logikasini
-- ifodalaydi — keyingi fazalarda badge va boshqa turlar shu jadvaldан
-- foydalanadi. Hozircha faqat 3 tur:
--   threshold  → min_score va max_score bo'yicha
--   rank       → davr ichida eng yuqori N ta o'qituvchi
--   component  → bitta score komponenti bo'yicha (keyingi faza)

CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text        UNIQUE NOT NULL,
  name             jsonb       NOT NULL DEFAULT '{}',
  description      jsonb       NOT NULL DEFAULT '{}',
  target_role      text        NOT NULL
    CHECK (target_role IN ('student', 'teacher')),
  tier             text        NOT NULL
    CHECK (tier IN ('gold', 'silver', 'bronze', 'special')),
  icon_emoji       text        NOT NULL DEFAULT '🏆',
  condition_type   text        NOT NULL
    CHECK (condition_type IN ('threshold', 'rank', 'component')),
  -- threshold: {"min_score": 90, "max_score": 100}
  -- rank:      {"max_rank": 1, "by": "total_score"}
  -- component: {"component": "test_score", "min_value": 85}
  condition_config jsonb       NOT NULL DEFAULT '{}',
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;

-- Har kim o'qiy oladi (UI'da ko'rsatish uchun)
CREATE POLICY "Public: read achievement_definitions"
  ON public.achievement_definitions FOR SELECT
  USING (true);

-- Faqat admin yarata/o'zgartira/o'chira oladi
CREATE POLICY "Admin: manage achievement_definitions"
  ON public.achievement_definitions FOR ALL
  USING (public.get_my_profile_role() = 'admin');

-- ── 2. USER_SCORE_SNAPSHOTS ───────────────────────────────────────────────────
--
-- Bir davr uchun foydalanuvchi ballarining "muzlatilgan nusxasi".
-- compute_monthly_snapshots() funksiyasi shu jadvalni to'ldiradi.
--
-- Ustun semantikasi (bir jadval, ikki rol):
--   attendance_score  → [talaba] davomat ulushi   | [o'qituvchi] davomat belgilash sifati
--   test_score        → [talaba] test o'rtachasi   | [o'qituvchi] talabalar test o'rtachasi
--   consistency_score → [talaba] haftalik izchillik | [o'qituvchi] sinf faolligi
--   activity_score    → [talaba] test ishtirokи    | [o'qituvchi] kontent yaratish darajasi
--
-- Nima uchun bir jadval? Snapshot'lar bir xil tuzilmaga ega —
-- rol farqi faqat qiymatlar semantikasida, strukturada emas.

CREATE TABLE IF NOT EXISTS public.user_score_snapshots (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role              text        NOT NULL
    CHECK (role IN ('student', 'teacher')),
  period_type       text        NOT NULL
    CHECK (period_type IN ('monthly', 'yearly')),
  period_year       int         NOT NULL,
  period_month      int         CHECK (period_month BETWEEN 1 AND 12),
  -- Talabalar uchun: qaysi guruh kontekstida hisoblangan
  -- O'qituvchilar uchun: NULL (barcha guruhlar yig'indisi)
  group_id          uuid        REFERENCES public.groups(id) ON DELETE SET NULL,
  -- Score komponenlari (0–100)
  attendance_score  numeric(5,2) NOT NULL DEFAULT 0,
  test_score        numeric(5,2) NOT NULL DEFAULT 0,
  consistency_score numeric(5,2) NOT NULL DEFAULT 0,
  activity_score    numeric(5,2) NOT NULL DEFAULT 0,
  total_score       numeric(5,2) NOT NULL DEFAULT 0,
  calculated_at     timestamptz  NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.user_score_snapshots ENABLE ROW LEVEL SECURITY;

-- Talabalar: group_id NOT NULL bo'lgan unique index
-- (bir talaba bir guruhda bir oyda faqat bitta snapshot)
CREATE UNIQUE INDEX IF NOT EXISTS uix_uss_student
  ON public.user_score_snapshots (user_id, period_type, period_year, period_month, group_id)
  WHERE group_id IS NOT NULL;

-- O'qituvchilar: group_id NULL bo'lgan unique index
-- (bir o'qituvchi bir oyda faqat bitta global snapshot)
CREATE UNIQUE INDEX IF NOT EXISTS uix_uss_teacher
  ON public.user_score_snapshots (user_id, period_type, period_year, period_month)
  WHERE group_id IS NULL;

-- Qo'shimcha tezlik indekslari
CREATE INDEX IF NOT EXISTS idx_uss_user_period
  ON public.user_score_snapshots (user_id, period_year, period_month);

CREATE INDEX IF NOT EXISTS idx_uss_period_role
  ON public.user_score_snapshots (period_year, period_month, role, total_score DESC);

-- RLS Policies
CREATE POLICY "User: read own snapshots"
  ON public.user_score_snapshots FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admin: manage all snapshots"
  ON public.user_score_snapshots FOR ALL
  USING (public.get_my_profile_role() = 'admin');

-- O'qituvchi: o'z guruhlaridagi talabalar snapshotlarini ko'radi
CREATE POLICY "Teacher: read student snapshots"
  ON public.user_score_snapshots FOR SELECT
  USING (
    public.get_my_profile_role() = 'teacher'
    AND role = 'student'
    AND EXISTS (
      SELECT 1 FROM public.student_groups sg
      JOIN public.groups g ON g.id = sg.group_id
      WHERE sg.student_id = user_score_snapshots.user_id
        AND g.teacher_id  = auth.uid()
    )
  );

-- ── 3. USER_ACHIEVEMENTS ─────────────────────────────────────────────────────
--
-- Foydalanuvchi qaysi yutuqni, qaysi davrda topshirgani qayd etiladi.
-- assign_monthly_achievements() funksiyasi shu jadvalni to'ldiradi.

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id uuid        NOT NULL REFERENCES public.achievement_definitions(id),
  -- Shu snapshot asosida berilgan (NULL bo'lishi mumkin: manual award)
  snapshot_id    uuid        REFERENCES public.user_score_snapshots(id) ON DELETE SET NULL,
  period_type    text        NOT NULL
    CHECK (period_type IN ('monthly', 'yearly')),
  period_year    int         NOT NULL,
  period_month   int         CHECK (period_month BETWEEN 1 AND 12),
  group_id       uuid        REFERENCES public.groups(id) ON DELETE SET NULL,
  total_score    numeric(5,2),
  earned_at      timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Talabalar uchun: bir guruhda bir oyda bir xil achievement ikki marta berilmaydi
CREATE UNIQUE INDEX IF NOT EXISTS uix_ua_student
  ON public.user_achievements (user_id, achievement_id, period_year, period_month, group_id)
  WHERE group_id IS NOT NULL;

-- O'qituvchilar uchun: bir oyda bir xil achievement ikki marta berilmaydi
CREATE UNIQUE INDEX IF NOT EXISTS uix_ua_teacher
  ON public.user_achievements (user_id, achievement_id, period_year, period_month)
  WHERE group_id IS NULL;

-- Tezlik indekslari
CREATE INDEX IF NOT EXISTS idx_ua_user_period
  ON public.user_achievements (user_id, period_year, period_month);

CREATE INDEX IF NOT EXISTS idx_ua_achievement_period
  ON public.user_achievements (achievement_id, period_year, period_month);

-- RLS Policies
CREATE POLICY "User: read own achievements"
  ON public.user_achievements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admin: manage all achievements"
  ON public.user_achievements FOR ALL
  USING (public.get_my_profile_role() = 'admin');

CREATE POLICY "Teacher: read student achievements"
  ON public.user_achievements FOR SELECT
  USING (
    public.get_my_profile_role() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM public.student_groups sg
      JOIN public.groups g ON g.id = sg.group_id
      WHERE sg.student_id = user_achievements.user_id
        AND g.teacher_id  = auth.uid()
    )
  );

-- ── 4. SEED DATA: Achievement Definitions ────────────────────────────────────
--
-- Bu yerda faqat Faza 1 uchun 6 ta achievement qo'shiladi.
-- ON CONFLICT DO NOTHING: qayta ishga tushirganda xato chiqmaydi.

INSERT INTO public.achievement_definitions
  (code, name, description, target_role, tier, icon_emoji, condition_type, condition_config)
VALUES

-- ──── STUDENT ACHIEVEMENTS ────────────────────────────────────────────────────

(
  'gold_student',
  '{"uz": "Oltin Talaba",  "ru": "Золотой студент", "en": "Gold Student"}',
  '{"uz": "Umumiy ball 90 va undan yuqori",  "ru": "Общий балл 90 и выше",        "en": "Overall score 90 and above"}',
  'student', 'gold',   '🥇',
  'threshold',
  '{"min_score": 90, "max_score": 100}'
),
(
  'silver_student',
  '{"uz": "Kumush Talaba", "ru": "Серебряный студент", "en": "Silver Student"}',
  '{"uz": "Umumiy ball 75 dan 89.99 gacha", "ru": "Общий балл от 75 до 89", "en": "Overall score 75 to 89"}',
  'student', 'silver', '🥈',
  'threshold',
  '{"min_score": 75, "max_score": 89.99}'
),
(
  'bronze_student',
  '{"uz": "Bronza Talaba", "ru": "Бронзовый студент", "en": "Bronze Student"}',
  '{"uz": "Umumiy ball 60 dan 74.99 gacha", "ru": "Общий балл от 60 до 74", "en": "Overall score 60 to 74"}',
  'student', 'bronze', '🥉',
  'threshold',
  '{"min_score": 60, "max_score": 74.99}'
),

-- ──── TEACHER ACHIEVEMENTS ────────────────────────────────────────────────────

(
  'best_teacher',
  '{"uz": "Eng Yaxshi O''qituvchi", "ru": "Лучший учитель",  "en": "Best Teacher"}',
  '{"uz": "Davrdagi eng yuqori umumiy ball",  "ru": "Наивысший общий балл за период", "en": "Highest overall score in the period"}',
  'teacher', 'gold',    '👑',
  'rank',
  '{"max_rank": 1, "by": "total_score", "min_qualifying_score": 50}'
),
(
  'top_mentor',
  '{"uz": "Top Mentor", "ru": "Топ ментор", "en": "Top Mentor"}',
  '{"uz": "Talabalari eng yuqori test natijalarini ko''rsatgan o''qituvchi", "ru": "Учитель с лучшими результатами студентов на тестах", "en": "Teacher whose students achieved the best test results"}',
  'teacher', 'gold',    '🎓',
  'rank',
  '{"max_rank": 1, "by": "test_score", "min_qualifying_score": 50}'
),
(
  'excellence_award',
  '{"uz": "A''lo Mukofoti", "ru": "Награда за превосходство", "en": "Excellence Award"}',
  '{"uz": "Barcha mezonlarda 90 ball va undan yuqori", "ru": "90 баллов и выше по всем критериям", "en": "90 points and above across all criteria"}',
  'teacher', 'special', '⭐',
  'threshold',
  '{"min_score": 90, "max_score": 100}'
)

ON CONFLICT (code) DO NOTHING;
