-- 031-feedback.sql
-- Feedback management: table, RLS, indexes, storage bucket

-- 1. Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  category text NOT NULL CHECK (category IN ('suggestie', 'bug', 'vraag')),
  message text NOT NULL CHECK (char_length(message) <= 5000),
  page_url text,
  user_agent text,
  element_selector text,
  element_tag text,
  element_text text,
  screenshot_path text,
  status text NOT NULL DEFAULT 'nieuw' CHECK (status IN ('nieuw', 'in_behandeling', 'requirement', 'afgewezen', 'afgerond')),
  priority text NOT NULL DEFAULT 'normaal' CHECK (priority IN ('laag', 'normaal', 'hoog', 'kritiek')),
  admin_notes text,
  requirement_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

-- 3. Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS feedback_updated_at ON feedback;
CREATE TRIGGER feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

-- 4. Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY feedback_insert_own ON feedback
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can read their own feedback
CREATE POLICY feedback_select_own ON feedback
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- 5. Storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-screenshots', 'feedback-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload screenshots
CREATE POLICY feedback_screenshots_insert ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'feedback-screenshots');

COMMENT ON TABLE feedback IS 'User feedback from in-app feedback button. Managed via /team/feedback admin page.';
