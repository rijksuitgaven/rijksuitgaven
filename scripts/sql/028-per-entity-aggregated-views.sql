-- =====================================================
-- Per-entity aggregated views for accurate filtering
--
-- PROBLEM: Entity-level modules (provincie, gemeente, publiek) used
-- MODE() to assign each recipient to ONE entity. This loses data:
--   - Recipient in both Drenthe and Utrecht → assigned to MODE() province
--   - Filtering by Drenthe misses this recipient's Drenthe amounts
--   - ~120 recipients affected in provincie alone (~1% data loss)
--
-- SOLUTION: GROUP BY (recipient, entity) instead of just recipient.
-- Each recipient appears once PER entity they receive money from.
-- Filtering by entity on the materialized view is now exact AND fast.
--
-- Default view (no filter) aggregates on-the-fly via backend GROUP BY.
-- Filtered view (e.g., ?provincie=Drenthe) queries view directly.
-- Both paths use the materialized view - no source table fallback.
--
-- Run: psql $DATABASE_URL -f 028-per-entity-aggregated-views.sql
-- =====================================================

-- =====================================================
-- 1. PROVINCIE
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS provincie_aggregated CASCADE;

CREATE MATERIALIZED VIEW provincie_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    -- Entity field: real column (not MODE), part of GROUP BY
    provincie,
    -- Secondary extra column: MODE within this (recipient, entity) group
    MODE() WITHIN GROUP (ORDER BY omschrijving) AS omschrijving,
    COUNT(DISTINCT omschrijving) AS omschrijving_count,
    -- Year amounts (per entity)
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
GROUP BY normalize_recipient(ontvanger), provincie;

-- Indexes
CREATE UNIQUE INDEX idx_provincie_agg_key_entity ON provincie_aggregated (ontvanger_key, provincie);
CREATE INDEX idx_provincie_agg_ontvanger ON provincie_aggregated (ontvanger);
CREATE INDEX idx_provincie_agg_entity ON provincie_aggregated (provincie);
CREATE INDEX idx_provincie_agg_totaal ON provincie_aggregated (totaal DESC);
CREATE INDEX idx_provincie_agg_ontvanger_trgm ON provincie_aggregated USING gin (ontvanger gin_trgm_ops);
CREATE INDEX idx_provincie_agg_random ON provincie_aggregated (random_order);
CREATE INDEX idx_provincie_agg_years ON provincie_aggregated (years_with_data);
-- Fast entity-filtered sorting
CREATE INDEX idx_provincie_agg_entity_totaal ON provincie_aggregated (provincie, totaal DESC);
ANALYZE provincie_aggregated;

SELECT 'provincie_aggregated' AS view_name,
    COUNT(*) AS total_rows,
    COUNT(DISTINCT ontvanger_key) AS unique_recipients
FROM provincie_aggregated;

-- =====================================================
-- 2. GEMEENTE
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS gemeente_aggregated CASCADE;

CREATE MATERIALIZED VIEW gemeente_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    -- Entity field: real column, part of GROUP BY
    gemeente,
    -- Secondary extra column
    MODE() WITHIN GROUP (ORDER BY omschrijving) AS omschrijving,
    COUNT(DISTINCT omschrijving) AS omschrijving_count,
    -- Year amounts (per entity)
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
GROUP BY normalize_recipient(ontvanger), gemeente;

-- Indexes
CREATE UNIQUE INDEX idx_gemeente_agg_key_entity ON gemeente_aggregated (ontvanger_key, gemeente);
CREATE INDEX idx_gemeente_agg_ontvanger ON gemeente_aggregated (ontvanger);
CREATE INDEX idx_gemeente_agg_entity ON gemeente_aggregated (gemeente);
CREATE INDEX idx_gemeente_agg_totaal ON gemeente_aggregated (totaal DESC);
CREATE INDEX idx_gemeente_agg_ontvanger_trgm ON gemeente_aggregated USING gin (ontvanger gin_trgm_ops);
CREATE INDEX idx_gemeente_agg_random ON gemeente_aggregated (random_order);
CREATE INDEX idx_gemeente_agg_years ON gemeente_aggregated (years_with_data);
-- Fast entity-filtered sorting
CREATE INDEX idx_gemeente_agg_entity_totaal ON gemeente_aggregated (gemeente, totaal DESC);
ANALYZE gemeente_aggregated;

