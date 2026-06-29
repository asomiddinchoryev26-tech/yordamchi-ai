-- Sprint 2: Pinned conversations persistence
-- Adds is_pinned to ai_conversations for cross-device sync

ALTER TABLE ai_conversations
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

-- Fast lookup index for pinned conversations per student
CREATE INDEX IF NOT EXISTS idx_ai_conversations_pinned
  ON ai_conversations (student_id, is_pinned)
  WHERE is_pinned = TRUE;
