#!/usr/bin/env python3
"""
Phase 1e: UNDO Phase 1d completely.
Phase 1d did blanket reversal that corrupted 23,911 rows of GOOD data.
This script reverses Phase 1d to restore the correct characters.
"""
import asyncio
import asyncpg
import os
import sys

DB_PASSWORD = os.environ.get('SUPABASE_DB_PASSWORD')
if not DB_PASSWORD:
    print("ERROR: Set SUPABASE_DB_PASSWORD environment variable first")
    sys.exit(1)

DB_URL = f"postgresql://postgres.kmdelrgtgglcrupprkqf:{DB_PASSWORD}@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

# Reverse Phase 1d Step 1: ´→ô in ALL tables
UNDO_STEP1 = [('´', 'ô', '´→ô')]

# Reverse Phase 1d Step 2: reverse all non-inkoop replacements
UNDO_STEP2 = [
    ('¡', 'á', '¡→á'),
    ('¢', 'â', '¢→â'),
    ('¤', 'ä', '¤→ä'),
    ('§', 'ç', '§→ç'),
    ('¨', 'è', '¨→è'),
    ('«', 'ë', '«→ë'),
    ('¯', 'ï', '¯→ï'),
    ('±', 'ñ', '±→ñ'),
    ('¶', 'ö', '¶→ö'),
    ('¸', 'ø', '¸→ø'),
    ('¹', 'ù', '¹→ù'),
    ('º', 'ú', 'º→ú'),
    ('»', 'û', '»→û'),
]

TABLE_COLUMNS_ALL = [
    ('instrumenten', ['ontvanger', 'regeling', 'detail', 'begrotingsnaam']),
    ('inkoop', ['leverancier', 'categorie']),
    ('apparaat', ['kostensoort', 'detail', 'begrotingsnaam']),
    ('provincie', ['ontvanger', 'omschrijving']),
    ('gemeente', ['ontvanger', 'omschrijving', 'regeling']),
    ('publiek', ['ontvanger', 'omschrijving', 'regeling']),
]

TABLE_COLUMNS_NON_INKOOP = [
    ('instrumenten', ['ontvanger', 'regeling', 'detail', 'begrotingsnaam']),
    ('apparaat', ['kostensoort', 'detail', 'begrotingsnaam']),
    ('provincie', ['ontvanger', 'omschrijving']),
    ('gemeente', ['ontvanger', 'omschrijving', 'regeling']),
    ('publiek', ['ontvanger', 'omschrijving', 'regeling']),
]


async def main():
    print("UNDOING Phase 1d...")
    conn = await asyncpg.connect(DB_URL, statement_cache_size=0, timeout=30)

    total = 0

    # Step 1: Undo ´→ô reversal
    print("\n=== Undo Step 1: ´→ô in ALL tables ===")
    for wrong, correct, desc in UNDO_STEP1:
        for table, columns in TABLE_COLUMNS_ALL:
            for column in columns:
                sql = f"UPDATE {table} SET {column} = REPLACE({column}, $1, $2) WHERE {column} LIKE $3"
                result = await conn.execute(sql, wrong, correct, f"%{wrong}%")
                count = int(result.split()[-1]) if result.startswith("UPDATE") else 0
                if count > 0:
                    total += count
                    print(f"  {desc}: {table}.{column}: {count} rows")

    # Step 2: Undo character reversals in non-inkoop tables
    print("\n=== Undo Step 2: Restore correct chars in non-inkoop tables ===")
    for wrong, correct, desc in UNDO_STEP2:
        for table, columns in TABLE_COLUMNS_NON_INKOOP:
            for column in columns:
                sql = f"UPDATE {table} SET {column} = REPLACE({column}, $1, $2) WHERE {column} LIKE $3"
                result = await conn.execute(sql, wrong, correct, f"%{wrong}%")
                count = int(result.split()[-1]) if result.startswith("UPDATE") else 0
                if count > 0:
                    total += count
                    print(f"  {desc}: {table}.{column}: {count} rows")

    print(f"\nTotal rows restored: {total}")

    # Verify
    print("\n--- Quick verification ---")
    for check, query in [
        ("Café count", "SELECT COUNT(DISTINCT ontvanger) FROM instrumenten WHERE ontvanger LIKE '%café%' OR ontvanger LIKE '%Café%'"),
        ("financiële count", "SELECT COUNT(*) FROM instrumenten WHERE regeling LIKE '%financiële%' OR regeling LIKE '%Financiële%'"),
        ("coöperatie count", "SELECT COUNT(DISTINCT ontvanger) FROM instrumenten WHERE ontvanger LIKE '%oöper%'"),
    ]:
        val = await conn.fetchval(query)
        print(f"  {check}: {val}")

    await conn.close()
    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
