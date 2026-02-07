-- =====================================================
-- Fix totaal column: only sum years 2016-2024
--
-- BUG: totaal was computed as SUM(bedrag) across ALL years,
-- including out-of-range data (2015, 2025, etc.) that has no
-- visible year column. This made totaal != sum of year columns.
--
-- FIX: Add WHERE jaar BETWEEN 2016 AND 2024 to each view.
-- This fixes totaal, row_count, and extra column counts.
--
-- Affected: provincie (2015 data), gemeente (2010+ data),
--           publiek (1900+ data), apparaat (2014+ data),
--           universal_search (inherits from above)
-- Not affected: instrumenten (2016-2024 only), inkoop (2017-2024 only)
--
-- Run: psql $DATABASE_URL -f 027-fix-totaal-year-range.sql
-- =====================================================

-- =====================================================
-- 1. PROVINCIE
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS provincie_aggregated CASCADE;

CREATE MATERIALIZED VIEW provincie_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    MODE() WITHIN GROUP (ORDER BY provincie) AS provincie,
    MODE() WITHIN GROUP (ORDER BY omschrijving) AS omschrijving,
    COUNT(DISTINCT provincie) AS provincie_count,
    COUNT(DISTINCT omschrijving) AS omschrijving_count,
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
    (CASE WHEN SUM(CASE WHEN jaar = 2016 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2017 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2018 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2019 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2020 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2021 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2022 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2023 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2024 THEN bedrag END) > 0 THEN 1 ELSE 0 END) AS years_with_data,
    RANDOM() AS random_order
FROM provincie
WHERE jaar BETWEEN 2016 AND 2024
GROUP BY normalize_recipient(ontvanger);

CREATE INDEX idx_provincie_agg_ontvanger ON provincie_aggregated (ontvanger);
CREATE INDEX idx_provincie_agg_totaal ON provincie_aggregated (totaal DESC);
CREATE INDEX idx_provincie_agg_ontvanger_trgm ON provincie_aggregated USING gin (ontvanger gin_trgm_ops);
CREATE UNIQUE INDEX idx_provincie_agg_key ON provincie_aggregated (ontvanger_key);
CREATE INDEX idx_provincie_agg_random ON provincie_aggregated (random_order);
CREATE INDEX idx_provincie_agg_years ON provincie_aggregated (years_with_data);
ANALYZE provincie_aggregated;

SELECT 'provincie_aggregated' AS view_name, COUNT(*) AS rows FROM provincie_aggregated;

-- =====================================================
-- 2. GEMEENTE
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS gemeente_aggregated CASCADE;

CREATE MATERIALIZED VIEW gemeente_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    MODE() WITHIN GROUP (ORDER BY gemeente) AS gemeente,
    MODE() WITHIN GROUP (ORDER BY omschrijving) AS omschrijving,
    COUNT(DISTINCT gemeente) AS gemeente_count,
    COUNT(DISTINCT omschrijving) AS omschrijving_count,
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
    (CASE WHEN SUM(CASE WHEN jaar = 2016 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2017 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2018 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2019 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2020 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2021 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2022 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2023 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2024 THEN bedrag END) > 0 THEN 1 ELSE 0 END) AS years_with_data,
    RANDOM() AS random_order
FROM gemeente
WHERE jaar BETWEEN 2016 AND 2024
GROUP BY normalize_recipient(ontvanger);

CREATE INDEX idx_gemeente_agg_ontvanger ON gemeente_aggregated (ontvanger);
CREATE INDEX idx_gemeente_agg_totaal ON gemeente_aggregated (totaal DESC);
CREATE INDEX idx_gemeente_agg_ontvanger_trgm ON gemeente_aggregated USING gin (ontvanger gin_trgm_ops);
CREATE UNIQUE INDEX idx_gemeente_agg_key ON gemeente_aggregated (ontvanger_key);
CREATE INDEX idx_gemeente_agg_random ON gemeente_aggregated (random_order);
CREATE INDEX idx_gemeente_agg_years ON gemeente_aggregated (years_with_data);
ANALYZE gemeente_aggregated;

SELECT 'gemeente_aggregated' AS view_name, COUNT(*) AS rows FROM gemeente_aggregated;

-- =====================================================
-- 3. PUBLIEK
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS publiek_aggregated CASCADE;

CREATE MATERIALIZED VIEW publiek_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    MODE() WITHIN GROUP (ORDER BY source) AS source,
    COUNT(DISTINCT source) AS source_count,
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
    (CASE WHEN SUM(CASE WHEN jaar = 2016 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2017 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2018 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2019 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2020 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2021 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2022 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2023 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2024 THEN bedrag END) > 0 THEN 1 ELSE 0 END) AS years_with_data,
    RANDOM() AS random_order
FROM publiek
WHERE jaar BETWEEN 2016 AND 2024
GROUP BY normalize_recipient(ontvanger);

