-- Migration 044: Weekly retention cohorts (was monthly)
-- With few early users, weekly granularity gives faster visibility.
-- Return type changes (cohort_month → cohort_week, month_offset → week_offset) → must DROP+CREATE.

DROP FUNCTION IF EXISTS get_usage_retention(TIMESTAMPTZ);

CREATE FUNCTION get_usage_retention(since_date TIMESTAMPTZ)
RETURNS TABLE(
  cohort_week TEXT,
  week_offset INT,
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
      DATE_TRUNC('week', MIN(created_at))::DATE AS first_week
    FROM usage_events
    WHERE actor_hash != 'anon_000000000000'
    GROUP BY actor_hash
  ),
  actor_weeks AS (
    -- Which weeks was each actor active?
    SELECT DISTINCT
      actor_hash,
      DATE_TRUNC('week', created_at)::DATE AS active_week
    FROM usage_events
    WHERE actor_hash != 'anon_000000000000'
  ),
  cohort_activity AS (
    SELECT
      af.first_week,
      aw.active_week,
      ((aw.active_week - af.first_week) / 7)::INT AS week_offset,
      COUNT(DISTINCT aw.actor_hash)::BIGINT AS active_count
    FROM actor_first af
    JOIN actor_weeks aw ON af.actor_hash = aw.actor_hash
    GROUP BY af.first_week, aw.active_week
  ),
  cohort_sizes AS (
    SELECT first_week, COUNT(*)::BIGINT AS cohort_size
    FROM actor_first
    GROUP BY first_week
  )
  SELECT
    TO_CHAR(ca.first_week, 'YYYY-"W"IW') AS cohort_week,
    ca.week_offset,
    ca.active_count,
    cs.cohort_size,
    ROUND(ca.active_count::NUMERIC / NULLIF(cs.cohort_size, 0) * 100, 0) AS retention_rate
  FROM cohort_activity ca
  JOIN cohort_sizes cs ON ca.first_week = cs.first_week
  WHERE ca.week_offset >= 0
    AND ca.first_week >= DATE_TRUNC('week', since_date)::DATE
  ORDER BY ca.first_week, ca.week_offset;
$$;
