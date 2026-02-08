-- 029: Add record_count column to universal_search
-- Counts total individual payment records per recipient across all modules.
-- Used for "Betalingen per ontvanger" filter in integraal view (UX-022).
--
-- Must DROP + recreate since materialized views don't support ALTER ADD COLUMN.

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
    COUNT(*) AS record_count,
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

-- Recreate all existing indexes + new record_count index
CREATE UNIQUE INDEX idx_universal_search_key ON universal_search(ontvanger_key);
CREATE INDEX idx_universal_search_ontvanger ON universal_search(ontvanger);
CREATE INDEX idx_universal_search_sources ON universal_search(sources);
CREATE INDEX idx_universal_search_totaal ON universal_search(totaal DESC);
CREATE INDEX idx_universal_search_random ON universal_search(random_order);
CREATE INDEX idx_universal_search_years ON universal_search(years_with_data);
CREATE INDEX idx_universal_search_years_random ON universal_search(years_with_data, random_order);
CREATE INDEX idx_universal_search_record_count ON universal_search(record_count);
ANALYZE universal_search;

SELECT 'universal_search' AS view_name, COUNT(*) AS rows FROM universal_search;

-- Verify record_count distribution
SELECT
    CASE
        WHEN record_count = 1 THEN '1'
        WHEN record_count BETWEEN 2 AND 10 THEN '2-10'
        WHEN record_count BETWEEN 11 AND 50 THEN '11-50'
        ELSE '50+'
    END AS bracket,
    COUNT(*) AS recipients
FROM universal_search
GROUP BY 1
ORDER BY MIN(record_count);
