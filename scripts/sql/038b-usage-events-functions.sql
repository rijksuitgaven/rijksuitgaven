-- Migration 038b: Dashboard query functions for usage_events (UX-032)
-- Called via supabase.rpc() from the admin dashboard API

-- 1. Pulse: counts per event type + unique actors
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
  GROUP BY e.event_type
  ORDER BY event_count DESC;
$$;

-- 2. Module views: count + unique actors per module
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
  GROUP BY e.module
  ORDER BY view_count DESC;
$$;

-- 3. Top search terms with unique actor counts
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
  GROUP BY e.properties->>'query'
  ORDER BY search_count DESC
  LIMIT max_results;
$$;

-- 4. Top filters used
CREATE OR REPLACE FUNCTION get_usage_filters(since_date TIMESTAMPTZ, max_results INT DEFAULT 10)
RETURNS TABLE(field TEXT, filter_count BIGINT, top_module VARCHAR)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.properties->>'field' AS field,
    COUNT(*)::BIGINT AS filter_count,
    MODE() WITHIN GROUP (ORDER BY e.module) AS top_module
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type = 'filter_apply'
    AND e.properties->>'field' IS NOT NULL
  GROUP BY e.properties->>'field'
  ORDER BY filter_count DESC
  LIMIT max_results;
$$;

-- 5. Top columns selected
CREATE OR REPLACE FUNCTION get_usage_columns(since_date TIMESTAMPTZ, max_results INT DEFAULT 10)
RETURNS TABLE(column_name TEXT, usage_count BIGINT, top_module VARCHAR)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    col.value::TEXT AS column_name,
    COUNT(*)::BIGINT AS usage_count,
    MODE() WITHIN GROUP (ORDER BY e.module) AS top_module
  FROM usage_events e,
    jsonb_array_elements_text(e.properties->'columns') AS col(value)
  WHERE e.created_at >= since_date
    AND e.event_type = 'column_change'
  GROUP BY col.value
  ORDER BY usage_count DESC
  LIMIT max_results;
$$;

-- 6. Export breakdown (CSV/XLS counts + avg rows)
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
  GROUP BY e.properties->>'format'
  ORDER BY export_count DESC;
$$;

-- 7. Zero-result searches (search terms that returned 0 results)
CREATE OR REPLACE FUNCTION get_usage_zero_results(since_date TIMESTAMPTZ, max_results INT DEFAULT 10)
RETURNS TABLE(query TEXT, search_count BIGINT, top_module VARCHAR)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.properties->>'query' AS query,
    COUNT(*)::BIGINT AS search_count,
    MODE() WITHIN GROUP (ORDER BY e.module) AS top_module
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type = 'search'
    AND e.properties->>'query' IS NOT NULL
    AND e.properties->>'query' != ''
    AND (e.properties->>'result_count')::int = 0
  GROUP BY e.properties->>'query'
  ORDER BY search_count DESC
  LIMIT max_results;
$$;
