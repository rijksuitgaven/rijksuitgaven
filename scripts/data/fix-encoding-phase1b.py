#!/usr/bin/env python3
"""
Phase 1b: Fix triple-encoded UTF-8 and remaining double-encoded patterns.
Handles patterns that Phase 1 missed:
- Triple-encoded: ÃƒÂ« → ë (went through UTF-8→Win1252 cycle twice)
- Missing uppercase double-encoded: Ã‡ → Ç (Win1252 0x87 = ‡)
- Remaining Â-prefix artifacts: Â´ → ´, Â¨ → ¨
- Special triple patterns: ÃƒÅ" → Ü
"""
import asyncio
import asyncpg
import sys

DB_URL = "postgresql://postgres.kmdelrgtgglcrupprkqf:bahwyq-6botry-veStad@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

# Triple-encoded patterns: ÃƒÂ + byte → correct char
# These went through UTF-8 → Win1252 → UTF-8 → Win1252 → UTF-8
# Pattern: Ãƒ (=double-encoded Ã) + Â (=C2 byte) + original_codepoint
TRIPLE_STANDARD = []
for codepoint in range(0xA0, 0x100):
    # Triple pattern: Ã (U+00C3) + ƒ (U+0192) + Â (U+00C2) + chr(codepoint)
    corrupted = '\u00c3\u0192\u00c2' + chr(codepoint)
    # The original character
    correct = chr(codepoint)
    TRIPLE_STANDARD.append((corrupted, correct))

# Triple-encoded patterns for uppercase chars with Win1252 0x80-0x9F mapping
# These have different second-stage encoding because the Win1252 chars are multi-byte in UTF-8
TRIPLE_SPECIAL = [
    # Ö: C3 96 → Ã– (Ã+–) → triple: Ãƒ + â€" (double-encoded –)
    ('\u00c3\u0192\u00e2\u20ac\u201c', '\u00d6'),   # Ö
    # Ä: C3 84 → Ã„ (Ã+„) → triple: Ãƒ + â€š
    ('\u00c3\u0192\u00e2\u20ac\u0161', '\u00c4'),   # Ä
    # É: C3 89 → Ã‰ (Ã+‰) → triple: Ãƒ + â€°
    ('\u00c3\u0192\u00e2\u20ac\u00b0', '\u00c9'),   # É
    # Ü: C3 9C → Ãœ (Ã+œ) → triple: Ãƒ + Å" (double-encoded œ)
    ('\u00c3\u0192\u00c5\u0153', '\u00dc'),          # Ü (TÜV)
    # Ú: C3 9A → Ãš (Ã+š) → triple: Ãƒ + Å¡
    ('\u00c3\u0192\u00c5\u0161', '\u00da'),          # Ú
    # À: C3 80 → Ã€ (Ã+€) → triple: Ãƒ + â‚¬
    ('\u00c3\u0192\u00e2\u201a\u00ac', '\u00c0'),    # À (à Dieu)
]

# Missing uppercase double-encoded patterns (Win1252 bytes 0x80-0x9F)
UPPERCASE_MISSING = [
    ('\u00c3\u201a', '\u00c2'),     # Â: C3 82 → Ã + ‚ (Win1252 0x82 = U+201A)
    ('\u00c3\u0192', '\u00c3'),     # Ã: C3 83 → Ã + ƒ (Win1252 0x83 = U+0192) — only standalone
    ('\u00c3\u201e', '\u00c4'),     # Ä: C3 84 → Ã + „ (Win1252 0x84 = U+201E)
    ('\u00c3\u2026', '\u00c5'),     # Å: C3 85 → Ã + … (Win1252 0x85 = U+2026)
    ('\u00c3\u2020', '\u00c6'),     # Æ: C3 86 → Ã + † (Win1252 0x86 = U+2020)
    ('\u00c3\u2021', '\u00c7'),     # Ç: C3 87 → Ã + ‡ (Win1252 0x87 = U+2021)
    ('\u00c3\u02c6', '\u00c8'),     # È: C3 88 → Ã + ˆ (Win1252 0x88 = U+02C6)
    ('\u00c3\u2019', '\u00d2'),     # Ò: C3 92 → Ã + ' (Win1252 0x92 = U+2019)
    ('\u00c3\u2022', '\u00d5'),     # Õ: C3 95 → Ã + • (Win1252 0x95 = U+2022)
    ('\u00c3\u2014', '\u00d7'),     # ×: C3 97 → Ã + — (Win1252 0x97 = U+2014)
    ('\u00c3\u017e', '\u00de'),     # Þ: C3 9E → Ã + ž (Win1252 0x9E = U+017E)
]

