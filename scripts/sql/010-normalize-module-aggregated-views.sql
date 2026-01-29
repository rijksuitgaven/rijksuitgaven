-- =====================================================
-- Entity Resolution: Normalize Module Aggregated Views
-- Description: Apply normalize_recipient() to all module views
--              to merge case variations (politie, Politie, POLITIE)
-- Created: 2026-01-29
-- Executed: 2026-01-29 on Supabase (instrumenten only so far)
-- =====================================================

-- This script drops and recreates all module aggregated views
-- with normalize_recipient() applied to GROUP BY
--
-- Key changes:
-- 1. GROUP BY normalize_recipient(primary_field) - merges case variants
-- 2. Display name: first letter capitalized via UPPER(LEFT()) || SUBSTRING()
-- 3. Includes random_order column for UX-002 random sorting
--
-- NOTE: apparaat_aggregated is NOT changed - uses kostensoort (category)
--       not recipient names

-- =====================================================
-- Step 1: Drop existing views and their indexes
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS instrumenten_aggregated CASCADE;
DROP MATERIALIZED VIEW IF EXISTS inkoop_aggregated CASCADE;
DROP MATERIALIZED VIEW IF EXISTS provincie_aggregated CASCADE;
DROP MATERIALIZED VIEW IF EXISTS gemeente_aggregated CASCADE;
DROP MATERIALIZED VIEW IF EXISTS publiek_aggregated CASCADE;

-- =====================================================
-- Step 2: Recreate INSTRUMENTEN with normalization
-- =====================================================

CREATE MATERIALIZED VIEW instrumenten_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    COALESCE(SUM(CASE WHEN begrotingsjaar = 2016 THEN bedrag END), 0) * 1000 AS "2016",
    COALESCE(SUM(CASE WHEN begrotingsjaar = 2017 THEN bedrag END), 0) * 1000 AS "2017",
    COALESCE(SUM(CASE WHEN begrotingsjaar = 2018 THEN bedrag END), 0) * 1000 AS "2018",
    COALESCE(SUM(CASE WHEN begrotingsjaar = 2019 THEN bedrag END), 0) * 1000 AS "2019",
    COALESCE(SUM(CASE WHEN begrotingsjaar = 2020 THEN bedrag END), 0) * 1000 AS "2020",
    COALESCE(SUM(CASE WHEN begrotingsjaar = 2021 THEN bedrag END), 0) * 1000 AS "2021",
    COALESCE(SUM(CASE WHEN begrotingsjaar = 2022 THEN bedrag END), 0) * 1000 AS "2022",
    COALESCE(SUM(CASE WHEN begrotingsjaar = 2023 THEN bedrag END), 0) * 1000 AS "2023",
    COALESCE(SUM(CASE WHEN begrotingsjaar = 2024 THEN bedrag END), 0) * 1000 AS "2024",
    COALESCE(SUM(bedrag), 0) * 1000 AS totaal,
    COUNT(*) AS row_count,
    RANDOM() AS random_order
FROM instrumenten
GROUP BY normalize_recipient(ontvanger);

CREATE INDEX idx_instrumenten_agg_ontvanger ON instrumenten_aggregated (ontvanger);
CREATE INDEX idx_instrumenten_agg_totaal ON instrumenten_aggregated (totaal DESC);
CREATE INDEX idx_instrumenten_agg_ontvanger_trgm ON instrumenten_aggregated USING gin (ontvanger gin_trgm_ops);
CREATE UNIQUE INDEX idx_instrumenten_agg_key ON instrumenten_aggregated (ontvanger_key);
CREATE INDEX idx_instrumenten_agg_random ON instrumenten_aggregated (random_order);

-- =====================================================
-- Step 3: Recreate INKOOP with normalization
-- =====================================================

