-- ============================================================
-- FACT EXTRACTION QUERIES — Rijksuitgaven Social Posts
-- ============================================================
-- These queries extract verified facts from the aggregated
-- materialized views. Every number in a social post MUST
-- trace back to one of these queries.
--
-- IMPORTANT: All aggregated views store amounts in ABSOLUTE
-- euros (the ×1000 multiplication for instrumenten/apparaat
-- is already applied at view-creation time).
--
-- Run with: psql $DATABASE_URL -f fact-queries.sql
-- Or run individual queries via Supabase SQL Editor.
-- ============================================================


-- ============================================================
-- Q-INSTR-01: Top recipients by total (instrumenten)
-- Use for: scale_shock, curiosity
-- ============================================================
\echo '--- Q-INSTR-01: Top instrumenten recipients by total ---'
SELECT
    ontvanger,
    totaal,
    "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024",
    years_with_data,
    row_count
FROM instrumenten_aggregated
ORDER BY totaal DESC
LIMIT 150;


-- ============================================================
-- Q-INSTR-02: Dramatic YoY increases (instrumenten)
-- Use for: scale_shock
-- Shows cases where amount jumped >5x year-over-year
-- ============================================================
\echo '--- Q-INSTR-02: Dramatic YoY increases ---'
WITH yearly AS (
    SELECT
        ontvanger,
        totaal,
        "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"
    FROM instrumenten_aggregated
    WHERE totaal > 100000000  -- at least €100M total to be interesting
),
yoy AS (
    SELECT ontvanger, totaal,
        -- Each pair: (later_year, earlier_year, year_label)
        CASE WHEN "2017" > 0 AND "2016" > 0 THEN "2017"::float / "2016" END AS r_2017,
        CASE WHEN "2018" > 0 AND "2017" > 0 THEN "2018"::float / "2017" END AS r_2018,
        CASE WHEN "2019" > 0 AND "2018" > 0 THEN "2019"::float / "2018" END AS r_2019,
        CASE WHEN "2020" > 0 AND "2019" > 0 THEN "2020"::float / "2019" END AS r_2020,
        CASE WHEN "2021" > 0 AND "2020" > 0 THEN "2021"::float / "2020" END AS r_2021,
        CASE WHEN "2022" > 0 AND "2021" > 0 THEN "2022"::float / "2021" END AS r_2022,
        CASE WHEN "2023" > 0 AND "2022" > 0 THEN "2023"::float / "2022" END AS r_2023,
        CASE WHEN "2024" > 0 AND "2023" > 0 THEN "2024"::float / "2023" END AS r_2024,
        "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"
    FROM yearly
)
SELECT ontvanger, totaal,
    "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024",
    GREATEST(r_2017, r_2018, r_2019, r_2020, r_2021, r_2022, r_2023, r_2024) AS max_increase_ratio,
    CASE
        WHEN GREATEST(r_2017, r_2018, r_2019, r_2020, r_2021, r_2022, r_2023, r_2024) = r_2017 THEN '2016→2017'
        WHEN GREATEST(r_2017, r_2018, r_2019, r_2020, r_2021, r_2022, r_2023, r_2024) = r_2018 THEN '2017→2018'
        WHEN GREATEST(r_2017, r_2018, r_2019, r_2020, r_2021, r_2022, r_2023, r_2024) = r_2019 THEN '2018→2019'
        WHEN GREATEST(r_2017, r_2018, r_2019, r_2020, r_2021, r_2022, r_2023, r_2024) = r_2020 THEN '2019→2020'
        WHEN GREATEST(r_2017, r_2018, r_2019, r_2020, r_2021, r_2022, r_2023, r_2024) = r_2021 THEN '2020→2021'
        WHEN GREATEST(r_2017, r_2018, r_2019, r_2020, r_2021, r_2022, r_2023, r_2024) = r_2022 THEN '2021→2022'
        WHEN GREATEST(r_2017, r_2018, r_2019, r_2020, r_2021, r_2022, r_2023, r_2024) = r_2023 THEN '2022→2023'
        WHEN GREATEST(r_2017, r_2018, r_2019, r_2020, r_2021, r_2022, r_2023, r_2024) = r_2024 THEN '2023→2024'
    END AS biggest_jump_period
FROM yoy
WHERE GREATEST(r_2017, r_2018, r_2019, r_2020, r_2021, r_2022, r_2023, r_2024) >= 3.0
ORDER BY max_increase_ratio DESC
LIMIT 100;


