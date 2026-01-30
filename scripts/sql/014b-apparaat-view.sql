-- =====================================================
-- Add default columns to apparaat_aggregated
-- Description: Adds artikel, detail columns for speed
-- Created: 2026-01-30
-- Executed: [pending]
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS apparaat_aggregated CASCADE;

CREATE MATERIALIZED VIEW apparaat_aggregated AS
SELECT
    kostensoort,
    MODE() WITHIN GROUP (ORDER BY artikel) AS artikel,
    MODE() WITHIN GROUP (ORDER BY detail) AS detail,
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

SELECT 'apparaat_aggregated' AS view_name, COUNT(*) AS rows FROM apparaat_aggregated;

-- Update query planner statistics (CRITICAL for performance)
ANALYZE apparaat_aggregated;
