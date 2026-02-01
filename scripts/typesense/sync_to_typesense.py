#!/usr/bin/env python3
"""
Typesense Data Sync Script
==========================
Syncs data from Supabase to Typesense for search indexing.

Created: 2026-01-23
Usage: python sync_to_typesense.py [--collection NAME] [--recreate]

Environment variables required:
  TYPESENSE_HOST      - Typesense server URL (e.g., typesense-production-xxxx.up.railway.app)
  TYPESENSE_API_KEY   - API key for authentication
  SUPABASE_DB_URL     - PostgreSQL connection string
"""

import os
import sys
import json
import argparse
from pathlib import Path

try:
    import typesense
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    print("Missing dependencies. Install with:")
    print("  pip install typesense psycopg2-binary")
    sys.exit(1)

# Configuration
TYPESENSE_HOST = os.environ.get('TYPESENSE_HOST', 'typesense-production-35ae.up.railway.app')
TYPESENSE_API_KEY = os.environ.get('TYPESENSE_API_KEY', '0vh4mxafjeuvd676gw92kpjflg6fuv57')
TYPESENSE_PORT = os.environ.get('TYPESENSE_PORT', '443')
TYPESENSE_PROTOCOL = os.environ.get('TYPESENSE_PROTOCOL', 'https')

SUPABASE_DB_URL = os.environ.get('SUPABASE_DB_URL', '')

# Batch size for indexing
BATCH_SIZE = 1000

def get_typesense_client():
    """Create Typesense client."""
    if not TYPESENSE_HOST:
        print("ERROR: TYPESENSE_HOST environment variable not set")
        sys.exit(1)

    return typesense.Client({
        'nodes': [{
            'host': TYPESENSE_HOST,
            'port': TYPESENSE_PORT,
            'protocol': TYPESENSE_PROTOCOL
        }],
        'api_key': TYPESENSE_API_KEY,
        'connection_timeout_seconds': 10
    })

def get_db_connection():
    """Create PostgreSQL connection."""
    if not SUPABASE_DB_URL:
        print("ERROR: SUPABASE_DB_URL environment variable not set")
        sys.exit(1)

    return psycopg2.connect(SUPABASE_DB_URL)

def load_collection_schemas():
    """Load collection schemas from JSON file."""
    schema_file = Path(__file__).parent / 'collections.json'
    with open(schema_file) as f:
        data = json.load(f)
    return {c['name']: c for c in data['collections']}

def create_collection(client, schema, recreate=False):
    """Create a Typesense collection."""
    name = schema['name']

    try:
        if recreate:
            try:
                client.collections[name].delete()
                print(f"  Deleted existing collection: {name}")
            except typesense.exceptions.ObjectNotFound:
                pass

        client.collections.create(schema)
        print(f"  Created collection: {name}")
    except typesense.exceptions.ObjectAlreadyExists:
        print(f"  Collection already exists: {name}")

