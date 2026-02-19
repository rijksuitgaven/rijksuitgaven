-- 059: Campaign history table
--
-- Stores sent campaign emails for history and template reuse.
-- Compose fields only (not rendered HTML — that's per-recipient).
--
-- Execute on production via Supabase SQL Editor

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  heading TEXT NOT NULL,
  preheader TEXT,
  body TEXT NOT NULL,
  cta_text TEXT,
  cta_url TEXT,
  segment TEXT NOT NULL,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_by UUID REFERENCES auth.users(id)
);

-- Index for listing recent campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_sent_at ON campaigns (sent_at DESC);
