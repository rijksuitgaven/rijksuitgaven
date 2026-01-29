-- =====================================================
-- Add random_order to universal_search
-- This is the largest view - run last
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
    RANDOM() AS random_order
FROM combined_data
GROUP BY ontvanger_key;

CREATE UNIQUE INDEX idx_universal_search_key ON universal_search(ontvanger_key);
CREATE INDEX idx_universal_search_ontvanger ON universal_search(ontvanger);
CREATE INDEX idx_universal_search_sources ON universal_search(sources);
CREATE INDEX idx_universal_search_totaal ON universal_search(totaal DESC);
CREATE INDEX idx_universal_search_random ON universal_search(random_order);

SELECT 'universal_search' as view_name, COUNT(*) as rows FROM universal_search;
