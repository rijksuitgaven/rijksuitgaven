-- =====================================================
-- Add Default Columns to Materialized Views (UX-005 Speed Fix)
-- Description: Adds default display columns to aggregated views
--              so queries don't need to fall back to source tables
-- Created: 2026-01-30
-- Executed: [pending]
-- =====================================================
--
-- Problem: When users have default columns selected (e.g., Artikel, Regeling
--          for Instrumenten), queries fall back to slow source table aggregation
--          instead of using fast materialized views.
--
-- Solution: Add the default columns to each materialized view using MODE()
--           to get the most frequent value per aggregation group.
--
-- Default columns per module:
-- - Instrumenten: artikel, regeling
-- - Apparaat: artikel, detail
-- - Inkoop: categorie, staffel
-- - Provincie: provincie, omschrijving
-- - Gemeente: gemeente, omschrijving
-- - Publiek: source
--
-- NOTE: This drops and recreates all 6 module views + universal_search.
--       Takes ~1-2 minutes on Supabase.
-- =====================================================

-- =====================================================
-- Step 1: Drop existing views
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS instrumenten_aggregated CASCADE;
DROP MATERIALIZED VIEW IF EXISTS apparaat_aggregated CASCADE;
DROP MATERIALIZED VIEW IF EXISTS inkoop_aggregated CASCADE;
DROP MATERIALIZED VIEW IF EXISTS provincie_aggregated CASCADE;
DROP MATERIALIZED VIEW IF EXISTS gemeente_aggregated CASCADE;
DROP MATERIALIZED VIEW IF EXISTS publiek_aggregated CASCADE;

-- =====================================================
-- Step 2: INSTRUMENTEN - Add artikel, regeling
-- =====================================================

CREATE MATERIALIZED VIEW instrumenten_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    -- Default columns using MODE() for most frequent value
    MODE() WITHIN GROUP (ORDER BY artikel) AS artikel,
    MODE() WITHIN GROUP (ORDER BY regeling) AS regeling,
    -- Year columns
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
-- Step 3: APPARAAT - Add artikel, detail
-- =====================================================

CREATE MATERIALIZED VIEW apparaat_aggregated AS
SELECT
    kostensoort,
    -- Default columns using MODE() for most frequent value
    MODE() WITHIN GROUP (ORDER BY artikel) AS artikel,
    MODE() WITHIN GROUP (ORDER BY detail) AS detail,
    -- Year columns
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
FROM apparaat
GROUP BY kostensoort;

CREATE INDEX idx_apparaat_agg_kostensoort ON apparaat_aggregated (kostensoort);
CREATE INDEX idx_apparaat_agg_totaal ON apparaat_aggregated (totaal DESC);
CREATE INDEX idx_apparaat_agg_random ON apparaat_aggregated (random_order);

-- =====================================================
-- Step 4: INKOOP - Add categorie, staffel
-- =====================================================

CREATE MATERIALIZED VIEW inkoop_aggregated AS
SELECT
    normalize_recipient(leverancier) AS leverancier_key,
    UPPER(LEFT(MIN(leverancier), 1)) || SUBSTRING(MIN(leverancier) FROM 2) AS leverancier,
    -- Default columns using MODE() for most frequent value
    MODE() WITHIN GROUP (ORDER BY categorie) AS categorie,
    MODE() WITHIN GROUP (ORDER BY staffel) AS staffel,
    -- Year columns
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
-- Step 5: PROVINCIE - Add provincie, omschrijving
-- =====================================================

CREATE MATERIALIZED VIEW provincie_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    -- Default columns using MODE() for most frequent value
    MODE() WITHIN GROUP (ORDER BY provincie) AS provincie,
    MODE() WITHIN GROUP (ORDER BY omschrijving) AS omschrijving,
    -- Year columns
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
-- Step 6: GEMEENTE - Add gemeente, omschrijving
-- =====================================================

CREATE MATERIALIZED VIEW gemeente_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    -- Default columns using MODE() for most frequent value
    MODE() WITHIN GROUP (ORDER BY gemeente) AS gemeente,
    MODE() WITHIN GROUP (ORDER BY omschrijving) AS omschrijving,
    -- Year columns
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
-- Step 7: PUBLIEK - Add source
-- =====================================================

CREATE MATERIALIZED VIEW publiek_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    -- Default column using MODE() for most frequent value
    MODE() WITHIN GROUP (ORDER BY source) AS source,
    -- Year columns
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

-- =====================================================
-- Step 8: Verify row counts
-- =====================================================

SELECT 'instrumenten_aggregated' as view_name, COUNT(*) as rows FROM instrumenten_aggregated
UNION ALL SELECT 'apparaat_aggregated', COUNT(*) FROM apparaat_aggregated
UNION ALL SELECT 'inkoop_aggregated', COUNT(*) FROM inkoop_aggregated
UNION ALL SELECT 'provincie_aggregated', COUNT(*) FROM provincie_aggregated
UNION ALL SELECT 'gemeente_aggregated', COUNT(*) FROM gemeente_aggregated
UNION ALL SELECT 'publiek_aggregated', COUNT(*) FROM publiek_aggregated;

-- =====================================================
-- Step 9: Sample data verification (check columns exist)
-- =====================================================

SELECT 'instrumenten' AS module, ontvanger, artikel, regeling, totaal
FROM instrumenten_aggregated
ORDER BY totaal DESC LIMIT 3;

SELECT 'apparaat' AS module, kostensoort, artikel, detail, totaal
FROM apparaat_aggregated
ORDER BY totaal DESC LIMIT 3;

SELECT 'inkoop' AS module, leverancier, categorie, staffel, totaal
FROM inkoop_aggregated
ORDER BY totaal DESC LIMIT 3;

SELECT 'provincie' AS module, ontvanger, provincie, omschrijving, totaal
FROM provincie_aggregated
ORDER BY totaal DESC LIMIT 3;

SELECT 'gemeente' AS module, ontvanger, gemeente, omschrijving, totaal
FROM gemeente_aggregated
ORDER BY totaal DESC LIMIT 3;

SELECT 'publiek' AS module, ontvanger, source, totaal
FROM publiek_aggregated
ORDER BY totaal DESC LIMIT 3;
