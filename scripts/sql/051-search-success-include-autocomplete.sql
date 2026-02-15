-- Migration 051: Add autocomplete_click to search success criteria
-- Clicking an autocomplete suggestion is a successful search outcome.

DROP FUNCTION IF EXISTS get_usage_search_success(TIMESTAMPTZ);

CREATE FUNCTION get_usage_search_success(since_date TIMESTAMPTZ)
RETURNS TABLE(
  total_searches BIGINT,
  successful_searches BIGINT,
  success_rate NUMERIC
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH events AS (
    SELECT
      actor_hash,
      event_type,
      created_at,
      LAG(created_at) OVER (PARTITION BY actor_hash ORDER BY created_at) AS prev_at
    FROM usage_events
    WHERE created_at >= since_date
      AND actor_hash != 'anon_000000000000'
  ),
  session_boundaries AS (
    SELECT *,
      SUM(CASE WHEN prev_at IS NULL OR EXTRACT(EPOCH FROM created_at - prev_at) > 1800 THEN 1 ELSE 0 END)
        OVER (PARTITION BY actor_hash ORDER BY created_at) AS session_num
    FROM events
  ),
  search_events AS (
    SELECT actor_hash, session_num, created_at AS search_at
    FROM session_boundaries
    WHERE event_type = 'search'
  ),
  search_outcomes AS (
    SELECT
      se.actor_hash,
      se.session_num,
      se.search_at,
      EXISTS (
        SELECT 1 FROM session_boundaries sb
        WHERE sb.actor_hash = se.actor_hash
          AND sb.session_num = se.session_num
          AND sb.created_at > se.search_at
          AND sb.event_type IN ('row_expand', 'export', 'cross_module_nav', 'external_link', 'autocomplete_click')
      ) AS is_successful
    FROM search_events se
  )
  SELECT
    COUNT(*)::BIGINT AS total_searches,
    COUNT(*) FILTER (WHERE is_successful)::BIGINT AS successful_searches,
    ROUND(
      COUNT(*) FILTER (WHERE is_successful)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1
    ) AS success_rate
  FROM search_outcomes;
$$;
