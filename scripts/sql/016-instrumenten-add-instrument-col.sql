-- =====================================================
-- Description: Add instrument column to instrumenten_aggregated
-- Created: 2026-01-30
-- Executed: [pending]
-- Purpose: Allow fast queries with instrument column selection
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS instrumenten_aggregated CASCADE;

CREATE MATERIALIZED VIEW instrumenten_aggregated AS
SELECT
    normalize_recipient(ontvanger) AS ontvanger_key,
    UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
    MODE() WITHIN GROUP (ORDER BY artikel) AS artikel,
    MODE() WITHIN GROUP (ORDER BY regeling) AS regeling,
    MODE() WITHIN GROUP (ORDER BY instrument) AS instrument,
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
FROM instrumenten
GROUP BY normalize_recipient(ontvanger);

CREATE INDEX idx_instrumenten_agg_ontvanger ON instrumenten_aggregated (ontvanger);
CREATE INDEX idx_instrumenten_agg_totaal ON instrumenten_aggregated (totaal DESC);
CREATE INDEX idx_instrumenten_agg_ontvanger_trgm ON instrumenten_aggregated USING gin (ontvanger gin_trgm_ops);
CREATE UNIQUE INDEX idx_instrumenten_agg_key ON instrumenten_aggregated (ontvanger_key);
CREATE INDEX idx_instrumenten_agg_random ON instrumenten_aggregated (random_order);
CREATE INDEX idx_instrumenten_agg_years ON instrumenten_aggregated (years_with_data);

ANALYZE instrumenten_aggregated;
SELECT 'instrumenten' AS view, COUNT(*) AS rows FROM instrumenten_aggregated;
