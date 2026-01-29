-- =====================================================
-- Add random_order Column to All Materialized Views
-- Description: Enables fast random sorting for default view (UX-002)
-- Created: 2026-01-29
--
-- WHY: ORDER BY RANDOM() is slow (3+ seconds on large tables)
--      Pre-computed random values with index = fast (~50ms)
--
-- WHEN TO RUN:
--   1. One-time migration (now)
--   2. After any data import (via refresh-all-views.sql)
--
-- EFFECT: Random values regenerate on each refresh, giving
--         users a fresh random selection after data updates.
-- =====================================================

-- =====================================================
-- 1. INSTRUMENTEN
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS instrumenten_aggregated CASCADE;

CREATE MATERIALIZED VIEW instrumenten_aggregated AS
SELECT
    ontvanger,
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
    RANDOM() AS random_order  -- For fast random sorting
FROM instrumenten
GROUP BY ontvanger;

CREATE INDEX idx_instrumenten_agg_ontvanger ON instrumenten_aggregated (ontvanger);
CREATE INDEX idx_instrumenten_agg_totaal ON instrumenten_aggregated (totaal DESC);
CREATE INDEX idx_instrumenten_agg_random ON instrumenten_aggregated (random_order);

-- =====================================================
-- 2. APPARAAT
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS apparaat_aggregated CASCADE;

CREATE MATERIALIZED VIEW apparaat_aggregated AS
SELECT
    kostensoort,
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
-- 3. INKOOP
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS inkoop_aggregated CASCADE;

CREATE MATERIALIZED VIEW inkoop_aggregated AS
SELECT
    leverancier,
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
GROUP BY leverancier;

CREATE INDEX idx_inkoop_agg_leverancier ON inkoop_aggregated (leverancier);
CREATE INDEX idx_inkoop_agg_totaal ON inkoop_aggregated (totaal DESC);
CREATE INDEX idx_inkoop_agg_random ON inkoop_aggregated (random_order);

-- =====================================================
-- 4. PROVINCIE
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS provincie_aggregated CASCADE;

CREATE MATERIALIZED VIEW provincie_aggregated AS
SELECT
    ontvanger,
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
GROUP BY ontvanger;

CREATE INDEX idx_provincie_agg_ontvanger ON provincie_aggregated (ontvanger);
CREATE INDEX idx_provincie_agg_totaal ON provincie_aggregated (totaal DESC);
CREATE INDEX idx_provincie_agg_random ON provincie_aggregated (random_order);

-- =====================================================
-- 5. GEMEENTE
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS gemeente_aggregated CASCADE;

CREATE MATERIALIZED VIEW gemeente_aggregated AS
SELECT
    ontvanger,
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
GROUP BY ontvanger;

CREATE INDEX idx_gemeente_agg_ontvanger ON gemeente_aggregated (ontvanger);
CREATE INDEX idx_gemeente_agg_totaal ON gemeente_aggregated (totaal DESC);
CREATE INDEX idx_gemeente_agg_random ON gemeente_aggregated (random_order);

-- =====================================================
-- 6. PUBLIEK
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS publiek_aggregated CASCADE;

CREATE MATERIALIZED VIEW publiek_aggregated AS
SELECT
    ontvanger,
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
GROUP BY ontvanger;

CREATE INDEX idx_publiek_agg_ontvanger ON publiek_aggregated (ontvanger);
CREATE INDEX idx_publiek_agg_totaal ON publiek_aggregated (totaal DESC);
CREATE INDEX idx_publiek_agg_random ON publiek_aggregated (random_order);

