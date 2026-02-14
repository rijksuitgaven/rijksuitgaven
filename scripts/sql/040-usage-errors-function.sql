-- Migration 040: Error tracking dashboard function (UX-032)
-- Returns recent error events with context for admin dashboard
-- Run AFTER 039

CREATE OR REPLACE FUNCTION get_usage_errors(since_date TIMESTAMPTZ, max_results INT DEFAULT 20)
RETURNS TABLE(
  module VARCHAR,
  message TEXT,
  properties JSONB,
  actor_hash VARCHAR,
  created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.module::VARCHAR,
    (e.properties->>'message')::TEXT AS message,
    e.properties,
    e.actor_hash::VARCHAR,
    e.created_at
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type = 'error'
  ORDER BY e.created_at DESC
  LIMIT max_results;
$$;