-- ============================================================
-- Q-INSTR-03: Dramatic YoY decreases (instrumenten)
-- Use for: scale_shock (dramatic drops are also interesting)
-- ============================================================
\echo '--- Q-INSTR-03: Dramatic YoY decreases ---'
WITH yearly AS (
    SELECT
        ontvanger, totaal,
        "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"
    FROM instrumenten_aggregated
    WHERE totaal > 100000000
),
yoy AS (
    SELECT ontvanger, totaal,
        CASE WHEN "2017" > 0 AND "2016" > 0 THEN "2016"::float / "2017" END AS d_2017,
        CASE WHEN "2018" > 0 AND "2017" > 0 THEN "2017"::float / "2018" END AS d_2018,
        CASE WHEN "2019" > 0 AND "2018" > 0 THEN "2018"::float / "2019" END AS d_2019,
        CASE WHEN "2020" > 0 AND "2019" > 0 THEN "2019"::float / "2020" END AS d_2020,
        CASE WHEN "2021" > 0 AND "2020" > 0 THEN "2020"::float / "2021" END AS d_2021,
        CASE WHEN "2022" > 0 AND "2021" > 0 THEN "2021"::float / "2022" END AS d_2022,
        CASE WHEN "2023" > 0 AND "2022" > 0 THEN "2022"::float / "2023" END AS d_2023,
        CASE WHEN "2024" > 0 AND "2023" > 0 THEN "2023"::float / "2024" END AS d_2024,
        "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"
    FROM yearly
)
SELECT ontvanger, totaal,
    "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024",
    GREATEST(d_2017, d_2018, d_2019, d_2020, d_2021, d_2022, d_2023, d_2024) AS max_decrease_ratio,
    CASE
        WHEN GREATEST(d_2017, d_2018, d_2019, d_2020, d_2021, d_2022, d_2023, d_2024) = d_2017 THEN '2016→2017'
        WHEN GREATEST(d_2017, d_2018, d_2019, d_2020, d_2021, d_2022, d_2023, d_2024) = d_2018 THEN '2017→2018'
        WHEN GREATEST(d_2017, d_2018, d_2019, d_2020, d_2021, d_2022, d_2023, d_2024) = d_2019 THEN '2018→2019'
        WHEN GREATEST(d_2017, d_2018, d_2019, d_2020, d_2021, d_2022, d_2023, d_2024) = d_2020 THEN '2019→2020'
        WHEN GREATEST(d_2017, d_2018, d_2019, d_2020, d_2021, d_2022, d_2023, d_2024) = d_2021 THEN '2020→2021'
        WHEN GREATEST(d_2017, d_2018, d_2019, d_2020, d_2021, d_2022, d_2023, d_2024) = d_2022 THEN '2021→2022'
        WHEN GREATEST(d_2017, d_2018, d_2019, d_2020, d_2021, d_2022, d_2023, d_2024) = d_2023 THEN '2022→2023'
        WHEN GREATEST(d_2017, d_2018, d_2019, d_2020, d_2021, d_2022, d_2023, d_2024) = d_2024 THEN '2023→2024'
    END AS biggest_drop_period
FROM yoy
WHERE GREATEST(d_2017, d_2018, d_2019, d_2020, d_2021, d_2022, d_2023, d_2024) >= 3.0
ORDER BY max_decrease_ratio DESC
LIMIT 100;


-- ============================================================
-- Q-GEM-01: Top recipients per gemeente (gemeente)
-- Use for: concentration, scale_shock
-- ============================================================
\echo '--- Q-GEM-01: Top gemeente recipients ---'
SELECT
    ontvanger,
    gemeente,
    totaal,
    "2018", "2019", "2020", "2021", "2022", "2023", "2024",
    years_with_data,
    row_count
FROM gemeente_aggregated
ORDER BY totaal DESC
LIMIT 200;


-- ============================================================
-- Q-GEM-02: Total spending per gemeente (for city comparisons)
-- Use for: comparison
-- ============================================================
\echo '--- Q-GEM-02: Total per gemeente ---'
SELECT
    gemeente,
    SUM(totaal) AS gemeente_totaal,
    COUNT(*) AS recipient_count,
    SUM("2018") AS y2018,
    SUM("2019") AS y2019,
    SUM("2020") AS y2020,
    SUM("2021") AS y2021,
    SUM("2022") AS y2022,
    SUM("2023") AS y2023,
    SUM("2024") AS y2024
