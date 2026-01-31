-- =====================================================
-- Add COUNT(DISTINCT) columns to apparaat_aggregated
-- Description: Enables "+X meer" indicator for extra columns
-- Created: 2026-01-31
-- Executed: 2026-01-31 on Supabase
-- =====================================================
--
-- Adds count columns for: artikel, detail
-- These show how many distinct values exist per kostensoort
-- Used by frontend to display "+X meer" when count > 1
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS apparaat_aggregated CASCADE;

CREATE MATERIALIZED VIEW apparaat_aggregated AS
SELECT
    kostensoort,
    -- Extra column values (most frequent)
    MODE() WITHIN GROUP (ORDER BY artikel) AS artikel,
    MODE() WITHIN GROUP (ORDER BY detail) AS detail,
    -- Extra column counts (for "+X meer" indicator)
    COUNT(DISTINCT artikel) AS artikel_count,
    COUNT(DISTINCT detail) AS detail_count,
    -- Year amounts
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
    -- years_with_data: count how many years have non-zero amounts
    (CASE WHEN SUM(CASE WHEN begrotingsjaar = 2016 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN begrotingsjaar = 2017 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN begrotingsjaar = 2018 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN begrotingsjaar = 2019 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN begrotingsjaar = 2020 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN begrotingsjaar = 2021 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN begrotingsjaar = 2022 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN begrotingsjaar = 2023 THEN bedrag END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN begrotingsjaar = 2024 THEN bedrag END) > 0 THEN 1 ELSE 0 END) AS years_with_data,
    RANDOM() AS random_order
FROM apparaat
GROUP BY kostensoort;

-- Create indexes
CREATE INDEX idx_apparaat_agg_kostensoort ON apparaat_aggregated (kostensoort);
CREATE INDEX idx_apparaat_agg_totaal ON apparaat_aggregated (totaal DESC);
CREATE INDEX idx_apparaat_agg_random ON apparaat_aggregated (random_order);
CREATE INDEX idx_apparaat_agg_years ON apparaat_aggregated (years_with_data);

-- Verify
SELECT 'apparaat_aggregated' AS view_name, COUNT(*) AS rows FROM apparaat_aggregated;

-- Update query planner statistics (CRITICAL for performance)
ANALYZE apparaat_aggregated;
