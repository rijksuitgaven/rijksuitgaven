#!/usr/bin/env python3
"""Extract verified facts from the Rijksuitgaven database.

Connects to the Supabase PostgreSQL database, runs predefined queries,
and outputs structured CSV files per module in social/facts/.

Every fact gets a unique ID, the query reference, and a verification timestamp.

Usage:
    python3 social/extract_facts.py

Requires: psycopg2 (pip install psycopg2-binary)
"""
import csv
import os
import sys
from datetime import datetime, timezone

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

# ============================================================
# CONFIG
# ============================================================
SOCIAL_DIR = os.path.dirname(os.path.abspath(__file__))
FACTS_DIR = os.path.join(SOCIAL_DIR, "facts")
os.makedirs(FACTS_DIR, exist_ok=True)

# Load DATABASE_URL from backend/.env
BACKEND_DIR = os.path.join(os.path.dirname(SOCIAL_DIR), "backend")
ENV_PATH = os.path.join(BACKEND_DIR, ".env")

def load_database_url():
    with open(ENV_PATH) as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                return line.strip().split("=", 1)[1]
    raise RuntimeError(f"DATABASE_URL not found in {ENV_PATH}")

DATABASE_URL = load_database_url()
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

YEARS = ["2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"]

# ============================================================
# FACT CSV WRITERS
# ============================================================

def write_facts_csv(filename, headers, rows):
    path = os.path.join(FACTS_DIR, filename)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(headers)
        for row in rows:
            w.writerow(row)
    print(f"  Wrote {path} ({len(rows)} facts)")
    return len(rows)


# ============================================================
# QUERY DEFINITIONS
# Each returns (filename, headers, rows)
# ============================================================

