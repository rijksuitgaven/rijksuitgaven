-- =====================================================
-- Add default columns to instrumenten_aggregated
-- Description: Adds artikel, regeling columns for speed
-- Created: 2026-01-30
-- Executed: [pending]
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS instrumenten_aggregated CASCADE;

CREATE MATERIALIZED VIEW instrumenten_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    MODE() WITHIN GROUP (ORDER BY artikel) AS artikel,
    MODE() WITHIN GROUP (ORDER BY regeling) AS regeling,
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

SELECT 'instrumenten_aggregated' AS view_name, COUNT(*) AS rows FROM instrumenten_aggregated;

-- Update query planner statistics (CRITICAL for performance)
ANALYZE instrumenten_aggregated;
