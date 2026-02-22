-- 070: Add sequence tracking columns to campaign_events
-- Allows campaign_events to track both campaign and sequence events

ALTER TABLE campaign_events ALTER COLUMN campaign_id DROP NOT NULL;

ALTER TABLE campaign_events
  ADD COLUMN IF NOT EXISTS sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS step_id UUID REFERENCES email_sequence_steps(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ce_sequence ON campaign_events (sequence_id, event_type) WHERE sequence_id IS NOT NULL;

ALTER TABLE campaign_events ADD CONSTRAINT chk_ce_source CHECK (campaign_id IS NOT NULL OR sequence_id IS NOT NULL);
