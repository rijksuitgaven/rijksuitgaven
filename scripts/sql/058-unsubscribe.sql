-- 058: Add unsubscribe support to people table
--
-- unsubscribe_token: opaque UUID for secure unsubscribe links (no email in URL)
-- unsubscribed_at: timestamp when person opted out of marketing emails
--
-- Execute on production via Supabase SQL Editor

-- Add columns
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS unsubscribe_token UUID DEFAULT gen_random_uuid() NOT NULL,
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ DEFAULT NULL;

-- Unique index on unsubscribe_token for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_people_unsubscribe_token
  ON people (unsubscribe_token);

-- Backfill existing rows (gen_random_uuid() default handles this automatically)
-- Verify with: SELECT id, email, unsubscribe_token FROM people LIMIT 5;
