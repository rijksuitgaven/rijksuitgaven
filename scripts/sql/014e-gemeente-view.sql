-- =====================================================
-- Add default columns to gemeente_aggregated
-- Description: Adds gemeente, omschrijving columns for speed
-- Created: 2026-01-30
-- Executed: [pending]
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS gemeente_aggregated CASCADE;

CREATE MATERIALIZED VIEW gemeente_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    MODE() WITHIN GROUP (ORDER BY gemeente) AS gemeente,
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
    RANDOM() AS random_order
FROM gemeente
GROUP BY normalize_recipient(ontvanger);

CREATE INDEX idx_gemeente_agg_ontvanger ON gemeente_aggregated (ontvanger);
CREATE INDEX idx_gemeente_agg_totaal ON gemeente_aggregated (totaal DESC);
CREATE INDEX idx_gemeente_agg_ontvanger_trgm ON gemeente_aggregated USING gin (ontvanger gin_trgm_ops);
CREATE UNIQUE INDEX idx_gemeente_agg_key ON gemeente_aggregated (ontvanger_key);
CREATE INDEX idx_gemeente_agg_random ON gemeente_aggregated (random_order);

SELECT 'gemeente_aggregated' AS view_name, COUNT(*) AS rows FROM gemeente_aggregated;
