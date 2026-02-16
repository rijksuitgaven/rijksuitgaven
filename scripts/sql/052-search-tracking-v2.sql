-- Migration 052: Search Tracking V2 (UX-034)
-- Committed search model: only explicit user actions (Enter / autocomplete click) tracked as search events.
-- New event: search_end (duration, exit_action).
-- New properties: search_id, commit_type, autocomplete_typed, prev_search_id (retry chains).
--
-- Step 1: Truncate old usage_events (test/noise data from debounce-based tracking)
-- Step 2: Replace search analytics functions to leverage new event model

-- 1. Clean slate — old data was debounce-based, incompatible with new model
TRUNCATE TABLE usage_events;

-- 2. Replace get_usage_searches: now includes commit_type breakdown, avg duration, engagement rate
DROP FUNCTION IF EXISTS get_usage_searches(TIMESTAMPTZ, INT);

CREATE FUNCTION get_usage_searches(since_date TIMESTAMPTZ, max_results INT DEFAULT 15)
RETURNS TABLE(
  query TEXT,
  search_count BIGINT,
  unique_actors BIGINT,
  avg_results NUMERIC,
  top_module VARCHAR,
  enter_count BIGINT,
  autocomplete_count BIGINT,
  avg_duration NUMERIC,
  engagement_rate NUMERIC
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH searches AS (
    SELECT
      e.properties->>'query' AS query,
      e.properties->>'search_id' AS search_id,
      e.actor_hash,
      e.module,
      (e.properties->>'result_count')::INT AS result_count,
      e.properties->>'commit_type' AS commit_type
    FROM usage_events e
    WHERE e.created_at >= since_date
      AND e.event_type = 'search'
      AND e.properties->>'query' IS NOT NULL
      AND e.properties->>'query' != ''
      AND (e.properties->>'result_count')::INT > 0
      AND e.actor_hash != 'anon_000000000000'
  ),
  durations AS (
    SELECT
      e.properties->>'search_id' AS search_id,
      (e.properties->>'duration_seconds')::NUMERIC AS duration
    FROM usage_events e
    WHERE e.created_at >= since_date
      AND e.event_type = 'search_end'
      AND e.properties->>'search_id' IS NOT NULL
  ),
  engagements AS (
    SELECT DISTINCT e.properties->>'search_id' AS search_id
    FROM usage_events e
    WHERE e.created_at >= since_date
      AND e.event_type IN ('row_expand', 'export', 'cross_module_nav', 'external_link')
      AND e.properties->>'search_id' IS NOT NULL
  )
  SELECT
    s.query,
    COUNT(*)::BIGINT AS search_count,
    COUNT(DISTINCT s.actor_hash)::BIGINT AS unique_actors,
    ROUND(AVG(s.result_count), 0) AS avg_results,
    MODE() WITHIN GROUP (ORDER BY s.module) AS top_module,
    COUNT(*) FILTER (WHERE s.commit_type = 'enter')::BIGINT AS enter_count,
    COUNT(*) FILTER (WHERE s.commit_type = 'autocomplete')::BIGINT AS autocomplete_count,
    ROUND(AVG(d.duration), 0) AS avg_duration,
    ROUND(
      COUNT(DISTINCT eng.search_id)::NUMERIC / NULLIF(COUNT(DISTINCT s.search_id), 0) * 100, 1
    ) AS engagement_rate
  FROM searches s
  LEFT JOIN durations d ON d.search_id = s.search_id
  LEFT JOIN engagements eng ON eng.search_id = s.search_id
  GROUP BY s.query
  ORDER BY search_count DESC
  LIMIT max_results;
$$;

-- 3. Replace get_usage_zero_results: now includes retry detection
DROP FUNCTION IF EXISTS get_usage_zero_results(TIMESTAMPTZ, INT);

CREATE FUNCTION get_usage_zero_results(since_date TIMESTAMPTZ, max_results INT DEFAULT 10)
RETURNS TABLE(
  query TEXT,
  search_count BIGINT,
  top_module VARCHAR,
  retry_count BIGINT
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.properties->>'query' AS query,
    COUNT(*)::BIGINT AS search_count,
    MODE() WITHIN GROUP (ORDER BY e.module) AS top_module,
    COUNT(*) FILTER (WHERE e.properties->>'prev_search_id' IS NOT NULL)::BIGINT AS retry_count
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type = 'search'
    AND e.properties->>'query' IS NOT NULL
    AND e.properties->>'query' != ''
    AND (e.properties->>'result_count')::INT = 0
    AND e.actor_hash != 'anon_000000000000'
  GROUP BY e.properties->>'query'
  ORDER BY search_count DESC
  LIMIT max_results;
$$;

-- 4. Replace get_usage_search_success: simpler with committed search model
-- Success = search event followed by engagement (row_expand, export, etc.) linked via search_id
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
  WITH searches AS (
    SELECT
      e.properties->>'search_id' AS search_id
    FROM usage_events e
    WHERE e.created_at >= since_date
      AND e.event_type = 'search'
      AND e.properties->>'search_id' IS NOT NULL
      AND e.actor_hash != 'anon_000000000000'
  ),
  engaged AS (
    SELECT DISTINCT e.properties->>'search_id' AS search_id
    FROM usage_events e
    WHERE e.created_at >= since_date
      AND e.event_type IN ('row_expand', 'export', 'cross_module_nav', 'external_link')
      AND e.properties->>'search_id' IS NOT NULL
  )
  SELECT
    COUNT(*)::BIGINT AS total_searches,
    COUNT(eng.search_id)::BIGINT AS successful_searches,
    ROUND(
      COUNT(eng.search_id)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 1
    ) AS success_rate
  FROM searches s
  LEFT JOIN engaged eng ON eng.search_id = s.search_id;
$$;

-- 5. New: search engagement summary (what users do after finding results)
CREATE OR REPLACE FUNCTION get_usage_search_engagement(since_date TIMESTAMPTZ)
RETURNS TABLE(
  action_type VARCHAR,
  action_count BIGINT,
  unique_searches BIGINT
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.event_type AS action_type,
    COUNT(*)::BIGINT AS action_count,
    COUNT(DISTINCT e.properties->>'search_id')::BIGINT AS unique_searches
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type IN ('row_expand', 'export', 'cross_module_nav', 'external_link', 'filter_apply', 'sort_change', 'page_change')
    AND e.properties->>'search_id' IS NOT NULL
    AND e.actor_hash != 'anon_000000000000'
  GROUP BY e.event_type
  ORDER BY action_count DESC;
$$;
