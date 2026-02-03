-- =====================================================
-- Functional Indexes for normalize_recipient()
-- Description: Enables fast details queries with entity resolution
-- Created: 2026-02-03
-- Execute: Run on Supabase SQL Editor
-- =====================================================

-- PROBLEM: Details queries need to use normalize_recipient() to match
-- all case/formatting variations of a recipient name (SVB, Svb, svb).
-- Without indexes, this causes full table scans (8+ seconds on 674K rows).

-- SOLUTION: Create functional indexes on normalize_recipient(primary_field).
-- PostgreSQL can use these indexes because normalize_recipient() is IMMUTABLE.

-- =====================================================
-- Instrumenten (674K rows)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_instrumenten_ontvanger_normalized
ON instrumenten (normalize_recipient(ontvanger));

-- Composite for year-filtered queries
CREATE INDEX IF NOT EXISTS idx_instrumenten_ontvanger_normalized_jaar
ON instrumenten (normalize_recipient(ontvanger), begrotingsjaar);

-- =====================================================
-- Inkoop (636K rows)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_inkoop_leverancier_normalized
ON inkoop (normalize_recipient(leverancier));

CREATE INDEX IF NOT EXISTS idx_inkoop_leverancier_normalized_jaar
ON inkoop (normalize_recipient(leverancier), jaar);

-- =====================================================
-- Provincie (67K rows)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_provincie_ontvanger_normalized
ON provincie (normalize_recipient(ontvanger));

CREATE INDEX IF NOT EXISTS idx_provincie_ontvanger_normalized_jaar
ON provincie (normalize_recipient(ontvanger), jaar);

-- =====================================================
-- Gemeente (126K rows)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_gemeente_ontvanger_normalized
ON gemeente (normalize_recipient(ontvanger));

CREATE INDEX IF NOT EXISTS idx_gemeente_ontvanger_normalized_jaar
ON gemeente (normalize_recipient(ontvanger), jaar);

-- =====================================================
-- Publiek (115K rows)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_publiek_ontvanger_normalized
ON publiek (normalize_recipient(ontvanger));

CREATE INDEX IF NOT EXISTS idx_publiek_ontvanger_normalized_jaar
ON publiek (normalize_recipient(ontvanger), jaar);

-- =====================================================
-- Apparaat (21K rows) - uses kostensoort (category), not recipient
-- No normalization needed for categories
-- =====================================================
-- (no changes needed)

-- =====================================================
-- Verify indexes were created
-- =====================================================
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE indexname LIKE '%normalized%'
ORDER BY tablename, indexname;