def index_recipients(client, conn, recreate=False):
    """Index recipients from universal_search."""
    print("\nIndexing recipients...")

    schemas = load_collection_schemas()
    create_collection(client, schemas['recipients'], recreate)

    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT
            ontvanger_key,
            ontvanger,
            sources,
            source_count,
            totaal,
            GREATEST(
                CASE WHEN "2024" > 0 THEN 2024 ELSE 0 END,
                CASE WHEN "2023" > 0 THEN 2023 ELSE 0 END,
                CASE WHEN "2022" > 0 THEN 2022 ELSE 0 END,
                CASE WHEN "2021" > 0 THEN 2021 ELSE 0 END,
                CASE WHEN "2020" > 0 THEN 2020 ELSE 0 END
            ) as latest_year
        FROM universal_search
        WHERE ontvanger IS NOT NULL AND ontvanger != ''
        ORDER BY totaal DESC
    """)

    documents = []
    count = 0

    for row in cursor:
        doc = {
            'id': row['ontvanger_key'][:512],  # Typesense max ID length
            'name': row['ontvanger'] or '',
            'name_lower': (row['ontvanger'] or '').lower(),
            'sources': (row['sources'] or '').split(', ') if row['sources'] else [],
            'source_count': row['source_count'] or 0,
            'totaal': int(row['totaal'] or 0),
            'latest_year': row['latest_year'] or 0
        }
        documents.append(doc)

        if len(documents) >= BATCH_SIZE:
            client.collections['recipients'].documents.import_(documents, {'action': 'upsert'})
            count += len(documents)
            print(f"  Indexed {count} recipients...")
            documents = []

    if documents:
        client.collections['recipients'].documents.import_(documents, {'action': 'upsert'})
        count += len(documents)

    print(f"  Total recipients indexed: {count}")
    cursor.close()

def index_instrumenten(client, conn, recreate=False):
    """Index instrumenten table."""
    print("\nIndexing instrumenten...")

    schemas = load_collection_schemas()
    create_collection(client, schemas['instrumenten'], recreate)

    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT
            id,
            ontvanger,
            regeling,
            begrotingsnaam,
            artikel,
            instrument,
            begrotingsjaar,
            COALESCE(bedrag, 0)::bigint * 1000 as bedrag
        FROM instrumenten
        WHERE ontvanger IS NOT NULL AND ontvanger != ''
    """)

    documents = []
    count = 0

    for row in cursor:
        doc = {
            'id': str(row['id']),
            'ontvanger': row['ontvanger'] or '',
            'ontvanger_lower': (row['ontvanger'] or '').lower(),
            'regeling': row['regeling'] or '',
            'begrotingsnaam': row['begrotingsnaam'] or '',
            'artikel': row['artikel'] or '',
            'instrument': row['instrument'] or '',
            'begrotingsjaar': row['begrotingsjaar'] or 0,
            'bedrag': int(row['bedrag'] or 0)
        }
        documents.append(doc)

        if len(documents) >= BATCH_SIZE:
            client.collections['instrumenten'].documents.import_(documents, {'action': 'upsert'})
            count += len(documents)
            print(f"  Indexed {count} instrumenten...")
            documents = []

    if documents:
        client.collections['instrumenten'].documents.import_(documents, {'action': 'upsert'})
        count += len(documents)

    print(f"  Total instrumenten indexed: {count}")
    cursor.close()

def index_inkoop(client, conn, recreate=False):
    """Index inkoop table."""
    print("\nIndexing inkoop...")

    schemas = load_collection_schemas()
    create_collection(client, schemas['inkoop'], recreate)

    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT
            id,
            leverancier,
            ministerie,
            categorie,
            staffel,
            jaar,
            COALESCE(totaal_avg, 0)::bigint as totaal_avg
        FROM inkoop
        WHERE leverancier IS NOT NULL AND leverancier != ''
    """)

    documents = []
    count = 0

    for row in cursor:
        doc = {
            'id': str(row['id']),
            'leverancier': row['leverancier'] or '',
            'leverancier_lower': (row['leverancier'] or '').lower(),
            'ministerie': row['ministerie'] or '',
            'categorie': row['categorie'] or '',
            'staffel': row['staffel'] or 0,
            'jaar': row['jaar'] or 0,
            'totaal_avg': int(row['totaal_avg'] or 0)
        }
        documents.append(doc)

        if len(documents) >= BATCH_SIZE:
            client.collections['inkoop'].documents.import_(documents, {'action': 'upsert'})
            count += len(documents)
            print(f"  Indexed {count} inkoop...")
            documents = []

    if documents:
        client.collections['inkoop'].documents.import_(documents, {'action': 'upsert'})
        count += len(documents)

    print(f"  Total inkoop indexed: {count}")
    cursor.close()

def index_publiek(client, conn, recreate=False):
    """Index publiek table."""
    print("\nIndexing publiek...")

    schemas = load_collection_schemas()
    create_collection(client, schemas['publiek'], recreate)

    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT
            id,
            ontvanger,
            source,
            regeling,
            omschrijving,
            jaar,
            COALESCE(bedrag, 0) as bedrag
        FROM publiek
        WHERE ontvanger IS NOT NULL AND ontvanger != ''
    """)

    documents = []
    count = 0

    for row in cursor:
        doc = {
            'id': str(row['id']),
            'ontvanger': row['ontvanger'] or '',
            'ontvanger_lower': (row['ontvanger'] or '').lower(),
            'source': row['source'] or '',
            'regeling': row['regeling'] or '',
            'omschrijving': (row['omschrijving'] or '')[:500],  # Limit length
            'jaar': row['jaar'] or 0,
            'bedrag': int(row['bedrag'] or 0)
        }
        documents.append(doc)

        if len(documents) >= BATCH_SIZE:
            client.collections['publiek'].documents.import_(documents, {'action': 'upsert'})
            count += len(documents)
            print(f"  Indexed {count} publiek...")
            documents = []

    if documents:
        client.collections['publiek'].documents.import_(documents, {'action': 'upsert'})
        count += len(documents)

    print(f"  Total publiek indexed: {count}")
    cursor.close()