CREATE INDEX idx_publiek_agg_ontvanger ON publiek_aggregated (ontvanger);
CREATE INDEX idx_publiek_agg_totaal ON publiek_aggregated (totaal DESC);
CREATE INDEX idx_publiek_agg_ontvanger_trgm ON publiek_aggregated USING gin (ontvanger gin_trgm_ops);
CREATE UNIQUE INDEX idx_publiek_agg_key ON publiek_aggregated (ontvanger_key);
CREATE INDEX idx_publiek_agg_random ON publiek_aggregated (random_order);
CREATE INDEX idx_publiek_agg_years ON publiek_aggregated (years_with_data);
ANALYZE publiek_aggregated;

SELECT 'publiek_aggregated' AS view_name, COUNT(*) AS rows FROM publiek_aggregated;

-- =====================================================
-- 4. APPARAAT
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS apparaat_aggregated CASCADE;

CREATE MATERIALIZED VIEW apparaat_aggregated AS
SELECT
    kostensoort,
    MODE() WITHIN GROUP (ORDER BY artikel) AS artikel,
    MODE() WITHIN GROUP (ORDER BY detail) AS detail,
    COUNT(DISTINCT artikel) AS artikel_count,
    COUNT(DISTINCT detail) AS detail_count,
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
    (CASE WHEN SUM(CASE WHEN begrotingsjaar = 2016 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN begrotingsjaar = 2017 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN begrotingsjaar = 2018 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN begrotingsjaar = 2019 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN begrotingsjaar = 2020 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN begrotingsjaar = 2021 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN begrotingsjaar = 2022 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN begrotingsjaar = 2023 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN begrotingsjaar = 2024 THEN bedrag END) > 0 THEN 1 ELSE 0 END) AS years_with_data,
    RANDOM() AS random_order
FROM apparaat
WHERE begrotingsjaar BETWEEN 2016 AND 2024
GROUP BY kostensoort;

CREATE INDEX idx_apparaat_agg_kostensoort ON apparaat_aggregated (kostensoort);
CREATE INDEX idx_apparaat_agg_totaal ON apparaat_aggregated (totaal DESC);
CREATE INDEX idx_apparaat_agg_random ON apparaat_aggregated (random_order);
CREATE INDEX idx_apparaat_agg_years ON apparaat_aggregated (years_with_data);
ANALYZE apparaat_aggregated;

SELECT 'apparaat_aggregated' AS view_name, COUNT(*) AS rows FROM apparaat_aggregated;

-- =====================================================
-- 5. UNIVERSAL_SEARCH (also filter source queries)
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS universal_search CASCADE;

