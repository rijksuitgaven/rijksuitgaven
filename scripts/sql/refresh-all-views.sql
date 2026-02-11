-- =====================================================
-- Refresh All Materialized Views
-- Description: Run this after any data import/update
-- Created: 2026-01-26
-- Updated: 2026-01-29 - Added note about random_order regeneration
-- Usage: Run in Supabase SQL Editor after data changes
-- =====================================================

-- NOTE: Refreshing regenerates the random_order column values,
-- giving users a fresh random selection after each data update.
-- This is intentional (UX-002 requirement).

-- Refresh aggregated views (for API performance)
REFRESH MATERIALIZED VIEW instrumenten_aggregated;
ANALYZE instrumenten_aggregated;

REFRESH MATERIALIZED VIEW apparaat_aggregated;
ANALYZE apparaat_aggregated;

REFRESH MATERIALIZED VIEW inkoop_aggregated;
ANALYZE inkoop_aggregated;

REFRESH MATERIALIZED VIEW provincie_aggregated;
ANALYZE provincie_aggregated;

REFRESH MATERIALIZED VIEW gemeente_aggregated;
ANALYZE gemeente_aggregated;

REFRESH MATERIALIZED VIEW publiek_aggregated;
ANALYZE publiek_aggregated;

-- Refresh cross-module search view
REFRESH MATERIALIZED VIEW CONCURRENTLY universal_search;
ANALYZE universal_search;

-- Verify row counts
SELECT 'instrumenten_aggregated' as view_name, COUNT(*) as rows FROM instrumenten_aggregated
UNION ALL SELECT 'apparaat_aggregated', COUNT(*) FROM apparaat_aggregated
UNION ALL SELECT 'inkoop_aggregated', COUNT(*) FROM inkoop_aggregated
UNION ALL SELECT 'provincie_aggregated', COUNT(*) FROM provincie_aggregated
UNION ALL SELECT 'gemeente_aggregated', COUNT(*) FROM gemeente_aggregated
UNION ALL SELECT 'publiek_aggregated', COUNT(*) FROM publiek_aggregated
UNION ALL SELECT 'universal_search', COUNT(*) FROM universal_search
ORDER BY view_name;
