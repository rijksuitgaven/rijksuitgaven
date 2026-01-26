-- =====================================================
-- Refresh All Materialized Views
-- Description: Run this after any data import/update
-- Created: 2026-01-26
-- Usage: Run in Supabase SQL Editor after data changes
-- =====================================================

-- Refresh aggregated views (for API performance)
REFRESH MATERIALIZED VIEW instrumenten_aggregated;
REFRESH MATERIALIZED VIEW apparaat_aggregated;
REFRESH MATERIALIZED VIEW inkoop_aggregated;
REFRESH MATERIALIZED VIEW provincie_aggregated;
REFRESH MATERIALIZED VIEW gemeente_aggregated;
REFRESH MATERIALIZED VIEW publiek_aggregated;

-- Refresh cross-module search view
REFRESH MATERIALIZED VIEW CONCURRENTLY universal_search;

-- Verify row counts
SELECT 'instrumenten_aggregated' as view_name, COUNT(*) as rows FROM instrumenten_aggregated
UNION ALL SELECT 'apparaat_aggregated', COUNT(*) FROM apparaat_aggregated
UNION ALL SELECT 'inkoop_aggregated', COUNT(*) FROM inkoop_aggregated
UNION ALL SELECT 'provincie_aggregated', COUNT(*) FROM provincie_aggregated
UNION ALL SELECT 'gemeente_aggregated', COUNT(*) FROM gemeente_aggregated
UNION ALL SELECT 'publiek_aggregated', COUNT(*) FROM publiek_aggregated
UNION ALL SELECT 'universal_search', COUNT(*) FROM universal_search
ORDER BY view_name;
