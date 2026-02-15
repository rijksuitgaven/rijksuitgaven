-- Migration 049: Fix unlinked subscriptions + consistent anon filtering
--
-- Part 1: Link subscriptions with NULL user_id to their auth users
-- (caused by invite flow "already registered" bug — user_id was never set)
--
-- Part 2: Exclude anon_000000000000 from get_usage_pulse (consistency with
-- get_usage_actors, get_usage_sessions_summary, get_usage_retention, etc.)

-- Part 1: Link unlinked subscriptions via people.email → auth.users.email
UPDATE subscriptions s
SET user_id = au.id
FROM people p, auth.users au
WHERE s.person_id = p.id
  AND s.user_id IS NULL
  AND p.email = au.email;

-- Part 2: Consistent anon filtering in pulse + modules + searches + exports
CREATE OR REPLACE FUNCTION get_usage_pulse(since_date TIMESTAMPTZ)
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
  WHERE e.created_at >= since_date
    AND e.actor_hash != 'anon_000000000000'
  GROUP BY e.event_type
  ORDER BY event_count DESC;
$$;

CREATE OR REPLACE FUNCTION get_usage_modules(since_date TIMESTAMPTZ)
RETURNS TABLE(module VARCHAR, view_count BIGINT, unique_actors BIGINT)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.module,
    COUNT(*)::BIGINT AS view_count,
    COUNT(DISTINCT e.actor_hash)::BIGINT AS unique_actors
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type = 'module_view'
    AND e.module IS NOT NULL
    AND e.actor_hash != 'anon_000000000000'
  GROUP BY e.module
  ORDER BY view_count DESC;
$$;

CREATE OR REPLACE FUNCTION get_usage_searches(since_date TIMESTAMPTZ, max_results INT DEFAULT 15)
RETURNS TABLE(query TEXT, search_count BIGINT, unique_actors BIGINT, top_module VARCHAR)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.properties->>'query' AS query,
    COUNT(*)::BIGINT AS search_count,
    COUNT(DISTINCT e.actor_hash)::BIGINT AS unique_actors,
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

CREATE OR REPLACE FUNCTION get_usage_exports(since_date TIMESTAMPTZ)
RETURNS TABLE(format TEXT, export_count BIGINT, avg_rows NUMERIC, unique_actors BIGINT)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.properties->>'format' AS format,
    COUNT(*)::BIGINT AS export_count,
    ROUND(AVG((e.properties->>'row_count')::NUMERIC), 0) AS avg_rows,
    COUNT(DISTINCT e.actor_hash)::BIGINT AS unique_actors
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type = 'export'
    AND e.actor_hash != 'anon_000000000000'
  GROUP BY e.properties->>'format'
  ORDER BY export_count DESC;
$$;
