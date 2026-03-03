#!/usr/bin/env python3
"""Extract per-year facts from source tables for social media posts.

Pipeline: source tables -> facts/*.csv -> generate_posts.py -> posts/

Extracts 7 CSVs, one per module/type:
  1. instrumenten_rows.csv  — (ontvanger, jaar, bedrag, descriptor, type)
  2. apparaat_rows.csv      — (begrotingsnaam, kostensoort, jaar, bedrag)
  3. inkoop_rows.csv        — (leverancier, staffel, categorie)
  4. provincie_rows.csv     — (ontvanger, jaar, bedrag, descriptor, provincie)
  5. gemeente_rows.csv      — (ontvanger, jaar, bedrag, descriptor, gemeente)
  6. publiek_rows.csv       — (ontvanger, jaar, bedrag, descriptor, source)
  7. coa_rows.csv           — (ontvanger, staffel, regeling)

Usage:
    python3 social/extract_facts.py

Requires: psycopg2 (pip install psycopg2-binary)
"""
import csv
import glob
import os
import sys
from datetime import datetime, timezone

try:
    import psycopg2
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

# ============================================================
# CONFIG
# ============================================================
SOCIAL_DIR = os.path.dirname(os.path.abspath(__file__))
FACTS_DIR = os.path.join(SOCIAL_DIR, "facts")
os.makedirs(FACTS_DIR, exist_ok=True)

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


def write_csv(filename, headers, rows):
    path = os.path.join(FACTS_DIR, filename)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(headers)
        for row in rows:
            w.writerow(row)
    print(f"  {filename}: {len(rows)} rows")
    return len(rows)


def cleanup_old_facts():
    """Remove old fact CSVs that are no longer produced."""
    old_files = [
        "apparaat_kostensoort_ministry.csv", "apparaat_ministry.csv",
        "apparaat_top.csv", "gemeente_dominant.csv", "gemeente_top.csv",
        "gemeente_totals.csv", "inkoop_categories.csv", "inkoop_high_staffel.csv",
        "inkoop_top.csv", "instrumenten_top.csv", "instrumenten_yoy_decreases.csv",
        "instrumenten_yoy_increases.csv", "provincie_top.csv", "provincie_totals.csv",
        "publiek_coa_staffel.csv", "publiek_per_source.csv", "publiek_top.csv",
        "universal_multi_source.csv", "universal_top.csv",
    ]
    removed = 0
    for name in old_files:
        path = os.path.join(FACTS_DIR, name)
        if os.path.exists(path):
            os.remove(path)
            removed += 1
    if removed:
        print(f"  Cleaned up {removed} old fact files")


# ============================================================
# EXTRACTION QUERIES — per-year rows from source tables
# ============================================================

