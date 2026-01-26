-- =====================================================
-- Refresh All Views Function
-- Description: Single function to refresh all materialized views
-- Created: 2026-01-26
-- Usage: SELECT refresh_all_views();
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_all_views()
RETURNS TEXT AS $$
BEGIN
    -- Refresh aggregated views (for API performance)
    REFRESH MATERIALIZED VIEW instrumenten_aggregated;
    REFRESH MATERIALIZED VIEW apparaat_aggregated;
    REFRESH MATERIALIZED VIEW inkoop_aggregated;
    REFRESH MATERIALIZED VIEW provincie_aggregated;
    REFRESH MATERIALIZED VIEW gemeente_aggregated;
    REFRESH MATERIALIZED VIEW publiek_aggregated;

    -- Refresh cross-module search view (with entity resolution)
    REFRESH MATERIALIZED VIEW CONCURRENTLY universal_search;

    RETURN 'All views refreshed successfully';
END;
$$ LANGUAGE plpgsql;
