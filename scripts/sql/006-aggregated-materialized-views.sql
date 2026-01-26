-- =====================================================
-- Aggregated Materialized Views for Fast Queries
-- Description: Pre-computed aggregations per module
-- Created: 2026-01-26
-- Execute: Run each CREATE statement separately in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. INSTRUMENTEN (ontvanger, bedrag * 1000)
-- =====================================================

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
    COUNT(*) AS row_count
FROM instrumenten
GROUP BY ontvanger;

CREATE INDEX idx_instrumenten_agg_ontvanger ON instrumenten_aggregated (ontvanger);
CREATE INDEX idx_instrumenten_agg_totaal ON instrumenten_aggregated (totaal DESC);

-- =====================================================
-- 2. APPARAAT (kostensoort, bedrag * 1000)
-- =====================================================

CREATE MATERIALIZED VIEW apparaat_aggregated AS
SELECT
    kostensoort,
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
    COUNT(*) AS row_count
FROM apparaat
GROUP BY kostensoort;

CREATE INDEX idx_apparaat_agg_kostensoort ON apparaat_aggregated (kostensoort);
CREATE INDEX idx_apparaat_agg_totaal ON apparaat_aggregated (totaal DESC);

-- =====================================================
-- 3. INKOOP (leverancier, totaal_avg - already absolute euros)
-- =====================================================

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
    COUNT(*) AS row_count
FROM inkoop
GROUP BY leverancier;

CREATE INDEX idx_inkoop_agg_leverancier ON inkoop_aggregated (leverancier);
CREATE INDEX idx_inkoop_agg_totaal ON inkoop_aggregated (totaal DESC);

-- =====================================================
-- 4. PROVINCIE (ontvanger, bedrag - already absolute euros)
-- =====================================================

CREATE MATERIALIZED VIEW provincie_aggregated AS
SELECT
    ontvanger,
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
    COUNT(*) AS row_count
FROM provincie
GROUP BY ontvanger;

CREATE INDEX idx_provincie_agg_ontvanger ON provincie_aggregated (ontvanger);
CREATE INDEX idx_provincie_agg_totaal ON provincie_aggregated (totaal DESC);

-- =====================================================
-- 5. GEMEENTE (ontvanger, bedrag - already absolute euros)
-- =====================================================

CREATE MATERIALIZED VIEW gemeente_aggregated AS
SELECT
    ontvanger,
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
    COUNT(*) AS row_count
FROM gemeente
GROUP BY ontvanger;

CREATE INDEX idx_gemeente_agg_ontvanger ON gemeente_aggregated (ontvanger);
CREATE INDEX idx_gemeente_agg_totaal ON gemeente_aggregated (totaal DESC);

-- =====================================================
-- 6. PUBLIEK (ontvanger, bedrag - already absolute euros)
-- =====================================================

CREATE MATERIALIZED VIEW publiek_aggregated AS
SELECT
    ontvanger,
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
    COUNT(*) AS row_count
FROM publiek
GROUP BY ontvanger;

CREATE INDEX idx_publiek_agg_ontvanger ON publiek_aggregated (ontvanger);
CREATE INDEX idx_publiek_agg_totaal ON publiek_aggregated (totaal DESC);

-- =====================================================
-- RLS POLICIES (allow backend to read)
-- =====================================================

ALTER TABLE instrumenten_aggregated ENABLE ROW LEVEL SECURITY;
ALTER TABLE apparaat_aggregated ENABLE ROW LEVEL SECURITY;
ALTER TABLE inkoop_aggregated ENABLE ROW LEVEL SECURITY;
ALTER TABLE provincie_aggregated ENABLE ROW LEVEL SECURITY;
ALTER TABLE gemeente_aggregated ENABLE ROW LEVEL SECURITY;
ALTER TABLE publiek_aggregated ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Backend can read instrumenten_aggregated" ON instrumenten_aggregated FOR SELECT TO postgres USING (true);
CREATE POLICY "Backend can read apparaat_aggregated" ON apparaat_aggregated FOR SELECT TO postgres USING (true);
CREATE POLICY "Backend can read inkoop_aggregated" ON inkoop_aggregated FOR SELECT TO postgres USING (true);
CREATE POLICY "Backend can read provincie_aggregated" ON provincie_aggregated FOR SELECT TO postgres USING (true);
CREATE POLICY "Backend can read gemeente_aggregated" ON gemeente_aggregated FOR SELECT TO postgres USING (true);
CREATE POLICY "Backend can read publiek_aggregated" ON publiek_aggregated FOR SELECT TO postgres USING (true);

-- =====================================================
-- REFRESH COMMANDS (run after data updates)
-- =====================================================
-- REFRESH MATERIALIZED VIEW instrumenten_aggregated;
-- REFRESH MATERIALIZED VIEW apparaat_aggregated;
-- REFRESH MATERIALIZED VIEW inkoop_aggregated;
-- REFRESH MATERIALIZED VIEW provincie_aggregated;
-- REFRESH MATERIALIZED VIEW gemeente_aggregated;
-- REFRESH MATERIALIZED VIEW publiek_aggregated;

-- =====================================================
-- VERIFY (check row counts)
-- =====================================================
-- SELECT 'instrumenten_aggregated' as view, COUNT(*) as rows FROM instrumenten_aggregated
-- UNION ALL SELECT 'apparaat_aggregated', COUNT(*) FROM apparaat_aggregated
-- UNION ALL SELECT 'inkoop_aggregated', COUNT(*) FROM inkoop_aggregated
-- UNION ALL SELECT 'provincie_aggregated', COUNT(*) FROM provincie_aggregated
-- UNION ALL SELECT 'gemeente_aggregated', COUNT(*) FROM gemeente_aggregated
-- UNION ALL SELECT 'publiek_aggregated', COUNT(*) FROM publiek_aggregated;
