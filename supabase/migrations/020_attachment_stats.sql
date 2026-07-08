-- ============================================================
-- YordamchiAI — Migration 020: Lesson materials — stats & required flag
--
-- lesson_attachments jadvaliga qo'shiladi:
--   • view_count / download_count      — ko'rish / yuklab olish soni
--   • last_viewed_at / last_downloaded_at
--   • is_required                      — majburiy / ixtiyoriy material belgisi
--
-- + bump_attachment_stat() — SECURITY DEFINER: talaba ham (RLS orqali UPDATE
--   qila olmasa-da) statistikani xavfsiz oshira oladi, faqat kirish huquqi bo'lsa.
--
-- Idempotent: qayta ishga tushirish xavfsiz.
-- ============================================================

ALTER TABLE public.lesson_attachments
  ADD COLUMN IF NOT EXISTS view_count         integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS download_count     integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_viewed_at     timestamptz,
  ADD COLUMN IF NOT EXISTS last_downloaded_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_required        boolean     NOT NULL DEFAULT false;

-- ── Statistikani xavfsiz oshirish (kirish huquqi tekshiriladi) ────────────────
CREATE OR REPLACE FUNCTION public.bump_attachment_stat(p_id uuid, p_kind text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Faqat shu materialni ko'ra oladigan foydalanuvchi statistikani oshira oladi
  IF NOT EXISTS (
    SELECT 1
    FROM public.lesson_attachments la
    JOIN public.lessons l ON l.id = la.lesson_id
    WHERE la.id = p_id
      AND (
        l.teacher_id = auth.uid()
        OR public.get_my_profile_role() = 'admin'
        OR (
          l.is_published = true
          AND EXISTS (
            SELECT 1 FROM public.student_groups sg
            WHERE sg.group_id = l.group_id AND sg.student_id = auth.uid()
          )
        )
      )
  ) THEN
    RETURN; -- kirish huquqi yo'q — jimgina qaytamiz
  END IF;

  IF p_kind = 'view' THEN
    UPDATE public.lesson_attachments
      SET view_count = view_count + 1, last_viewed_at = timezone('utc', now())
      WHERE id = p_id;
  ELSIF p_kind = 'download' THEN
    UPDATE public.lesson_attachments
      SET download_count = download_count + 1, last_downloaded_at = timezone('utc', now())
      WHERE id = p_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bump_attachment_stat(uuid, text) TO authenticated;