FROM gemeente_aggregated
GROUP BY gemeente
ORDER BY gemeente_totaal DESC
LIMIT 50;


-- ============================================================
-- Q-GEM-03: Dominant recipients (>20% of a gemeente's total)
-- Use for: concentration
-- ============================================================
\echo '--- Q-GEM-03: Dominant recipients per gemeente ---'
WITH gemeente_totals AS (
    SELECT gemeente, SUM(totaal) AS gem_total
    FROM gemeente_aggregated
    GROUP BY gemeente
)
SELECT
    ga.ontvanger,
    ga.gemeente,
    ga.totaal,
    gt.gem_total,
    ROUND(100.0 * ga.totaal / NULLIF(gt.gem_total, 0), 1) AS pct_of_gemeente,
    ga.years_with_data
FROM gemeente_aggregated ga
JOIN gemeente_totals gt ON gt.gemeente = ga.gemeente
WHERE ga.totaal > 5000000  -- at least €5M
AND gt.gem_total > 0
ORDER BY pct_of_gemeente DESC
LIMIT 100;


-- ============================================================
-- Q-PROV-01: Top recipients per provincie
-- Use for: concentration, scale_shock
-- ============================================================
\echo '--- Q-PROV-01: Top provincie recipients ---'
SELECT
    ontvanger,
    provincie,
    totaal,
    "2018", "2019", "2020", "2021", "2022", "2023", "2024",
    years_with_data,
    row_count
FROM provincie_aggregated
ORDER BY totaal DESC
LIMIT 200;


-- ============================================================
-- Q-PROV-02: Total spending per provincie (for comparisons)
-- Use for: comparison
-- ============================================================
\echo '--- Q-PROV-02: Total per provincie ---'
SELECT
    provincie,
    SUM(totaal) AS prov_totaal,
    COUNT(*) AS recipient_count,
    SUM("2018") AS y2018,
    SUM("2019") AS y2019,
    SUM("2020") AS y2020,
    SUM("2021") AS y2021,
    SUM("2022") AS y2022,
    SUM("2023") AS y2023,
    SUM("2024") AS y2024
FROM provincie_aggregated
GROUP BY provincie
ORDER BY prov_totaal DESC;


-- ============================================================
-- Q-INKOOP-01: Top leveranciers by contract count
-- Use for: concentration, scale_shock
-- Note: amounts are staffel-based — use row_count and
-- staffel tier, NOT euro amounts
-- ============================================================
\echo '--- Q-INKOOP-01: Top inkoop leveranciers ---'
SELECT
    leverancier,
    row_count,
    staffel AS mode_staffel,
    categorie,
    categorie_count,
    staffel_count,
    years_with_data,
    totaal
FROM inkoop_aggregated
ORDER BY row_count DESC
LIMIT 150;


-- ============================================================
-- Q-INKOOP-02: Leveranciers with highest staffel tiers
-- Use for: scale_shock, concentration
-- Staffel 13 = €50-100M, Staffel 14 = >€100M (approx)
-- ============================================================
\echo '--- Q-INKOOP-02: Highest staffel leveranciers ---'
SELECT
    leverancier,
    staffel AS mode_staffel,
    row_count,
    categorie,
    years_with_data
FROM inkoop_aggregated
WHERE staffel >= 12
ORDER BY staffel DESC, row_count DESC
LIMIT 100;


-- ============================================================
-- Q-INKOOP-03: Contracts by category (for category_reveal)
-- Use for: category_reveal
-- ============================================================
\echo '--- Q-INKOOP-03: Contracts by category ---'
SELECT
    categorie,
    COUNT(*) AS leverancier_count,
    SUM(row_count) AS total_contracts
FROM inkoop_aggregated
WHERE categorie IS NOT NULL AND categorie != ''
GROUP BY categorie
ORDER BY total_contracts DESC
LIMIT 50;


-- ============================================================
-- Q-INKOOP-04: Source table — actual staffel brackets per
-- leverancier per year (for precise bracket language)
-- Use for: verifying staffel bracket claims
-- ============================================================
\echo '--- Q-INKOOP-04: Staffel detail per leverancier ---'
SELECT
    leverancier,
    jaar,
    staffel,
    categorie,
    COUNT(*) AS contracts_in_bracket
FROM inkoop
GROUP BY leverancier, jaar, staffel, categorie
HAVING COUNT(*) >= 2
ORDER BY leverancier, jaar, staffel DESC
LIMIT 500;


-- ============================================================
-- Q-PUB-01: Top publiek recipients by contract count
-- Use for: concentration
-- Note: publiek uses staffel brackets (varchar), not amounts
-- ============================================================
\echo '--- Q-PUB-01: Top publiek recipients ---'
SELECT
    ontvanger,
    source,
    row_count,
    years_with_data,
    totaal
FROM publiek_aggregated
ORDER BY row_count DESC
LIMIT 150;


-- ============================================================
-- Q-PUB-02: Top recipients per source org (COA, RVO, etc.)
-- Use for: concentration, comparison
-- ============================================================
\echo '--- Q-PUB-02: Top per publiek source ---'
SELECT
    source,
    ontvanger,
    row_count,
    totaal,
    years_with_data
FROM publiek_aggregated
WHERE row_count >= 5
ORDER BY source, row_count DESC
LIMIT 200;


-- ============================================================
-- Q-PUB-03: Staffel distribution per leverancier (source table)
-- Use for: verifying bracket claims
-- ============================================================
\echo '--- Q-PUB-03: Publiek staffel detail ---'
SELECT
    ontvanger,
    source,
    staffel,
    jaar,
    COUNT(*) AS records
FROM publiek
GROUP BY ontvanger, source, staffel, jaar
HAVING COUNT(*) >= 2
ORDER BY ontvanger, source, staffel, jaar
LIMIT 500;


-- ============================================================
-- Q-APP-01: Top kostensoort by total (apparaat)
-- Use for: scale_shock, category_reveal
-- ============================================================
\echo '--- Q-APP-01: Top apparaat kostensoort ---'
SELECT
    kostensoort,
    artikel,
    detail,
    totaal,
    "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024",
    row_count
FROM apparaat_aggregated
ORDER BY totaal DESC
LIMIT 100;


-- ============================================================
-- Q-APP-02: Apparaat by ministry (source table aggregation)
-- Use for: comparison, scale_shock
-- ============================================================
\echo '--- Q-APP-02: Apparaat by ministry ---'
SELECT
    begrotingsnaam,
    SUM(bedrag) * 1000 AS totaal_abs,
    SUM(CASE WHEN begrotingsjaar = 2024 THEN bedrag * 1000 ELSE 0 END) AS y2024,
    SUM(CASE WHEN begrotingsjaar = 2023 THEN bedrag * 1000 ELSE 0 END) AS y2023,
    SUM(CASE WHEN begrotingsjaar = 2022 THEN bedrag * 1000 ELSE 0 END) AS y2022,
    SUM(CASE WHEN begrotingsjaar = 2021 THEN bedrag * 1000 ELSE 0 END) AS y2021,
    SUM(CASE WHEN begrotingsjaar = 2020 THEN bedrag * 1000 ELSE 0 END) AS y2020,
    COUNT(*) AS rows
FROM apparaat
GROUP BY begrotingsnaam
ORDER BY totaal_abs DESC;


-- ============================================================
-- Q-APP-03: Apparaat kostensoort by ministry (cross-tab)
-- Use for: category_reveal, comparison
-- ============================================================
\echo '--- Q-APP-03: Kostensoort per ministry ---'
SELECT
    begrotingsnaam,
    kostensoort,
    SUM(bedrag) * 1000 AS totaal_abs,
    COUNT(DISTINCT begrotingsjaar) AS year_count
FROM apparaat
GROUP BY begrotingsnaam, kostensoort
HAVING SUM(bedrag) * 1000 > 10000000  -- at least €10M
ORDER BY totaal_abs DESC
LIMIT 200;


-- ============================================================
-- Q-CROSS-01: Universal search — most broadly funded entities
-- Use for: curiosity, scale_shock
-- ============================================================
\echo '--- Q-CROSS-01: Universal search top entities ---'
SELECT
    ontvanger,
    sources,
    source_count,
    record_count,
    totaal,
    "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024",
    years_with_data
FROM universal_search
ORDER BY totaal DESC
LIMIT 100;


-- ============================================================
-- Q-CROSS-02: Entities appearing in most modules
-- Use for: curiosity, concentration
-- ============================================================
\echo '--- Q-CROSS-02: Multi-source entities ---'
SELECT
    ontvanger,
    sources,
    source_count,
    record_count,
    totaal
FROM universal_search
WHERE source_count >= 3
ORDER BY source_count DESC, totaal DESC
LIMIT 50;