-- =====================================================
-- 7. UNIVERSAL_SEARCH (Integraal)
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

    UNION ALL

    SELECT
        UPPER(leverancier) AS ontvanger_key,
        leverancier AS ontvanger_display,
        'Inkoopuitgaven' AS source,
        jaar,
        COALESCE(totaal_avg, 0)::BIGINT AS bedrag_euros
    FROM inkoop
    WHERE leverancier IS NOT NULL AND leverancier != ''

    UNION ALL

    SELECT
        UPPER(ontvanger) AS ontvanger_key,
        ontvanger AS ontvanger_display,
        'Publiek' AS source,
        jaar,
        COALESCE(bedrag, 0)::BIGINT AS bedrag_euros
    FROM publiek
    WHERE ontvanger IS NOT NULL AND ontvanger != ''

    UNION ALL

    SELECT
        UPPER(ontvanger) AS ontvanger_key,
        ontvanger AS ontvanger_display,
        'Gemeentelijke subsidieregisters' AS source,
        jaar,
        COALESCE(bedrag, 0)::BIGINT AS bedrag_euros
    FROM gemeente
    WHERE ontvanger IS NOT NULL AND ontvanger != ''

    UNION ALL

    SELECT
        UPPER(ontvanger) AS ontvanger_key,
        ontvanger AS ontvanger_display,
        'Provinciale subsidieregisters' AS source,
        jaar,
        COALESCE(bedrag, 0)::BIGINT AS bedrag_euros
    FROM provincie
    WHERE ontvanger IS NOT NULL AND ontvanger != ''
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
    COALESCE(SUM(CASE WHEN jaar = 2025 THEN bedrag_euros END), 0) AS "2025",
    COALESCE(SUM(bedrag_euros), 0) AS totaal,
    RANDOM() AS random_order  -- For fast random sorting
FROM combined_data
GROUP BY ontvanger_key;

CREATE UNIQUE INDEX idx_universal_search_key ON universal_search(ontvanger_key);
CREATE INDEX idx_universal_search_ontvanger ON universal_search(ontvanger);
CREATE INDEX idx_universal_search_sources ON universal_search(sources);
CREATE INDEX idx_universal_search_totaal ON universal_search(totaal DESC);
CREATE INDEX idx_universal_search_random ON universal_search(random_order);

-- =====================================================
-- RLS POLICIES (re-apply after recreation)
-- =====================================================
ALTER TABLE instrumenten_aggregated ENABLE ROW LEVEL SECURITY;
ALTER TABLE apparaat_aggregated ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkoop_aggregated ENABLE ROW LEVEL SECURITY;
ALTER TABLE provincie_aggregated ENABLE ROW LEVEL SECURITY;
ALTER TABLE gemeente_aggregated ENABLE ROW LEVEL SECURITY;
ALTER TABLE publiek_aggregated ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Backend can read instrumenten_aggregated" ON instrumenten_aggregated FOR SELECT TO postgres USING (true);
CREATE POLICY "Backend can read apparaat_aggregated" ON apparaat_aggregated FOR SELECT TO postgres USING (true);
CREATE POLICY "Backend can read inkoop_aggregated" ON inkoop_aggregated FOR SELECT TO postgres USING (true);
CREATE POLICY "Backend can read provincie_aggregated" ON provincie_aggregated FOR SELECT TO postgres USING (true);
CREATE POLICY "Backend can read gemeente_aggregated" ON gemeente_aggregated FOR SELECT TO postgres USING (true);
CREATE POLICY "Backend can read publiek_aggregated" ON publiek_aggregated FOR SELECT TO postgres USING (true);

-- =====================================================
-- VERIFY
-- =====================================================
SELECT 'instrumenten_aggregated' as view_name, COUNT(*) as rows FROM instrumenten_aggregated
UNION ALL SELECT 'apparaat_aggregated', COUNT(*) FROM apparaat_aggregated
UNION ALL SELECT 'inkoop_aggregated', COUNT(*) FROM inkoop_aggregated
UNION ALL SELECT 'provincie_aggregated', COUNT(*) FROM provincie_aggregated
UNION ALL SELECT 'gemeente_aggregated', COUNT(*) FROM gemeente_aggregated
UNION ALL SELECT 'publiek_aggregated', COUNT(*) FROM publiek_aggregated
UNION ALL SELECT 'universal_search', COUNT(*) FROM universal_search
ORDER BY view_name;

-- Test random_order exists
SELECT ontvanger, random_order FROM instrumenten_aggregated LIMIT 3;