CREATE MATERIALIZED VIEW universal_search AS
WITH combined_data AS (
    SELECT
        UPPER(ontvanger) AS ontvanger_key,
        ontvanger AS ontvanger_display,
        'Financiële instrumenten' AS source,
        begrotingsjaar AS jaar,
        COALESCE(bedrag, 0)::BIGINT * 1000 AS bedrag_euros
    FROM instrumenten
    WHERE ontvanger IS NOT NULL AND ontvanger != ''
      AND begrotingsjaar BETWEEN 2016 AND 2024

    UNION ALL

    SELECT
        UPPER(leverancier) AS ontvanger_key,
        leverancier AS ontvanger_display,
        'Inkoopuitgaven' AS source,
        jaar,
        COALESCE(totaal_avg, 0)::BIGINT AS bedrag_euros
    FROM inkoop
    WHERE leverancier IS NOT NULL AND leverancier != ''
      AND jaar BETWEEN 2016 AND 2024

    UNION ALL

    SELECT
        UPPER(ontvanger) AS ontvanger_key,
        ontvanger AS ontvanger_display,
        'Publiek' AS source,
        jaar,
        COALESCE(bedrag, 0)::BIGINT AS bedrag_euros
    FROM publiek
    WHERE ontvanger IS NOT NULL AND ontvanger != ''
      AND jaar BETWEEN 2016 AND 2024

    UNION ALL

    SELECT
        UPPER(ontvanger) AS ontvanger_key,
        ontvanger AS ontvanger_display,
        'Gemeentelijke subsidieregisters' AS source,
        jaar,
        COALESCE(bedrag, 0)::BIGINT AS bedrag_euros
    FROM gemeente
    WHERE ontvanger IS NOT NULL AND ontvanger != ''
      AND jaar BETWEEN 2016 AND 2024

    UNION ALL

    SELECT
        UPPER(ontvanger) AS ontvanger_key,
        ontvanger AS ontvanger_display,
        'Provinciale subsidieregisters' AS source,
        jaar,
        COALESCE(bedrag, 0)::BIGINT AS bedrag_euros
    FROM provincie
    WHERE ontvanger IS NOT NULL AND ontvanger != ''
      AND jaar BETWEEN 2016 AND 2024
)
SELECT
    ontvanger_key,
    MIN(ontvanger_display) AS ontvanger,
    STRING_AGG(DISTINCT source, ', ' ORDER BY source) AS sources,
    COUNT(DISTINCT source) AS source_count,
    COALESCE(SUM(CASE WHEN jaar = 2016 THEN bedrag_euros END), 0) AS "2016",
    COALESCE(SUM(CASE WHEN jaar = 2017 THEN bedrag_euros END), 0) AS "2017",
    COALESCE(SUM(CASE WHEN jaar = 2018 THEN bedrag_euros END), 0) AS "2018",
    COALESCE(SUM(CASE WHEN jaar = 2019 THEN bedrag_euros END), 0) AS "2019",
    COALESCE(SUM(CASE WHEN jaar = 2020 THEN bedrag_euros END), 0) AS "2020",
    COALESCE(SUM(CASE WHEN jaar = 2021 THEN bedrag_euros END), 0) AS "2021",
    COALESCE(SUM(CASE WHEN jaar = 2022 THEN bedrag_euros END), 0) AS "2022",
    COALESCE(SUM(CASE WHEN jaar = 2023 THEN bedrag_euros END), 0) AS "2023",
    COALESCE(SUM(CASE WHEN jaar = 2024 THEN bedrag_euros END), 0) AS "2024",
    COALESCE(SUM(bedrag_euros), 0) AS totaal,
    (CASE WHEN SUM(CASE WHEN jaar = 2016 THEN bedrag_euros END) <> 0 THEN 1 ELSE 0 END
   + CASE WHEN SUM(CASE WHEN jaar = 2017 THEN bedrag_euros END) <> 0 THEN 1 ELSE 0 END
   + CASE WHEN SUM(CASE WHEN jaar = 2018 THEN bedrag_euros END) <> 0 THEN 1 ELSE 0 END
   + CASE WHEN SUM(CASE WHEN jaar = 2019 THEN bedrag_euros END) <> 0 THEN 1 ELSE 0 END
   + CASE WHEN SUM(CASE WHEN jaar = 2020 THEN bedrag_euros END) <> 0 THEN 1 ELSE 0 END
   + CASE WHEN SUM(CASE WHEN jaar = 2021 THEN bedrag_euros END) <> 0 THEN 1 ELSE 0 END
   + CASE WHEN SUM(CASE WHEN jaar = 2022 THEN bedrag_euros END) <> 0 THEN 1 ELSE 0 END
   + CASE WHEN SUM(CASE WHEN jaar = 2023 THEN bedrag_euros END) <> 0 THEN 1 ELSE 0 END
   + CASE WHEN SUM(CASE WHEN jaar = 2024 THEN bedrag_euros END) <> 0 THEN 1 ELSE 0 END) AS years_with_data,
    RANDOM() AS random_order
FROM combined_data
GROUP BY ontvanger_key;

CREATE UNIQUE INDEX idx_universal_search_key ON universal_search(ontvanger_key);
CREATE INDEX idx_universal_search_ontvanger ON universal_search(ontvanger);
CREATE INDEX idx_universal_search_sources ON universal_search(sources);
CREATE INDEX idx_universal_search_totaal ON universal_search(totaal DESC);
CREATE INDEX idx_universal_search_random ON universal_search(random_order);
CREATE INDEX idx_universal_search_years ON universal_search(years_with_data);
CREATE INDEX idx_universal_search_years_random ON universal_search(years_with_data, random_order);
ANALYZE universal_search;

SELECT 'universal_search' AS view_name, COUNT(*) AS rows FROM universal_search;

-- =====================================================
-- VERIFICATION: totaal should equal sum of year columns
-- =====================================================
SELECT 'provincie' AS module,
    COUNT(*) FILTER (WHERE totaal != "2016"+"2017"+"2018"+"2019"+"2020"+"2021"+"2022"+"2023"+"2024") AS mismatches
FROM provincie_aggregated
UNION ALL
SELECT 'gemeente',
    COUNT(*) FILTER (WHERE totaal != "2016"+"2017"+"2018"+"2019"+"2020"+"2021"+"2022"+"2023"+"2024")
FROM gemeente_aggregated
UNION ALL
SELECT 'publiek',
    COUNT(*) FILTER (WHERE totaal != "2016"+"2017"+"2018"+"2019"+"2020"+"2021"+"2022"+"2023"+"2024")
FROM publiek_aggregated
UNION ALL
SELECT 'apparaat',
    COUNT(*) FILTER (WHERE totaal != "2016"+"2017"+"2018"+"2019"+"2020"+"2021"+"2022"+"2023"+"2024")
FROM apparaat_aggregated
UNION ALL
SELECT 'universal_search',
    COUNT(*) FILTER (WHERE totaal != "2016"+"2017"+"2018"+"2019"+"2020"+"2021"+"2022"+"2023"+"2024")
FROM universal_search;