def index_gemeente(client, conn, recreate=False):
    """Index gemeente table."""
    print("\nIndexing gemeente...")

    schemas = load_collection_schemas()
    create_collection(client, schemas['gemeente'], recreate)

    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT
            id,
            ontvanger,
            gemeente,
            beleidsterrein,
            regeling,
            omschrijving,
            jaar,
            COALESCE(bedrag, 0) as bedrag
        FROM gemeente
        WHERE ontvanger IS NOT NULL AND ontvanger != ''
    """)

    documents = []
    count = 0

    for row in cursor:
        doc = {
            'id': str(row['id']),
            'ontvanger': row['ontvanger'] or '',
            'ontvanger_lower': (row['ontvanger'] or '').lower(),
            'gemeente': row['gemeente'] or '',
            'beleidsterrein': row['beleidsterrein'] or '',
            'regeling': row['regeling'] or '',
            'omschrijving': (row['omschrijving'] or '')[:500],
            'jaar': row['jaar'] or 0,
            'bedrag': int(row['bedrag'] or 0)
        }
        documents.append(doc)

        if len(documents) >= BATCH_SIZE:
            client.collections['gemeente'].documents.import_(documents, {'action': 'upsert'})
            count += len(documents)
            print(f"  Indexed {count} gemeente...")
            documents = []

    if documents:
        client.collections['gemeente'].documents.import_(documents, {'action': 'upsert'})
        count += len(documents)

    print(f"  Total gemeente indexed: {count}")
    cursor.close()

def index_provincie(client, conn, recreate=False):
    """Index provincie table."""
    print("\nIndexing provincie...")

    schemas = load_collection_schemas()
    create_collection(client, schemas['provincie'], recreate)

    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT
            id,
            ontvanger,
            provincie,
            omschrijving,
            jaar,
            COALESCE(bedrag, 0) as bedrag
        FROM provincie
        WHERE ontvanger IS NOT NULL AND ontvanger != ''
    """)

    documents = []
    count = 0

    for row in cursor:
        doc = {
            'id': str(row['id']),
            'ontvanger': row['ontvanger'] or '',
            'ontvanger_lower': (row['ontvanger'] or '').lower(),
            'provincie': row['provincie'] or '',
            'omschrijving': (row['omschrijving'] or '')[:500],
            'jaar': row['jaar'] or 0,
            'bedrag': int(row['bedrag'] or 0)
        }
        documents.append(doc)

        if len(documents) >= BATCH_SIZE:
            client.collections['provincie'].documents.import_(documents, {'action': 'upsert'})
            count += len(documents)
            print(f"  Indexed {count} provincie...")
            documents = []

    if documents:
        client.collections['provincie'].documents.import_(documents, {'action': 'upsert'})
        count += len(documents)

    print(f"  Total provincie indexed: {count}")
    cursor.close()

