-- 045-people-table.sql
-- Phase 1: Create unified people table for CRM
-- People is the single identity anchor. Subscriptions and contacts become aspects of a person.
-- This migration is ADDITIVE — no columns or tables are dropped.

-- 1A: Create people table
CREATE TABLE people (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL,
  first_name      text,
  last_name       text,
  organization    text,
  phone           text,
  notes           text,
  source          text,
  resend_contact_id text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Case-insensitive unique email
CREATE UNIQUE INDEX idx_people_email_lower ON people (LOWER(email));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_people_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW
  EXECUTE FUNCTION update_people_updated_at();

-- 1B: Populate from contacts (primary source for identity)
INSERT INTO people (id, email, first_name, last_name, organization, phone, notes, source, resend_contact_id, created_at, updated_at)
SELECT id, LOWER(email), first_name, last_name, organization, phone, notes, source, resend_contact_id, created_at, updated_at
FROM contacts;

-- 1C: Insert subscription-only people (no matching contact row)
INSERT INTO people (email, first_name, last_name, organization, source, created_at, updated_at)
SELECT LOWER(s.email), s.first_name, s.last_name, s.organization, 'subscription', s.created_at, s.created_at
FROM subscriptions s
WHERE NOT EXISTS (
  SELECT 1 FROM people p WHERE LOWER(p.email) = LOWER(s.email)
);

-- 1D: Add person_id FK to subscriptions (nullable initially)
ALTER TABLE subscriptions ADD COLUMN person_id uuid REFERENCES people(id) ON DELETE RESTRICT;

-- 1E: Link subscriptions to people via email match
UPDATE subscriptions s
SET person_id = p.id
FROM people p
WHERE LOWER(s.email) = LOWER(p.email);

-- 1F: Verification — every subscription must have a person_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM subscriptions WHERE person_id IS NULL) THEN
    RAISE EXCEPTION 'Migration failed: subscriptions without person_id found';
  END IF;
END $$;

-- 1G: Make person_id NOT NULL now that all rows are linked
ALTER TABLE subscriptions ALTER COLUMN person_id SET NOT NULL;

-- Create index for the FK
CREATE INDEX idx_subscriptions_person_id ON subscriptions(person_id);

-- 1H: RLS policies for people table
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage people"
  ON people FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Users can read their own person row (via subscription link)
CREATE POLICY "Users can read own person"
  ON people FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions
      WHERE person_id = people.id
      AND user_id = (SELECT auth.uid())
    )
  );

-- Service role bypasses RLS (used by admin API routes and public contact form)
