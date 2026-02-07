-- ============================================================================
-- 024-fix-encoding-double-utf8.sql
-- Fix double-encoded UTF-8 characters across all tables
-- Created: 2026-02-07
--
-- Problem: MySQL/WordPress stored UTF-8 data that was double-encoded during
-- CSV export. Characters like é (C3 A9 in UTF-8) were interpreted as
-- Windows-1252 bytes and re-encoded, producing Ã© (C3 83 C2 A9).
--
-- Scope: ~4,400 rows across instrumenten, inkoop, publiek
-- Approach: Explicit REPLACE chains for known double-encoded character pairs
--
-- IMPORTANT: Run this BEFORE 025-fix-encoding-question-marks.sql
-- ============================================================================

-- Create a reusable function for fixing double-encoded UTF-8
CREATE OR REPLACE FUNCTION fix_double_encoded_utf8(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    result TEXT := input_text;
BEGIN
    -- Skip NULL values
    IF result IS NULL THEN
        RETURN NULL;
    END IF;

    -- =============================================
    -- Phase 1: Fix triple-encoded patterns first
    -- (Ãƒ sequences from triple UTF-8→Win1252 encoding)
    -- =============================================
    result := REPLACE(result, 'Ãƒâ€"', 'Ö');     -- Triple-encoded Ö
    result := REPLACE(result, 'Ãƒâ€š', 'Ä');     -- Triple-encoded Ä
    result := REPLACE(result, 'Ãƒâ€°', 'É');     -- Triple-encoded É
    result := REPLACE(result, 'ÃƒÂ©', 'é');      -- Triple-encoded é

    -- =============================================
    -- Phase 2: Fix uppercase double-encoded (Ã + Win1252 char → uppercase accent)
    -- Pattern: original UTF-8 byte C3 xx → Win1252 interprets as Ã + char
    -- =============================================
    result := REPLACE(result, 'Ã€', 'À');   -- U+00C0
    result := REPLACE(result, 'Ã‰', 'É');   -- U+00C9
    result := REPLACE(result, 'ÃŠ', 'Ê');   -- U+00CA
    result := REPLACE(result, 'Ã‹', 'Ë');   -- U+00CB
    result := REPLACE(result, 'ÃŒ', 'Ì');   -- U+00CC
    result := REPLACE(result, 'ÃŽ', 'Î');   -- U+00CE
    result := REPLACE(result, 'Ã'', 'Ñ');   -- U+00D1
    result := REPLACE(result, 'Ã"', 'Ó');   -- U+00D3
    result := REPLACE(result, 'Ã"', 'Ô');   -- U+00D4
    result := REPLACE(result, 'Ã–', 'Ö');   -- U+00D6
    result := REPLACE(result, 'Ã˜', 'Ø');   -- U+00D8
    result := REPLACE(result, 'Ã™', 'Ù');   -- U+00D9
    result := REPLACE(result, 'Ãš', 'Ú');   -- U+00DA
    result := REPLACE(result, 'Ã›', 'Û');   -- U+00DB
    result := REPLACE(result, 'Ãœ', 'Ü');   -- U+00DC
    result := REPLACE(result, 'ÃŸ', 'ß');   -- U+00DF

    -- =============================================
    -- Phase 3: Fix lowercase double-encoded (Ã + Latin-1 char → lowercase accent)
    -- These are the most common cases
    -- =============================================
    result := REPLACE(result, 'Ã©', 'é');   -- U+00E9 (most common: café, René)
    result := REPLACE(result, 'Ã¨', 'è');   -- U+00E8 (crème, après)
    result := REPLACE(result, 'Ã¶', 'ö');   -- U+00F6 (coöperatie, Möller)
    result := REPLACE(result, 'Ã¼', 'ü');   -- U+00FC (München, Brüning)
    result := REPLACE(result, 'Ã«', 'ë');   -- U+00EB (financiële, sociëteit)
    result := REPLACE(result, 'Ã¯', 'ï');   -- U+00EF (naïef, reïntegratie)
    result := REPLACE(result, 'Ã®', 'î');   -- U+00EE (Nîmes)
    result := REPLACE(result, 'Ã´', 'ô');   -- U+00F4 (Côte, hôtel)
    result := REPLACE(result, 'Ã»', 'û');   -- U+00FB (Fryslân variant)
    result := REPLACE(result, 'Ã¢', 'â');   -- U+00E2 (Amrâth, château)
    result := REPLACE(result, 'Ãª', 'ê');   -- U+00EA (fête, crêpe)
    result := REPLACE(result, 'Ã§', 'ç');   -- U+00E7 (française, Curaçao)
    result := REPLACE(result, 'Ã±', 'ñ');   -- U+00F1 (El Niño, España)
    result := REPLACE(result, 'Ã³', 'ó');   -- U+00F3 (vóór)
    result := REPLACE(result, 'Ãº', 'ú');   -- U+00FA (Curaçao variant)
    result := REPLACE(result, 'Ã¤', 'ä');   -- U+00E4 (Universität)
    result := REPLACE(result, 'Ã¬', 'ì');   -- U+00EC
    result := REPLACE(result, 'Ã­', 'í');   -- U+00ED
    result := REPLACE(result, 'Ã ', 'à');   -- U+00E0
    result := REPLACE(result, 'Ã¡', 'á');   -- U+00E1
    result := REPLACE(result, 'Ã¹', 'ù');   -- U+00F9
    result := REPLACE(result, 'Ã½', 'ý');   -- U+00FD
    result := REPLACE(result, 'Ã¿', 'ÿ');   -- U+00FF
    result := REPLACE(result, 'Ã°', 'ð');   -- U+00F0
    result := REPLACE(result, 'Ãµ', 'õ');   -- U+00F5
    result := REPLACE(result, 'Ã²', 'ò');   -- U+00F2
    result := REPLACE(result, 'Ã¦', 'æ');   -- U+00E6
    result := REPLACE(result, 'Ã¸', 'ø');   -- U+00F8
    result := REPLACE(result, 'Ã¾', 'þ');   -- U+00FE
    result := REPLACE(result, 'Ã£', 'ã');   -- U+00E3
    result := REPLACE(result, 'Ã¥', 'å');   -- U+00E5

    -- =============================================
    -- Phase 4: Fix smart quotes and special characters
    -- (3-byte UTF-8 characters double-encoded via Windows-1252)
    -- =============================================
    result := REPLACE(result, 'â€˜', ''');   -- U+2018 left single quote
    result := REPLACE(result, 'â€™', ''');   -- U+2019 right single quote
    result := REPLACE(result, 'â€œ', '"');   -- U+201C left double quote
    result := REPLACE(result, 'â€?', '"');   -- U+201D right double quote
    result := REPLACE(result, 'â€"', '—');   -- U+2014 em dash
    result := REPLACE(result, 'â€"', '–');   -- U+2013 en dash
    result := REPLACE(result, 'â€¢', '•');   -- U+2022 bullet
    result := REPLACE(result, 'â€¦', '…');   -- U+2026 ellipsis

    -- =============================================
    -- Phase 5: Fix other Windows-1252 encoding artifacts
    -- =============================================
    result := REPLACE(result, 'Â©', '©');   -- Copyright symbol
    result := REPLACE(result, 'Â®', '®');   -- Registered symbol
    result := REPLACE(result, 'Â°', '°');   -- Degree symbol
    result := REPLACE(result, 'Â²', '²');   -- Superscript 2
    result := REPLACE(result, 'Â³', '³');   -- Superscript 3
    result := REPLACE(result, 'Â½', '½');   -- Fraction 1/2
    result := REPLACE(result, 'Â¼', '¼');   -- Fraction 1/4
    result := REPLACE(result, 'Â¾', '¾');   -- Fraction 3/4
    result := REPLACE(result, 'Â·', '·');   -- Middle dot

    RETURN result;
END;
$$;

-- ============================================================================
-- Apply fixes to all text columns across all tables
-- ============================================================================

-- === instrumenten ===
UPDATE instrumenten SET ontvanger = fix_double_encoded_utf8(ontvanger)
WHERE ontvanger ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§ãåæø¸¾£¥ ¡¹½¿°ðõò¤¬­]'
   OR ontvanger ~ 'Ã[€‰Š‹ŒŽ''""•–—˜™šœžŸ]'
   OR ontvanger ~ 'â€[˜™œ?"|•¦…]'
   OR ontvanger ~ 'Ãƒ'
   OR ontvanger ~ 'Â[©®°²³½¼¾·]';

UPDATE instrumenten SET regeling = fix_double_encoded_utf8(regeling)
WHERE regeling ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§ãåæø¸¾£¥ ¡¹½¿°ðõò¤¬­]'
   OR regeling ~ 'â€';

