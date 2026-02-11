#!/usr/bin/env python3
"""Check remaining encoding corruption across all tables."""
import asyncio
import asyncpg
import os
import sys

DB_PASSWORD = os.environ.get('SUPABASE_DB_PASSWORD')
if not DB_PASSWORD:
    print("ERROR: Set SUPABASE_DB_PASSWORD environment variable first")
    sys.exit(1)

DB_URL = f"postgresql://postgres.kmdelrgtgglcrupprkqf:{DB_PASSWORD}@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

COLUMNS = [
    ('instrumenten', 'ontvanger'),
    ('instrumenten', 'regeling'),
    ('instrumenten', 'detail'),
    ('instrumenten', 'begrotingsnaam'),
    ('inkoop', 'leverancier'),
    ('inkoop', 'categorie'),
    ('apparaat', 'kostensoort'),
    ('apparaat', 'detail'),
    ('apparaat', 'begrotingsnaam'),
    ('provincie', 'ontvanger'),
    ('provincie', 'omschrijving'),
    ('gemeente', 'ontvanger'),
    ('gemeente', 'omschrijving'),
    ('gemeente', 'regeling'),
    ('publiek', 'ontvanger'),
    ('publiek', 'omschrijving'),
    ('publiek', 'regeling'),
]


async def main():
    conn = await asyncpg.connect(DB_URL, statement_cache_size=0, timeout=30)

    for pattern_name, pattern in [("Ã (double-encoded)", "%Ã%"), ("â€ (smart quotes)", "%â€%"), ("Â (win1252)", "%Â%")]:
        print(f"\n=== Remaining: {pattern_name} ===")
        for table, col in COLUMNS:
            sql = f"SELECT DISTINCT {col}, COUNT(*) as cnt FROM {table} WHERE {col} LIKE $1 GROUP BY {col} ORDER BY cnt DESC"
            rows = await conn.fetch(sql, pattern)
            for r in rows:
                print(f"  {table}.{col} ({r['cnt']}x): {r[col][:120]}")

    await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
