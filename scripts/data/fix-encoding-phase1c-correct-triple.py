#!/usr/bin/env python3
"""
Phase 1c: CORRECT the wrong triple-encoded fixes from Phase 1b.
Phase 1b mapped ÃƒÂ¤ → ¤ (currency sign) instead of ä (a-umlaut).
The correct mapping is: byte_val + 0x40 = Unicode codepoint.
This script replaces the wrong characters with the correct ones.
"""
import asyncio
import asyncpg

DB_URL = "postgresql://postgres.kmdelrgtgglcrupprkqf:bahwyq-6botry-veStad@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

# Map of wrong character → correct character
# byte_val was in range 0xA0-0xBF, should have been chr(byte_val + 0x40)
CORRECTIONS = [
    # (wrong_char, correct_char, description, expected_count)
    ('\u00a1', '\u00e1', '¡→á', 11),   # inverted exclamation → a-acute
    ('\u00a2', '\u00e2', '¢→â', 2),    # cent sign → a-circumflex
    ('\u00a4', '\u00e4', '¤→ä', 52),   # currency sign → a-umlaut
    ('\u00a7', '\u00e7', '§→ç', 5),    # section sign → c-cedilla
    ('\u00a8', '\u00e8', '¨→è', 21),   # diaeresis → e-grave
    ('\u00ab', '\u00eb', '«→ë', 99),   # left guillemet → e-umlaut
    ('\u00af', '\u00ef', '¯→ï', 6),    # macron → i-umlaut
    ('\u00b1', '\u00f1', '±→ñ', 1),    # plus-minus → n-tilde
    ('\u00b4', '\u00f4', '´→ô', 6),    # acute accent → o-circumflex
    ('\u00b6', '\u00f6', '¶→ö', 99),   # pilcrow → o-umlaut
    ('\u00b8', '\u00f8', '¸→ø', 3),    # cedilla → o-stroke
    ('\u00b9', '\u00f9', '¹→ù', 3),    # superscript 1 → u-grave
    ('\u00ba', '\u00fa', 'º→ú', 1),    # masc ordinal → u-acute
    ('\u00bb', '\u00fb', '»→û', 1),    # right guillemet → u-circumflex
]

# Also fix the Ã that was incorrectly introduced by uppercase-missing pattern
# Many of these Ã were part of triple patterns that should have been decoded further
# But since the triple fix already ran (wrong), the Ã is now standalone
# These need context-specific handling - skip for now, verify manually

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

    total_fixed = 0

    for wrong, correct, desc, expected in CORRECTIONS:
        for table, columns in TABLE_COLUMNS:
            for column in columns:
                sql = f"UPDATE {table} SET {column} = REPLACE({column}, $1, $2) WHERE {column} LIKE $3"
                like_pattern = f"%{wrong}%"
                result = await conn.execute(sql, wrong, correct, like_pattern)
                count = int(result.split()[-1]) if result.startswith("UPDATE") else 0
                if count > 0:
                    total_fixed += count
                    print(f"  {desc}: {table}.{column}: {count} rows")

    print(f"\nPhase 1c complete. Total rows corrected: {total_fixed}")

    # Verification: sample some corrected values
    print("\n--- Sample corrected values ---")
    samples = await conn.fetch(
        "SELECT DISTINCT leverancier FROM inkoop WHERE leverancier LIKE '%öper%' OR leverancier LIKE '%ënh%' OR leverancier LIKE '%äger%' OR leverancier LIKE '%ür%' LIMIT 15"
    )
    for s in samples:
        print(f"  {s['leverancier']}")

    # Check remaining Ã patterns
    print("\n--- Remaining issues ---")
    for table, columns in TABLE_COLUMNS:
        for col in columns:
            cnt = await conn.fetchval(
                f"SELECT COUNT(DISTINCT {col}) FROM {table} WHERE {col} LIKE $1", "%Ã%"
            )
            if cnt > 0:
                print(f"  {table}.{col}: {cnt} distinct values with Ã")

    await conn.close()
    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
