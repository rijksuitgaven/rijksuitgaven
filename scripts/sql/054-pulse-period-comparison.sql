-- Migration 054: Add bounded pulse function for period-over-period comparison
-- Allows comparing current period vs previous period for delta/trend indicators
-- Example: 7-day view compares last 7 days vs the 7 days before that

CREATE OR REPLACE FUNCTION get_usage_pulse_period(
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ
)
RETURNS TABLE(event_type VARCHAR, event_count BIGINT, unique_actors BIGINT)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.event_type,
    COUNT(*)::BIGINT AS event_count,
    COUNT(DISTINCT e.actor_hash)::BIGINT AS unique_actors
  FROM usage_events e
  WHERE e.created_at >= period_start
    AND e.created_at < period_end
  GROUP BY e.event_type
  ORDER BY event_count DESC;
$$;
