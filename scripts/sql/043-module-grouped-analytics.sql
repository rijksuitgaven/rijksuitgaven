-- Migration 043: Module-grouped analytics functions
-- Changes get_usage_filters, get_usage_columns, get_usage_exports to GROUP BY module
-- so the dashboard can display data grouped by module first.
-- Return types change → must DROP then CREATE.

-- 1. Filters: grouped by module + field
DROP FUNCTION IF EXISTS get_usage_filters(TIMESTAMPTZ, INT);

CREATE FUNCTION get_usage_filters(since_date TIMESTAMPTZ, max_results INT DEFAULT 30)
RETURNS TABLE(module VARCHAR, field TEXT, filter_count BIGINT)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.module,
    e.properties->>'field' AS field,
    COUNT(*)::BIGINT AS filter_count
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type = 'filter_apply'
    AND e.properties->>'field' IS NOT NULL
    AND e.module IS NOT NULL
  GROUP BY e.module, e.properties->>'field'
  ORDER BY e.module, filter_count DESC
  LIMIT max_results;
$$;

-- 2. Columns: grouped by module + column
DROP FUNCTION IF EXISTS get_usage_columns(TIMESTAMPTZ, INT);

CREATE FUNCTION get_usage_columns(since_date TIMESTAMPTZ, max_results INT DEFAULT 30)
RETURNS TABLE(module VARCHAR, column_name TEXT, usage_count BIGINT)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.module,
    col.value::TEXT AS column_name,
    COUNT(*)::BIGINT AS usage_count
  FROM usage_events e,
    jsonb_array_elements_text(e.properties->'columns') AS col(value)
  WHERE e.created_at >= since_date
    AND e.event_type = 'column_change'
    AND e.module IS NOT NULL
  GROUP BY e.module, col.value
  ORDER BY e.module, usage_count DESC
  LIMIT max_results;
$$;

-- 3. Exports: grouped by module + format
DROP FUNCTION IF EXISTS get_usage_exports(TIMESTAMPTZ);

CREATE FUNCTION get_usage_exports(since_date TIMESTAMPTZ)
RETURNS TABLE(module VARCHAR, format TEXT, export_count BIGINT, avg_rows NUMERIC, unique_actors BIGINT)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.module,
    e.properties->>'format' AS format,
    COUNT(*)::BIGINT AS export_count,
    ROUND(AVG((e.properties->>'row_count')::NUMERIC), 0) AS avg_rows,
    COUNT(DISTINCT e.actor_hash)::BIGINT AS unique_actors
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type = 'export'
    AND e.module IS NOT NULL
  GROUP BY e.module, e.properties->>'format'
  ORDER BY e.module, export_count DESC;
$$;
