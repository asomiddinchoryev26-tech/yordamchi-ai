-- ============================================================
-- Migration 018 — verification script (Homework & Assignment module)
--
-- MUHIM: Supabase SQL Editor RAISE NOTICE / RAISE WARNING xabarlarini
-- ko'rsatmaydi va DO $$ bloki natija jadvali qaytarmaydi. Shu sabab avvalgi
-- versiyada hisobot "ko'rinmas" edi. Bu versiya BARCHA tekshiruvlarni vaqtinchalik
-- jadvalga yozadi va oxirida bitta SELECT bilan qaytaradi — natija HAR DOIM ko'rinadi.
--
-- Nima qiladi:
--   • Sxema tekshiruvi (jadval / RLS / siyosat / trigger / funksiya / bucket / indeks)
--   • MAVJUD production yozuvlaridan foydalanib to'liq workflow smoke test
--     (soxta teacher/student/group YARATMAYDI):
--       o'qituvchi yaratadi -> talaba ko'radi -> yuklaydi -> baholanadi -> bildirishnoma
--   • Test artefaktlari (topshiriq/submission/bildirishnoma) savepoint orqali
--     ROLLBACK qilinadi — production ma'lumotiga TEGILMAYDI.
--   • Har bosqich uchun PASS / FAIL / SKIP + sabab bitta SELECT jadvalida chiqadi.
--
-- Ishlatish: butun faylni Supabase SQL Editor'da RUN qiling. Oxirgi natija
-- jadvali — to'liq PASS/FAIL hisoboti.
-- ============================================================

-- ── Hisobot uchun vaqtinchalik jadval (sessiya davomida) ─────────────────────
DROP TABLE IF EXISTS _v018_report;
CREATE TEMP TABLE _v018_report (
  seq        int  PRIMARY KEY,
  category   text NOT NULL,
  check_name text NOT NULL,
  status     text NOT NULL,     -- PASS | FAIL | SKIP
  detail     text
);

-- ── Barcha tekshiruvlarni bajarib, natijalarni jadvalga yozadi ───────────────
DO $$
DECLARE
  -- Sxema hisoblagichlari
  v_tbl_count    int := 0;
  v_rls_count    int := 0;
  v_pol_count    int := 0;
  v_trg_count    int := 0;
  v_fn_count     int := 0;
  v_bucket_count int := 0;
  v_idx_count    int := 0;
  v_storage_pol  int := 0;

  -- Zarur jadvallar
  v_tbl            text;
  v_missing_tables text := '';

  -- Topilgan (mavjud) yozuvlar
  v_teacher uuid;
  v_student uuid;
  v_group   uuid;

  -- Test artefaktlari (savepoint bilan rollback qilinadi)
  v_asg uuid;
  v_sub uuid;

  -- Bosqich holatlari va sabablari
  st1 text := 'SKIP'; d1 text := '';
  st2 text := 'SKIP'; d2 text := '';
  st3 text := 'SKIP'; d3 text := '';
  st4 text := 'SKIP'; d4 text := '';
  st5 text := 'SKIP'; d5 text := '';
  st6 text := 'SKIP'; d6 text := '';

  -- Diagnostika
  v_teachers       int := 0;
  v_students       int := 0;
  v_grp_teacher    int := 0;
  v_enroll_teacher int := 0;

  -- Natijalar
  v_visible      boolean := false;
  v_notif_new    int     := 0;
  v_notif_graded int     := 0;
