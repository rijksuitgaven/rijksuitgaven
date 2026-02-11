-- =====================================================
-- Supabase Security Linter Fixes
-- Description: Resolve warnings from Supabase Security Advisor
-- Executed: 2026-02-11 on production
-- =====================================================

-- 1. Fix function search_path (mutable search_path warning)
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Move extensions out of public schema
-- (postgis does NOT support SET SCHEMA — known limitation, warning will persist)
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
ALTER EXTENSION vector SET SCHEMA extensions;

-- 3. Revoke direct PostgREST API access to materialized views
-- Backend connects as postgres (bypasses these grants), so no impact
REVOKE SELECT ON instrumenten_aggregated FROM anon, authenticated;
REVOKE SELECT ON apparaat_aggregated FROM anon, authenticated;
REVOKE SELECT ON inkoop_aggregated FROM anon, authenticated;
REVOKE SELECT ON provincie_aggregated FROM anon, authenticated;
REVOKE SELECT ON gemeente_aggregated FROM anon, authenticated;
REVOKE SELECT ON publiek_aggregated FROM anon, authenticated;
REVOKE SELECT ON universal_search FROM anon, authenticated;

-- 4. Enable RLS on spatial_ref_sys (PostGIS system table)
-- NOTE: Must run in SQL Editor (requires supabase_admin ownership)
-- ALTER TABLE spatial_ref_sys ENABLE ROW LEVEL SECURITY;
