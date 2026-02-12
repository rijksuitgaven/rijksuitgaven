-- 036-contacts.sql
-- Contacts table for CRM / email campaign management
-- Single source of truth for all contacts (prospects, subscribers, churned)
-- Syncs to Resend Audience for email broadcasts

-- Create contacts table
CREATE TABLE contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL UNIQUE,
  first_name      text,
  last_name       text,
  organization    text,
  type            text NOT NULL DEFAULT 'prospect' CHECK (type IN ('prospect', 'subscriber', 'churned')),
  source          text,
  notes           text,
  resend_contact_id text,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_contacts_subscription_id ON contacts(subscription_id);

-- Auto-update updated_at trigger (same pattern as subscriptions)
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Admin-only access via service role (no anon/authenticated access)
-- Service role bypasses RLS, so no policy needed for admin operations
-- This ensures contacts are only accessible via admin API routes
