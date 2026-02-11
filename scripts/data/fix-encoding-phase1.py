#!/usr/bin/env python3
"""
Phase 1: Fix double-encoded UTF-8 characters in Supabase.
Uses asyncpg parameterized queries to avoid all SQL escaping issues.
"""
import asyncio
import asyncpg
import sys
import os

# Database connection
DB_PASSWORD = os.environ.get('SUPABASE_DB_PASSWORD')
if not DB_PASSWORD:
    print("ERROR: Set SUPABASE_DB_PASSWORD environment variable first")
    sys.exit(1)

DB_URL = f"postgresql://postgres.kmdelrgtgglcrupprkqf:{DB_PASSWORD}@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

# All double-encoded UTF-8 replacement pairs
# Format: (corrupted_pattern, correct_character)
#
# How double-encoding works:
# Original UTF-8 bytes (e.g., C3 A9 for é) were interpreted as Windows-1252,
# producing Ã (from C3) + © (from A9), then re-encoded to UTF-8.
#
# For bytes 0x80-0x9F, Windows-1252 maps to special Unicode characters
# (smart quotes, dashes, etc.) while Latin-1 leaves them undefined.

REPLACEMENTS = [
    # === Triple-encoded patterns (Ãƒ sequences) ===
    # These went through UTF-8 → Win1252 → UTF-8 → Win1252 → UTF-8
    ('\u00c3\u0192\u00e2\u20ac\u201c', '\u00d6'),   # Triple Ö
    ('\u00c3\u0192\u00e2\u20ac\u0161', '\u00c4'),   # Triple Ä
    ('\u00c3\u0192\u00e2\u20ac\u00b0', '\u00c9'),   # Triple É
    ('\u00c3\u0192\u00c2\u00a9', '\u00e9'),          # Triple é

    # === Uppercase double-encoded (C3 8x/9x range) ===
    # Second byte 0x80-0x9F maps to Win1252 special characters
    ('\u00c3\u20ac', '\u00c0'),     # À (C3 80 → Ã + €)
    ('\u00c3\u2030', '\u00c9'),     # É (C3 89 → Ã + ‰)
    ('\u00c3\u0160', '\u00ca'),     # Ê (C3 8A → Ã + Š)
    ('\u00c3\u2039', '\u00cb'),     # Ë (C3 8B → Ã + ‹)
    ('\u00c3\u0152', '\u00cc'),     # Ì (C3 8C → Ã + Œ)
    ('\u00c3\u017d', '\u00ce'),     # Î (C3 8E → Ã + Ž)
    ('\u00c3\u2018', '\u00d1'),     # Ñ (C3 91 → Ã + ')
    ('\u00c3\u201c', '\u00d3'),     # Ó (C3 93 → Ã + ")
    ('\u00c3\u201d', '\u00d4'),     # Ô (C3 94 → Ã + ")
    ('\u00c3\u2013', '\u00d6'),     # Ö (C3 96 → Ã + –)
    ('\u00c3\u02dc', '\u00d8'),     # Ø (C3 98 → Ã + ˜)
    ('\u00c3\u2122', '\u00d9'),     # Ù (C3 99 → Ã + ™)
    ('\u00c3\u0161', '\u00da'),     # Ú (C3 9A → Ã + š)
    ('\u00c3\u203a', '\u00db'),     # Û (C3 9B → Ã + ›)
    ('\u00c3\u0153', '\u00dc'),     # Ü (C3 9C → Ã + œ)
    ('\u00c3\u0178', '\u00df'),     # ß (C3 9F → Ã + Ÿ)

    # === Lowercase double-encoded (C3 Ax-Fx range) ===
    # Second byte 0xA0-0xFF maps identically in Win1252 and Latin-1
    ('\u00c3\u00a0', '\u00e0'),     # à
    ('\u00c3\u00a1', '\u00e1'),     # á
    ('\u00c3\u00a2', '\u00e2'),     # â
    ('\u00c3\u00a3', '\u00e3'),     # ã
    ('\u00c3\u00a4', '\u00e4'),     # ä
    ('\u00c3\u00a5', '\u00e5'),     # å
    ('\u00c3\u00a6', '\u00e6'),     # æ
    ('\u00c3\u00a7', '\u00e7'),     # ç
    ('\u00c3\u00a8', '\u00e8'),     # è
    ('\u00c3\u00a9', '\u00e9'),     # é (most common)
    ('\u00c3\u00aa', '\u00ea'),     # ê
    ('\u00c3\u00ab', '\u00eb'),     # ë
    ('\u00c3\u00ac', '\u00ec'),     # ì
    ('\u00c3\u00ad', '\u00ed'),     # í
    ('\u00c3\u00ae', '\u00ee'),     # î
    ('\u00c3\u00af', '\u00ef'),     # ï
    ('\u00c3\u00b0', '\u00f0'),     # ð
    ('\u00c3\u00b1', '\u00f1'),     # ñ
    ('\u00c3\u00b2', '\u00f2'),     # ò
    ('\u00c3\u00b3', '\u00f3'),     # ó
    ('\u00c3\u00b4', '\u00f4'),     # ô
    ('\u00c3\u00b5', '\u00f5'),     # õ
    ('\u00c3\u00b6', '\u00f6'),     # ö
    ('\u00c3\u00b8', '\u00f8'),     # ø
    ('\u00c3\u00b9', '\u00f9'),     # ù
    ('\u00c3\u00ba', '\u00fa'),     # ú
    ('\u00c3\u00bb', '\u00fb'),     # û
    ('\u00c3\u00bc', '\u00fc'),     # ü
    ('\u00c3\u00bd', '\u00fd'),     # ý
    ('\u00c3\u00be', '\u00fe'),     # þ
    ('\u00c3\u00bf', '\u00ff'),     # ÿ

    # === Smart quotes double-encoded (3-byte UTF-8 via Win1252) ===
    ('\u00e2\u20ac\u02dc', '\u2018'),     # ' left single quote
    ('\u00e2\u20ac\u2122', '\u2019'),     # ' right single quote
    ('\u00e2\u20ac\u0153', '\u201c'),     # " left double quote
    ('\u00e2\u20ac\u009d', '\u201d'),     # " right double quote
    ('\u00e2\u20ac\u201d', '\u2014'),     # — em dash
    ('\u00e2\u20ac\u201c', '\u2013'),     # – en dash
    ('\u00e2\u20ac\u00a2', '\u2022'),     # • bullet
    ('\u00e2\u20ac\u00a6', '\u2026'),     # … ellipsis

    # === Windows-1252 Â-prefix artifacts ===
    # Characters U+00A0-U+00BF: UTF-8 is C2 xx, Win1252 interprets C2 as Â
    ('\u00c2\u00a9', '\u00a9'),     # ©
    ('\u00c2\u00ae', '\u00ae'),     # ®
    ('\u00c2\u00b0', '\u00b0'),     # °
    ('\u00c2\u00b2', '\u00b2'),     # ²
    ('\u00c2\u00b3', '\u00b3'),     # ³
    ('\u00c2\u00bc', '\u00bc'),     # ¼
    ('\u00c2\u00bd', '\u00bd'),     # ½
    ('\u00c2\u00be', '\u00be'),     # ¾
    ('\u00c2\u00b7', '\u00b7'),     # ·
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
    conn = await asyncpg.connect(DB_URL, statement_cache_size=0)
    print("Connected.\n")

    total_fixed = 0

    for corrupted, correct in REPLACEMENTS:
        for table, columns in TABLE_COLUMNS:
            for column in columns:
                sql = f"UPDATE {table} SET {column} = REPLACE({column}, $1, $2) WHERE {column} LIKE $3"
                like_pattern = f"%{corrupted}%"
                result = await conn.execute(sql, corrupted, correct, like_pattern)
                count = int(result.split()[-1]) if result.startswith("UPDATE") else 0
                if count > 0:
                    total_fixed += count
                    print(f"  {table}.{column}: {repr(corrupted)} -> {repr(correct)}: {count} rows")

    print(f"\nPhase 1 complete. Total rows updated: {total_fixed}")

    # Verification
    print("\n--- Verification ---")
    remaining = await conn.fetch("""
        SELECT 'instrumenten.ontvanger' as loc, COUNT(*) as cnt
        FROM instrumenten WHERE ontvanger LIKE '%Ã%'
        UNION ALL
        SELECT 'inkoop.leverancier', COUNT(*)
        FROM inkoop WHERE leverancier LIKE '%Ã%'
        UNION ALL
        SELECT 'publiek.ontvanger', COUNT(*)
        FROM publiek WHERE ontvanger LIKE '%Ã%'
    """)
    for row in remaining:
        print(f"  {row['loc']}: {row['cnt']} remaining with Ã")

    # Sample fixed values
    samples = await conn.fetch(
        "SELECT DISTINCT ontvanger FROM instrumenten WHERE ontvanger LIKE '%café%' OR ontvanger LIKE '%Café%' LIMIT 5"
    )
    if samples:
        print("\nSample fixed values:")
        for s in samples:
            print(f"  {s['ontvanger']}")

    await conn.close()
    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
