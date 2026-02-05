-- Migration: 021-filter-column-indexes.sql
-- Description: Add B-tree indexes on filter columns for faster DISTINCT queries
-- Problem: Filter dropdown options take 800-900ms due to full table scans
-- Solution: B-tree indexes enable index-only scans for DISTINCT (~300ms)
-- Date: 2026-02-05

-- =============================================================================
-- INSTRUMENTEN (674K rows)
-- Existing: idx_instrumenten_regeling
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_instrumenten_begrotingsnaam
ON instrumenten (begrotingsnaam);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_instrumenten_artikel
ON instrumenten (artikel);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_instrumenten_artikelonderdeel
ON instrumenten (artikelonderdeel);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_instrumenten_instrument
ON instrumenten (instrument);

-- regeling already has index (idx_instrumenten_regeling)

-- =============================================================================
-- APPARAAT (21K rows)
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apparaat_begrotingsnaam
ON apparaat (begrotingsnaam);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apparaat_artikel
ON apparaat (artikel);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apparaat_detail
ON apparaat (detail);

-- =============================================================================
-- INKOOP (635K rows)
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inkoop_ministerie
ON inkoop (ministerie);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inkoop_categorie
ON inkoop (categorie);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inkoop_staffel
ON inkoop (staffel);

-- =============================================================================
-- PROVINCIE (67K rows)
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_provincie_provincie
ON provincie (provincie);

-- =============================================================================
-- GEMEENTE (126K rows)
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gemeente_gemeente
ON gemeente (gemeente);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gemeente_beleidsterrein
ON gemeente (beleidsterrein);

-- =============================================================================
-- PUBLIEK (115K rows)
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_publiek_source
ON publiek (source);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_publiek_regeling
ON publiek (regeling);

-- =============================================================================
-- VERIFY
-- =============================================================================

-- Run this to verify indexes were created:
-- SELECT indexname, tablename FROM pg_indexes
-- WHERE indexname LIKE 'idx_%_begrotingsnaam'
--    OR indexname LIKE 'idx_%_artikel'
--    OR indexname LIKE 'idx_%_ministerie'
--    OR indexname LIKE 'idx_%_provincie'
--    OR indexname LIKE 'idx_%_gemeente'
--    OR indexname LIKE 'idx_%_source';
