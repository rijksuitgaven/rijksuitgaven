-- 066: Hard bounce auto-suppress
-- Adds bounce tracking columns to people table for automatic suppression

ALTER TABLE people
  ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bounce_type TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_people_bounced ON people (bounced_at) WHERE bounced_at IS NOT NULL;
