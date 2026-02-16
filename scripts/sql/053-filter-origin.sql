-- Migration 053: Add origin to filter usage stats
-- Splits filter_apply events by origin: 'filter_panel' vs 'expanded_row'
-- Old events without origin default to 'filter_panel'

DROP FUNCTION IF EXISTS get_usage_filters(TIMESTAMPTZ, INT);

CREATE FUNCTION get_usage_filters(since_date TIMESTAMPTZ, max_results INT DEFAULT 50)
RETURNS TABLE(module VARCHAR, field TEXT, filter_count BIGINT, origin TEXT)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.module,
    e.properties->>'field' AS field,
    COUNT(*)::BIGINT AS filter_count,
    COALESCE(e.properties->>'origin', 'filter_panel') AS origin
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type = 'filter_apply'
    AND e.properties->>'field' IS NOT NULL
    AND e.module IS NOT NULL
  GROUP BY e.module, e.properties->>'field', COALESCE(e.properties->>'origin', 'filter_panel')
  ORDER BY origin, e.module, filter_count DESC
  LIMIT max_results;
$$;
