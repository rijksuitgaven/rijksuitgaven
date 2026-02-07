-- Add years_with_data column to universal_search materialized view
-- This replaces the expensive computed CASE expression (9 checks × 465K rows)
-- with a simple indexed column lookup, matching other aggregated views.
--
-- Run: psql $DATABASE_URL -f 026-universal-search-add-years-with-data.sql

DROP MATERIALIZED VIEW IF EXISTS universal_search CASCADE;

CREATE MATERIALIZED VIEW universal_search AS

WITH combined_data AS (
    -- FINANCIËLE INSTRUMENTEN (bedrag in thousands ×1000)
    SELECT
        UPPER(ontvanger) AS ontvanger_key,
        ontvanger AS ontvanger_display,
        'Financiële instrumenten' AS source,
        begrotingsjaar AS jaar,
        COALESCE(bedrag, 0)::BIGINT * 1000 AS bedrag_euros
    FROM instrumenten
    WHERE ontvanger IS NOT NULL AND ontvanger != ''

    UNION ALL

    -- INKOOPUITGAVEN (totaal_avg in absolute euros)
    SELECT
        UPPER(leverancier) AS ontvanger_key,
        leverancier AS ontvanger_display,
        'Inkoopuitgaven' AS source,
        jaar,
        COALESCE(totaal_avg, 0)::BIGINT AS bedrag_euros
    FROM inkoop
    WHERE leverancier IS NOT NULL AND leverancier != ''

    UNION ALL

    -- PUBLIEK (bedrag in absolute euros)
    SELECT
        UPPER(ontvanger) AS ontvanger_key,
        ontvanger AS ontvanger_display,
        'Publiek' AS source,
        jaar,
        COALESCE(bedrag, 0)::BIGINT AS bedrag_euros
    FROM publiek
    WHERE ontvanger IS NOT NULL AND ontvanger != ''

    UNION ALL

    -- GEMEENTELIJKE SUBSIDIEREGISTERS (bedrag in absolute euros)
    SELECT
        UPPER(ontvanger) AS ontvanger_key,
        ontvanger AS ontvanger_display,
        'Gemeentelijke subsidieregisters' AS source,
        jaar,
        COALESCE(bedrag, 0)::BIGINT AS bedrag_euros
    FROM gemeente
    WHERE ontvanger IS NOT NULL AND ontvanger != ''

    UNION ALL

    -- PROVINCIALE SUBSIDIEREGISTERS (bedrag in absolute euros)
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
    -- Pre-computed columns for fast filtering/sorting
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

-- Indexes
CREATE UNIQUE INDEX idx_universal_search_key ON universal_search(ontvanger_key);
CREATE INDEX idx_universal_search_ontvanger ON universal_search(ontvanger);
CREATE INDEX idx_universal_search_sources ON universal_search(sources);
CREATE INDEX idx_universal_search_totaal ON universal_search(totaal DESC);
CREATE INDEX idx_universal_search_random ON universal_search(random_order);
CREATE INDEX idx_universal_search_years ON universal_search(years_with_data);

-- Composite index for the default view query: years_with_data + random_order
CREATE INDEX idx_universal_search_years_random ON universal_search(years_with_data, random_order);

ANALYZE universal_search;

-- Verify
SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE years_with_data >= 4) AS with_4plus_years FROM universal_search;
