-- 067: Email client detection via user-agent parsing
-- Stores parsed UA data on click events for device/client analytics

ALTER TABLE campaign_events
  ADD COLUMN IF NOT EXISTS user_agent TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ua_client TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ua_device TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ua_os TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_ce_ua_campaign ON campaign_events (campaign_id, ua_client) WHERE ua_client IS NOT NULL;
