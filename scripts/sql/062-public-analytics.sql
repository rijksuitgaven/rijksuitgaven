-- Migration 062: Public page analytics functions (UX-036)
-- 8 RPC functions for the "Website" tab in /team/statistieken
-- All query usage_events where event_type IN ('public_page_view', 'public_interaction')

-- 1. Page views: count + unique sessions per page
CREATE OR REPLACE FUNCTION get_public_page_views(since_date TIMESTAMPTZ)
RETURNS TABLE(page TEXT, view_count BIGINT, unique_sessions BIGINT)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.properties->>'page' AS page,
    COUNT(*)::BIGINT AS view_count,
    COUNT(DISTINCT e.properties->>'session_id')::BIGINT AS unique_sessions
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type = 'public_page_view'
    AND e.properties->>'page' IS NOT NULL
  GROUP BY e.properties->>'page'
  ORDER BY view_count DESC;
$$;

-- 2. Interactions: count per action type
CREATE OR REPLACE FUNCTION get_public_interactions(since_date TIMESTAMPTZ)
RETURNS TABLE(action TEXT, interaction_count BIGINT, unique_sessions BIGINT)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.properties->>'action' AS action,
    COUNT(*)::BIGINT AS interaction_count,
    COUNT(DISTINCT e.properties->>'session_id')::BIGINT AS unique_sessions
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type = 'public_interaction'
    AND e.properties->>'action' IS NOT NULL
  GROUP BY e.properties->>'action'
  ORDER BY interaction_count DESC;
$$;

-- 3. Contact form funnel: starts vs submissions (success/error)
CREATE OR REPLACE FUNCTION get_public_contact_funnel(since_date TIMESTAMPTZ)
RETURNS TABLE(step TEXT, step_count BIGINT, unique_sessions BIGINT)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN e.properties->>'action' = 'contact_form_start' THEN 'start'
      WHEN e.properties->>'action' = 'contact_form_submit' AND e.properties->>'element' = 'success' THEN 'submit_success'
      WHEN e.properties->>'action' = 'contact_form_submit' AND e.properties->>'element' = 'error' THEN 'submit_error'
    END AS step,
    COUNT(*)::BIGINT AS step_count,
    COUNT(DISTINCT e.properties->>'session_id')::BIGINT AS unique_sessions
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type = 'public_interaction'
    AND e.properties->>'action' IN ('contact_form_start', 'contact_form_submit')
  GROUP BY step
  ORDER BY step_count DESC;
$$;

-- 4. Referrers: which external domains send traffic
CREATE OR REPLACE FUNCTION get_public_referrers(since_date TIMESTAMPTZ, max_results INT DEFAULT 20)
RETURNS TABLE(referrer TEXT, visit_count BIGINT, unique_sessions BIGINT)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.properties->>'referrer' AS referrer,
    COUNT(*)::BIGINT AS visit_count,
    COUNT(DISTINCT e.properties->>'session_id')::BIGINT AS unique_sessions
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type = 'public_page_view'
    AND e.properties->>'referrer' IS NOT NULL
  GROUP BY e.properties->>'referrer'
  ORDER BY visit_count DESC
  LIMIT max_results;
$$;

-- 5. CTA clicks: which CTAs get clicked and from which sections
CREATE OR REPLACE FUNCTION get_public_cta_clicks(since_date TIMESTAMPTZ)
RETURNS TABLE(section TEXT, element TEXT, click_count BIGINT, unique_sessions BIGINT)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.properties->>'section' AS section,
    e.properties->>'element' AS element,
    COUNT(*)::BIGINT AS click_count,
    COUNT(DISTINCT e.properties->>'session_id')::BIGINT AS unique_sessions
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type = 'public_interaction'
    AND e.properties->>'action' = 'cta_click'
  GROUP BY e.properties->>'section', e.properties->>'element'
  ORDER BY click_count DESC;
$$;

-- 6. Scroll funnel: how far visitors scroll (section_view events)
CREATE OR REPLACE FUNCTION get_public_scroll_funnel(since_date TIMESTAMPTZ)
RETURNS TABLE(section TEXT, view_count BIGINT, unique_sessions BIGINT)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.properties->>'section' AS section,
    COUNT(*)::BIGINT AS view_count,
    COUNT(DISTINCT e.properties->>'session_id')::BIGINT AS unique_sessions
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type = 'public_interaction'
    AND e.properties->>'action' = 'section_view'
  GROUP BY e.properties->>'section'
  ORDER BY view_count DESC;
$$;

-- 7. Login funnel: attempts vs magic links sent
CREATE OR REPLACE FUNCTION get_public_login_funnel(since_date TIMESTAMPTZ)
RETURNS TABLE(step TEXT, step_count BIGINT, unique_sessions BIGINT)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.properties->>'action' AS step,
    COUNT(*)::BIGINT AS step_count,
    COUNT(DISTINCT e.properties->>'session_id')::BIGINT AS unique_sessions
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type = 'public_interaction'
    AND e.properties->>'action' IN ('login_attempt', 'login_magic_link_sent')
  GROUP BY e.properties->>'action'
  ORDER BY step_count DESC;
$$;

-- 8. UTM campaign attribution
CREATE OR REPLACE FUNCTION get_public_utm_campaigns(since_date TIMESTAMPTZ, max_results INT DEFAULT 20)
RETURNS TABLE(utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, visit_count BIGINT, unique_sessions BIGINT)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.properties->>'utm_source' AS utm_source,
    e.properties->>'utm_medium' AS utm_medium,
    e.properties->>'utm_campaign' AS utm_campaign,
    COUNT(*)::BIGINT AS visit_count,
    COUNT(DISTINCT e.properties->>'session_id')::BIGINT AS unique_sessions
  FROM usage_events e
  WHERE e.created_at >= since_date
    AND e.event_type = 'public_page_view'
    AND e.properties->>'utm_source' IS NOT NULL
  GROUP BY e.properties->>'utm_source', e.properties->>'utm_medium', e.properties->>'utm_campaign'
  ORDER BY visit_count DESC
  LIMIT max_results;
$$;
