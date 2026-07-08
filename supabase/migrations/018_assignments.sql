-- ============================================================
-- YordamchiAI — Migration 018: Homework & Assignment module
--
-- Jadvallar:
--   1. assignments             — o'qituvchi yaratgan topshiriqlar
--   2. assignment_groups       — topshiriq ↔ guruh (ko'p-ko'pga)
--   3. assignment_attachments  — topshiriqqa biriktirilgan fayllar (PDF/DOCX/rasm)
--   4. assignment_submissions  — talaba topshirgan ishlar + baho + izoh
--   5. notifications           — bildirishnomalar (yangi topshiriq / baho / muddat)
--
-- Xususiyatlar: UUID kalitlar, created_at/updated_at, soft delete (deleted_at),
-- indekslar, foreign key'lar, RLS + xavfsiz siyosatlar, updated_at triggerlari,
-- avtomatik bildirishnoma triggerlari, Storage bucket.
--
-- Idempotent: qayta ishga tushirish xavfsiz.
-- ============================================================

-- ── 0. UMUMIY: updated_at ni avtomatik yangilovchi trigger funksiyasi ─────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- ============================================================
-- 1. ASSIGNMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.assignments (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id   uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id   uuid        REFERENCES public.subjects(id) ON DELETE SET NULL,
  title        text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description  text,
  deadline     timestamptz,
  max_score    integer     NOT NULL DEFAULT 100 CHECK (max_score BETWEEN 1 AND 1000),
  status       text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  deleted_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at   timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_assignments_teacher  ON public.assignments (teacher_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_subject  ON public.assignments (subject_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assignments_deadline ON public.assignments (deadline)   WHERE deleted_at IS NULL AND status = 'published';
CREATE INDEX IF NOT EXISTS idx_assignments_status   ON public.assignments (status)     WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_assignments_updated_at ON public.assignments;
CREATE TRIGGER trg_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- NOTE: assignments'ning talaba SELECT siyosati assignment_groups jadvaliga
-- tayanadi, shuning uchun siyosatlar §2 (assignment_groups yaratilgandan) keyin
-- e'lon qilinadi — CREATE POLICY o'z ifodasini yaratish paytida tahlil qiladi.

-- ============================================================
-- 2. ASSIGNMENT_GROUPS  (topshiriq bir yoki bir nechta guruhga)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.assignment_groups (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid        NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  group_id      uuid        NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (assignment_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_groups_assignment ON public.assignment_groups (assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_groups_group      ON public.assignment_groups (group_id);

ALTER TABLE public.assignment_groups ENABLE ROW LEVEL SECURITY;

-- ── assignments RLS siyosatlari (endi assignment_groups mavjud) ───────────────

-- Talaba: o'z guruhiga tegishli, nashr qilingan va o'chirilmagan topshiriqlarni ko'radi
DO $$ BEGIN
  CREATE POLICY "Student: read published assignments for own groups"
    ON public.assignments FOR SELECT
    USING (
      deleted_at IS NULL
      AND status = 'published'
      AND EXISTS (
        SELECT 1
        FROM public.assignment_groups ag
        JOIN public.student_groups sg ON sg.group_id = ag.group_id
        WHERE ag.assignment_id = assignments.id
          AND sg.student_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- O'qituvchi: faqat o'zining topshiriqlarini boshqaradi
DO $$ BEGIN
  CREATE POLICY "Teacher: manage own assignments"
    ON public.assignments FOR ALL
    USING (teacher_id = auth.uid())
    WITH CHECK (teacher_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin: barcha topshiriqlar
DO $$ BEGIN
  CREATE POLICY "Admin: manage all assignments"
    ON public.assignments FOR ALL
    USING (public.get_my_profile_role() = 'admin')
    WITH CHECK (public.get_my_profile_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── assignment_groups RLS siyosatlari ─────────────────────────────────────────

-- Talaba: o'ziga tegishli guruh biriktirmalarini ko'radi
DO $$ BEGIN
  CREATE POLICY "Student: read own group assignment links"
    ON public.assignment_groups FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.student_groups sg
        WHERE sg.group_id = assignment_groups.group_id
          AND sg.student_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- O'qituvchi: o'z topshirig'ining guruh biriktirmalarini boshqaradi
DO $$ BEGIN
  CREATE POLICY "Teacher: manage own assignment group links"
    ON public.assignment_groups FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_groups.assignment_id
          AND a.teacher_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_groups.assignment_id
          AND a.teacher_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admin: manage all assignment group links"
    ON public.assignment_groups FOR ALL
    USING (public.get_my_profile_role() = 'admin')
    WITH CHECK (public.get_my_profile_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 3. ASSIGNMENT_ATTACHMENTS  (o'qituvchi biriktirgan fayllar)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.assignment_attachments (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid        NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  file_name     text        NOT NULL,
  file_path     text        NOT NULL,
  file_size     bigint,
  mime_type     text,
  uploaded_by   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS uix_assignment_attachments_path ON public.assignment_attachments (file_path);
CREATE INDEX IF NOT EXISTS idx_assignment_attachments_assignment ON public.assignment_attachments (assignment_id);

ALTER TABLE public.assignment_attachments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Student: read attachments for visible assignments"
    ON public.assignment_attachments FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.assignments a
        JOIN public.assignment_groups ag ON ag.assignment_id = a.id
        JOIN public.student_groups sg    ON sg.group_id = ag.group_id
        WHERE a.id = assignment_attachments.assignment_id
          AND a.status = 'published'
          AND a.deleted_at IS NULL
          AND sg.student_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Teacher: manage own assignment attachments"
    ON public.assignment_attachments FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_attachments.assignment_id
          AND a.teacher_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_attachments.assignment_id
          AND a.teacher_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admin: manage all assignment attachments"
    ON public.assignment_attachments FOR ALL
    USING (public.get_my_profile_role() = 'admin')
    WITH CHECK (public.get_my_profile_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 4. ASSIGNMENT_SUBMISSIONS  (talaba topshirig'i + baho + izoh)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid        NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name     text,
  file_path     text,
  file_size     bigint,
  mime_type     text,
  comment       text,
  status        text        NOT NULL DEFAULT 'submitted'
                CHECK (status IN ('submitted', 'graded', 'returned')),
  score         integer     CHECK (score IS NULL OR score >= 0),
  feedback      text,
  graded_by     uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  graded_at     timestamptz,
  submitted_at  timestamptz NOT NULL DEFAULT timezone('utc', now()),
  deleted_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at    timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.assignment_submissions (assignment_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_student     ON public.assignment_submissions (student_id)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_status      ON public.assignment_submissions (status)        WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_submissions_updated_at ON public.assignment_submissions;
CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Talaba: faqat O'ZINING topshiriqlarini ko'radi va boshqaradi
DO $$ BEGIN
  CREATE POLICY "Student: read own submissions"
    ON public.assignment_submissions FOR SELECT
    USING (student_id = auth.uid() AND deleted_at IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Student: insert own submissions"
    ON public.assignment_submissions FOR INSERT
    WITH CHECK (
      student_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.assignments a
        JOIN public.assignment_groups ag ON ag.assignment_id = a.id
        JOIN public.student_groups sg    ON sg.group_id = ag.group_id
        WHERE a.id = assignment_submissions.assignment_id
          AND a.status = 'published'
          AND a.deleted_at IS NULL
          AND sg.student_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Talaba: o'z topshirig'ini muddatgacha yangilashi/almashtirishi mumkin (baho qo'yilmagan bo'lsa)
DO $$ BEGIN
  CREATE POLICY "Student: update own ungraded submissions before deadline"
    ON public.assignment_submissions FOR UPDATE
    USING (
      student_id = auth.uid()
      AND status = 'submitted'
      AND EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_submissions.assignment_id
          AND (a.deadline IS NULL OR a.deadline > timezone('utc', now()))
      )
    )
    WITH CHECK (student_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- O'qituvchi: o'z topshiriqlariga kelgan ishlarni ko'radi va baholaydi
DO $$ BEGIN
  CREATE POLICY "Teacher: read submissions for own assignments"
    ON public.assignment_submissions FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_submissions.assignment_id
          AND a.teacher_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Teacher: grade submissions for own assignments"
    ON public.assignment_submissions FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_submissions.assignment_id
          AND a.teacher_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_submissions.assignment_id
          AND a.teacher_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admin: manage all submissions"
    ON public.assignment_submissions FOR ALL
    USING (public.get_my_profile_role() = 'admin')
    WITH CHECK (public.get_my_profile_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 5. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       text        NOT NULL CHECK (type IN (
                'assignment_new', 'assignment_graded', 'assignment_deadline'
              )),
  title      text        NOT NULL,
  body       text,
  data       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user   ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (user_id) WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Foydalanuvchi: faqat o'zining bildirishnomalarini ko'radi va o'qilgan deb belgilaydi
DO $$ BEGIN
  CREATE POLICY "User: read own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "User: update own notifications"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admin: read all notifications"
    ON public.notifications FOR SELECT
    USING (public.get_my_profile_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 5a. Trigger: topshiriq NASHR qilinganda guruh talabalariga bildirishnoma ──

CREATE OR REPLACE FUNCTION public.notify_assignment_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Faqat draft → published o'tishida (yoki yangi published qatorda)
  IF NEW.status = 'published'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    SELECT DISTINCT sg.student_id,
           'assignment_new',
           'Yangi topshiriq: ' || NEW.title,
           'Yangi uy vazifasi qo''shildi. Muddatini tekshiring.',
           jsonb_build_object('assignment_id', NEW.id, 'deadline', NEW.deadline)
    FROM public.assignment_groups ag
    JOIN public.student_groups sg ON sg.group_id = ag.group_id
    WHERE ag.assignment_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_assignment_published ON public.assignments;
CREATE TRIGGER trg_notify_assignment_published
  AFTER INSERT OR UPDATE OF status ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.notify_assignment_published();

-- ── 5b. Trigger: ish BAHOLANGANDA talabaga bildirishnoma ──────────────────────

CREATE OR REPLACE FUNCTION public.notify_submission_graded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
BEGIN
  IF NEW.status = 'graded'
     AND (OLD.status IS DISTINCT FROM 'graded' OR OLD.score IS DISTINCT FROM NEW.score) THEN
    SELECT a.title INTO v_title FROM public.assignments a WHERE a.id = NEW.assignment_id;
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.student_id,
      'assignment_graded',
      'Ishingiz baholandi: ' || COALESCE(v_title, 'Topshiriq'),
      'O''qituvchi bahoingizni qo''ydi. Natijani ko''ring.',
      jsonb_build_object('assignment_id', NEW.assignment_id, 'submission_id', NEW.id, 'score', NEW.score)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_submission_graded ON public.assignment_submissions;
CREATE TRIGGER trg_notify_submission_graded
  AFTER UPDATE OF status, score ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_submission_graded();

-- ── 5c. Muddat eslatmasi funksiyasi (pg_cron / Edge Function orqali chaqiriladi) ─
-- 24 soat ichida muddati tugaydigan, hali topshirmagan talabalarga eslatma.
-- Ikki marta yubormaslik uchun mavjud eslatma tekshiriladi.

CREATE OR REPLACE FUNCTION public.create_deadline_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, data)
  SELECT DISTINCT sg.student_id,
         'assignment_deadline',
         'Muddat yaqinlashmoqda: ' || a.title,
         'Topshiriq muddati 24 soat ichida tugaydi.',
         jsonb_build_object('assignment_id', a.id, 'deadline', a.deadline)
  FROM public.assignments a
  JOIN public.assignment_groups ag ON ag.assignment_id = a.id
  JOIN public.student_groups sg    ON sg.group_id = ag.group_id
  WHERE a.status = 'published'
    AND a.deleted_at IS NULL
    AND a.deadline IS NOT NULL
    AND a.deadline > timezone('utc', now())
    AND a.deadline <= timezone('utc', now()) + interval '24 hours'
    AND NOT EXISTS (
      SELECT 1 FROM public.assignment_submissions s
      WHERE s.assignment_id = a.id AND s.student_id = sg.student_id AND s.deleted_at IS NULL
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = sg.student_id
        AND n.type = 'assignment_deadline'
        AND (n.data->>'assignment_id')::uuid = a.id
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================
-- 6. STORAGE BUCKET — assignment-files (private)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-files',
  'assignment-files',
  false,
  20971520, -- 20 MB
  ARRAY[
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- O'qilishi: tizimga kirgan foydalanuvchilar (haqiqiy kirish qisqa muddatli signed URL orqali)
DO $$ BEGIN
  CREATE POLICY "Authenticated can read assignment files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'assignment-files' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Yuklash: tizimga kirgan foydalanuvchilar (o'qituvchi biriktirma, talaba topshiriq)
DO $$ BEGIN
  CREATE POLICY "Authenticated can upload assignment files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'assignment-files' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- O'chirish: fayl egasi (yuklagan) yoki admin
DO $$ BEGIN
  CREATE POLICY "Owner or admin can delete assignment files"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'assignment-files'
      AND auth.role() = 'authenticated'
      AND (owner = auth.uid() OR public.get_my_profile_role() = 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