def extract_instrumenten_top(cur):
    """Q-INSTR-01: Top recipients by total"""
    cur.execute("""
        SELECT ontvanger, totaal,
            "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024",
            years_with_data, row_count
        FROM instrumenten_aggregated
        WHERE ontvanger IS NOT NULL AND ontvanger != ''
        ORDER BY totaal DESC
        LIMIT 150
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        fact_id = f"INSTR-TOP-{i:03d}"
        rows.append([
            fact_id, "instrumenten", r[0], "total_received", r[1],
            *[r[j] for j in range(2, 11)],  # year columns
            r[11], r[12],  # years_with_data, row_count
            "Q-INSTR-01", NOW
        ])
    headers = [
        "fact_id", "module", "entity", "metric", "value",
        *[f"y{y}" for y in YEARS],
        "years_with_data", "row_count", "query_ref", "verified_at"
    ]
    return "instrumenten_top.csv", headers, rows


def extract_instrumenten_yoy_increases(cur):
    """Q-INSTR-02: Dramatic YoY increases"""
    cur.execute("""
        WITH yearly AS (
            SELECT ontvanger, totaal,
                "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"
            FROM instrumenten_aggregated
            WHERE totaal > 100000000
        ),
        yoy AS (
            SELECT ontvanger, totaal,
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
            GREATEST(r_2017, r_2018, r_2019, r_2020, r_2021, r_2022, r_2023, r_2024) AS max_ratio,
            CASE
                WHEN GREATEST(r_2017,r_2018,r_2019,r_2020,r_2021,r_2022,r_2023,r_2024) = r_2017 THEN '2016-2017'
                WHEN GREATEST(r_2017,r_2018,r_2019,r_2020,r_2021,r_2022,r_2023,r_2024) = r_2018 THEN '2017-2018'
                WHEN GREATEST(r_2017,r_2018,r_2019,r_2020,r_2021,r_2022,r_2023,r_2024) = r_2019 THEN '2018-2019'
                WHEN GREATEST(r_2017,r_2018,r_2019,r_2020,r_2021,r_2022,r_2023,r_2024) = r_2020 THEN '2019-2020'
                WHEN GREATEST(r_2017,r_2018,r_2019,r_2020,r_2021,r_2022,r_2023,r_2024) = r_2021 THEN '2020-2021'
                WHEN GREATEST(r_2017,r_2018,r_2019,r_2020,r_2021,r_2022,r_2023,r_2024) = r_2022 THEN '2021-2022'
                WHEN GREATEST(r_2017,r_2018,r_2019,r_2020,r_2021,r_2022,r_2023,r_2024) = r_2023 THEN '2022-2023'
                WHEN GREATEST(r_2017,r_2018,r_2019,r_2020,r_2021,r_2022,r_2023,r_2024) = r_2024 THEN '2023-2024'
            END AS jump_period
        FROM yoy
        WHERE GREATEST(r_2017,r_2018,r_2019,r_2020,r_2021,r_2022,r_2023,r_2024) >= 3.0
        ORDER BY max_ratio DESC
        LIMIT 100
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        fact_id = f"INSTR-YOY-UP-{i:03d}"
        rows.append([
            fact_id, "instrumenten", r[0], "yoy_increase", r[1],
            *[r[j] for j in range(2, 11)],
            r[11], r[12],  # max_ratio, jump_period
            "Q-INSTR-02", NOW
        ])
    headers = [
        "fact_id", "module", "entity", "metric", "totaal",
        *[f"y{y}" for y in YEARS],
        "max_ratio", "jump_period", "query_ref", "verified_at"
    ]
    return "instrumenten_yoy_increases.csv", headers, rows


def extract_instrumenten_yoy_decreases(cur):
    """Q-INSTR-03: Dramatic YoY decreases"""
    cur.execute("""
        WITH yearly AS (
            SELECT ontvanger, totaal,
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
            GREATEST(d_2017,d_2018,d_2019,d_2020,d_2021,d_2022,d_2023,d_2024) AS max_ratio,
            CASE
                WHEN GREATEST(d_2017,d_2018,d_2019,d_2020,d_2021,d_2022,d_2023,d_2024) = d_2017 THEN '2016-2017'
                WHEN GREATEST(d_2017,d_2018,d_2019,d_2020,d_2021,d_2022,d_2023,d_2024) = d_2018 THEN '2017-2018'
                WHEN GREATEST(d_2017,d_2018,d_2019,d_2020,d_2021,d_2022,d_2023,d_2024) = d_2019 THEN '2018-2019'
                WHEN GREATEST(d_2017,d_2018,d_2019,d_2020,d_2021,d_2022,d_2023,d_2024) = d_2020 THEN '2019-2020'
                WHEN GREATEST(d_2017,d_2018,d_2019,d_2020,d_2021,d_2022,d_2023,d_2024) = d_2021 THEN '2020-2021'
                WHEN GREATEST(d_2017,d_2018,d_2019,d_2020,d_2021,d_2022,d_2023,d_2024) = d_2022 THEN '2021-2022'
                WHEN GREATEST(d_2017,d_2018,d_2019,d_2020,d_2021,d_2022,d_2023,d_2024) = d_2023 THEN '2022-2023'
                WHEN GREATEST(d_2017,d_2018,d_2019,d_2020,d_2021,d_2022,d_2023,d_2024) = d_2024 THEN '2023-2024'
            END AS drop_period
        FROM yoy
        WHERE GREATEST(d_2017,d_2018,d_2019,d_2020,d_2021,d_2022,d_2023,d_2024) >= 3.0
        ORDER BY max_ratio DESC
        LIMIT 100
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        fact_id = f"INSTR-YOY-DN-{i:03d}"
        rows.append([
            fact_id, "instrumenten", r[0], "yoy_decrease", r[1],
            *[r[j] for j in range(2, 11)],
            r[11], r[12],
            "Q-INSTR-03", NOW
        ])
    headers = [
        "fact_id", "module", "entity", "metric", "totaal",
        *[f"y{y}" for y in YEARS],
        "max_ratio", "drop_period", "query_ref", "verified_at"
    ]
    return "instrumenten_yoy_decreases.csv", headers, rows


def extract_gemeente_top(cur):
    """Q-GEM-01: Top gemeente recipients"""
    cur.execute("""
        SELECT ontvanger, gemeente, totaal,
            "2018", "2019", "2020", "2021", "2022", "2023", "2024",
            years_with_data, row_count
        FROM gemeente_aggregated
        ORDER BY totaal DESC
        LIMIT 200
    """)
    rows = []
    gem_years = ["2018", "2019", "2020", "2021", "2022", "2023", "2024"]
    for i, r in enumerate(cur.fetchall(), 1):
        fact_id = f"GEM-TOP-{i:03d}"
        rows.append([
            fact_id, "gemeente", r[0], r[1], "total_received", r[2],
            *[r[j] for j in range(3, 10)],
            r[10], r[11],
            "Q-GEM-01", NOW
        ])
    headers = [
        "fact_id", "module", "entity", "gemeente", "metric", "value",
        *[f"y{y}" for y in gem_years],
        "years_with_data", "row_count", "query_ref", "verified_at"
    ]
    return "gemeente_top.csv", headers, rows


def extract_gemeente_totals(cur):
    """Q-GEM-02: Total per gemeente"""
    cur.execute("""
        SELECT gemeente, SUM(totaal) AS gemeente_totaal, COUNT(*) AS recipient_count,
            SUM("2018"), SUM("2019"), SUM("2020"), SUM("2021"),
            SUM("2022"), SUM("2023"), SUM("2024")
        FROM gemeente_aggregated
        GROUP BY gemeente
        ORDER BY gemeente_totaal DESC
        LIMIT 50
    """)
    rows = []
    gem_years = ["2018", "2019", "2020", "2021", "2022", "2023", "2024"]
    for i, r in enumerate(cur.fetchall(), 1):
        fact_id = f"GEM-TOTAL-{i:03d}"
        rows.append([
            fact_id, "gemeente", r[0], "gemeente_total", r[1], r[2],
            *[r[j] for j in range(3, 10)],
            "Q-GEM-02", NOW
        ])
    headers = [
        "fact_id", "module", "entity", "metric", "value", "recipient_count",
        *[f"y{y}" for y in gem_years],
        "query_ref", "verified_at"
    ]
    return "gemeente_totals.csv", headers, rows


def extract_gemeente_dominant(cur):
    """Q-GEM-03: Dominant recipients per gemeente"""
    cur.execute("""
        WITH gemeente_totals AS (
            SELECT gemeente, SUM(totaal) AS gem_total
            FROM gemeente_aggregated
            GROUP BY gemeente
        )
        SELECT ga.ontvanger, ga.gemeente, ga.totaal, gt.gem_total,
            ROUND(100.0 * ga.totaal / NULLIF(gt.gem_total, 0), 1) AS pct,
            ga.years_with_data
        FROM gemeente_aggregated ga
        JOIN gemeente_totals gt ON gt.gemeente = ga.gemeente
        WHERE ga.totaal > 5000000 AND gt.gem_total > 0
        ORDER BY pct DESC
        LIMIT 100
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        fact_id = f"GEM-DOM-{i:03d}"
        rows.append([
            fact_id, "gemeente", r[0], r[1], "dominance_pct",
            r[2], r[3], float(r[4]), r[5],
            "Q-GEM-03", NOW
        ])
    headers = [
        "fact_id", "module", "entity", "gemeente", "metric",
        "entity_total", "gemeente_total", "pct_of_gemeente", "years_with_data",
        "query_ref", "verified_at"
    ]
    return "gemeente_dominant.csv", headers, rows


def extract_provincie_top(cur):
    """Q-PROV-01: Top provincie recipients"""
    cur.execute("""
        SELECT ontvanger, provincie, totaal,
            "2018", "2019", "2020", "2021", "2022", "2023", "2024",
            years_with_data, row_count
        FROM provincie_aggregated
        ORDER BY totaal DESC
        LIMIT 200
    """)
    rows = []
    prov_years = ["2018", "2019", "2020", "2021", "2022", "2023", "2024"]
    for i, r in enumerate(cur.fetchall(), 1):
        fact_id = f"PROV-TOP-{i:03d}"
        rows.append([
            fact_id, "provincie", r[0], r[1], "total_received", r[2],
            *[r[j] for j in range(3, 10)],
            r[10], r[11],
            "Q-PROV-01", NOW
        ])
    headers = [
        "fact_id", "module", "entity", "provincie", "metric", "value",
        *[f"y{y}" for y in prov_years],
        "years_with_data", "row_count", "query_ref", "verified_at"
    ]
    return "provincie_top.csv", headers, rows


def extract_provincie_totals(cur):
    """Q-PROV-02: Total per provincie"""
    cur.execute("""
        SELECT provincie, SUM(totaal) AS prov_totaal, COUNT(*) AS recipient_count,
            SUM("2018"), SUM("2019"), SUM("2020"), SUM("2021"),
            SUM("2022"), SUM("2023"), SUM("2024")
        FROM provincie_aggregated
        GROUP BY provincie
        ORDER BY prov_totaal DESC
    """)
    rows = []
    prov_years = ["2018", "2019", "2020", "2021", "2022", "2023", "2024"]
    for i, r in enumerate(cur.fetchall(), 1):
        fact_id = f"PROV-TOTAL-{i:03d}"
        rows.append([
            fact_id, "provincie", r[0], "provincie_total", r[1], r[2],
            *[r[j] for j in range(3, 10)],
            "Q-PROV-02", NOW
        ])
    headers = [
        "fact_id", "module", "entity", "metric", "value", "recipient_count",
        *[f"y{y}" for y in prov_years],
        "query_ref", "verified_at"
    ]
    return "provincie_totals.csv", headers, rows


def extract_inkoop_top(cur):
    """Q-INKOOP-01: Top leveranciers by contract count"""
    cur.execute("""
        SELECT leverancier, row_count, staffel, categorie,
            categorie_count, staffel_count, years_with_data, totaal
        FROM inkoop_aggregated
        ORDER BY row_count DESC
        LIMIT 150
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        fact_id = f"INKOOP-TOP-{i:03d}"
        rows.append([
            fact_id, "inkoop", r[0], "contract_count", r[1],
            r[2], r[3], r[4], r[5], r[6], r[7],
            "Q-INKOOP-01", NOW
        ])
    headers = [
        "fact_id", "module", "entity", "metric", "contract_count",
        "mode_staffel", "categorie", "categorie_count", "staffel_count",
        "years_with_data", "totaal",
        "query_ref", "verified_at"
    ]
    return "inkoop_top.csv", headers, rows


def extract_inkoop_high_staffel(cur):
    """Q-INKOOP-02: Highest staffel leveranciers"""
    cur.execute("""
        SELECT leverancier, staffel, row_count, categorie, years_with_data
        FROM inkoop_aggregated
        WHERE staffel >= 12
        ORDER BY staffel DESC, row_count DESC
        LIMIT 100
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        fact_id = f"INKOOP-HSTF-{i:03d}"
        rows.append([
            fact_id, "inkoop", r[0], "high_staffel", r[1],
            r[2], r[3], r[4],
            "Q-INKOOP-02", NOW
        ])
    headers = [
        "fact_id", "module", "entity", "metric", "mode_staffel",
        "contract_count", "categorie", "years_with_data",
        "query_ref", "verified_at"
    ]
    return "inkoop_high_staffel.csv", headers, rows


def extract_inkoop_categories(cur):
    """Q-INKOOP-03: Contracts by category"""
    cur.execute("""
        SELECT categorie, COUNT(*) AS leverancier_count,
            SUM(row_count) AS total_contracts
        FROM inkoop_aggregated
        WHERE categorie IS NOT NULL AND categorie != ''
        GROUP BY categorie
        ORDER BY total_contracts DESC
        LIMIT 50
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        fact_id = f"INKOOP-CAT-{i:03d}"
        rows.append([
            fact_id, "inkoop", r[0], "category_total", r[1], r[2],
            "Q-INKOOP-03", NOW
        ])
    headers = [
        "fact_id", "module", "entity", "metric", "leverancier_count",
        "total_contracts", "query_ref", "verified_at"
    ]
    return "inkoop_categories.csv", headers, rows


def extract_publiek_top(cur):
    """Q-PUB-01: Top publiek recipients"""
    cur.execute("""
        SELECT ontvanger, source, row_count, years_with_data, totaal
        FROM publiek_aggregated
        ORDER BY row_count DESC
        LIMIT 150
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        fact_id = f"PUB-TOP-{i:03d}"
        rows.append([
            fact_id, "publiek", r[0], r[1], "contract_count", r[2],
            r[3], r[4],
            "Q-PUB-01", NOW
        ])
    headers = [
        "fact_id", "module", "entity", "source", "metric", "contract_count",
        "years_with_data", "totaal",
        "query_ref", "verified_at"
    ]
    return "publiek_top.csv", headers, rows


def extract_publiek_per_source(cur):
    """Q-PUB-02: Top per source org"""
    cur.execute("""
        SELECT source, ontvanger, row_count, totaal, years_with_data
        FROM publiek_aggregated
        WHERE row_count >= 5
        ORDER BY source, row_count DESC
        LIMIT 200
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        fact_id = f"PUB-SRC-{i:03d}"
        rows.append([
            fact_id, "publiek", r[1], r[0], "per_source_count", r[2],
            r[3], r[4],
            "Q-PUB-02", NOW
        ])
    headers = [
        "fact_id", "module", "entity", "source", "metric", "contract_count",
        "totaal", "years_with_data",
        "query_ref", "verified_at"
    ]
    return "publiek_per_source.csv", headers, rows


def extract_apparaat_top(cur):
    """Q-APP-01: Top kostensoort"""
    cur.execute("""
        SELECT kostensoort, artikel, detail, totaal,
            "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024",
            row_count
        FROM apparaat_aggregated
        ORDER BY totaal DESC
        LIMIT 100
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        fact_id = f"APP-TOP-{i:03d}"
        rows.append([
            fact_id, "apparaat", r[0], r[1], r[2], "total_amount", r[3],
            *[r[j] for j in range(4, 13)],
            r[13],
            "Q-APP-01", NOW
        ])
    headers = [
        "fact_id", "module", "entity", "artikel", "detail", "metric", "value",
        *[f"y{y}" for y in YEARS],
        "row_count", "query_ref", "verified_at"
    ]
    return "apparaat_top.csv", headers, rows


def extract_apparaat_ministry(cur):
    """Q-APP-02: Apparaat by ministry"""
    cur.execute("""
        SELECT begrotingsnaam,
            SUM(bedrag) * 1000 AS totaal_abs,
            SUM(CASE WHEN begrotingsjaar = 2024 THEN bedrag * 1000 ELSE 0 END) AS y2024,
            SUM(CASE WHEN begrotingsjaar = 2023 THEN bedrag * 1000 ELSE 0 END) AS y2023,
            SUM(CASE WHEN begrotingsjaar = 2022 THEN bedrag * 1000 ELSE 0 END) AS y2022,
            SUM(CASE WHEN begrotingsjaar = 2021 THEN bedrag * 1000 ELSE 0 END) AS y2021,
            SUM(CASE WHEN begrotingsjaar = 2020 THEN bedrag * 1000 ELSE 0 END) AS y2020,
            COUNT(*) AS rows
        FROM apparaat
        GROUP BY begrotingsnaam
        ORDER BY totaal_abs DESC
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        fact_id = f"APP-MIN-{i:03d}"
        rows.append([
            fact_id, "apparaat", r[0], "ministry_total", r[1],
            r[2], r[3], r[4], r[5], r[6], r[7],
            "Q-APP-02", NOW
        ])
    headers = [
        "fact_id", "module", "entity", "metric", "value",
        "y2024", "y2023", "y2022", "y2021", "y2020", "row_count",
        "query_ref", "verified_at"
    ]
    return "apparaat_ministry.csv", headers, rows


def extract_apparaat_kostensoort_ministry(cur):
    """Q-APP-03: Kostensoort per ministry"""
    cur.execute("""
        SELECT begrotingsnaam, kostensoort,
            SUM(bedrag) * 1000 AS totaal_abs,
            COUNT(DISTINCT begrotingsjaar) AS year_count
        FROM apparaat
        GROUP BY begrotingsnaam, kostensoort
        HAVING SUM(bedrag) * 1000 > 10000000
        ORDER BY totaal_abs DESC
        LIMIT 200
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        fact_id = f"APP-KMIN-{i:03d}"
        rows.append([
            fact_id, "apparaat", f"{r[1]} ({r[0]})", "kostensoort_ministry",
            r[2], r[0], r[1], r[3],
            "Q-APP-03", NOW
        ])
    headers = [
        "fact_id", "module", "entity", "metric", "value",
        "begrotingsnaam", "kostensoort", "year_count",
        "query_ref", "verified_at"
    ]
    return "apparaat_kostensoort_ministry.csv", headers, rows


def extract_universal_top(cur):
    """Q-CROSS-01: Universal search top entities"""
    cur.execute("""
        SELECT ontvanger, sources, source_count, record_count, totaal,
            "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024",
            years_with_data
        FROM universal_search
        ORDER BY totaal DESC
        LIMIT 100
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        fact_id = f"CROSS-TOP-{i:03d}"
        rows.append([
            fact_id, "integraal", r[0], r[1], r[2], "cross_module_total",
            r[3], r[4],
            *[r[j] for j in range(5, 14)],
            r[14],
            "Q-CROSS-01", NOW
        ])
    headers = [
        "fact_id", "module", "entity", "sources", "source_count", "metric",
        "record_count", "value",
        *[f"y{y}" for y in YEARS],
        "years_with_data", "query_ref", "verified_at"
    ]
    return "universal_top.csv", headers, rows


def extract_universal_multi_source(cur):
    """Q-CROSS-02: Multi-source entities"""
    cur.execute("""
        SELECT ontvanger, sources, source_count, record_count, totaal
        FROM universal_search
        WHERE source_count >= 3
        ORDER BY source_count DESC, totaal DESC
        LIMIT 50
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        fact_id = f"CROSS-MULTI-{i:03d}"
        rows.append([
            fact_id, "integraal", r[0], r[1], r[2],
            "multi_source", r[3], r[4],
            "Q-CROSS-02", NOW
        ])
    headers = [
        "fact_id", "module", "entity", "sources", "source_count",
        "metric", "record_count", "totaal",
        "query_ref", "verified_at"
    ]
    return "universal_multi_source.csv", headers, rows


# ============================================================
# MAIN
# ============================================================
def main():
    print(f"Connecting to database...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    print(f"Connected. Extracting facts...\n")

    extractors = [
        extract_instrumenten_top,
        extract_instrumenten_yoy_increases,
        extract_instrumenten_yoy_decreases,
        extract_gemeente_top,
        extract_gemeente_totals,
        extract_gemeente_dominant,
        extract_provincie_top,
        extract_provincie_totals,
        extract_inkoop_top,
        extract_inkoop_high_staffel,
        extract_inkoop_categories,
        extract_publiek_top,
        extract_publiek_per_source,
        extract_apparaat_top,
        extract_apparaat_ministry,
        extract_apparaat_kostensoort_ministry,
        extract_universal_top,
        extract_universal_multi_source,
    ]

    total = 0
    for fn in extractors:
        print(f"Running {fn.__doc__}...")
        filename, headers, rows = fn(cur)
        count = write_facts_csv(filename, headers, rows)
        total += count

    cur.close()
    conn.close()

    print(f"\n{'='*60}")
    print(f"DONE: {total} facts extracted across {len(extractors)} queries")
    print(f"Facts directory: {FACTS_DIR}")
    print(f"Verified at: {NOW}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
