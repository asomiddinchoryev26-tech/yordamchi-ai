-- ============================================================
-- YordamchiAI — Migration 021: Test integrity (P1 security fix)
--
-- MUAMMO (audit P1):
--   1. Talaba `tests` jadvalini to'g'ridan-to'g'ri o'qib, `questions` ichidagi
--      `correct_index` (to'g'ri javoblar) ni ko'ra olardi → aldash imkoni.
--   2. `test_results` uchun "FOR ALL" siyosati talabaga istalgan `score` ni
--      yozish imkonini berardi → natijani soxtalashtirish.
--
-- YECHIM:
--   • Talabaning `tests` ustidagi to'g'ridan-to'g'ri SELECT siyosati olib tashlanadi.
--     Talaba testlarni FAQAT SECURITY DEFINER RPC orqali oladi (javoblar serverda
--     qoladi; topshirilmagan testda correct_index UMUMAN yuborilmaydi).
--   • Baholash SERVERDA (submit_test RPC) hisoblanadi va yoziladi — mijoz score
--     yubora olmaydi. `test_results` talaba uchun faqat SELECT.
--   • Dashboard/Progress uchun test nomlari xavfsiz RPC orqali beriladi.
--
--   Eslatma: correct_index `tests.questions` da qoladi (o'qituvchi/admin uchun),
--   lekin talabaga hech qachon yetib bormaydi.
--
-- Idempotent: qayta ishga tushirish xavfsiz.
-- ============================================================

-- ── 1. Xavfli talaba siyosatlarini olib tashlaymiz ────────────────────────────
DROP POLICY IF EXISTS "Student: read published tests" ON public.tests;
DROP POLICY IF EXISTS "Student: manage own results"   ON public.test_results;

-- Talaba faqat O'Z natijalarini O'QIY oladi (yoza olmaydi — yozish RPC orqali)
DO $$ BEGIN
  CREATE POLICY "Student: read own results"
    ON public.test_results FOR SELECT
    USING (student_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. Talaba uchun testlar (javoblar tozalangan) ─────────────────────────────
-- correct_index FAQAT talaba allaqachon topshirgan testlarda qaytariladi
-- (topshirilgach ko'rib chiqish/review ekrani uchun). Aks holda umuman yo'q.
CREATE OR REPLACE FUNCTION public.get_student_tests()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(jsonb_agg(row_to_json(x) ORDER BY x.created_at DESC), '[]'::jsonb)
  FROM (
    SELECT
      t.id, t.title, t.description, t.group_id, t.subject_id, t.created_by,
      t.duration_minutes, t.is_published, t.created_at,
      (
        SELECT COALESCE(jsonb_agg(
          CASE WHEN r.submitted_at IS NOT NULL
            THEN elem.value  -- topshirilgan: to'liq (review uchun)
            ELSE jsonb_build_object(
                   'id',       elem.value->'id',
                   'question', elem.value->'question',
                   'options',  elem.value->'options'
                 )
          END
        ), '[]'::jsonb)
        FROM jsonb_array_elements(t.questions) AS elem
      ) AS questions,
      (SELECT jsonb_build_object('id', g.id, 'name', g.name)
         FROM public.groups g WHERE g.id = t.group_id) AS "group",
      (SELECT row_to_json(rr) FROM public.test_results rr
         WHERE rr.test_id = t.id AND rr.student_id = auth.uid()) AS result
    FROM public.tests t
    LEFT JOIN public.test_results r ON r.test_id = t.id AND r.student_id = auth.uid()
    WHERE t.is_published = true
      AND (
        t.group_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.student_groups sg
          WHERE sg.student_id = auth.uid() AND sg.group_id = t.group_id
        )
      )
    ORDER BY t.created_at DESC
  ) x
$$;

-- ── 3. Testni topshirish — SERVER tomonida baholash ───────────────────────────
CREATE OR REPLACE FUNCTION public.submit_test(p_test_id uuid, p_answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_questions jsonb;
  v_total     int;
  v_score     int := 0;
  q           jsonb;
  v_sel       int;
  v_correct   int;
  v_result    public.test_results;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Avtorizatsiya talab qilinadi'; END IF;

  -- Kirish tekshiruvi: nashr qilingan va talaba guruhiga tegishli test
  SELECT t.questions INTO v_questions
  FROM public.tests t
  WHERE t.id = p_test_id
    AND t.is_published = true
    AND (
      t.group_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.student_groups sg
        WHERE sg.student_id = v_uid AND sg.group_id = t.group_id
      )
    );
  IF v_questions IS NULL THEN
    RAISE EXCEPTION 'Test topilmadi yoki ruxsat yo''q';
  END IF;

  v_total := jsonb_array_length(v_questions);

  -- Serverda baholash (correct_index mijozga chiqmaydi)
  FOR q IN SELECT value FROM jsonb_array_elements(v_questions) LOOP
    v_correct := (q->>'correct_index')::int;
    v_sel     := NULLIF(p_answers->>(q->>'id'), '')::int;
    IF v_sel IS NOT NULL AND v_sel = v_correct THEN
      v_score := v_score + 1;
    END IF;
  END LOOP;

  INSERT INTO public.test_results (test_id, student_id, answers, score, total_questions, submitted_at)
  VALUES (p_test_id, v_uid, COALESCE(p_answers, '{}'::jsonb), v_score, v_total, timezone('utc', now()))
  ON CONFLICT (test_id, student_id) DO UPDATE
    SET answers = EXCLUDED.answers, score = EXCLUDED.score,
        total_questions = EXCLUDED.total_questions, submitted_at = EXCLUDED.submitted_at
  RETURNING * INTO v_result;

  -- Natija + review uchun to'liq savollar (topshirilgandan keyin javoblar ochiladi)
  RETURN jsonb_build_object('result', row_to_json(v_result), 'questions', v_questions);
END;
$$;

-- ── 4. Talabaning o'z natijalari + test nomi (dashboard/progress uchun) ───────
CREATE OR REPLACE FUNCTION public.get_my_test_results()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(jsonb_agg(row_to_json(x) ORDER BY x.submitted_at DESC), '[]'::jsonb)
  FROM (
    SELECT
      r.id, r.test_id, r.score, r.total_questions, r.submitted_at,
      jsonb_build_object(
        'title', t.title,
        'group', jsonb_build_object('name', g.name)
      ) AS test
    FROM public.test_results r
    JOIN public.tests t       ON t.id = r.test_id
    LEFT JOIN public.groups g ON g.id = t.group_id
    WHERE r.student_id = auth.uid()
      AND r.submitted_at IS NOT NULL
    ORDER BY r.submitted_at DESC
  ) x
$$;

GRANT EXECUTE ON FUNCTION public.get_student_tests()            TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_test(uuid, jsonb)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_test_results()          TO authenticated;
