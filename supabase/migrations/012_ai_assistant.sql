-- ============================================================
-- YordamchiAI — Migration 012: AI Assistant
--
-- Yangi jadvallar:
--   1. ai_conversations — suhbat sessiyalari
--   2. ai_messages      — xabarlar tarixi
--
-- Idempotent: qayta ishga tushirish xavfsiz
-- ============================================================

-- ── 1. AI_CONVERSATIONS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text        NOT NULL DEFAULT 'Yangi suhbat',
  created_at  timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at  timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_conversations_student
  ON public.ai_conversations (student_id, updated_at DESC);

-- Talaba: faqat o'z suhbatlarini boshqaradi
DO $$
BEGIN
  CREATE POLICY "Student: manage own conversations"
    ON public.ai_conversations FOR ALL
    USING  (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admin: barcha suhbatlarni ko'ra oladi
DO $$
BEGIN
  CREATE POLICY "Admin: read all conversations"
    ON public.ai_conversations FOR SELECT
    USING (public.get_my_profile_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. AI_MESSAGES ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role            text        NOT NULL CHECK (role IN ('user', 'assistant')),
  content         text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation
  ON public.ai_messages (conversation_id, created_at ASC);

-- Talaba: o'z suhbat xabarlarini boshqaradi
DO $$
BEGIN
  CREATE POLICY "Student: manage own messages"
    ON public.ai_messages FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.ai_conversations c
        WHERE c.id = ai_messages.conversation_id
          AND c.student_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.ai_conversations c
        WHERE c.id = ai_messages.conversation_id
          AND c.student_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admin: barcha xabarlarni ko'ra oladi
DO $$
BEGIN
  CREATE POLICY "Admin: read all messages"
    ON public.ai_messages FOR SELECT
    USING (public.get_my_profile_role() = 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 3. UPDATED_AT TRIGGER ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.touch_ai_conversation_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.ai_conversations
  SET    updated_at = timezone('utc', now())
  WHERE  id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_message_touch_conversation ON public.ai_messages;
CREATE TRIGGER trg_ai_message_touch_conversation
  AFTER INSERT ON public.ai_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_ai_conversation_updated_at();
