-- ============================================================
-- YordamchiAI — Migration 010: Achievement Engine Functions
--
-- Uchta ochiq funksiya:
--   compute_monthly_snapshots(year, month)
--     → barcha foydalanuvchilar uchun ballarni hisoblaydi
--     → user_score_snapshots jadvalini to'ldiradi (UPSERT)
--
--   assign_monthly_achievements(year, month)
--     → snapshotlarga qarab yutuqlar beradi
--     → user_achievements jadvalini to'ldiradi (UPSERT)
--
--   run_monthly_achievement_cycle(year, month)   ← asosiy chaqiruv
--     → ikkalasini ketma-ket ishga tushiradi
--     → natijani JSON sifatida qaytaradi
--
-- Ishlatish (admin SQL yoki Edge Function orqali):
--   SELECT * FROM run_monthly_achievement_cycle(2026, 6);
-- ============================================================


-- ── 1. SNAPSHOT HISOBLASH ─────────────────────────────────────────────────────
--
-- Berilgan oy uchun:
--   a) Har bir (talaba, guruh) juftligi uchun calculate_student_score() chaqiradi
--   b) Har bir (o'qituvchi) uchun calculate_teacher_score() chaqiradi
-- Natijalar user_score_snapshots jadvaliga UPSERT qilinadi.
--
-- Qaytaradi: yaratilgan yoki yangilangan snapshotlar soni.

CREATE OR REPLACE FUNCTION public.compute_monthly_snapshots(
  p_year  int,
  p_month int
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_start date;
  v_period_end   date;
  v_count        int := 0;
  r_student      record;
  r_teacher      record;
  r_score        record;
BEGIN
  -- ── KRITIK-1: Admin tekshiruvi ────────────────────────────────────────────
  -- service_role / pg_cron uchun: auth.uid() NULL → tekshiruv o'tkazilmaydi.
  -- authenticated foydalanuvchi uchun: faqat admin rol chaqira oladi.
  IF auth.uid() IS NOT NULL AND public.get_my_profile_role() <> 'admin' THEN
    RAISE EXCEPTION 'Ruxsat yo''q: faqat admin compute_monthly_snapshots ni chaqira oladi';
  END IF;

  v_period_start := make_date(p_year, p_month, 1);
  v_period_end   := (v_period_start + interval '1 month' - interval '1 day')::date;

  -- ── a. TALABALAR ────────────────────────────────────────────────────────────
  -- Davr ichida aktiv bo'lgan har bir (talaba, guruh) juftligi uchun hisoblash
  FOR r_student IN
    SELECT DISTINCT sg.student_id, sg.group_id
    FROM public.student_groups sg
    JOIN public.groups g ON g.id = sg.group_id
    WHERE sg.enrolled_at <= v_period_end
      AND g.status IN ('active', 'completed')
  LOOP
    -- Score funksiyasini chaqiramiz
    SELECT * INTO r_score
    FROM public.calculate_student_score(
      r_student.student_id,
      r_student.group_id,
      v_period_start,
      v_period_end
    );

    -- UPSERT: mavjud bo'lsa yangilaydi, bo'lmasa qo'shadi
    INSERT INTO public.user_score_snapshots (
      user_id, role, period_type, period_year, period_month, group_id,
      attendance_score, test_score, consistency_score, activity_score,
      total_score, calculated_at
    ) VALUES (
      r_student.student_id, 'student', 'monthly', p_year, p_month, r_student.group_id,
      r_score.attendance_score, r_score.test_score,
      r_score.consistency_score, r_score.activity_score,
      r_score.total_score, timezone('utc', now())
    )
    -- Partial unique index: uix_uss_student (group_id IS NOT NULL)
    ON CONFLICT (user_id, period_type, period_year, period_month, group_id)
    WHERE group_id IS NOT NULL
    DO UPDATE SET
      attendance_score  = EXCLUDED.attendance_score,
      test_score        = EXCLUDED.test_score,
      consistency_score = EXCLUDED.consistency_score,
      activity_score    = EXCLUDED.activity_score,
      total_score       = EXCLUDED.total_score,
      calculated_at     = EXCLUDED.calculated_at;

    v_count := v_count + 1;
  END LOOP;

  -- ── b. O'QITUVCHILAR ────────────────────────────────────────────────────────
  -- Davr ichida aktiv guruhlari bo'lgan har bir o'qituvchi uchun hisoblash
  FOR r_teacher IN
    SELECT DISTINCT g.teacher_id
    FROM public.groups g
    WHERE g.status IN ('active', 'completed')
      AND (g.start_date IS NULL OR g.start_date <= v_period_end)
      AND g.teacher_id IS NOT NULL
  LOOP
    SELECT * INTO r_score
    FROM public.calculate_teacher_score(
      r_teacher.teacher_id,
      v_period_start,
      v_period_end
    );

    -- O'qituvchi uchun group_id = NULL (barcha guruhlar yig'indisi)
    INSERT INTO public.user_score_snapshots (
      user_id, role, period_type, period_year, period_month, group_id,
      attendance_score, test_score, consistency_score, activity_score,
      total_score, calculated_at
    ) VALUES (
      r_teacher.teacher_id, 'teacher', 'monthly', p_year, p_month, NULL,
      r_score.attendance_score,   -- attendance_quality
      r_score.test_score,         -- student_performance
      r_score.consistency_score,  -- engagement
      r_score.activity_score,     -- teaching_activity
      r_score.total_score, timezone('utc', now())
    )
    -- Partial unique index: uix_uss_teacher (group_id IS NULL)
    ON CONFLICT (user_id, period_type, period_year, period_month)
    WHERE group_id IS NULL
    DO UPDATE SET
      attendance_score  = EXCLUDED.attendance_score,
      test_score        = EXCLUDED.test_score,
      consistency_score = EXCLUDED.consistency_score,
      activity_score    = EXCLUDED.activity_score,
      total_score       = EXCLUDED.total_score,
      calculated_at     = EXCLUDED.calculated_at;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;


-- ── 2. ACHIEVEMENT BERISH ─────────────────────────────────────────────────────
--
-- compute_monthly_snapshots() dan keyin chaqiriladi.
-- Snapshotlarga qarab:
--
--   TALABALAR (threshold logikasi):
--     total_score ∈ [90, 100] → gold_student
--     total_score ∈ [75, 89.99] → silver_student
--     total_score ∈ [60, 74.99] → bronze_student
--
--   O'QITUVCHILAR:
--     total_score >= 90          → excellence_award     (threshold, bir nechta g'olib)
--     MAX total_score            → best_teacher         (rank #1, faqat 1 ta)
--     MAX test_score             → top_mentor           (rank #1, faqat 1 ta)
--
-- Har ikki tur ham UPSERT — qayta ishga tushirsak ikkilanmaydi.
-- Qaytaradi: berilgan yutuqlar soni.

CREATE OR REPLACE FUNCTION public.assign_monthly_achievements(
  p_year  int,
  p_month int
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count    int := 0;
  r_snap     record;
  v_def_id   uuid;
BEGIN
  -- ── KRITIK-1: Admin tekshiruvi ────────────────────────────────────────────
  IF auth.uid() IS NOT NULL AND public.get_my_profile_role() <> 'admin' THEN
    RAISE EXCEPTION 'Ruxsat yo''q: faqat admin assign_monthly_achievements ni chaqira oladi';
  END IF;

  -- ──────────────────────────────────────────────────────────────────────────
  -- A. TALABALAR — threshold (bitta guruh = bitta yutuq)
  -- ──────────────────────────────────────────────────────────────────────────
  FOR r_snap IN
    SELECT id, user_id, group_id, total_score
    FROM public.user_score_snapshots
    WHERE period_type  = 'monthly'
      AND period_year  = p_year
      AND period_month = p_month
      AND role         = 'student'
      AND total_score  >= 60          -- Bronze chegarasi
    ORDER BY user_id, group_id
  LOOP
    -- Balga mos eng yuqori tier'li achievementni topamiz
    SELECT id INTO v_def_id
    FROM public.achievement_definitions
    WHERE target_role    = 'student'
      AND condition_type = 'threshold'
      AND is_active      = true
      AND r_snap.total_score >= (condition_config->>'min_score')::numeric
      AND r_snap.total_score <= (condition_config->>'max_score')::numeric
    ORDER BY (condition_config->>'min_score')::numeric DESC
    LIMIT 1;

    CONTINUE WHEN v_def_id IS NULL;

    INSERT INTO public.user_achievements (
      user_id, achievement_id, snapshot_id,
      period_type, period_year, period_month,
      group_id, total_score, earned_at
    ) VALUES (
      r_snap.user_id, v_def_id, r_snap.id,
      'monthly', p_year, p_month,
      r_snap.group_id, r_snap.total_score, timezone('utc', now())
    )
    -- Partial unique index: uix_ua_student (group_id IS NOT NULL)
    ON CONFLICT (user_id, achievement_id, period_year, period_month, group_id)
    WHERE group_id IS NOT NULL
    DO UPDATE SET
      snapshot_id = EXCLUDED.snapshot_id,
      total_score = EXCLUDED.total_score,
      earned_at   = EXCLUDED.earned_at;

    v_count := v_count + 1;
  END LOOP;

  -- ──────────────────────────────────────────────────────────────────────────
  -- B.1 O'QITUVCHILAR — Excellence Award (threshold, bir nechta g'olib)
  -- ──────────────────────────────────────────────────────────────────────────
  SELECT id INTO v_def_id
  FROM public.achievement_definitions
  WHERE code = 'excellence_award' AND is_active = true;

  IF v_def_id IS NOT NULL THEN
    FOR r_snap IN
      SELECT id, user_id, total_score
      FROM public.user_score_snapshots
      WHERE period_type  = 'monthly'
        AND period_year  = p_year
        AND period_month = p_month
        AND role         = 'teacher'
        AND total_score  >= 90
    LOOP
      INSERT INTO public.user_achievements (
        user_id, achievement_id, snapshot_id,
        period_type, period_year, period_month,
        group_id, total_score, earned_at
      ) VALUES (
        r_snap.user_id, v_def_id, r_snap.id,
        'monthly', p_year, p_month,
        NULL, r_snap.total_score, timezone('utc', now())
      )
      -- Partial unique index: uix_ua_teacher (group_id IS NULL)
      ON CONFLICT (user_id, achievement_id, period_year, period_month)
      WHERE group_id IS NULL
      DO UPDATE SET
        snapshot_id = EXCLUDED.snapshot_id,
        total_score = EXCLUDED.total_score,
        earned_at   = EXCLUDED.earned_at;

      v_count := v_count + 1;
    END LOOP;
  END IF;

  -- ──────────────────────────────────────────────────────────────────────────
  -- B.2 O'QITUVCHILAR — Best Teacher (rank #1 by total_score)
  -- ──────────────────────────────────────────────────────────────────────────
  SELECT id INTO v_def_id
  FROM public.achievement_definitions
  WHERE code = 'best_teacher' AND is_active = true;

  IF v_def_id IS NOT NULL THEN
    -- Eng yuqori total_score'li o'qituvchini topamiz
    -- Bir nechta o'qituvchi teng bo'lsa — hammasi oladi (RANK OVER)
    FOR r_snap IN
      SELECT id, user_id, total_score
      FROM (
        SELECT
          id, user_id, total_score,
          RANK() OVER (ORDER BY total_score DESC) AS rnk
        FROM public.user_score_snapshots
        WHERE period_type  = 'monthly'
          AND period_year  = p_year
          AND period_month = p_month
          AND role         = 'teacher'
          AND total_score  >= 50   -- Minimal qualifying score
      ) ranked
      WHERE rnk = 1
    LOOP
      INSERT INTO public.user_achievements (
        user_id, achievement_id, snapshot_id,
        period_type, period_year, period_month,
        group_id, total_score, earned_at
      ) VALUES (
        r_snap.user_id, v_def_id, r_snap.id,
        'monthly', p_year, p_month,
        NULL, r_snap.total_score, timezone('utc', now())
      )
      ON CONFLICT (user_id, achievement_id, period_year, period_month)
      WHERE group_id IS NULL
      DO UPDATE SET
        snapshot_id = EXCLUDED.snapshot_id,
        total_score = EXCLUDED.total_score,
        earned_at   = EXCLUDED.earned_at;

      v_count := v_count + 1;
    END LOOP;
  END IF;

  -- ──────────────────────────────────────────────────────────────────────────
  -- B.3 O'QITUVCHILAR — Top Mentor (rank #1 by test_score = student performance)
  -- ──────────────────────────────────────────────────────────────────────────
  SELECT id INTO v_def_id
  FROM public.achievement_definitions
  WHERE code = 'top_mentor' AND is_active = true;

  IF v_def_id IS NOT NULL THEN
    FOR r_snap IN
      SELECT id, user_id, test_score AS winning_score
      FROM (
        SELECT
          id, user_id, test_score,
          RANK() OVER (ORDER BY test_score DESC) AS rnk
        FROM public.user_score_snapshots
        WHERE period_type  = 'monthly'
          AND period_year  = p_year
          AND period_month = p_month
          AND role         = 'teacher'
          AND test_score   >= 50   -- Minimal qualifying score
      ) ranked
      WHERE rnk = 1
    LOOP
      INSERT INTO public.user_achievements (
        user_id, achievement_id, snapshot_id,
        period_type, period_year, period_month,
        group_id, total_score, earned_at
      ) VALUES (
        r_snap.user_id, v_def_id, r_snap.id,
        'monthly', p_year, p_month,
        NULL, r_snap.winning_score, timezone('utc', now())
      )
      ON CONFLICT (user_id, achievement_id, period_year, period_month)
      WHERE group_id IS NULL
      DO UPDATE SET
        snapshot_id = EXCLUDED.snapshot_id,
        total_score = EXCLUDED.total_score,
        earned_at   = EXCLUDED.earned_at;

      v_count := v_count + 1;
    END LOOP;
  END IF;

  RETURN v_count;
END;
$$;


-- ── 3. ASOSIY CHAQIRUV FUNKSIYASI ────────────────────────────────────────────
--
-- Snapshot hisoblash + achievement berish — bitta qo'ng'iroq bilan.
-- Admin SQL Editor yoki keyinchalik Edge Function chaqiradi:
--
--   SELECT run_monthly_achievement_cycle(2026, 6);
--
-- Qaytaradi:
--   { "year": 2026, "month": 6,
--     "snapshots_computed": 47, "achievements_awarded": 12,
--     "executed_at": "2026-06-23T..." }

CREATE OR REPLACE FUNCTION public.run_monthly_achievement_cycle(
  p_year  int,
  p_month int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshots    int;
  v_achievements int;
BEGIN
  -- ── KRITIK-1: Admin tekshiruvi ────────────────────────────────────────────
  IF auth.uid() IS NOT NULL AND public.get_my_profile_role() <> 'admin' THEN
    RAISE EXCEPTION 'Ruxsat yo''q: faqat admin run_monthly_achievement_cycle ni chaqira oladi';
  END IF;

  -- Tekshiruv: kelajak oy uchun ishga tushirib bo'lmaydi
  IF make_date(p_year, p_month, 1) > date_trunc('month', now())::date THEN
    RAISE EXCEPTION 'Kelajak oy uchun snapshot hisoblab bo''lmaydi: %-%', p_year, p_month;
  END IF;

  SELECT public.compute_monthly_snapshots(p_year, p_month) INTO v_snapshots;
  SELECT public.assign_monthly_achievements(p_year, p_month) INTO v_achievements;

  RETURN jsonb_build_object(
    'year',                 p_year,
    'month',                p_month,
    'snapshots_computed',   v_snapshots,
    'achievements_awarded', v_achievements,
    'executed_at',          timezone('utc', now())
  );
END;
$$;

-- ── 4. RPC FUNKSIYALARI (Supabase client uchun) ───────────────────────────────
--
-- Foydalanuvchi o'z snapshotini real-time hisoblata olishi uchun.
-- Bu funksiyalar public bo'lib, auth.uid() orqali cheklanadi.

-- Talabaning hozirgi oyda o'z balini ko'rishi
CREATE OR REPLACE FUNCTION public.get_my_current_score(p_group_id uuid)
RETURNS TABLE (
  attendance_score  numeric,
  test_score        numeric,
  consistency_score numeric,
  activity_score    numeric,
  total_score       numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_today        date := current_date;
  v_period_start date := date_trunc('month', v_today)::date;
BEGIN
  RETURN QUERY
  SELECT * FROM public.calculate_student_score(
    auth.uid(),
    p_group_id,
    v_period_start,
    v_today
  );
END;
$$;

-- O'qituvchining hozirgi oyda o'z balini ko'rishi
CREATE OR REPLACE FUNCTION public.get_my_teacher_score_current()
RETURNS TABLE (
  attendance_score  numeric,
  test_score        numeric,
  consistency_score numeric,
  activity_score    numeric,
  total_score       numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_today        date := current_date;
  v_period_start date := date_trunc('month', v_today)::date;
BEGIN
  RETURN QUERY
  SELECT * FROM public.calculate_teacher_score(
    auth.uid(),
    v_period_start,
    v_today
  );
END;
$$;

-- ── KRITIK-1: REVOKE / GRANT — Kirish nazorati ───────────────────────────────
--
-- Hisoblash sikli funksiyalari (compute / assign / run):
--   - authenticated (admin)  → PUBLIC orqali kirish mavjud
--     (ichki tekshiruv admin emaslarni bloklaydi)
--   - service_role / pg_cron → GRANT bilan maxsus ruxsat
--   - anon                   → umuman chaqira olmaydi
--
-- Ochiq RPC funksiyalar (get_my_current_score, get_my_teacher_score_current):
--   - authenticated           → ruxsatli (o'z balini ko'rish uchun)
--   - anon                    → taqiqlangan
--
-- Idempotent: qayta ishga tushirish xavfsiz.

-- Hisoblash sikli — service_role uchun maxsus GRANT
GRANT EXECUTE ON FUNCTION public.compute_monthly_snapshots(int, int)     TO service_role;
GRANT EXECUTE ON FUNCTION public.assign_monthly_achievements(int, int)   TO service_role;
GRANT EXECUTE ON FUNCTION public.run_monthly_achievement_cycle(int, int) TO service_role;

-- Ochiq RPC — faqat tizimga kirgan foydalanuvchilar (anon emas)
REVOKE EXECUTE ON FUNCTION public.get_my_current_score(uuid)         FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_current_score(uuid)         FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_my_current_score(uuid)         TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_teacher_score_current()     FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_teacher_score_current()     FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_my_teacher_score_current()     TO authenticated;
