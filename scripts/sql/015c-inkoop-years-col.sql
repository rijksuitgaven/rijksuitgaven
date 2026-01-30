-- Add years_with_data to inkoop_aggregated
DROP MATERIALIZED VIEW IF EXISTS inkoop_aggregated CASCADE;

CREATE MATERIALIZED VIEW inkoop_aggregated AS
SELECT
    normalize_recipient(leverancier) AS leverancier_key,
    UPPER(LEFT(MIN(leverancier), 1)) || SUBSTRING(MIN(leverancier) FROM 2) AS leverancier,
    MODE() WITHIN GROUP (ORDER BY categorie) AS categorie,
    MODE() WITHIN GROUP (ORDER BY staffel) AS staffel,
    COALESCE(SUM(CASE WHEN jaar = 2016 THEN totaal_avg END), 0) AS "2016",
    COALESCE(SUM(CASE WHEN jaar = 2017 THEN totaal_avg END), 0) AS "2017",
    COALESCE(SUM(CASE WHEN jaar = 2018 THEN totaal_avg END), 0) AS "2018",
    COALESCE(SUM(CASE WHEN jaar = 2019 THEN totaal_avg END), 0) AS "2019",
    COALESCE(SUM(CASE WHEN jaar = 2020 THEN totaal_avg END), 0) AS "2020",
    COALESCE(SUM(CASE WHEN jaar = 2021 THEN totaal_avg END), 0) AS "2021",
    COALESCE(SUM(CASE WHEN jaar = 2022 THEN totaal_avg END), 0) AS "2022",
    COALESCE(SUM(CASE WHEN jaar = 2023 THEN totaal_avg END), 0) AS "2023",
    COALESCE(SUM(CASE WHEN jaar = 2024 THEN totaal_avg END), 0) AS "2024",
    COALESCE(SUM(totaal_avg), 0) AS totaal,
    COUNT(*) AS row_count,
    (CASE WHEN SUM(CASE WHEN jaar = 2016 THEN totaal_avg END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2017 THEN totaal_avg END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2018 THEN totaal_avg END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2019 THEN totaal_avg END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2020 THEN totaal_avg END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2021 THEN totaal_avg END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2022 THEN totaal_avg END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2023 THEN totaal_avg END) > 0 THEN 1 ELSE 0 END +
     CASE WHEN SUM(CASE WHEN jaar = 2024 THEN totaal_avg END) > 0 THEN 1 ELSE 0 END) AS years_with_data,
    RANDOM() AS random_order
FROM inkoop
GROUP BY normalize_recipient(leverancier);

CREATE INDEX idx_inkoop_agg_leverancier ON inkoop_aggregated (leverancier);
CREATE INDEX idx_inkoop_agg_totaal ON inkoop_aggregated (totaal DESC);
CREATE INDEX idx_inkoop_agg_leverancier_trgm ON inkoop_aggregated USING gin (leverancier gin_trgm_ops);
CREATE UNIQUE INDEX idx_inkoop_agg_key ON inkoop_aggregated (leverancier_key);
CREATE INDEX idx_inkoop_agg_random ON inkoop_aggregated (random_order);
CREATE INDEX idx_inkoop_agg_years ON inkoop_aggregated (years_with_data);

ANALYZE inkoop_aggregated;
SELECT 'inkoop' AS view, COUNT(*) AS rows FROM inkoop_aggregated;