def index_apparaat(client, conn, recreate=False):
    """Index apparaat table - aggregated by kostensoort + begrotingsnaam."""
    print("\nIndexing apparaat...")

    schemas = load_collection_schemas()
    create_collection(client, schemas['apparaat'], recreate)

    cursor = conn.cursor(cursor_factory=RealDictCursor)
    # Aggregate by kostensoort + begrotingsnaam, sum bedrag across all years
    # Note: apparaat bedrag is in ×1000, so multiply by 1000 for absolute euros
    cursor.execute("""
        SELECT
            kostensoort,
            begrotingsnaam,
            artikel,
            detail,
            SUM(COALESCE(bedrag, 0)::bigint) * 1000 as totaal
        FROM apparaat
        WHERE kostensoort IS NOT NULL AND kostensoort != ''
        GROUP BY kostensoort, begrotingsnaam, artikel, detail
        ORDER BY totaal DESC
    """)

    documents = []
    count = 0

    for row in cursor:
        # Create unique ID from all 4 grouped fields to prevent collisions
        id_str = f"{row['kostensoort']}|{row['begrotingsnaam'] or ''}|{row['artikel'] or ''}|{row['detail'] or ''}"
        doc = {
            'id': id_str[:512],  # Typesense max ID length
            'kostensoort': row['kostensoort'] or '',
            'kostensoort_lower': (row['kostensoort'] or '').lower(),
            'begrotingsnaam': row['begrotingsnaam'] or '',
            'begrotingsnaam_lower': (row['begrotingsnaam'] or '').lower(),
            'artikel': row['artikel'] or '',
            'detail': (row['detail'] or '')[:500],
            'totaal': int(row['totaal'] or 0)
        }
        documents.append(doc)

        if len(documents) >= BATCH_SIZE:
            client.collections['apparaat'].documents.import_(documents, {'action': 'upsert'})
            count += len(documents)
            print(f"  Indexed {count} apparaat records...")
            documents = []

    if documents:
        client.collections['apparaat'].documents.import_(documents, {'action': 'upsert'})
        count += len(documents)

    print(f"  Total apparaat records indexed: {count}")
    cursor.close()

def test_search(client):
    """Test search performance."""
    print("\n" + "="*50)
    print("Testing search performance...")
    print("="*50)

    import time

    # Test recipients collection
    print("\n  Recipients collection:")
    test_queries = ['prorail', 'amsterdam', 'subsidie', 'ns']

    for query in test_queries:
        start = time.time()
        result = client.collections['recipients'].documents.search({
            'q': query,
            'query_by': 'name,name_lower',
            'per_page': 10
        })
        elapsed = (time.time() - start) * 1000

        hits = result.get('found', 0)
        print(f"    '{query}': {hits} hits in {elapsed:.0f}ms {'✅' if elapsed < 100 else '⚠️'}")

    # Test apparaat collection (if it has data)
    try:
        info = client.collections['apparaat'].retrieve()
        if info.get('num_documents', 0) > 0:
            print("\n  Apparaat collection:")
            apparaat_queries = ['ICT', 'defensie', 'abonnementen', 'huisvesting']

            for query in apparaat_queries:
                start = time.time()
                result = client.collections['apparaat'].documents.search({
                    'q': query,
                    'query_by': 'kostensoort,kostensoort_lower,begrotingsnaam,begrotingsnaam_lower',
                    'query_by_weights': '100,100,50,50',
                    'per_page': 10
                })
                elapsed = (time.time() - start) * 1000

                hits = result.get('found', 0)
                print(f"    '{query}': {hits} hits in {elapsed:.0f}ms {'✅' if elapsed < 100 else '⚠️'}")
    except Exception:
        print("\n  Apparaat collection: not yet populated")

