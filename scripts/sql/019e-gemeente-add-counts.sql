-- =====================================================
-- Add COUNT(DISTINCT) columns to gemeente_aggregated
-- Description: Enables "+X meer" indicator for extra columns
-- Created: 2026-01-31
-- Executed: 2026-01-31 on Supabase
-- =====================================================
--
-- Adds count columns for: gemeente, omschrijving
-- These show how many distinct values exist per ontvanger
-- Used by frontend to display "+X meer" when count > 1
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS gemeente_aggregated CASCADE;

CREATE MATERIALIZED VIEW gemeente_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    -- Extra column values (most frequent)
    MODE() WITHIN GROUP (ORDER BY gemeente) AS gemeente,
    MODE() WITHIN GROUP (ORDER BY omschrijving) AS omschrijving,
    -- Extra column counts (for "+X meer" indicator)
    COUNT(DISTINCT gemeente) AS gemeente_count,
    COUNT(DISTINCT omschrijving) AS omschrijving_count,
    -- Year amounts
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
    -- years_with_data: count how many years have non-zero amounts
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
FROM gemeente
GROUP BY normalize_recipient(ontvanger);

-- Create indexes
CREATE INDEX idx_gemeente_agg_ontvanger ON gemeente_aggregated (ontvanger);
CREATE INDEX idx_gemeente_agg_totaal ON gemeente_aggregated (totaal DESC);
CREATE INDEX idx_gemeente_agg_ontvanger_trgm ON gemeente_aggregated USING gin (ontvanger gin_trgm_ops);
CREATE UNIQUE INDEX idx_gemeente_agg_key ON gemeente_aggregated (ontvanger_key);
CREATE INDEX idx_gemeente_agg_random ON gemeente_aggregated (random_order);
CREATE INDEX idx_gemeente_agg_years ON gemeente_aggregated (years_with_data);

-- Verify
SELECT 'gemeente_aggregated' AS view_name, COUNT(*) AS rows FROM gemeente_aggregated;

-- Update query planner statistics (CRITICAL for performance)
ANALYZE gemeente_aggregated;
