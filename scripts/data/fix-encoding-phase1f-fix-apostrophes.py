#!/usr/bin/env python3
"""
Phase 1f: Fix ô back to ´ where it was used as apostrophe.
Uses regex patterns to distinguish apostrophe-ô from legitimate-ô (Côte, Hôtel).
"""
import asyncio
import asyncpg

DB_URL = "postgresql://postgres.kmdelrgtgglcrupprkqf:bahwyq-6botry-veStad@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

# SQL patterns that identify ô as apostrophe, not circumflex
REGEX_FIXES = [
    # Pattern 1: ô at start of word followed by t/s/n/T/S (Dutch articles: 't, 's, 'n)
    (r"(^|\s)ô([tTsSnN]\s)", r"\1´\2", "word-start ôt/ôs → ´t/´s"),
    # Pattern 2: ô at start of word followed by digit (year: '09, '57, '66)
    (r"(^|\s)ô([0-9])", r"\1´\2", "ôNN → ´NN (year)"),
    # Pattern 3: ô at very start of string followed by letter
    (r"^ô([tTsSnN])", r"´\1", "^ôt → ´t (start of string)"),
    # Pattern 4: letter + ôs at end of word (English/Dutch possessive: Henry's, GGD'er)
    (r"([a-zA-Z])ôs(\s|$|[,.\-)])", r"\1´s\2", "Xôs → X´s (possessive)"),
    # Pattern 5: letter + ôer (Dutch suffix: GGD'er, wijk'er)
    (r"([a-zA-Z])ôer(\s|$|[,.\-)])", r"\1´er\2", "Xôer → X´er (suffix)"),
    # Pattern 6: letter + ôn at end of word (contraction: d'n, 'n)
    (r"([a-zA-Z])ôn(\s|$|[,.\-)])", r"\1´n\2", "Xôn → X´n"),
    # Pattern 7: ôS (capital S possessive)
    (r"([a-zA-Z])ôS(\s|$|[,.\-)])", r"\1´S\2", "XôS → X´S"),
]

TABLE_COLUMNS = [
    ('instrumenten', ['ontvanger', 'regeling', 'detail', 'begrotingsnaam']),
    ('inkoop', ['leverancier', 'categorie']),
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

    for pattern, replacement, desc in REGEX_FIXES:
        print(f"\n--- {desc} ---")
        for table, columns in TABLE_COLUMNS:
            for col in columns:
                # Count matches first
                count_sql = f"SELECT COUNT(*) FROM {table} WHERE {col} ~ '{pattern}'"
                cnt = await conn.fetchval(count_sql)
                if cnt > 0:
                    # Apply fix
                    fix_sql = f"UPDATE {table} SET {col} = regexp_replace({col}, '{pattern}', '{replacement}', 'g') WHERE {col} ~ '{pattern}'"
                    result = await conn.execute(fix_sql)
                    updated = int(result.split()[-1]) if result.startswith("UPDATE") else 0
                    total += updated
                    print(f"  {table}.{col}: {updated} rows")

    print(f"\nTotal rows fixed: {total}")

    # Verify with samples
    print("\n--- Verification samples ---")
    samples = await conn.fetch(
        "SELECT DISTINCT ontvanger FROM instrumenten WHERE ontvanger LIKE '%´%' ORDER BY ontvanger LIMIT 10"
    )
    print("instrumenten ´ values (should be apostrophes):")
    for s in samples:
        print(f"  {s['ontvanger'][:80]}")

    samples2 = await conn.fetch(
        "SELECT DISTINCT ontvanger FROM instrumenten WHERE ontvanger LIKE '%ô%' ORDER BY ontvanger LIMIT 10"
    )
    print("\ninstrumenten ô values (should be circumflex in words):")
    for s in samples2:
        print(f"  {s['ontvanger'][:80]}")

    await conn.close()
    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