UPDATE instrumenten SET detail = fix_double_encoded_utf8(detail)
WHERE detail ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§]' OR detail ~ 'â€';

UPDATE instrumenten SET begrotingsnaam = fix_double_encoded_utf8(begrotingsnaam)
WHERE begrotingsnaam ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§]' OR begrotingsnaam ~ 'â€';

-- === inkoop ===
UPDATE inkoop SET leverancier = fix_double_encoded_utf8(leverancier)
WHERE leverancier ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§ãåæø¸¾£¥ ¡¹½¿°ðõò¤¬­]'
   OR leverancier ~ 'Ã[€‰Š‹ŒŽ''""•–—˜™šœžŸ]'
   OR leverancier ~ 'â€'
   OR leverancier ~ 'Ãƒ'
   OR leverancier ~ 'Â[©®°²³½¼¾·]';

UPDATE inkoop SET categorie = fix_double_encoded_utf8(categorie)
WHERE categorie ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§]' OR categorie ~ 'â€';

-- === apparaat ===
UPDATE apparaat SET kostensoort = fix_double_encoded_utf8(kostensoort)
WHERE kostensoort ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§]' OR kostensoort ~ 'â€';

UPDATE apparaat SET detail = fix_double_encoded_utf8(detail)
WHERE detail ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§]' OR detail ~ 'â€';

