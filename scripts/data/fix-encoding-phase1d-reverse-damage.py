#!/usr/bin/env python3
"""
Phase 1d: REVERSE wrong Phase 1c replacements.
Phase 1c did blanket character replacements across ALL tables, but the triple encoding
only affected inkoop.leverancier. Most replacements in other tables corrupted good data.
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

# Phase 1b triple-standard only affected inkoop.leverancier (and 1 row in instrumenten.ontvanger for «)
# Phase 1c then replaced across ALL tables — need to reverse for non-inkoop tables

# Characters to reverse in ALL tables (including inkoop.leverancier)
# because the vast majority were wrong
REVERSE_ALL_TABLES = [
    # (wrong_char, original_char, description)
    ('ô', '´', 'ô→´ (apostrophe in Dutch names)'),  # 823 total, only 6 from triple
]

# Characters to reverse in all tables EXCEPT inkoop.leverancier
# because inkoop had the actual triple encoding
REVERSE_NON_INKOOP = [
    ('á', '¡', 'á→¡'),      # ¡ not in non-inkoop
    ('â', '¢', 'â→¢'),      # ¢ not in non-inkoop
    ('ä', '¤', 'ä→¤'),      # ¤ not in non-inkoop
    ('ç', '§', 'ç→§'),      # § common in legal text
    ('è', '¨', 'è→¨'),      # ¨ used as quotation marks
    ('ë', '«', 'ë→«'),      # « rare but possible
    ('ï', '¯', 'ï→¯'),      # ¯ not in non-inkoop
    ('ñ', '±', 'ñ→±'),      # ± possible in data
    ('ö', '¶', 'ö→¶'),      # ¶ not in non-inkoop
    ('ø', '¸', 'ø→¸'),      # ¸ not in non-inkoop
    ('ù', '¹', 'ù→¹'),      # ¹ possible in data
    ('ú', 'º', 'ú→º'),      # º used in addresses
    ('û', '»', 'û→»'),      # » rare
]

# Also reverse ´→ô in inkoop.leverancier for pre-existing acute accents
# (61 pre-existing were wrongly changed, 6 were correctly from triple)
# But we accept the 6 collateral damage since 61 >> 6

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
    print("Connecting to Supabase...")
    conn = await asyncpg.connect(DB_URL, statement_cache_size=0, timeout=30)
    print("Connected.\n")

    total = 0

    # Step 1: Reverse ô→´ in ALL tables
    print("=== Step 1: Reverse ô→´ in ALL tables ===")
    for wrong, orig, desc in REVERSE_ALL_TABLES:
        for table, columns in TABLE_COLUMNS_ALL:
            for column in columns:
                sql = f"UPDATE {table} SET {column} = REPLACE({column}, $1, $2) WHERE {column} LIKE $3"
                result = await conn.execute(sql, wrong, orig, f"%{wrong}%")
                count = int(result.split()[-1]) if result.startswith("UPDATE") else 0
                if count > 0:
                    total += count
                    print(f"  {desc}: {table}.{column}: {count} rows")

    # Step 2: Reverse other chars in non-inkoop tables
    print("\n=== Step 2: Reverse other chars in non-inkoop tables ===")
    for wrong, orig, desc in REVERSE_NON_INKOOP:
        for table, columns in TABLE_COLUMNS_NON_INKOOP:
            for column in columns:
                sql = f"UPDATE {table} SET {column} = REPLACE({column}, $1, $2) WHERE {column} LIKE $3"
                result = await conn.execute(sql, wrong, orig, f"%{wrong}%")
                count = int(result.split()[-1]) if result.startswith("UPDATE") else 0
                if count > 0:
                    total += count
                    print(f"  {desc}: {table}.{column}: {count} rows")

    print(f"\nTotal rows reversed: {total}")

    # Verify: check sample values in problematic tables
    print("\n--- Verification samples ---")
    samples = await conn.fetch(
        "SELECT DISTINCT ontvanger FROM instrumenten WHERE ontvanger LIKE '%´%' LIMIT 5"
    )
    print("instrumenten.ontvanger with ´ (should be apostrophe):")
    for s in samples:
        print(f"  {s['ontvanger']}")

    # Check inkoop is still good
    samples2 = await conn.fetch(
        "SELECT DISTINCT leverancier FROM inkoop WHERE leverancier LIKE '%öper%' OR leverancier LIKE '%ënh%' LIMIT 5"
    )
    print("\ninkoop.leverancier (should still be correct):")
    for s in samples2:
        print(f"  {s['leverancier']}")

    await conn.close()
    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
