-- =====================================================
-- Add random_order to inkoop_aggregated
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS inkoop_aggregated CASCADE;

CREATE MATERIALIZED VIEW inkoop_aggregated AS
SELECT
    leverancier,
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
    RANDOM() AS random_order
FROM inkoop
GROUP BY leverancier;

CREATE INDEX idx_inkoop_agg_leverancier ON inkoop_aggregated (leverancier);
CREATE INDEX idx_inkoop_agg_totaal ON inkoop_aggregated (totaal DESC);
CREATE INDEX idx_inkoop_agg_random ON inkoop_aggregated (random_order);

ALTER TABLE inkoop_aggregated ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Backend can read inkoop_aggregated" ON inkoop_aggregated FOR SELECT TO postgres USING (true);

SELECT 'inkoop_aggregated' as view_name, COUNT(*) as rows FROM inkoop_aggregated;
