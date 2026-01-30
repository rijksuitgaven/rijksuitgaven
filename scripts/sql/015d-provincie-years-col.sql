-- Add years_with_data to provincie_aggregated
DROP MATERIALIZED VIEW IF EXISTS provincie_aggregated CASCADE;

CREATE MATERIALIZED VIEW provincie_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    MODE() WITHIN GROUP (ORDER BY provincie) AS provincie,
    MODE() WITHIN GROUP (ORDER BY omschrijving) AS omschrijving,
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
GROUP BY normalize_recipient(ontvanger);

CREATE INDEX idx_provincie_agg_ontvanger ON provincie_aggregated (ontvanger);
CREATE INDEX idx_provincie_agg_totaal ON provincie_aggregated (totaal DESC);
CREATE INDEX idx_provincie_agg_ontvanger_trgm ON provincie_aggregated USING gin (ontvanger gin_trgm_ops);
CREATE UNIQUE INDEX idx_provincie_agg_key ON provincie_aggregated (ontvanger_key);
CREATE INDEX idx_provincie_agg_random ON provincie_aggregated (random_order);
CREATE INDEX idx_provincie_agg_years ON provincie_aggregated (years_with_data);

ANALYZE provincie_aggregated;
SELECT 'provincie' AS view, COUNT(*) AS rows FROM provincie_aggregated;
