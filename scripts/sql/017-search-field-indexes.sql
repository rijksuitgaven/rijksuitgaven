-- =====================================================
-- Search Field Indexes for Expanded Search
-- Description: GIN trigram indexes for new searchable fields
-- Created: 2026-01-31
-- Executed: [Date] on [Environment]
-- =====================================================
--
-- Context: Search fields were expanded to include more columns per module.
-- These indexes support fast regex/ILIKE searches on those fields.
--
-- NOTE: Run each section separately if Supabase times out.
-- =====================================================

-- Ensure pg_trgm extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- INSTRUMENTEN source table indexes
-- New search fields: regeling, instrument, begrotingsnaam, artikel, artikelonderdeel, detail
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_instrumenten_regeling_trgm
ON instrumenten USING gin (regeling gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_instrumenten_instrument_trgm
ON instrumenten USING gin (instrument gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_instrumenten_begrotingsnaam_trgm
ON instrumenten USING gin (begrotingsnaam gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_instrumenten_artikel_trgm
ON instrumenten USING gin (artikel gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_instrumenten_artikelonderdeel_trgm
ON instrumenten USING gin (artikelonderdeel gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_instrumenten_detail_trgm
ON instrumenten USING gin (detail gin_trgm_ops);

-- =====================================================
-- APPARAAT source table indexes
-- New search fields: begrotingsnaam, artikel, detail
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apparaat_begrotingsnaam_trgm
ON apparaat USING gin (begrotingsnaam gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apparaat_artikel_trgm
ON apparaat USING gin (artikel gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_apparaat_detail_trgm
ON apparaat USING gin (detail gin_trgm_ops);

-- =====================================================
-- GEMEENTE source table indexes
-- New search fields: omschrijving, regeling, beleidsterrein
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gemeente_omschrijving_trgm
ON gemeente USING gin (omschrijving gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gemeente_regeling_trgm
ON gemeente USING gin (regeling gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gemeente_beleidsterrein_trgm
ON gemeente USING gin (beleidsterrein gin_trgm_ops);

-- =====================================================
-- PUBLIEK source table indexes
-- New search fields: omschrijving, regeling, trefwoorden, sectoren
-- =====================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_publiek_omschrijving_trgm
ON publiek USING gin (omschrijving gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_publiek_regeling_trgm
ON publiek USING gin (regeling gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_publiek_trefwoorden_trgm
ON publiek USING gin (trefwoorden gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_publiek_sectoren_trgm
ON publiek USING gin (sectoren gin_trgm_ops);

-- =====================================================
-- VERIFY: List all trigram indexes
-- =====================================================

SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes
WHERE indexname LIKE '%trgm%'
ORDER BY tablename, indexname;
