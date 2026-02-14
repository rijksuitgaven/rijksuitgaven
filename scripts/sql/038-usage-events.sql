-- Migration 038: Usage Events Table (UX-032)
-- Server-side product analytics with pseudonymized user tracking
-- No PII stored — actor_hash is SHA256(user_id + secret)

CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(20) NOT NULL,
  actor_hash VARCHAR(16) NOT NULL,
  module VARCHAR(20),
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for dashboard queries
CREATE INDEX idx_usage_events_created_at ON usage_events (created_at);
CREATE INDEX idx_usage_events_type ON usage_events (event_type);
CREATE INDEX idx_usage_events_type_created ON usage_events (event_type, created_at);
CREATE INDEX idx_usage_events_module ON usage_events (module);
CREATE INDEX idx_usage_events_actor ON usage_events (actor_hash);

-- GIN index for JSONB property queries (e.g., search term aggregation)
CREATE INDEX idx_usage_events_properties ON usage_events USING GIN (properties);

-- Enable RLS — no public access
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- No SELECT policy for anon/authenticated — admin reads via service_role
-- BFF writes via service_role client (bypasses RLS)

-- Retention cleanup function (call weekly via pg_cron or manual)
CREATE OR REPLACE FUNCTION cleanup_old_usage_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM usage_events
  WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
