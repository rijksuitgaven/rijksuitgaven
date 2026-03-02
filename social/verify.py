#!/usr/bin/env python3
"""Verify all facts in social/facts/ against the live database.

Re-runs each query and compares results to the stored CSV values.
Reports: PASS (exact match), CHANGED (value differs), MISSING (entity gone).

Usage:
    python3 social/verify.py              # Verify all facts
    python3 social/verify.py --module instrumenten  # Verify one module
    python3 social/verify.py --fact INSTR-TOP-001   # Verify one fact

Requires: psycopg2 (pip install psycopg2-binary)
"""
import csv
import os
import sys
import argparse
from datetime import datetime, timezone

try:
    import psycopg2
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

SOCIAL_DIR = os.path.dirname(os.path.abspath(__file__))
FACTS_DIR = os.path.join(SOCIAL_DIR, "facts")
BACKEND_DIR = os.path.join(os.path.dirname(SOCIAL_DIR), "backend")
ENV_PATH = os.path.join(BACKEND_DIR, ".env")


def load_database_url():
    with open(ENV_PATH) as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                return line.strip().split("=", 1)[1]
    raise RuntimeError(f"DATABASE_URL not found in {ENV_PATH}")


def load_facts(module_filter=None, fact_filter=None):
    """Load all facts from CSV files, optionally filtered."""
    facts = []
    for fname in sorted(os.listdir(FACTS_DIR)):
        if not fname.endswith(".csv"):
            continue
        path = os.path.join(FACTS_DIR, fname)
        with open(path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if module_filter and row.get("module") != module_filter:
                    continue
                if fact_filter and row.get("fact_id") != fact_filter:
                    continue
                row["_source_file"] = fname
                facts.append(row)
    return facts


def verify_instrumenten_top(cur, fact):
    """Verify a fact from instrumenten_top.csv"""
    entity = fact["entity"]
    cur.execute(
        'SELECT totaal, "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016" '
        "FROM instrumenten_aggregated WHERE ontvanger = %s",
        (entity,)
    )
    row = cur.fetchone()
    if not row:
        return "MISSING", f"Entity '{entity}' not found in instrumenten_aggregated"

    db_total = row[0]
    csv_total = int(fact["value"])
    if db_total != csv_total:
        return "CHANGED", f"totaal: CSV={csv_total}, DB={db_total} (diff={db_total - csv_total})"

    # Verify individual years
    year_cols = ["y2024", "y2023", "y2022", "y2021", "y2020", "y2019", "y2018", "y2017", "y2016"]
    for i, ycol in enumerate(year_cols):
        if ycol in fact:
            db_val = row[i + 1] or 0
            csv_val = int(fact[ycol]) if fact[ycol] else 0
            if db_val != csv_val:
                return "CHANGED", f"{ycol}: CSV={csv_val}, DB={db_val}"

    return "PASS", ""


def verify_gemeente_top(cur, fact):
    """Verify a fact from gemeente_top.csv"""
    entity = fact["entity"]
    gemeente = fact["gemeente"]
    cur.execute(
        "SELECT totaal FROM gemeente_aggregated WHERE ontvanger = %s AND gemeente = %s",
        (entity, gemeente)
    )
    row = cur.fetchone()
    if not row:
        return "MISSING", f"Entity '{entity}' in '{gemeente}' not found"

    db_total = row[0]
    csv_total = int(fact["value"])
    if db_total != csv_total:
        return "CHANGED", f"totaal: CSV={csv_total}, DB={db_total}"
    return "PASS", ""


def verify_provincie_top(cur, fact):
    """Verify a fact from provincie_top.csv"""
    entity = fact["entity"]
    provincie = fact["provincie"]
    cur.execute(
        "SELECT totaal FROM provincie_aggregated WHERE ontvanger = %s AND provincie = %s",
        (entity, provincie)
    )
    row = cur.fetchone()
    if not row:
        return "MISSING", f"Entity '{entity}' in '{provincie}' not found"

    db_total = row[0]
    csv_total = int(fact["value"])
    if db_total != csv_total:
        return "CHANGED", f"totaal: CSV={csv_total}, DB={db_total}"
    return "PASS", ""


def verify_inkoop_top(cur, fact):
    """Verify a fact from inkoop_top.csv"""
    entity = fact["entity"]
    cur.execute(
        "SELECT row_count, staffel FROM inkoop_aggregated WHERE leverancier = %s",
        (entity,)
    )
    row = cur.fetchone()
    if not row:
        return "MISSING", f"Entity '{entity}' not found in inkoop_aggregated"

    db_count = row[0]
    csv_count = int(fact["contract_count"])
    if db_count != csv_count:
        return "CHANGED", f"contract_count: CSV={csv_count}, DB={db_count}"
    return "PASS", ""


def verify_publiek_top(cur, fact):
    """Verify a fact from publiek_top.csv"""
    entity = fact["entity"]
    source = fact["source"]
    cur.execute(
        "SELECT row_count FROM publiek_aggregated WHERE ontvanger = %s AND source = %s",
        (entity, source)
    )
    row = cur.fetchone()
    if not row:
        return "MISSING", f"Entity '{entity}' (source={source}) not found"

    db_count = row[0]
    csv_count = int(fact["contract_count"])
    if db_count != csv_count:
        return "CHANGED", f"contract_count: CSV={csv_count}, DB={db_count}"
    return "PASS", ""


def verify_apparaat_top(cur, fact):
    """Verify a fact from apparaat_top.csv"""
    entity = fact["entity"]
    cur.execute(
        "SELECT totaal FROM apparaat_aggregated WHERE kostensoort = %s",
        (entity,)
    )
    row = cur.fetchone()
    if not row:
        return "MISSING", f"Kostensoort '{entity}' not found"

    db_total = row[0]
    csv_total = int(fact["value"])
    if db_total != csv_total:
        return "CHANGED", f"totaal: CSV={csv_total}, DB={db_total}"
    return "PASS", ""


def verify_generic(cur, fact):
    """Generic pass for facts that need specialized verification."""
    return "SKIP", "No specialized verifier for this query_ref"


# Map query_ref to verifier function
VERIFIERS = {
    "Q-INSTR-01": verify_instrumenten_top,
    "Q-GEM-01": verify_gemeente_top,
    "Q-PROV-01": verify_provincie_top,
    "Q-INKOOP-01": verify_inkoop_top,
    "Q-PUB-01": verify_publiek_top,
    "Q-APP-01": verify_apparaat_top,
    # YoY and aggregation queries use generic for now
    "Q-INSTR-02": verify_generic,
    "Q-INSTR-03": verify_generic,
    "Q-GEM-02": verify_generic,
    "Q-GEM-03": verify_generic,
    "Q-PROV-02": verify_generic,
    "Q-INKOOP-02": verify_generic,
    "Q-INKOOP-03": verify_generic,
    "Q-PUB-02": verify_generic,
    "Q-APP-02": verify_generic,
    "Q-APP-03": verify_generic,
    "Q-CROSS-01": verify_generic,
    "Q-CROSS-02": verify_generic,
}


def main():
    parser = argparse.ArgumentParser(description="Verify social media facts against live DB")
    parser.add_argument("--module", help="Only verify facts for this module")
    parser.add_argument("--fact", help="Only verify this specific fact_id")
    args = parser.parse_args()

    facts = load_facts(module_filter=args.module, fact_filter=args.fact)
    if not facts:
        print("No facts found matching filter criteria.")
        sys.exit(1)

    print(f"Verifying {len(facts)} facts against live database...\n")

    conn = psycopg2.connect(load_database_url())
    cur = conn.cursor()

    results = {"PASS": 0, "CHANGED": 0, "MISSING": 0, "SKIP": 0}
    failures = []

    for fact in facts:
        query_ref = fact.get("query_ref", "")
        verifier = VERIFIERS.get(query_ref, verify_generic)
        status, detail = verifier(cur, fact)
        results[status] += 1

        if status in ("CHANGED", "MISSING"):
            failures.append((fact["fact_id"], status, detail))
            print(f"  FAIL  {fact['fact_id']}: {status} — {detail}")

    cur.close()
    conn.close()

    print(f"\n{'='*60}")
    print(f"VERIFICATION RESULTS")
    print(f"{'='*60}")
    print(f"  PASS:    {results['PASS']}")
    print(f"  CHANGED: {results['CHANGED']}")
    print(f"  MISSING: {results['MISSING']}")
    print(f"  SKIP:    {results['SKIP']} (no specialized verifier)")
    print(f"  TOTAL:   {sum(results.values())}")

    if failures:
        print(f"\nFAILURES ({len(failures)}):")
        for fid, status, detail in failures:
            print(f"  {fid}: {status} — {detail}")
        sys.exit(1)
    else:
        print(f"\nAll verifiable facts PASS.")
        sys.exit(0)


if __name__ == "__main__":
    main()
