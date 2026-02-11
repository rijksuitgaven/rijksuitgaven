-- =====================================================
-- Drop Unused PostGIS Extension
-- Description: PostGIS was never used (locatie column had 0 non-null rows).
--              Dropping removes spatial_ref_sys table, clearing Supabase
--              security linter error (RLS disabled on spatial_ref_sys).
-- Executed: 2026-02-11 on production via SQL Editor
-- =====================================================

-- 1. Drop unused geometry column from publiek table
ALTER TABLE publiek DROP COLUMN IF EXISTS locatie;

-- 2. Drop PostGIS extension (removes spatial_ref_sys automatically)
DROP EXTENSION IF EXISTS postgis CASCADE;
