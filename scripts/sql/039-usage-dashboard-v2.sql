-- Migration 039: Dashboard V2 functions (UX-032 enhancement)
-- Fixes: keystroke tracking, false zero-results, adds per-user view
-- Run AFTER 038 + 038b

-- 1. Replace get_usage_searches: add avg_results column
-- (keeps result_count > 0 filter — zero results shown separately)
CREATE OR REPLACE FUNCTION get_usage_searches(since_date TIMESTAMPTZ, max_results INT DEFAULT 15)
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
  GROUP BY e.properties->>'query'
  ORDER BY search_count DESC
  LIMIT max_results;
$$;

-- 2. New: per-actor summary for user activity table
CREATE OR REPLACE FUNCTION get_usage_actors(since_date TIMESTAMPTZ, max_results INT DEFAULT 30)
RETURNS TABLE(
  actor_hash VARCHAR,
  last_seen TIMESTAMPTZ,
  event_count BIGINT,
  top_module TEXT,
  search_count BIGINT,
  export_count BIGINT,
  module_count BIGINT
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.actor_hash::VARCHAR,
    MAX(e.created_at) AS last_seen,
    COUNT(*)::BIGINT AS event_count,
    (
      SELECT sub.module FROM usage_events sub
      WHERE sub.actor_hash = e.actor_hash
        AND sub.created_at >= since_date
        AND sub.module IS NOT NULL
      GROUP BY sub.module
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) AS top_module,
    COUNT(*) FILTER (WHERE e.event_type = 'search')::BIGINT AS search_count,
    COUNT(*) FILTER (WHERE e.event_type = 'export')::BIGINT AS export_count,
    COUNT(DISTINCT e.module) FILTER (WHERE e.module IS NOT NULL)::BIGINT AS module_count
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.actor_hash != 'anon_000000000000'
  GROUP BY e.actor_hash
  ORDER BY event_count DESC
  LIMIT max_results;
$$;

-- 3. New: per-actor detail (called when admin expands a user row)
CREATE OR REPLACE FUNCTION get_usage_actor_detail(target_actor VARCHAR, since_date TIMESTAMPTZ)
RETURNS TABLE(
  event_type VARCHAR,
  module VARCHAR,
  properties JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.event_type::VARCHAR,
    e.module::VARCHAR,
    e.properties,
    e.created_at
  FROM usage_events e
  WHERE e.actor_hash = target_actor
    AND e.created_at >= since_date
  ORDER BY e.created_at DESC
  LIMIT 50;
$$;
