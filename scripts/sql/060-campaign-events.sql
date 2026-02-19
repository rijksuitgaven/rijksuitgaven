-- 060: Campaign event tracking from Resend webhooks
--
-- Stores per-recipient delivery events: delivered, opened, clicked, bounced, complained.
-- Linked to campaigns table via campaign_id and people table via person_id.
--
-- Execute on production via Supabase SQL Editor

CREATE TABLE IF NOT EXISTS campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  link_url TEXT,
  resend_email_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Query pattern: "show me all events for campaign X grouped by type"
CREATE INDEX IF NOT EXISTS idx_ce_campaign ON campaign_events (campaign_id, event_type);

-- Query pattern: "show me all campaigns a person engaged with"
CREATE INDEX IF NOT EXISTS idx_ce_person ON campaign_events (person_id) WHERE person_id IS NOT NULL;

-- Deduplication: prevent duplicate webhook deliveries for same email_id + event
CREATE UNIQUE INDEX IF NOT EXISTS idx_ce_dedup ON campaign_events (resend_email_id, event_type)
  WHERE resend_email_id IS NOT NULL;