def audit_collections(client, conn):
    """
    MANDATORY audit after sync: verify Typesense counts match PostgreSQL.

    This prevents incomplete indexes that cause missing search results.
    The sync script will EXIT WITH ERROR if counts don't match.
    """
    print("\n" + "="*50)
    print("AUDIT: Verifying Typesense vs PostgreSQL counts")
    print("="*50)

    cursor = conn.cursor()

    # Collection name -> (PostgreSQL query, tolerance %)
    checks = [
        ('recipients', "SELECT COUNT(*) FROM universal_search WHERE ontvanger IS NOT NULL AND ontvanger != ''", 0),
        ('instrumenten', "SELECT COUNT(*) FROM instrumenten WHERE ontvanger IS NOT NULL AND ontvanger != ''", 0),
        ('inkoop', "SELECT COUNT(*) FROM inkoop WHERE leverancier IS NOT NULL AND leverancier != ''", 0),
        ('publiek', "SELECT COUNT(*) FROM publiek WHERE ontvanger IS NOT NULL AND ontvanger != ''", 0),
        ('gemeente', "SELECT COUNT(*) FROM gemeente WHERE ontvanger IS NOT NULL AND ontvanger != ''", 0),
        ('provincie', "SELECT COUNT(*) FROM provincie WHERE ontvanger IS NOT NULL AND ontvanger != ''", 0),
        ('apparaat', """SELECT COUNT(*) FROM (
            SELECT 1 FROM apparaat WHERE kostensoort IS NOT NULL AND kostensoort != ''
            GROUP BY kostensoort, begrotingsnaam, artikel, detail
        ) t""", 0),
    ]

    all_passed = True

    for collection, query, tolerance in checks:
        try:
            info = client.collections[collection].retrieve()
            ts_count = info.get('num_documents', 0)
        except Exception as e:
            print(f"  ❌ {collection}: Cannot retrieve from Typesense ({e})")
            all_passed = False
            continue

        cursor.execute(query)
        pg_count = cursor.fetchone()[0]

        diff = abs(ts_count - pg_count)
        pct = (diff / pg_count * 100) if pg_count > 0 else 0

        if diff == 0:
            print(f"  ✅ {collection}: {ts_count:,} documents (exact match)")
        elif pct <= tolerance:
            print(f"  ⚠️  {collection}: {ts_count:,} vs {pg_count:,} ({pct:.1f}% diff, within tolerance)")
        else:
            print(f"  ❌ {collection}: {ts_count:,} vs {pg_count:,} ({diff:,} missing, {pct:.1f}%)")
            all_passed = False

    cursor.close()

    print()
    if all_passed:
        print("✅ AUDIT PASSED: All collections verified")
    else:
        print("❌ AUDIT FAILED: Some collections have mismatches!")
        print("   Data integrity issue - DO NOT USE until fixed.")

    return all_passed


def main():
    parser = argparse.ArgumentParser(description='Sync data to Typesense')
    parser.add_argument('--collection', help='Only sync specific collection')
    parser.add_argument('--recreate', action='store_true', help='Recreate collections')
    parser.add_argument('--test-only', action='store_true', help='Only run search test')
    parser.add_argument('--audit-only', action='store_true', help='Only run audit (no sync)')
    args = parser.parse_args()

    print("="*50)
    print("Typesense Data Sync")
    print("="*50)

    client = get_typesense_client()

    # Test connection
    try:
        health = client.operations.is_healthy()
        print(f"Typesense connection: {'✅ Healthy' if health else '❌ Unhealthy'}")
    except Exception as e:
        print(f"❌ Cannot connect to Typesense: {e}")
        sys.exit(1)

    if args.test_only:
        test_search(client)
        return

    conn = get_db_connection()
    print(f"Database connection: ✅ Connected")

    if args.audit_only:
        # Just run audit without syncing
        passed = audit_collections(client, conn)
        conn.close()
        sys.exit(0 if passed else 1)

    collections_to_sync = {
        'recipients': index_recipients,
        'instrumenten': index_instrumenten,
        'inkoop': index_inkoop,
        'publiek': index_publiek,
        'gemeente': index_gemeente,
        'provincie': index_provincie,
        'apparaat': index_apparaat,
    }

    if args.collection:
        if args.collection in collections_to_sync:
            collections_to_sync[args.collection](client, conn, args.recreate)
        else:
            print(f"Unknown collection: {args.collection}")
            print(f"Available: {', '.join(collections_to_sync.keys())}")
            sys.exit(1)
    else:
        for name, func in collections_to_sync.items():
            func(client, conn, args.recreate)

    # Run search test
    test_search(client)

    # MANDATORY: Audit after sync to verify data integrity
    passed = audit_collections(client, conn)
    conn.close()

    print("\n" + "="*50)
    if passed:
        print("Sync complete! ✅")
    else:
        print("Sync complete but AUDIT FAILED! ❌")
        print("Check for data issues before using in production.")
        sys.exit(1)
    print("="*50)

if __name__ == '__main__':
    main()
