-- Sprint 3.2 Phase 1 — AI Vision Results Table
-- Stores the history of every image solved by the AI Vision module.
-- Images are NOT stored here (base64 never persisted — privacy + cost).
-- Only metadata and structured solution JSON are kept.

-- ─── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_vision_results (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Classification
  topic         TEXT        NOT NULL DEFAULT 'Unknown',
  subject       TEXT        NOT NULL DEFAULT 'unknown'
                              CHECK (subject IN (
                                'math','physics','chemistry','biology','history',
                                'literature','language','geography','computer_science',
                                'mixed','unknown'
                              )),
  difficulty    TEXT        NOT NULL DEFAULT 'unknown'
                              CHECK (difficulty IN (
                                'elementary','middle','high_school','university','unknown'
                              )),

  -- Content
  detected_text TEXT        DEFAULT '',
  solution_json JSONB       NOT NULL DEFAULT '{}',

  -- Metrics
  xp_earned     INTEGER     NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
  duration_ms   INTEGER     NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  confidence    REAL        NOT NULL DEFAULT 0.7 CHECK (confidence BETWEEN 0 AND 1),

  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE ai_vision_results ENABLE ROW LEVEL SECURITY;

-- Students can only access their own results
CREATE POLICY "vision_student_select"
  ON ai_vision_results FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "vision_student_insert"
  ON ai_vision_results FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "vision_student_delete"
  ON ai_vision_results FOR DELETE
  USING (auth.uid() = student_id);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- Primary query pattern: student's history, newest first
CREATE INDEX IF NOT EXISTS idx_vision_student_created
  ON ai_vision_results (student_id, created_at DESC);

-- Filter by subject
CREATE INDEX IF NOT EXISTS idx_vision_subject
  ON ai_vision_results (student_id, subject);

-- Filter by difficulty
CREATE INDEX IF NOT EXISTS idx_vision_difficulty
  ON ai_vision_results (student_id, difficulty);

-- ─── Auto-update updated_at ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_vision_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vision_updated_at ON ai_vision_results;
CREATE TRIGGER trg_vision_updated_at
  BEFORE UPDATE ON ai_vision_results
  FOR EACH ROW EXECUTE FUNCTION update_vision_updated_at();

-- ─── XP summary view (used by AI Brain for profile computation) ───────────────

CREATE OR REPLACE VIEW student_vision_summary AS
SELECT
  student_id,
  COUNT(*)              AS total_solved,
  SUM(xp_earned)        AS total_xp,
  AVG(confidence)       AS avg_confidence,
  MAX(created_at)       AS last_solved_at,
  MODE() WITHIN GROUP (ORDER BY subject) AS most_frequent_subject
FROM ai_vision_results
GROUP BY student_id;
