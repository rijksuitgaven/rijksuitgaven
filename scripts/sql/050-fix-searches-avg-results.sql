-- Migration 050: Add avg_results column back to get_usage_searches
-- Migration 049 recreated this function without the avg_results column,
-- causing NaN in the dashboard's "Resultaten" column.

DROP FUNCTION IF EXISTS get_usage_searches(TIMESTAMPTZ, INT);

CREATE FUNCTION get_usage_searches(since_date TIMESTAMPTZ, max_results INT DEFAULT 15)
RETURNS TABLE(query TEXT, search_count BIGINT, unique_actors BIGINT, avg_results NUMERIC, top_module VARCHAR)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.properties->>'query' AS query,
    COUNT(*)::BIGINT AS search_count,
    COUNT(DISTINCT e.actor_hash)::BIGINT AS unique_actors,
    ROUND(AVG((e.properties->>'result_count')::NUMERIC), 0) AS avg_results,
    MODE() WITHIN GROUP (ORDER BY e.module) AS top_module
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type = 'search'
    AND e.properties->>'query' IS NOT NULL
    AND e.properties->>'query' != ''
    AND (e.properties->>'result_count')::int > 0
    AND e.actor_hash != 'anon_000000000000'
  GROUP BY e.properties->>'query'
  ORDER BY search_count DESC
  LIMIT max_results;
$$;
