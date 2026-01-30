-- =====================================================
-- Description: Enable RLS on tables flagged by Supabase linter
-- Created: 2026-01-31
-- Executed: 2026-01-31 on Supabase Production
-- =====================================================
--
-- Fixes:
-- 1. spatial_ref_sys - PostGIS system table (revoke API access)
-- 2. data_freshness - Our data freshness tracking table (enable RLS)
-- =====================================================

-- ============================================
-- 1. spatial_ref_sys (PostGIS system table)
-- ============================================
-- This table is owned by PostGIS extension - cannot enable RLS or move schema.
-- Supabase linter flags it but this is a FALSE POSITIVE.
--
-- Why it's safe:
-- - Read-only reference data (coordinate system definitions)
-- - API access revoked below
-- - Extension-owned tables are a known Supabase linter limitation
--
-- Action: Revoke API access and ignore the linter warning.

REVOKE SELECT ON public.spatial_ref_sys FROM anon, authenticated;

-- ============================================
-- 2. data_freshness
-- ============================================
-- Tracks when each module's data was last updated.
-- Public read access, no write access via API.

ALTER TABLE public.data_freshness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "data_freshness_select_policy"
ON public.data_freshness
FOR SELECT
TO public
USING (true);
