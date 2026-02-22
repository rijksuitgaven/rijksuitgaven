-- 068: Engagement scoring functions
-- Two SQL functions for computing email engagement levels per person

-- Bulk: returns all persons with engagement level + stats
CREATE OR REPLACE FUNCTION get_engagement_scores()
RETURNS TABLE (
  person_id UUID,
  engagement_level TEXT,
  last_engagement_at TIMESTAMPTZ,
  campaigns_sent BIGINT,
  campaigns_opened BIGINT,
  campaigns_clicked BIGINT
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  WITH person_events AS (
    SELECT
      ce.person_id,
      COUNT(DISTINCT ce.campaign_id) FILTER (WHERE ce.event_type = 'delivered') AS delivered,
      COUNT(DISTINCT ce.campaign_id) FILTER (WHERE ce.event_type = 'opened') AS opened,
      COUNT(DISTINCT ce.campaign_id) FILTER (WHERE ce.event_type = 'clicked') AS clicked,
      MAX(ce.occurred_at) FILTER (WHERE ce.event_type IN ('opened', 'clicked')) AS last_engage
    FROM campaign_events ce
    WHERE ce.person_id IS NOT NULL
    GROUP BY ce.person_id
  )
  SELECT
    pe.person_id,
    CASE
      WHEN pe.delivered < 3 THEN 'new'
      WHEN pe.last_engage >= NOW() - INTERVAL '30 days' THEN 'active'
      WHEN pe.last_engage >= NOW() - INTERVAL '90 days' THEN 'at_risk'
      WHEN pe.last_engage IS NOT NULL THEN 'cold'
      ELSE 'cold'
    END::TEXT AS engagement_level,
    pe.last_engage AS last_engagement_at,
    pe.delivered AS campaigns_sent,
    pe.opened AS campaigns_opened,
    pe.clicked AS campaigns_clicked
  FROM person_events pe;
END;
$$;

-- Single person: returns engagement for one person
CREATE OR REPLACE FUNCTION get_person_engagement(p_person_id UUID)
RETURNS TABLE (
  engagement_level TEXT,
  last_engagement_at TIMESTAMPTZ,
  campaigns_sent BIGINT,
  campaigns_opened BIGINT,
  campaigns_clicked BIGINT
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  WITH person_events AS (
    SELECT
      COUNT(DISTINCT ce.campaign_id) FILTER (WHERE ce.event_type = 'delivered') AS delivered,
      COUNT(DISTINCT ce.campaign_id) FILTER (WHERE ce.event_type = 'opened') AS opened,
      COUNT(DISTINCT ce.campaign_id) FILTER (WHERE ce.event_type = 'clicked') AS clicked,
      MAX(ce.occurred_at) FILTER (WHERE ce.event_type IN ('opened', 'clicked')) AS last_engage
    FROM campaign_events ce
    WHERE ce.person_id = p_person_id
  )
  SELECT
    CASE
      WHEN pe.delivered < 3 THEN 'new'
      WHEN pe.last_engage >= NOW() - INTERVAL '30 days' THEN 'active'
      WHEN pe.last_engage >= NOW() - INTERVAL '90 days' THEN 'at_risk'
      WHEN pe.last_engage IS NOT NULL THEN 'cold'
      ELSE 'cold'
    END::TEXT AS engagement_level,
    pe.last_engage AS last_engagement_at,
    pe.delivered AS campaigns_sent,
    pe.opened AS campaigns_opened,
    pe.clicked AS campaigns_clicked
  FROM person_events pe;
END;
$$;
