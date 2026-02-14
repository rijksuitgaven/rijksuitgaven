-- Migration 042: Advanced Analytics Functions (UX-032 V3)
-- Sessions, exit intent, search success, retention cohorts, engagement scores
-- All computed from existing usage_events data — no schema changes needed
--
-- Session definition: events from same actor with <30min gap between consecutive events
-- (Industry standard, used by Google Analytics)

-- 1. Sessions summary for pulse cards
CREATE OR REPLACE FUNCTION get_usage_sessions_summary(since_date TIMESTAMPTZ)
RETURNS TABLE(
  total_sessions BIGINT,
  unique_actors BIGINT,
  avg_duration_seconds NUMERIC,
  avg_events_per_session NUMERIC,
  avg_modules_per_session NUMERIC
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH events AS (
    SELECT
      actor_hash,
      created_at,
      module,
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
  sessions AS (
    SELECT
      actor_hash,
      session_num,
      EXTRACT(EPOCH FROM MAX(created_at) - MIN(created_at))::NUMERIC AS duration_seconds,
      COUNT(*)::NUMERIC AS event_count,
      COUNT(DISTINCT module) FILTER (WHERE module IS NOT NULL)::NUMERIC AS modules_visited
    FROM session_boundaries
    GROUP BY actor_hash, session_num
  )
  SELECT
    COUNT(*)::BIGINT AS total_sessions,
    COUNT(DISTINCT actor_hash)::BIGINT AS unique_actors,
    ROUND(AVG(duration_seconds), 0) AS avg_duration_seconds,
    ROUND(AVG(event_count), 1) AS avg_events_per_session,
    ROUND(AVG(modules_visited), 1) AS avg_modules_per_session
  FROM sessions;
$$;

-- 2. Exit intent: last event type before each session ends
CREATE OR REPLACE FUNCTION get_usage_exit_intent(since_date TIMESTAMPTZ, max_results INT DEFAULT 10)
RETURNS TABLE(
  last_event_type VARCHAR,
  session_count BIGINT,
  percentage NUMERIC
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
  last_events AS (
    SELECT DISTINCT ON (actor_hash, session_num)
      event_type
    FROM session_boundaries
    ORDER BY actor_hash, session_num, created_at DESC
  ),
  total AS (
    SELECT COUNT(*)::NUMERIC AS cnt FROM last_events
  )
  SELECT
    le.event_type::VARCHAR AS last_event_type,
    COUNT(*)::BIGINT AS session_count,
    ROUND(COUNT(*)::NUMERIC / NULLIF(t.cnt, 0) * 100, 1) AS percentage
  FROM last_events le, total t
  GROUP BY le.event_type, t.cnt
  ORDER BY session_count DESC
  LIMIT max_results;
$$;

-- 3. Search success rate
-- Success = search followed by row_expand, export, cross_module_nav, or external_link
-- within the same session
CREATE OR REPLACE FUNCTION get_usage_search_success(since_date TIMESTAMPTZ)
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
          AND sb.event_type IN ('row_expand', 'export', 'cross_module_nav', 'external_link')
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

-- 4. Retention cohorts (monthly)
-- Cohort = month of user's first-ever activity
-- Shows how many from each cohort were active in subsequent months
CREATE OR REPLACE FUNCTION get_usage_retention(since_date TIMESTAMPTZ)
RETURNS TABLE(
  cohort_month TEXT,
  month_offset INT,
  active_count BIGINT,
  cohort_size BIGINT,
  retention_rate NUMERIC
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH actor_first AS (
    -- First-ever activity (all-time, not limited by since_date)
    SELECT
      actor_hash,
      DATE_TRUNC('month', MIN(created_at))::DATE AS first_month
    FROM usage_events
    WHERE actor_hash != 'anon_000000000000'
    GROUP BY actor_hash
  ),
  actor_months AS (
    -- Which months was each actor active? (all-time for full picture)
    SELECT DISTINCT
      actor_hash,
      DATE_TRUNC('month', created_at)::DATE AS active_month
    FROM usage_events
    WHERE actor_hash != 'anon_000000000000'
  ),
  cohort_activity AS (
    SELECT
      af.first_month,
      am.active_month,
      ((EXTRACT(YEAR FROM am.active_month) - EXTRACT(YEAR FROM af.first_month)) * 12
        + EXTRACT(MONTH FROM am.active_month) - EXTRACT(MONTH FROM af.first_month))::INT AS month_offset,
      COUNT(DISTINCT am.actor_hash)::BIGINT AS active_count
    FROM actor_first af
    JOIN actor_months am ON af.actor_hash = am.actor_hash
    GROUP BY af.first_month, am.active_month
  ),
  cohort_sizes AS (
    SELECT first_month, COUNT(*)::BIGINT AS cohort_size
    FROM actor_first
    GROUP BY first_month
  )
  SELECT
    TO_CHAR(ca.first_month, 'YYYY-MM') AS cohort_month,
    ca.month_offset,
    ca.active_count,
    cs.cohort_size,
    ROUND(ca.active_count::NUMERIC / NULLIF(cs.cohort_size, 0) * 100, 0) AS retention_rate
  FROM cohort_activity ca
  JOIN cohort_sizes cs ON ca.first_month = cs.first_month
  WHERE ca.month_offset >= 0
    AND ca.first_month >= DATE_TRUNC('month', since_date)::DATE
  ORDER BY ca.first_month, ca.month_offset;
$$;

-- 5. Enhanced actors: replaces existing function with session + engagement data
-- Engagement score = weighted sum of actions within the time window
-- Weights: export/cross_module=3, search/filter/external_link=2, everything else=1, error=0
CREATE OR REPLACE FUNCTION get_usage_actors(since_date TIMESTAMPTZ, max_results INT DEFAULT 30)
RETURNS TABLE(
  actor_hash VARCHAR,
  last_seen TIMESTAMPTZ,
  event_count BIGINT,
  top_module TEXT,
  search_count BIGINT,
  export_count BIGINT,
  module_count BIGINT,
  session_count BIGINT,
  avg_session_seconds NUMERIC,
  engagement_score NUMERIC,
  avg_gap_days NUMERIC,
  gap_trend VARCHAR
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH events AS (
    SELECT
      e.actor_hash,
      e.event_type,
      e.module,
      e.created_at,
      LAG(e.created_at) OVER (PARTITION BY e.actor_hash ORDER BY e.created_at) AS prev_at
    FROM usage_events e
    WHERE e.created_at >= since_date
      AND e.actor_hash != 'anon_000000000000'
  ),
  session_boundaries AS (
    SELECT *,
      SUM(CASE WHEN prev_at IS NULL OR EXTRACT(EPOCH FROM created_at - prev_at) > 1800 THEN 1 ELSE 0 END)
        OVER (PARTITION BY actor_hash ORDER BY created_at) AS session_num
    FROM events
  ),
  -- Per-actor session metrics
  per_session AS (
    SELECT actor_hash, session_num,
      MIN(created_at) AS start_t, MAX(created_at) AS end_t
    FROM session_boundaries
    GROUP BY actor_hash, session_num
  ),
  actor_sessions AS (
    SELECT
      actor_hash,
      COUNT(*)::BIGINT AS session_count,
      ROUND(AVG(EXTRACT(EPOCH FROM end_t - start_t)), 0) AS avg_session_seconds
    FROM per_session
    GROUP BY actor_hash
  ),
  -- Per-actor engagement score (weighted event counts)
  actor_engagement AS (
    SELECT
      actor_hash,
      SUM(
        CASE event_type
          WHEN 'module_view' THEN 1
          WHEN 'search' THEN 2
          WHEN 'row_expand' THEN 1
          WHEN 'filter_apply' THEN 2
          WHEN 'export' THEN 3
          WHEN 'column_change' THEN 1
          WHEN 'autocomplete_search' THEN 1
          WHEN 'autocomplete_click' THEN 1
          WHEN 'cross_module_nav' THEN 3
          WHEN 'sort_change' THEN 1
          WHEN 'page_change' THEN 1
          WHEN 'external_link' THEN 2
          ELSE 0
        END
      )::NUMERIC AS engagement_score
    FROM events
    GROUP BY actor_hash
  ),
  -- Per-actor login gap trends
  session_gaps AS (
    SELECT
      actor_hash,
      EXTRACT(EPOCH FROM start_t - LAG(start_t) OVER (PARTITION BY actor_hash ORDER BY start_t)) / 86400.0 AS gap_days,
      ROW_NUMBER() OVER (PARTITION BY actor_hash ORDER BY start_t DESC) AS rn
    FROM per_session
  ),
  actor_gaps AS (
    SELECT
      actor_hash,
      ROUND(AVG(gap_days)::NUMERIC, 1) AS avg_gap_days,
      CASE
        WHEN COUNT(*) < 2 THEN 'nieuw'
        WHEN MAX(CASE WHEN rn = 1 THEN gap_days END) < AVG(gap_days) * 0.7 THEN 'stijgend'
        WHEN MAX(CASE WHEN rn = 1 THEN gap_days END) > AVG(gap_days) * 1.3 THEN 'dalend'
        ELSE 'stabiel'
      END::VARCHAR AS gap_trend
    FROM session_gaps
    WHERE gap_days IS NOT NULL
    GROUP BY actor_hash
  ),
  -- Base actor stats
  actor_base AS (
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
  )
  SELECT
    ab.actor_hash,
    ab.last_seen,
    ab.event_count,
    ab.top_module,
    ab.search_count,
    ab.export_count,
    ab.module_count,
    COALESCE(s.session_count, 0) AS session_count,
    COALESCE(s.avg_session_seconds, 0) AS avg_session_seconds,
    COALESCE(ae.engagement_score, 0) AS engagement_score,
    COALESCE(ag.avg_gap_days, 0) AS avg_gap_days,
    COALESCE(ag.gap_trend, 'nieuw')::VARCHAR AS gap_trend
  FROM actor_base ab
  LEFT JOIN actor_sessions s ON ab.actor_hash = s.actor_hash
  LEFT JOIN actor_engagement ae ON ab.actor_hash = ae.actor_hash
  LEFT JOIN actor_gaps ag ON ab.actor_hash = ag.actor_hash
  ORDER BY ab.event_count DESC
  LIMIT max_results;
$$;
