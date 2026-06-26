-- ============================================================
-- YordamchiAI — Migration 011: Lesson Content System
--
-- Yangiliklar:
--   1. lessons jadvaliga video_url kolonnasi
--   2. lesson_attachments jadvali (fayl biriktirmalar)
--   3. lesson-attachments Supabase Storage bucket
--
-- Idempotent: qayta ishga tushirish xavfsiz
-- ============================================================

-- ── 1. LESSONS JADVALIGA VIDEO_URL QOSHISH ───────────────────────────────────

ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS video_url TEXT;

-- ── 2. LESSON_ATTACHMENTS JADVALI ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.lesson_attachments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id   uuid        NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  file_name   text        NOT NULL,
  file_path   text        NOT NULL,
  file_size   bigint,
  mime_type   text,
  uploaded_by uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS uix_lesson_attachments_path
  ON public.lesson_attachments (file_path);

CREATE INDEX IF NOT EXISTS idx_lesson_attachments_lesson
  ON public.lesson_attachments (lesson_id);

ALTER TABLE public.lesson_attachments ENABLE ROW LEVEL SECURITY;

-- Talabalar: o'z guruhlarining nashr qilingan darslariga biriktirilgan fayllarni ko'ra oladi
DO $$
BEGIN
  CREATE POLICY "Student: read attachments for published lessons"
    ON public.lesson_attachments FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.lessons l
        JOIN public.student_groups sg ON sg.group_id = l.group_id
        WHERE l.id = lesson_attachments.lesson_id
          AND l.is_published = true
          AND sg.student_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- O'qituvchilar: o'z darslarining fayllarini boshqara oladi
DO $$
BEGIN
  CREATE POLICY "Teacher: manage own lesson attachments"
    ON public.lesson_attachments FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.lessons l
        WHERE l.id = lesson_attachments.lesson_id
          AND l.teacher_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admin: barcha fayllarni boshqaradi
DO $$
BEGIN
  CREATE POLICY "Admin: manage all lesson attachments"
    ON public.lesson_attachments FOR ALL
    USING (public.get_my_profile_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 3. SUPABASE STORAGE BUCKET ────────────────────────────────────────────────
-- Bucket Supabase Dashboard yoki SQL orqali yaratiladi.
-- SQL orqali yaratish (agar storage schema mavjud bo'lsa):

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-attachments',
  'lesson-attachments',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Faqat tizimga kirgan foydalanuvchilar o'qiy oladi
DO $$
BEGIN
  CREATE POLICY "Authenticated users can read lesson attachments"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'lesson-attachments'
      AND auth.role() = 'authenticated'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- O'qituvchi va admin yuklashi mumkin
DO $$
BEGIN
  CREATE POLICY "Teachers and admins can upload lesson attachments"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'lesson-attachments'
      AND auth.role() = 'authenticated'
      AND public.get_my_profile_role() IN ('teacher', 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- O'qituvchi va admin o'chirishi mumkin
DO $$
BEGIN
  CREATE POLICY "Teachers and admins can delete lesson attachments"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'lesson-attachments'
      AND auth.role() = 'authenticated'
      AND public.get_my_profile_role() IN ('teacher', 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
