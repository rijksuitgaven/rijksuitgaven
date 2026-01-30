-- =====================================================
-- Add default columns to publiek_aggregated
-- Description: Adds source column for speed
-- Created: 2026-01-30
-- Executed: [pending]
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS publiek_aggregated CASCADE;

CREATE MATERIALIZED VIEW publiek_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    MODE() WITHIN GROUP (ORDER BY source) AS source,
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

SELECT 'publiek_aggregated' AS view_name, COUNT(*) AS rows FROM publiek_aggregated;

-- Update query planner statistics (CRITICAL for performance)
ANALYZE publiek_aggregated;