def extract_instrumenten(cur):
    """Per (recipient, year, regeling) from instrumenten source table."""
    cur.execute("""
        SELECT
            UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
            begrotingsjaar AS jaar,
            SUM(bedrag) * 1000 AS bedrag,
            regeling AS descriptor,
            MODE() WITHIN GROUP (ORDER BY instrument) AS type
        FROM instrumenten
        WHERE begrotingsjaar BETWEEN 2022 AND 2024
            AND bedrag > 0
            AND ontvanger IS NOT NULL AND TRIM(ontvanger) != ''
            AND regeling IS NOT NULL AND TRIM(regeling) != ''
        GROUP BY normalize_recipient(ontvanger), begrotingsjaar, regeling
        HAVING SUM(bedrag) * 1000 >= 100000
        ORDER BY SUM(bedrag) * 1000 DESC
        LIMIT 500
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        rows.append([f"INSTR-{i:03d}", r[0], r[1], int(r[2]), r[3], r[4] or "bijdrage"])
    headers = ["fact_id", "ontvanger", "jaar", "bedrag", "descriptor", "type"]
    return "instrumenten_rows.csv", headers, rows


def extract_apparaat(cur):
    """Per (ministry, kostensoort, year) from apparaat source table."""
    cur.execute("""
        SELECT
            begrotingsnaam,
            kostensoort,
            begrotingsjaar AS jaar,
            SUM(bedrag) * 1000 AS bedrag
        FROM apparaat
        WHERE begrotingsjaar BETWEEN 2022 AND 2024
            AND bedrag > 0
            AND begrotingsnaam IS NOT NULL AND TRIM(begrotingsnaam) != ''
            AND kostensoort IS NOT NULL AND TRIM(kostensoort) != ''
        GROUP BY begrotingsnaam, kostensoort, begrotingsjaar
        HAVING SUM(bedrag) * 1000 >= 1000000
        ORDER BY SUM(bedrag) * 1000 DESC
        LIMIT 300
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        rows.append([f"APP-{i:03d}", r[0], r[1], r[2], int(r[3])])
    headers = ["fact_id", "begrotingsnaam", "kostensoort", "jaar", "bedrag"]
    return "apparaat_rows.csv", headers, rows


def extract_inkoop(cur):
    """Per (leverancier, staffel) from inkoop source table. Staffel >= 7."""
    cur.execute("""
        SELECT
            UPPER(LEFT(MIN(leverancier), 1)) || SUBSTRING(MIN(leverancier) FROM 2) AS leverancier,
            staffel,
            MODE() WITHIN GROUP (ORDER BY categorie) AS categorie
        FROM inkoop
        WHERE staffel >= 7
            AND leverancier IS NOT NULL AND TRIM(leverancier) != ''
        GROUP BY normalize_recipient(leverancier), staffel
        ORDER BY staffel DESC, COUNT(*) DESC
        LIMIT 300
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        rows.append([f"INKOOP-{i:03d}", r[0], r[1], r[2] or ""])
    headers = ["fact_id", "leverancier", "staffel", "categorie"]
    return "inkoop_rows.csv", headers, rows


def extract_provincie(cur):
    """Per (recipient, year, provincie) from provincie source table."""
    cur.execute("""
        SELECT
            UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
            jaar,
            SUM(bedrag) AS bedrag,
            MODE() WITHIN GROUP (ORDER BY omschrijving) AS descriptor,
            provincie
        FROM provincie
        WHERE jaar BETWEEN 2022 AND 2024
            AND bedrag > 0
            AND ontvanger IS NOT NULL AND TRIM(ontvanger) != ''
        GROUP BY normalize_recipient(ontvanger), jaar, provincie
        HAVING SUM(bedrag) >= 25000
        ORDER BY SUM(bedrag) DESC
        LIMIT 500
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        rows.append([f"PROV-{i:03d}", r[0], r[1], int(r[2]), r[3] or "", r[4]])
    headers = ["fact_id", "ontvanger", "jaar", "bedrag", "descriptor", "provincie"]
    return "provincie_rows.csv", headers, rows


def extract_gemeente(cur):
    """Per (recipient, year, gemeente) from gemeente source table."""
    cur.execute("""
        SELECT
            UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
            jaar,
            SUM(bedrag) AS bedrag,
            MODE() WITHIN GROUP (ORDER BY omschrijving) AS descriptor,
            gemeente
        FROM gemeente
        WHERE jaar BETWEEN 2022 AND 2024
            AND bedrag > 0
            AND ontvanger IS NOT NULL AND TRIM(ontvanger) != ''
        GROUP BY normalize_recipient(ontvanger), jaar, gemeente
        HAVING SUM(bedrag) >= 25000
        ORDER BY SUM(bedrag) DESC
        LIMIT 500
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        rows.append([f"GEM-{i:03d}", r[0], r[1], int(r[2]), r[3] or "", r[4]])
    headers = ["fact_id", "ontvanger", "jaar", "bedrag", "descriptor", "gemeente"]
    return "gemeente_rows.csv", headers, rows


def extract_publiek(cur):
    """Per (recipient, year, source) from publiek — non-COA only."""
    cur.execute("""
        SELECT
            UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
            jaar,
            SUM(bedrag) AS bedrag,
            MODE() WITHIN GROUP (ORDER BY COALESCE(regeling, omschrijving)) AS descriptor,
            source
        FROM publiek
        WHERE source != 'COA'
            AND jaar BETWEEN 2022 AND 2024
            AND bedrag > 0
            AND ontvanger IS NOT NULL AND TRIM(ontvanger) != ''
        GROUP BY normalize_recipient(ontvanger), jaar, source
        HAVING SUM(bedrag) >= 25000
        ORDER BY SUM(bedrag) DESC
        LIMIT 500
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        rows.append([f"PUB-{i:03d}", r[0], r[1], int(r[2]), r[3] or "", r[4]])
    headers = ["fact_id", "ontvanger", "jaar", "bedrag", "descriptor", "source"]
    return "publiek_rows.csv", headers, rows


def extract_coa(cur):
    """COA recipients with high staffel (>= 7). Staffel-based, no exact amounts."""
    cur.execute("""
        SELECT
            UPPER(LEFT(MIN(ontvanger), 1)) || SUBSTRING(MIN(ontvanger) FROM 2) AS ontvanger,
            MODE() WITHIN GROUP (ORDER BY staffel::integer) AS staffel,
            MODE() WITHIN GROUP (ORDER BY regeling) AS regeling
        FROM publiek
        WHERE source = 'COA'
            AND staffel ~ '^\\d+$'
            AND staffel::integer >= 7
        GROUP BY normalize_recipient(ontvanger)
        ORDER BY MODE() WITHIN GROUP (ORDER BY staffel::integer) DESC, COUNT(*) DESC
        LIMIT 200
    """)
    rows = []
    for i, r in enumerate(cur.fetchall(), 1):
        rows.append([f"COA-{i:03d}", r[0], r[1], r[2] or ""])
    headers = ["fact_id", "ontvanger", "staffel", "regeling"]
    return "coa_rows.csv", headers, rows


# ============================================================
# MAIN
# ============================================================
def main():
    print(f"Connecting to database...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    print(f"Connected.\n")

    cleanup_old_facts()

    extractors = [
        extract_instrumenten,
        extract_apparaat,
        extract_inkoop,
        extract_provincie,
        extract_gemeente,
        extract_publiek,
        extract_coa,
    ]

    total = 0
    for fn in extractors:
        print(f"Extracting {fn.__doc__.split('.')[0].strip()}...")
        filename, headers, rows = fn(cur)
        count = write_csv(filename, headers, rows)
        total += count

    cur.close()
    conn.close()

    print(f"\n{'=' * 60}")
    print(f"DONE: {total} facts extracted across {len(extractors)} queries")
    print(f"Facts directory: {FACTS_DIR}")
    print(f"Verified at: {NOW}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
