-- ============================================================
-- YordamchiAI — Migration 009: Score Calculation Functions
--
-- Ikkita SECURITY DEFINER funksiya:
--   calculate_student_score(student_id, group_id, start, end)
--   calculate_teacher_score(teacher_id, start, end)
--
-- Qaytaradi: 5 ta ustun — 4 komponent + total_score (0–100)
--
-- Bu funksiyalar to'g'ridan-to'g'ri chaqirilmaydi.
-- compute_monthly_snapshots() ularni ichki ishlatadi.
-- ============================================================

-- ── 1. TALABA BALI HISOBLASH ──────────────────────────────────────────────────
--
-- Kirish:
--   p_student_id   — talaba profiles.id
--   p_group_id     — qaysi guruh kontekstida hisoblash
--   p_period_start — davr boshi (shu kun kiritiladi)
--   p_period_end   — davr oxiri (shu kun kiritiladi)
--
-- Qaytaradi:
--   attendance_score  — davomat ulushi, og'irlik bilan (0–100)
--   test_score        — barcha testlar o'rtachasi (0–100)
--   consistency_score — haftalik izchillik (0–100)
--   activity_score    — test ishtirok ulushi (0–100)
--   total_score       — og'irlik bilan yig'indi (0–100)
--
-- Og'irliklar (Faza 1):
--   attendance  × 0.40
--   test        × 0.40
--   consistency × 0.20
--   activity_score saqlanadi lekin weightga kiritilmaydi —
--   dars-ko'rish logi qo'shilganda (Faza 3) 0.10 vazn beriladi.

CREATE OR REPLACE FUNCTION public.calculate_student_score(
  p_student_id   uuid,
  p_group_id     uuid,
  p_period_start date,
  p_period_end   date
)
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
  v_att_score   numeric := 0;
  v_test_score  numeric := 0;
  v_cons_score  numeric := 0;
  v_act_score   numeric := 0;
  v_total       numeric := 0;

  -- Davomat hisoblash uchun
  v_total_days     int     := 0;
  v_weighted_sum   numeric := 0;

  -- Izchillik hisoblash uchun
  v_total_weeks    int     := 0;
  v_active_weeks   int     := 0;

  -- Faollik hisoblash uchun
  v_published_tests int    := 0;
  v_submitted_tests int    := 0;