CREATE MATERIALIZED VIEW inkoop_aggregated AS
SELECT
    normalize_recipient(leverancier) AS leverancier_key,
    UPPER(LEFT(MIN(leverancier), 1)) || SUBSTRING(MIN(leverancier) FROM 2) AS leverancier,
    COALESCE(SUM(CASE WHEN jaar = 2016 THEN totaal_avg END), 0) AS "2016",
    COALESCE(SUM(CASE WHEN jaar = 2017 THEN totaal_avg END), 0) AS "2017",
    COALESCE(SUM(CASE WHEN jaar = 2018 THEN totaal_avg END), 0) AS "2018",
    COALESCE(SUM(CASE WHEN jaar = 2019 THEN totaal_avg END), 0) AS "2019",
    COALESCE(SUM(CASE WHEN jaar = 2020 THEN totaal_avg END), 0) AS "2020",
    COALESCE(SUM(CASE WHEN jaar = 2021 THEN totaal_avg END), 0) AS "2021",
    COALESCE(SUM(CASE WHEN jaar = 2022 THEN totaal_avg END), 0) AS "2022",
    COALESCE(SUM(CASE WHEN jaar = 2023 THEN totaal_avg END), 0) AS "2023",
    COALESCE(SUM(CASE WHEN jaar = 2024 THEN totaal_avg END), 0) AS "2024",
    COALESCE(SUM(totaal_avg), 0) AS totaal,
    COUNT(*) AS row_count,
    RANDOM() AS random_order
FROM inkoop
GROUP BY normalize_recipient(leverancier);

CREATE INDEX idx_inkoop_agg_leverancier ON inkoop_aggregated (leverancier);
CREATE INDEX idx_inkoop_agg_totaal ON inkoop_aggregated (totaal DESC);
CREATE INDEX idx_inkoop_agg_leverancier_trgm ON inkoop_aggregated USING gin (leverancier gin_trgm_ops);
CREATE UNIQUE INDEX idx_inkoop_agg_key ON inkoop_aggregated (leverancier_key);
CREATE INDEX idx_inkoop_agg_random ON inkoop_aggregated (random_order);

-- =====================================================
-- Step 4: Recreate PROVINCIE with normalization
-- =====================================================

CREATE MATERIALIZED VIEW provincie_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    COALESCE(SUM(CASE WHEN jaar = 2016 THEN bedrag END), 0) AS "2016",
    COALESCE(SUM(CASE WHEN jaar = 2017 THEN bedrag END), 0) AS "2017",
    COALESCE(SUM(CASE WHEN jaar = 2018 THEN bedrag END), 0) AS "2018",
    COALESCE(SUM(CASE WHEN jaar = 2019 THEN bedrag END), 0) AS "2019",
    COALESCE(SUM(CASE WHEN jaar = 2020 THEN bedrag END), 0) AS "2020",
    COALESCE(SUM(CASE WHEN jaar = 2021 THEN bedrag END), 0) AS "2021",
    COALESCE(SUM(CASE WHEN jaar = 2022 THEN bedrag END), 0) AS "2022",
    COALESCE(SUM(CASE WHEN jaar = 2023 THEN bedrag END), 0) AS "2023",
    COALESCE(SUM(CASE WHEN jaar = 2024 THEN bedrag END), 0) AS "2024",
    COALESCE(SUM(bedrag), 0) AS totaal,
    COUNT(*) AS row_count,
    RANDOM() AS random_order
FROM provincie
GROUP BY normalize_recipient(ontvanger);

CREATE INDEX idx_provincie_agg_ontvanger ON provincie_aggregated (ontvanger);
CREATE INDEX idx_provincie_agg_totaal ON provincie_aggregated (totaal DESC);
CREATE INDEX idx_provincie_agg_ontvanger_trgm ON provincie_aggregated USING gin (ontvanger gin_trgm_ops);
CREATE UNIQUE INDEX idx_provincie_agg_key ON provincie_aggregated (ontvanger_key);
CREATE INDEX idx_provincie_agg_random ON provincie_aggregated (random_order);

-- =====================================================
-- Step 5: Recreate GEMEENTE with normalization
-- =====================================================

CREATE MATERIALIZED VIEW gemeente_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    COALESCE(SUM(CASE WHEN jaar = 2016 THEN bedrag END), 0) AS "2016",
    COALESCE(SUM(CASE WHEN jaar = 2017 THEN bedrag END), 0) AS "2017",
    COALESCE(SUM(CASE WHEN jaar = 2018 THEN bedrag END), 0) AS "2018",
    COALESCE(SUM(CASE WHEN jaar = 2019 THEN bedrag END), 0) AS "2019",
    COALESCE(SUM(CASE WHEN jaar = 2020 THEN bedrag END), 0) AS "2020",
    COALESCE(SUM(CASE WHEN jaar = 2021 THEN bedrag END), 0) AS "2021",
    COALESCE(SUM(CASE WHEN jaar = 2022 THEN bedrag END), 0) AS "2022",
    COALESCE(SUM(CASE WHEN jaar = 2023 THEN bedrag END), 0) AS "2023",
    COALESCE(SUM(CASE WHEN jaar = 2024 THEN bedrag END), 0) AS "2024",
    COALESCE(SUM(bedrag), 0) AS totaal,
    COUNT(*) AS row_count,
    RANDOM() AS random_order
