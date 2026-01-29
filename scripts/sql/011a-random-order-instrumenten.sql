-- =====================================================
-- Add random_order to instrumenten_aggregated
-- Run this first, then proceed to next script
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS instrumenten_aggregated CASCADE;

CREATE MATERIALIZED VIEW instrumenten_aggregated AS
SELECT
    ontvanger,
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
GROUP BY ontvanger;

CREATE INDEX idx_instrumenten_agg_ontvanger ON instrumenten_aggregated (ontvanger);
CREATE INDEX idx_instrumenten_agg_totaal ON instrumenten_aggregated (totaal DESC);
CREATE INDEX idx_instrumenten_agg_random ON instrumenten_aggregated (random_order);

ALTER TABLE instrumenten_aggregated ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Backend can read instrumenten_aggregated" ON instrumenten_aggregated FOR SELECT TO postgres USING (true);

SELECT 'instrumenten_aggregated' as view_name, COUNT(*) as rows FROM instrumenten_aggregated;