BEGIN
  -- ── KRITIK-1 / KRITIK-2: Kirish tekshiruvi ───────────────────────────────
  -- Faqat talabaning o'zi, o'qituvchi yoki admin chaqira oladi.
  -- auth.uid() NULL bo'lsa (service_role / pg_cron) — tekshiruv o'tkazilmaydi.
  IF auth.uid() IS NOT NULL
     AND auth.uid() <> p_student_id
     AND public.get_my_profile_role() NOT IN ('teacher', 'admin') THEN
    RAISE EXCEPTION 'Ruxsat yo''q: boshqa talabaning balini ko''ra olmaysiz';
  END IF;

  -- ── 1. DAVOMAT BALI ─────────────────────────────────────────────────────────
  -- present = 1.0 | late = 0.7 | excused = 0.5 | absent = 0.0
  SELECT
    COUNT(*),
    COALESCE(SUM(
      CASE status
        WHEN 'present' THEN 1.0
        WHEN 'late'    THEN 0.7
        WHEN 'excused' THEN 0.5
        ELSE                0.0
      END
    ), 0)
  INTO v_total_days, v_weighted_sum
  FROM public.attendance
  WHERE student_id    = p_student_id
    AND group_id      = p_group_id
    AND attended_date BETWEEN p_period_start AND p_period_end;

  IF v_total_days > 0 THEN
    v_att_score := LEAST(100, (v_weighted_sum / v_total_days) * 100);
  END IF;

  -- ── 2. TEST BALI ─────────────────────────────────────────────────────────────
  -- Har bir test: score / total_questions * 100 → AVG
  SELECT COALESCE(
    AVG(
      tr.score::numeric / NULLIF(tr.total_questions, 0) * 100
    ),
    0
  )
  INTO v_test_score
  FROM public.test_results tr
  JOIN public.tests t ON t.id = tr.test_id
  WHERE tr.student_id   = p_student_id
    AND t.group_id      = p_group_id
    AND tr.submitted_at IS NOT NULL
    AND tr.submitted_at >= p_period_start::timestamptz
    AND tr.submitted_at <  (p_period_end + 1)::timestamptz;

  v_test_score := LEAST(100, COALESCE(v_test_score, 0));

  -- ── 3. IZCHILLIK BALI ────────────────────────────────────────────────────────
  -- Talaba necha haftada kamida 1 marta keldi / jami hafta soni
  v_total_weeks := GREATEST(1, CEIL((p_period_end - p_period_start + 1) / 7.0)::int);

  SELECT COUNT(DISTINCT date_trunc('week', attended_date::timestamptz))
  INTO v_active_weeks
  FROM public.attendance
  WHERE student_id    = p_student_id
    AND group_id      = p_group_id
    AND attended_date BETWEEN p_period_start AND p_period_end
    AND status IN ('present', 'late');

  v_cons_score := LEAST(100, (v_active_weeks::numeric / v_total_weeks) * 100);

  -- ── 4. FAOLLIK BALI ──────────────────────────────────────────────────────────
  -- Davr ichida nashr qilingan testlardan talaba nechatasini topshirdi
  SELECT COUNT(*)
  INTO v_published_tests
  FROM public.tests
  WHERE group_id      = p_group_id
    AND is_published  = true
    AND created_at   >= p_period_start::timestamptz
    AND created_at   <  (p_period_end + 1)::timestamptz;

  SELECT COUNT(*)
  INTO v_submitted_tests
  FROM public.test_results tr
  JOIN public.tests t ON t.id = tr.test_id
  WHERE tr.student_id   = p_student_id
    AND t.group_id      = p_group_id
    AND t.is_published  = true
    AND tr.submitted_at IS NOT NULL
    AND tr.submitted_at >= p_period_start::timestamptz
    AND tr.submitted_at <  (p_period_end + 1)::timestamptz;

  IF v_published_tests > 0 THEN
    v_act_score := LEAST(100, (v_submitted_tests::numeric / v_published_tests) * 100);
  ELSE
    -- Davr ichida test chiqmagan — neytral ball (na yuqori, na past)
    v_act_score := 50;
  END IF;

  -- ── 5. UMUMIY BAL (og'irlik bilan) ──────────────────────────────────────────
  v_total :=
    (v_att_score  * 0.40) +
    (v_test_score * 0.40) +
    (v_cons_score * 0.20);

  RETURN QUERY SELECT
    ROUND(v_att_score,  2),
    ROUND(v_test_score, 2),
    ROUND(v_cons_score, 2),
    ROUND(v_act_score,  2),
    ROUND(v_total,      2);
END;
$$;


-- ── 2. O'QITUVCHI BALI HISOBLASH ─────────────────────────────────────────────
--
-- Kirish:
--   p_teacher_id   — o'qituvchi profiles.id
--   p_period_start — davr boshi
--   p_period_end   — davr oxiri
--
-- Qaytaradi:
--   attendance_score  → davomat belgilash sifati (qancha kunni belgiladi)
--   test_score        → talabalar test o'rtachasi (student performance)
--   consistency_score → sinf faolligi (class engagement)
--   activity_score    → kontent yaratish darajasi (lessons + tests)
--   total_score       → og'irlik bilan yig'indi
--
-- user_score_snapshots jadvalidagi ustun nomlariga moslik:
--   attendance_score  ← attendance_quality
--   test_score        ← student_performance_score  (eng muhim metrika)
--   consistency_score ← engagement_score
--   activity_score    ← teaching_activity_score
--
-- Og'irliklar:
--   test_score (student_performance) × 0.35
--   attendance_score (quality)       × 0.25
--   activity_score (content)         × 0.25
--   consistency_score (engagement)   × 0.15

CREATE OR REPLACE FUNCTION public.calculate_teacher_score(
  p_teacher_id   uuid,
  p_period_start date,
  p_period_end   date
)
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
  v_att_score    numeric := 0;   -- attendance quality
  v_test_score   numeric := 0;   -- student performance
  v_cons_score   numeric := 0;   -- class engagement
  v_act_score    numeric := 0;   -- teaching activity
  v_total        numeric := 0;

  v_period_days      int := 0;
  v_days_marked      int := 0;
  v_group_count      int := 0;
  v_expected_content int := 0;
  v_lessons_count    int := 0;
  v_tests_count      int := 0;
BEGIN
  -- ── KRITIK-1 / KRITIK-2: Kirish tekshiruvi ───────────────────────────────
  -- Faqat o'qituvchining o'zi yoki admin chaqira oladi.
  -- auth.uid() NULL bo'lsa (service_role / pg_cron) — tekshiruv o'tkazilmaydi.
  IF auth.uid() IS NOT NULL
     AND auth.uid() <> p_teacher_id
     AND public.get_my_profile_role() <> 'admin' THEN
    RAISE EXCEPTION 'Ruxsat yo''q: boshqa o''qituvchining balini ko''ra olmaysiz';
  END IF;

  v_period_days := (p_period_end - p_period_start + 1);

  -- ── 1. DAVOMAT BELGILASH SIFATI ─────────────────────────────────────────────
  -- O'qituvchi o'z guruhlarida necha kun davomat belgiladi
  SELECT COUNT(DISTINCT a.attended_date)
  INTO v_days_marked
  FROM public.attendance a
  JOIN public.groups g ON g.id = a.group_id
  WHERE g.teacher_id   = p_teacher_id
    AND a.attended_date BETWEEN p_period_start AND p_period_end;

  -- Kutilgan ish kunlari: period_days × 5/7 (taxminiy ish haftalik)
  v_att_score := LEAST(100,
    v_days_marked::numeric / GREATEST(1, v_period_days * 5.0 / 7.0) * 100
  );

  -- ── 2. TALABALAR TEST NATIJALARI (student performance) ──────────────────────
  -- O'qituvchi guruhlaridagi barcha talabalarning test o'rtachasi
  SELECT COALESCE(
    AVG(tr.score::numeric / NULLIF(tr.total_questions, 0) * 100),
    0
  )
  INTO v_test_score
  FROM public.test_results tr
  JOIN public.tests t    ON t.id  = tr.test_id
  JOIN public.groups g   ON g.id  = t.group_id
  WHERE g.teacher_id    = p_teacher_id
    AND tr.submitted_at IS NOT NULL
    AND tr.submitted_at >= p_period_start::timestamptz
    AND tr.submitted_at <  (p_period_end + 1)::timestamptz;

  v_test_score := LEAST(100, COALESCE(v_test_score, 0));

  -- ── 3. SINF FAOLLIGI (engagement) ────────────────────────────────────────────
  -- O'qituvchi guruhlaridagi o'rtacha talaba davomati
  SELECT COALESCE(
    AVG(
      CASE a.status
        WHEN 'present' THEN 1.0
        WHEN 'late'    THEN 0.7
        WHEN 'excused' THEN 0.5
        ELSE                0.0
      END
    ) * 100,
    0
  )
  INTO v_cons_score
  FROM public.attendance a
  JOIN public.groups g ON g.id = a.group_id
  WHERE g.teacher_id   = p_teacher_id
    AND a.attended_date BETWEEN p_period_start AND p_period_end;

  v_cons_score := LEAST(100, COALESCE(v_cons_score, 0));

  -- ── 4. KONTENT YARATISH DARAJASI (teaching activity) ────────────────────────
  -- Yaratilgan darslar + testlar / kutilgan miqdor * 100
  -- Kutilgan miqdor: har bir aktiv guruh uchun oyiga 8 ta kontent
  SELECT COUNT(*)
  INTO v_group_count
  FROM public.groups
  WHERE teacher_id  = p_teacher_id
    AND status IN ('active', 'completed')
    AND (start_date IS NULL OR start_date <= p_period_end);

  v_expected_content := GREATEST(1, v_group_count * 8);

  SELECT COUNT(*)
  INTO v_lessons_count
  FROM public.lessons
  WHERE teacher_id  = p_teacher_id
    AND is_published = true
    AND created_at  >= p_period_start::timestamptz
    AND created_at  <  (p_period_end + 1)::timestamptz;

  SELECT COUNT(*)
  INTO v_tests_count
  FROM public.tests
  WHERE created_by  = p_teacher_id
    AND is_published = true
    AND created_at  >= p_period_start::timestamptz
    AND created_at  <  (p_period_end + 1)::timestamptz;

  v_act_score := LEAST(100,
    (v_lessons_count + v_tests_count)::numeric / v_expected_content * 100
  );

  -- ── 5. UMUMIY BAL (og'irlik bilan) ──────────────────────────────────────────
  v_total :=
    (v_test_score  * 0.35) +   -- student performance eng muhim
    (v_att_score   * 0.25) +   -- attendance quality
    (v_act_score   * 0.25) +   -- teaching activity
    (v_cons_score  * 0.15);    -- class engagement

  RETURN QUERY SELECT
    ROUND(v_att_score,  2),
    ROUND(v_test_score, 2),
    ROUND(v_cons_score, 2),
    ROUND(v_act_score,  2),
    ROUND(v_total,      2);
END;
$$;

-- ── KRITIK-1: REVOKE / GRANT — Kirish nazorati ───────────────────────────────
--
-- calculate_student_score va calculate_teacher_score ICHKI funksiyalar.
-- Ular to'g'ridan-to'g'ri Supabase RPC orqali chaqirilmasligi kerak.
-- Faqat SECURITY DEFINER funksiyalar (compute_monthly_snapshots,
-- get_my_current_score, get_my_teacher_score_current) ichidan chaqiriladi.
--
-- authenticated foydalanuvchilar kirish yo'li:
--   student  → get_my_current_score()          → calculate_student_score()
--   teacher  → get_my_teacher_score_current()  → calculate_teacher_score()
--   admin    → compute_monthly_snapshots()      → ikkala funksiya ham
--
-- Idempotent: qayta ishga tushirish xavfsiz.

REVOKE EXECUTE ON FUNCTION public.calculate_student_score(uuid, uuid, date, date) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.calculate_student_score(uuid, uuid, date, date) TO service_role;

REVOKE EXECUTE ON FUNCTION public.calculate_teacher_score(uuid, date, date) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.calculate_teacher_score(uuid, date, date) TO service_role;