UPDATE apparaat SET begrotingsnaam = fix_double_encoded_utf8(begrotingsnaam)
WHERE begrotingsnaam ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§]' OR begrotingsnaam ~ 'â€';

-- === provincie ===
UPDATE provincie SET ontvanger = fix_double_encoded_utf8(ontvanger)
WHERE ontvanger ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§]' OR ontvanger ~ 'â€';

UPDATE provincie SET omschrijving = fix_double_encoded_utf8(omschrijving)
WHERE omschrijving ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§]' OR omschrijving ~ 'â€';

-- === gemeente ===
UPDATE gemeente SET ontvanger = fix_double_encoded_utf8(ontvanger)
WHERE ontvanger ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§]' OR ontvanger ~ 'â€';

UPDATE gemeente SET omschrijving = fix_double_encoded_utf8(omschrijving)
WHERE omschrijving ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§]' OR omschrijving ~ 'â€';

UPDATE gemeente SET regeling = fix_double_encoded_utf8(regeling)
WHERE regeling ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§]' OR regeling ~ 'â€';

-- === publiek ===
UPDATE publiek SET ontvanger = fix_double_encoded_utf8(ontvanger)
WHERE ontvanger ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§]' OR ontvanger ~ 'â€';

UPDATE publiek SET omschrijving = fix_double_encoded_utf8(omschrijving)
WHERE omschrijving ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§]' OR omschrijving ~ 'â€';

UPDATE publiek SET regeling = fix_double_encoded_utf8(regeling)
WHERE regeling ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§]' OR regeling ~ 'â€';

-- ============================================================================
-- Verification queries
-- ============================================================================

-- Should return 0 rows if all double-encoding is fixed
SELECT 'instrumenten.ontvanger' as location, COUNT(*) as remaining
FROM instrumenten WHERE ontvanger ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§]' OR ontvanger ~ 'â€'
UNION ALL
SELECT 'inkoop.leverancier', COUNT(*)
FROM inkoop WHERE leverancier ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§]' OR leverancier ~ 'â€'
UNION ALL
SELECT 'publiek.ontvanger', COUNT(*)
FROM publiek WHERE ontvanger ~ 'Ã[©¨¶¼«¯®´»³²ª±µ§]' OR ontvanger ~ 'â€';

-- Sample fixed values
SELECT 'instrumenten' as source, ontvanger as fixed_value
FROM instrumenten
WHERE ontvanger LIKE '%café%' OR ontvanger LIKE '%Café%'
LIMIT 5;

-- Clean up function (optional - remove after verification)
-- DROP FUNCTION IF EXISTS fix_double_encoded_utf8(TEXT);