BEGIN
  -- ==========================================================
  -- A. SXEMA TEKSHIRUVI
  -- ==========================================================
  SELECT count(*) INTO v_tbl_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('assignments','assignment_groups','assignment_attachments',
                       'assignment_submissions','notifications');

  SELECT count(*) INTO v_rls_count
  FROM pg_class
  WHERE relname IN ('assignments','assignment_groups','assignment_attachments',
                    'assignment_submissions','notifications')
    AND relrowsecurity = true;

  SELECT count(*) INTO v_pol_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('assignments','assignment_groups','assignment_attachments',
                      'assignment_submissions','notifications');

  SELECT count(*) INTO v_trg_count
  FROM pg_trigger t
  WHERE NOT t.tgisinternal
    AND t.tgname IN ('trg_assignments_updated_at','trg_submissions_updated_at',
                     'trg_notify_assignment_published','trg_notify_submission_graded');

  SELECT count(*) INTO v_fn_count
  FROM pg_proc
  WHERE proname IN ('set_updated_at','notify_assignment_published',
                    'notify_submission_graded','create_deadline_reminders');

  SELECT count(*) INTO v_bucket_count
  FROM storage.buckets
  WHERE id = 'assignment-files';

  SELECT count(*) INTO v_idx_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('assignments','assignment_groups','assignment_attachments',
                      'assignment_submissions','notifications');

  -- Storage RLS siyosatlari 'storage' sxemasida (storage.objects) — 'public' emas.
  -- Shu sabab yuqoridagi v_pol_count'ga kirmaydi; alohida sanaladi.
  SELECT count(*) INTO v_storage_pol
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname IN (
      'Authenticated can read assignment files',
      'Authenticated can upload assignment files',
      'Owner or admin can delete assignment files'
    );

  -- ==========================================================
  -- B. WORKFLOW — 1-bosqich: mavjud yozuvlarni topish
  -- ==========================================================
  FOREACH v_tbl IN ARRAY ARRAY[
      'profiles','groups','student_groups',
      'assignments','assignment_groups','assignment_submissions','notifications'
    ]
  LOOP
    IF to_regclass('public.' || v_tbl) IS NULL THEN
      v_missing_tables := v_missing_tables || ' ' || v_tbl;
    END IF;
  END LOOP;

  IF length(v_missing_tables) > 0 THEN
    st1 := 'FAIL';
    d1  := $m$MISSING TABLE:$m$ || v_missing_tables || $m$  (migratsiya to'liq qo'llanmagan)$m$;
  ELSE
    SELECT sg.student_id, g.id, g.teacher_id
      INTO v_student, v_group, v_teacher
    FROM public.student_groups sg
    JOIN public.groups   g  ON g.id  = sg.group_id
    JOIN public.profiles pt ON pt.id = g.teacher_id  AND pt.role = 'teacher'
    JOIN public.profiles ps ON ps.id = sg.student_id AND ps.role = 'student'
    LIMIT 1;

    IF v_student IS NOT NULL THEN
      st1 := 'PASS';
      d1  := 'teacher=' || v_teacher::text
               || ' group=' || v_group::text
               || ' student=' || v_student::text;
    ELSE
      st1 := 'FAIL';

      SELECT count(*) INTO v_teachers FROM public.profiles WHERE role = 'teacher';
      SELECT count(*) INTO v_students FROM public.profiles WHERE role = 'student';
      SELECT count(*) INTO v_grp_teacher
        FROM public.groups g
        JOIN public.profiles pt ON pt.id = g.teacher_id AND pt.role = 'teacher';
      SELECT count(*) INTO v_enroll_teacher
        FROM public.student_groups sg
        JOIN public.groups   g  ON g.id  = sg.group_id
        JOIN public.profiles pt ON pt.id = g.teacher_id AND pt.role = 'teacher';

      d1 := CASE
              WHEN v_teachers = 0
                THEN $m$MISSING RECORD: o'qituvchi yo'q (profiles.role = 'teacher')$m$
              WHEN v_grp_teacher = 0
                THEN $m$MISSING RELATIONSHIP: guruh o'qituvchiga biriktirilmagan (groups.teacher_id NULL)$m$
              WHEN v_students = 0
                THEN $m$MISSING RECORD: talaba yo'q (profiles.role = 'student')$m$
              WHEN v_enroll_teacher = 0
                THEN $m$MISSING RELATIONSHIP: o'qituvchili guruhga yozilgan talaba yo'q (student_groups)$m$
              ELSE
                $m$MISSING RELATIONSHIP: teacher -> group -> student uchligi mos kelmadi$m$
            END;
    END IF;
  END IF;

  -- ==========================================================
  -- C. WORKFLOW — 2..6 bosqichlar (savepoint bilan, oxirida rollback)
  -- ==========================================================
  IF st1 = 'PASS' THEN
    BEGIN  -- ===== rollback wrapper (test yozuvlari shu yerda bekor qilinadi) =====

      -- 2) O'qituvchi topshiriq yaratadi -> guruhga biriktiradi -> nashr qiladi
      BEGIN
        INSERT INTO public.assignments (teacher_id, title, max_score, status, deadline)
        VALUES (v_teacher, 'SMOKE TEST - 018', 100, 'draft', now() + interval '3 days')
        RETURNING id INTO v_asg;

        INSERT INTO public.assignment_groups (assignment_id, group_id)
        VALUES (v_asg, v_group);

        UPDATE public.assignments SET status = 'published' WHERE id = v_asg;
        st2 := 'PASS';
      EXCEPTION WHEN OTHERS THEN
        st2 := 'FAIL'; d2 := SQLERRM;
      END;

      -- 3) Talaba topshiriqni KO'RADI (RLS ko'rinish zanjiri)
      IF st2 = 'PASS' THEN
        SELECT EXISTS (
          SELECT 1
          FROM public.assignments a
          JOIN public.assignment_groups ag ON ag.assignment_id = a.id
          JOIN public.student_groups sg    ON sg.group_id = ag.group_id
          WHERE a.id = v_asg
            AND a.status = 'published'
            AND a.deleted_at IS NULL
            AND sg.student_id = v_student
        ) INTO v_visible;

        IF v_visible THEN
          st3 := 'PASS';
        ELSE
          st3 := 'FAIL';
          d3  := $m$RLS ko'rinish zanjiri natija bermadi (assignments <-> assignment_groups <-> student_groups)$m$;
        END IF;
      END IF;

      -- 4) Talaba ish yuklaydi (submission)
      IF st2 = 'PASS' THEN
        BEGIN
          INSERT INTO public.assignment_submissions
            (assignment_id, student_id, file_name, file_path, status)
          VALUES
            (v_asg, v_student, 'ishim.pdf', 'submissions/smoke/ishim.pdf', 'submitted')
          RETURNING id INTO v_sub;
          st4 := 'PASS';
        EXCEPTION WHEN OTHERS THEN
          st4 := 'FAIL'; d4 := SQLERRM;
        END;
      END IF;

      -- 5) O'qituvchi baholaydi
      IF st4 = 'PASS' THEN
        BEGIN
          UPDATE public.assignment_submissions
            SET status    = 'graded',
                score     = 92,
                feedback  = 'Zo''r ish',
                graded_by = v_teacher,
                graded_at = now()
            WHERE id = v_sub;
          st5 := 'PASS';
        EXCEPTION WHEN OTHERS THEN
          st5 := 'FAIL'; d5 := SQLERRM;
        END;
      END IF;

      -- 6) Bildirishnomalar (assignment_new + assignment_graded) — rollbackdan OLDIN o'qiladi
      IF st2 = 'PASS' THEN
        SELECT count(*) INTO v_notif_new
        FROM public.notifications
        WHERE user_id = v_student
          AND type = 'assignment_new'
          AND (data->>'assignment_id')::uuid = v_asg;
      END IF;

      IF st5 = 'PASS' THEN
        SELECT count(*) INTO v_notif_graded
        FROM public.notifications
        WHERE user_id = v_student
          AND type = 'assignment_graded'
          AND (data->>'submission_id')::uuid = v_sub;
      END IF;

      IF st2 = 'PASS' OR st5 = 'PASS' THEN
        IF v_notif_new > 0 AND v_notif_graded > 0 THEN
          st6 := 'PASS';
        ELSE
          st6 := 'FAIL';
          d6  := 'assignment_new=' || v_notif_new::text
                   || ' (kutildi >=1), assignment_graded=' || v_notif_graded::text
                   || ' (kutildi >=1)';
        END IF;
      END IF;

      -- Test yozuvlarini bekor qilamiz (savepoint rollback). O'zgaruvchilar saqlanadi.
      RAISE EXCEPTION 'SMOKE_TEST_ROLLBACK';

    EXCEPTION
      WHEN SQLSTATE 'P0001' THEN
        IF SQLERRM <> 'SMOKE_TEST_ROLLBACK' THEN
          d6 := COALESCE(NULLIF(d6, ''), SQLERRM);
        END IF;
      WHEN OTHERS THEN
        d6 := COALESCE(NULLIF(d6, ''), SQLERRM);
    END;  -- ===== bu yerda barcha test yozuvlari bekor qilingan =====
  ELSE
    -- Mavjud yozuvlar topilmadi -> keyingi bosqichlar o'tkazilmaydi
    st2 := 'SKIP'; d2 := $m$1-bosqich FAIL (mavjud yozuvlar yo'q)$m$;
    st3 := 'SKIP'; d3 := d2;
    st4 := 'SKIP'; d4 := d2;
    st5 := 'SKIP'; d5 := d2;
    st6 := 'SKIP'; d6 := d2;
  END IF;

  -- ==========================================================
  -- D. HISOBOTNI JADVALGA YOZAMIZ (rollbackdan tashqarida — saqlanadi)
  -- ==========================================================
  INSERT INTO _v018_report (seq, category, check_name, status, detail) VALUES
    (1, 'SCHEMA', '5 ta jadval mavjud',
        CASE WHEN v_tbl_count = 5 THEN 'PASS' ELSE 'FAIL' END, v_tbl_count::text || '/5'),
    (2, 'SCHEMA', 'RLS yoqilgan',
        CASE WHEN v_rls_count = 5 THEN 'PASS' ELSE 'FAIL' END, v_rls_count::text || '/5'),
    (3, 'SCHEMA', 'RLS siyosatlari — public 5 jadval (kutilgan 18)',
        CASE WHEN v_pol_count >= 18 THEN 'PASS' ELSE 'FAIL' END, v_pol_count::text || '/18'),
    (4, 'SCHEMA', 'RLS siyosatlari — storage.objects (kutilgan 3)',
        CASE WHEN v_storage_pol = 3 THEN 'PASS' ELSE 'FAIL' END, v_storage_pol::text || '/3'),
    (5, 'SCHEMA', 'RLS siyosatlari — jami (18 public + 3 storage = 21)',
        CASE WHEN (v_pol_count + v_storage_pol) >= 21 THEN 'PASS' ELSE 'FAIL' END, (v_pol_count + v_storage_pol)::text || '/21'),
    (6, 'SCHEMA', 'Triggerlar (kutilgan 4)',
        CASE WHEN v_trg_count = 4 THEN 'PASS' ELSE 'FAIL' END, v_trg_count::text || '/4'),
    (7, 'SCHEMA', 'Funksiyalar (kutilgan 4)',
        CASE WHEN v_fn_count = 4 THEN 'PASS' ELSE 'FAIL' END, v_fn_count::text || '/4'),
    (8, 'SCHEMA', 'Storage bucket (assignment-files)',
        CASE WHEN v_bucket_count = 1 THEN 'PASS' ELSE 'FAIL' END, v_bucket_count::text || '/1'),
    (9, 'SCHEMA', 'Indekslar (kutilgan >=12)',
        CASE WHEN v_idx_count >= 12 THEN 'PASS' ELSE 'FAIL' END, v_idx_count::text || ' ta');

  INSERT INTO _v018_report (seq, category, check_name, status, detail) VALUES
    (10, 'WORKFLOW', $m$1. Mavjud yozuvlar (teacher/group/student)$m$, st1, d1),
    (11, 'WORKFLOW', $m$2. O'qituvchi topshiriq yaratdi + nashr qildi$m$, st2, d2),
    (12, 'WORKFLOW', $m$3. Talaba topshiriqni ko'radi (RLS)$m$, st3, d3),
    (13, 'WORKFLOW', $m$4. Talaba ish yukladi (submission)$m$, st4, d4),
    (14, 'WORKFLOW', $m$5. O'qituvchi baholadi$m$, st5, d5),
    (15, 'WORKFLOW', $m$6. Bildirishnomalar yaratildi (new + graded)$m$, st6, d6);

  INSERT INTO _v018_report (seq, category, check_name, status, detail)
  SELECT 99, 'RESULT', 'YAKUNIY NATIJA',
         CASE WHEN EXISTS (SELECT 1 FROM _v018_report WHERE status = 'FAIL')
              THEN 'FAIL' ELSE 'PASS' END,
         'FAIL qatorlar soni: ' || (SELECT count(*)::text FROM _v018_report WHERE status = 'FAIL');

EXCEPTION WHEN OTHERS THEN
  -- Kutilmagan xato bo'lsa ham hisobotda ko'rinsin
  INSERT INTO _v018_report (seq, category, check_name, status, detail)
  VALUES (100, 'RESULT', 'UNEXPECTED ERROR', 'FAIL', SQLERRM || ' (SQLSTATE ' || SQLSTATE || ')');
END $$;

-- ── YAKUNIY HISOBOT (har doim ko'rinadigan natija jadvali) ───────────────────
SELECT seq, category, check_name, status, detail
FROM _v018_report
ORDER BY seq;