SELECT 'gemeente_aggregated' AS view_name,
    COUNT(*) AS total_rows,
    COUNT(DISTINCT ontvanger_key) AS unique_recipients
FROM gemeente_aggregated;

-- =====================================================
-- 3. PUBLIEK
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS publiek_aggregated CASCADE;

CREATE MATERIALIZED VIEW publiek_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    -- Entity field: real column, part of GROUP BY
    source,
    -- Year amounts (per entity)
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
GROUP BY normalize_recipient(ontvanger), source;

-- Indexes
CREATE UNIQUE INDEX idx_publiek_agg_key_entity ON publiek_aggregated (ontvanger_key, source);
CREATE INDEX idx_publiek_agg_ontvanger ON publiek_aggregated (ontvanger);
CREATE INDEX idx_publiek_agg_entity ON publiek_aggregated (source);
CREATE INDEX idx_publiek_agg_totaal ON publiek_aggregated (totaal DESC);
CREATE INDEX idx_publiek_agg_ontvanger_trgm ON publiek_aggregated USING gin (ontvanger gin_trgm_ops);
CREATE INDEX idx_publiek_agg_random ON publiek_aggregated (random_order);
CREATE INDEX idx_publiek_agg_years ON publiek_aggregated (years_with_data);
-- Fast entity-filtered sorting
CREATE INDEX idx_publiek_agg_entity_totaal ON publiek_aggregated (source, totaal DESC);
ANALYZE publiek_aggregated;

SELECT 'publiek_aggregated' AS view_name,
    COUNT(*) AS total_rows,
    COUNT(DISTINCT ontvanger_key) AS unique_recipients
FROM publiek_aggregated;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- 1. Totaal integrity: totaal must equal sum of year columns
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
FROM publiek_aggregated;

-- 2. Data accuracy: aggregated view total must equal source table total
-- (This is the core validation - proves no data is lost)
SELECT 'provincie' AS module,
    (SELECT SUM(totaal) FROM provincie_aggregated) AS view_total,
    (SELECT SUM(bedrag) FROM provincie WHERE jaar BETWEEN 2016 AND 2024) AS source_total,
    (SELECT SUM(totaal) FROM provincie_aggregated) -
    (SELECT SUM(bedrag) FROM provincie WHERE jaar BETWEEN 2016 AND 2024) AS difference
UNION ALL
SELECT 'gemeente',
    (SELECT SUM(totaal) FROM gemeente_aggregated),
    (SELECT SUM(bedrag) FROM gemeente WHERE jaar BETWEEN 2016 AND 2024),
    (SELECT SUM(totaal) FROM gemeente_aggregated) -
    (SELECT SUM(bedrag) FROM gemeente WHERE jaar BETWEEN 2016 AND 2024)
UNION ALL
SELECT 'publiek',
    (SELECT SUM(totaal) FROM publiek_aggregated),
    (SELECT SUM(bedrag) FROM publiek WHERE jaar BETWEEN 2016 AND 2024),
    (SELECT SUM(totaal) FROM publiek_aggregated) -
    (SELECT SUM(bedrag) FROM publiek WHERE jaar BETWEEN 2016 AND 2024);

-- 3. Entity accuracy: Drenthe-filtered view total must equal source Drenthe total
SELECT
    'Drenthe accuracy test' AS test,
    (SELECT SUM(totaal) FROM provincie_aggregated WHERE provincie = 'Drenthe') AS view_drenthe,
    (SELECT SUM(bedrag) FROM provincie WHERE provincie = 'Drenthe' AND jaar BETWEEN 2016 AND 2024) AS source_drenthe,
    (SELECT SUM(totaal) FROM provincie_aggregated WHERE provincie = 'Drenthe') -
    (SELECT SUM(bedrag) FROM provincie WHERE provincie = 'Drenthe' AND jaar BETWEEN 2016 AND 2024) AS difference;
