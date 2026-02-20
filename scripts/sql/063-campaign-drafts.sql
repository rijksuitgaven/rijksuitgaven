-- 063: Campaign drafts support
--
-- Adds status column to campaigns table for draft/sent distinction.
-- Makes sent_at nullable (drafts have no sent_at).
-- Adds updated_at for "last edited" display on drafts.
--
-- Execute on production via Supabase SQL Editor

-- Add status column: 'draft' or 'sent'
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent';

-- Make sent_at nullable for drafts
ALTER TABLE campaigns
  ALTER COLUMN sent_at DROP NOT NULL,
  ALTER COLUMN sent_at DROP DEFAULT;

-- Add updated_at for tracking draft edits
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Index for listing drafts first, then sent
CREATE INDEX IF NOT EXISTS idx_campaigns_status_updated
  ON campaigns (status, updated_at DESC);