# Additional Â-prefix patterns (C2 XX double-encoded)
A_PREFIX = [
    ('\u00c2\u00b4', '\u00b4'),     # ´ acute accent
    ('\u00c2\u00a8', '\u00a8'),     # ¨ diaeresis
    ('\u00c2\u00a0', '\u00a0'),     # NBSP (non-breaking space)
    ('\u00c2\u00a4', '\u00a4'),     # ¤ currency sign
    ('\u00c2\u00ab', '\u00ab'),     # « left guillemet
    ('\u00c2\u00bb', '\u00bb'),     # » right guillemet
    ('\u00c2\u00b1', '\u00b1'),     # ± plus-minus
    ('\u00c2\u00b5', '\u00b5'),     # µ micro sign
    ('\u00c2\u00b6', '\u00b6'),     # ¶ pilcrow
    ('\u00c2\u00a6', '\u00a6'),     # ¦ broken bar
]

# Smart quote remnants
SMART_REMNANTS = [
    # "de Coendersborgâ€? → "de Coendersborg"  (â€? = corrupted right double quote)
    ('\u00e2\u20ac\u009d', '\u201d'),     # right double quote (using control char 0x9D)
    # ââ‚¬â€? = double-corrupted smart quote
    ('\u00e2\u00e2\u201a\u00ac\u00e2\u20ac\u201d', '\u2014'),  # attempt em dash
]

TABLE_COLUMNS = [
    ('instrumenten', ['ontvanger', 'regeling', 'detail', 'begrotingsnaam']),
    ('inkoop', ['leverancier', 'categorie']),
    ('apparaat', ['kostensoort', 'detail', 'begrotingsnaam']),
    ('provincie', ['ontvanger', 'omschrijving']),
    ('gemeente', ['ontvanger', 'omschrijving', 'regeling']),
    ('publiek', ['ontvanger', 'omschrijving', 'regeling']),
]

ALL_REPLACEMENTS = (
    [("triple-standard", c, r) for c, r in TRIPLE_STANDARD] +
    [("triple-special", c, r) for c, r in TRIPLE_SPECIAL] +
    [("uppercase-missing", c, r) for c, r in UPPERCASE_MISSING] +
    [("a-prefix", c, r) for c, r in A_PREFIX] +
    [("smart-remnant", c, r) for c, r in SMART_REMNANTS]
)


async def main():
    print("Connecting to Supabase...")
    conn = await asyncpg.connect(DB_URL, statement_cache_size=0, timeout=30)
    print("Connected.\n")

    total_fixed = 0

    for category, corrupted, correct in ALL_REPLACEMENTS:
        for table, columns in TABLE_COLUMNS:
            for column in columns:
                sql = f"UPDATE {table} SET {column} = REPLACE({column}, $1, $2) WHERE {column} LIKE $3"
                like_pattern = f"%{corrupted}%"
                result = await conn.execute(sql, corrupted, correct, like_pattern)
                count = int(result.split()[-1]) if result.startswith("UPDATE") else 0
                if count > 0:
                    total_fixed += count
                    print(f"  [{category}] {table}.{column}: {repr(corrupted)} -> {repr(correct)}: {count} rows")

    print(f"\nPhase 1b complete. Total rows updated: {total_fixed}")

    # Verification
    print("\n--- Verification ---")
    for pattern_name, like in [("Ãƒ (triple)", "%Ãƒ%"), ("Ã‡ (Ç)", "%Ã‡%"), ("Â (artifacts)", "%Â%")]:
        for table, columns in TABLE_COLUMNS:
            for col in columns:
                cnt = await conn.fetchval(
                    f"SELECT COUNT(*) FROM {table} WHERE {col} LIKE $1", like
                )
                if cnt > 0:
                    print(f"  {pattern_name} in {table}.{col}: {cnt} remaining")

    await conn.close()
    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
