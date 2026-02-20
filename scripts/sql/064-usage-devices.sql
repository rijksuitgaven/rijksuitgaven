-- Migration 064: Browser & Device Analytics
-- Aggregates browser/device from usage_events properties JSONB
-- Split by scope: public (website visitors) vs logged_in (authenticated users)

CREATE OR REPLACE FUNCTION get_usage_devices(since_date TIMESTAMPTZ)
RETURNS TABLE(scope TEXT, browser TEXT, device TEXT, event_count BIGINT, unique_actors BIGINT)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT
    CASE WHEN event_type IN ('public_page_view', 'public_interaction') THEN 'public' ELSE 'logged_in' END AS scope,
    COALESCE(properties->>'browser', 'Onbekend') AS browser,
    COALESCE(properties->>'device', 'Onbekend') AS device,
    COUNT(*) AS event_count,
    COUNT(DISTINCT actor_hash) AS unique_actors
  FROM usage_events
  WHERE created_at >= since_date
    AND properties->>'browser' IS NOT NULL
  GROUP BY 1, 2, 3
  ORDER BY scope, event_count DESC;
$$;
