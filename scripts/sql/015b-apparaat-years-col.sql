-- Add years_with_data to apparaat_aggregated
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

CREATE INDEX idx_apparaat_agg_kostensoort ON apparaat_aggregated (kostensoort);
CREATE INDEX idx_apparaat_agg_totaal ON apparaat_aggregated (totaal DESC);
CREATE INDEX idx_apparaat_agg_random ON apparaat_aggregated (random_order);
CREATE INDEX idx_apparaat_agg_years ON apparaat_aggregated (years_with_data);

ANALYZE apparaat_aggregated;
SELECT 'apparaat' AS view, COUNT(*) AS rows FROM apparaat_aggregated;