FROM gemeente
GROUP BY normalize_recipient(ontvanger);

CREATE INDEX idx_gemeente_agg_ontvanger ON gemeente_aggregated (ontvanger);
CREATE INDEX idx_gemeente_agg_totaal ON gemeente_aggregated (totaal DESC);
CREATE INDEX idx_gemeente_agg_ontvanger_trgm ON gemeente_aggregated USING gin (ontvanger gin_trgm_ops);
CREATE UNIQUE INDEX idx_gemeente_agg_key ON gemeente_aggregated (ontvanger_key);
CREATE INDEX idx_gemeente_agg_random ON gemeente_aggregated (random_order);

-- =====================================================
-- Step 6: Recreate PUBLIEK with normalization
-- =====================================================

CREATE MATERIALIZED VIEW publiek_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    COALESCE(SUM(CASE WHEN jaar = 2016 THEN bedrag END), 0) AS "2016",
    COALESCE(SUM(CASE WHEN jaar = 2017 THEN bedrag END), 0) AS "2017",
    COALESCE(SUM(CASE WHEN jaar = 2018 THEN bedrag END), 0) AS "2018",
    COALESCE(SUM(CASE WHEN jaar = 2019 THEN bedrag END), 0) AS "2019",
    COALESCE(SUM(CASE WHEN jaar = 2020 THEN bedrag END), 0) AS "2020",
    COALESCE(SUM(CASE WHEN jaar = 2021 THEN bedrag END), 0) AS "2021",
    COALESCE(SUM(CASE WHEN jaar = 2022 THEN bedrag END), 0) AS "2022",
    COALESCE(SUM(CASE WHEN jaar = 2023 THEN bedrag END), 0) AS "2023",
    COALESCE(SUM(CASE WHEN jaar = 2024 THEN bedrag END), 0) AS "2024",
    COALESCE(SUM(bedrag), 0) AS totaal,
    COUNT(*) AS row_count,
    RANDOM() AS random_order
FROM publiek
GROUP BY normalize_recipient(ontvanger);

CREATE INDEX idx_publiek_agg_ontvanger ON publiek_aggregated (ontvanger);
CREATE INDEX idx_publiek_agg_totaal ON publiek_aggregated (totaal DESC);
CREATE INDEX idx_publiek_agg_ontvanger_trgm ON publiek_aggregated USING gin (ontvanger gin_trgm_ops);
CREATE UNIQUE INDEX idx_publiek_agg_key ON publiek_aggregated (ontvanger_key);
CREATE INDEX idx_publiek_agg_random ON publiek_aggregated (random_order);

-- NOTE: Materialized views don't support RLS - they inherit access from the
-- underlying tables. The backend service role has access.

-- =====================================================
-- VERIFICATION QUERIES (run after execution)
-- =====================================================

-- Check row counts (should be LOWER than before due to merging)
-- SELECT 'instrumenten_aggregated' as view, COUNT(*) as rows FROM instrumenten_aggregated
-- UNION ALL SELECT 'inkoop_aggregated', COUNT(*) FROM inkoop_aggregated
-- UNION ALL SELECT 'provincie_aggregated', COUNT(*) FROM provincie_aggregated
-- UNION ALL SELECT 'gemeente_aggregated', COUNT(*) FROM gemeente_aggregated
-- UNION ALL SELECT 'publiek_aggregated', COUNT(*) FROM publiek_aggregated;

-- Verify "Politie" merged and capitalized (should be 1 row starting with "P")
-- SELECT ontvanger, totaal FROM instrumenten_aggregated
-- WHERE UPPER(ontvanger) LIKE '%POLITIE%' AND UPPER(ontvanger) NOT LIKE '%POLITIEK%'
-- ORDER BY totaal DESC;

-- Verify "Politieke beweging DENK" merged (should be 1 row)
-- SELECT ontvanger, totaal FROM instrumenten_aggregated
-- WHERE UPPER(ontvanger) LIKE '%POLITIEKE BEWEGING DENK%'
-- ORDER BY totaal DESC;
