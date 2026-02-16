-- Migration 055: Per-module event counts for module-centric dashboard
-- Returns event counts grouped by module + event_type
-- Used for Google link clicks, row expands, and other per-module breakdowns

CREATE OR REPLACE FUNCTION get_usage_module_events(since_date TIMESTAMPTZ)
RETURNS TABLE(module VARCHAR, event_type VARCHAR, event_count BIGINT)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.module,
    e.event_type,
    COUNT(*)::BIGINT AS event_count
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.module IS NOT NULL
  GROUP BY e.module, e.event_type
  ORDER BY e.module, event_count DESC;
$$;
