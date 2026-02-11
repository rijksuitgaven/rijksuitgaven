# Data Migration: MySQL → Supabase

> ⚠️ **HISTORICAL DOCUMENT**: Initial migration (2026-01-23) is complete. For regular data updates, see **[DATA-UPDATE-RUNBOOK.md](DATA-UPDATE-RUNBOOK.md)**.

**Created:** 2026-01-23
**Completed:** 2026-01-23
**Status:** ✅ Complete

---

## Summary

Successfully migrated 3.1 million rows across 7 tables from MySQL (WordPress) to Supabase (PostgreSQL).

| Table | Rows | Status |
|-------|------|--------|
| instrumenten | 674,826 | ✅ |
| apparaat | 21,315 | ✅ |
| inkoop | 635,866 | ✅ |
| provincie | 67,456 | ✅ |
| gemeente | 126,377 | ✅ |
| publiek | 115,020 | ✅ |
| universal_search | 1,456,095 (pre-ER) → ~451,445 (post-ER) | ✅ |
| **Total** | **3,096,955** | ✅ |

**Note:** universal_search row count shown is pre-entity-resolution (1,456,095). After entity resolution normalization (2026-01-26), count dropped to ~451,445 due to merging duplicate recipients with different spellings.

---

## Process Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  MySQL/WordPress │────▶│  CSV Export      │────▶│  Transform      │
│  (PhpMyAdmin)   │     │  (7 files)       │     │  (Python)       │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Supabase       │◀────│  psql Import     │◀────│  Transformed    │
│  (PostgreSQL)   │     │  (UTF-8)         │     │  CSVs           │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## Step 1: Export from MySQL

### Source
- **Database:** MySQL via PhpMyAdmin
- **Export format:** CSV
- **Delimiter:** Comma (,)
- **Enclosure:** Double quote (")
- **Encoding:** UTF-8

### Export Location
```
/Users/michielmaandag/SynologyDrive/code/watchtower/rijksuitgavenSQL/
├── apparaat.csv
├── gemeente.csv
├── inkoop.csv
├── instrumenten.csv
├── provincie.csv
├── publiek.csv
└── universal_search.csv
```

> **Note:** Originally exported to `~/Downloads/RoijksuitgavenSQL/`, moved to version-controlled location on 2026-01-23.

---

## Step 2: Transformation Required

The MySQL export CSVs needed transformation before Supabase import:

| Issue | Problem | Solution |
|-------|---------|----------|
| Column case | MySQL: `Begrotingsjaar` | Lowercase: `begrotingsjaar` |
| ID column | CSV has `id` column | Remove (Supabase auto-generates SERIAL) |
| Column rename | `stad` in gemeente.csv | Rename to `gemeente` |
| Column rename | `sub_source` in universal_search | Rename to `sub_sources` |
| Column rename | `source` in universal_search | Rename to `sources` |
| NULL strings | Literal `"NULL"` in data | Convert to empty for PostgreSQL NULL |
| Empty values | Quoted empty `""` | Use unquoted empty (QUOTE_MINIMAL) |
| Encoding | Must preserve UTF-8 | Read/write as UTF-8 |

---

## Step 3: Transformation Script

### File: `scripts/data/transform-csv-headers.py`

```python
#!/usr/bin/env python3
"""
Transform CSV headers for Supabase import
Created: 2026-01-23

Transforms MySQL export CSV headers to match Supabase schema:
- Lowercase all column names
- Rename specific columns
- Remove 'id' column (let Supabase auto-generate)
- Convert "NULL" strings to empty (for proper PostgreSQL NULL handling)
"""

import csv
import os
from pathlib import Path

SOURCE_DIR = Path("/Users/michielmaandag/Downloads/RoijksuitgavenSQL")
OUTPUT_DIR = SOURCE_DIR / "transformed"

# Column renames (after lowercase)
RENAMES = {
    "gemeente.csv": {"stad": "gemeente"},
    "universal_search.csv": {"sub_source": "sub_sources", "source": "sources"},
}

def transform_csv(filename):
    input_path = SOURCE_DIR / filename
    output_path = OUTPUT_DIR / filename

    renames = RENAMES.get(filename, {})

    with open(input_path, 'r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)

        # Transform headers: lowercase + renames + remove id
        old_fieldnames = reader.fieldnames
        new_fieldnames = []

        for col in old_fieldnames:
            col_lower = col.lower()
            if col_lower == 'id':
                continue  # Skip id column
            if col_lower in renames:
                col_lower = renames[col_lower]
            new_fieldnames.append(col_lower)

        # Write transformed CSV (UTF-8, no BOM - psql handles encoding natively)
        # Use QUOTE_MINIMAL so empty values become ,, not ,"", which PostgreSQL handles as NULL
        with open(output_path, 'w', encoding='utf-8', newline='') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=new_fieldnames, quoting=csv.QUOTE_MINIMAL)
            writer.writeheader()

            row_count = 0
            for row in reader:
                new_row = {}
                for old_col in old_fieldnames:
                    col_lower = old_col.lower()
                    if col_lower == 'id':
                        continue
                    if col_lower in renames:
                        col_lower = renames[col_lower]
                    # Convert "NULL" strings to empty (PostgreSQL handles empty as NULL)
                    value = row[old_col]
                    if value == 'NULL' or value == 'null':
                        value = ''
                    new_row[col_lower] = value
                writer.writerow(new_row)
                row_count += 1

    return row_count

def main():
    # Create output directory
    OUTPUT_DIR.mkdir(exist_ok=True)

    files = [
        "instrumenten.csv",
        "apparaat.csv",
        "inkoop.csv",
        "provincie.csv",
        "gemeente.csv",
        "publiek.csv",
        "universal_search.csv",
    ]

    print("Transforming CSV headers...")
    print(f"Source: {SOURCE_DIR}")
    print(f"Output: {OUTPUT_DIR}")
    print()

    for i, filename in enumerate(files, 1):
        print(f"{i}/7 {filename}")
        if (SOURCE_DIR / filename).exists():
            rows = transform_csv(filename)
            print(f"    Done: {rows:,} rows")
        else:
            print(f"    SKIPPED: file not found")

    print()
    print("=" * 50)
    print("Transformation complete!")
    print(f"Files ready for import in: {OUTPUT_DIR}")
    print("=" * 50)
    print()
    print("Next: Import each CSV via Supabase Dashboard")
    print("  1. Go to Table Editor")
    print("  2. Select table")
    print("  3. Insert → Import data from CSV")
    print("  4. Select file from transformed/ folder")

if __name__ == "__main__":
    main()
```

### Usage
```bash
cd /Users/michielmaandag/SynologyDrive/code/watchtower/rijksuitgaven
python3 scripts/data/transform-csv-headers.py
```

### Output
```
/Users/michielmaandag/Downloads/RoijksuitgavenSQL/transformed/
├── apparaat.csv       (21,315 rows)
├── gemeente.csv       (126,377 rows)
├── inkoop.csv         (635,866 rows)
├── instrumenten.csv   (674,826 rows)
├── provincie.csv      (67,456 rows)
├── publiek.csv        (115,020 rows)
└── universal_search.csv (1,456,095 rows)
```

---

## Step 4: Import Script

### File: `scripts/data/import-to-supabase.sh`

```bash
#!/bin/bash
# =====================================================
# Import CSV files to Supabase via psql
# Created: 2026-01-23
#
# Ensures proper UTF-8 encoding for Dutch characters
# =====================================================

# Configuration (Session Pooler - IPv4 compatible)
DB_HOST="aws-1-eu-west-1.pooler.supabase.com"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres.kmdelrgtgglcrupprkqf"
PSQL="/usr/local/Cellar/libpq/18.1/bin/psql"
CSV_DIR="/Users/michielmaandag/Downloads/RoijksuitgavenSQL/transformed"

# Check for password
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "ERROR: Set SUPABASE_DB_PASSWORD environment variable first:"
    echo "  export SUPABASE_DB_PASSWORD=\"your-password\""
    exit 1
fi

# Connection string
export PGPASSWORD="$SUPABASE_DB_PASSWORD"
CONN="postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

echo "========================================"
echo "Supabase CSV Import (UTF-8)"
echo "========================================"
echo ""

# Function to import a CSV file
import_csv() {
    local table=$1
    local file=$2
    local expected_rows=$3

    echo "Importing $table..."
    echo "  File: $file"

    # Check if file exists
    if [ ! -f "$CSV_DIR/$file" ]; then
        echo "  ERROR: File not found!"
        return 1
    fi

    # Get column names from CSV header (skip BOM if present)
    # Remove BOM bytes and get first line
    local raw_headers=$(head -1 "$CSV_DIR/$file" | sed 's/^\xef\xbb\xbf//' | tr -d '"' | tr -d '\r')

    # Quote column names that start with numbers (like 2016, 2017, etc.)
    local headers=""
    IFS=',' read -ra COLS <<< "$raw_headers"
    for col in "${COLS[@]}"; do
        if [[ $col =~ ^[0-9] ]]; then
            col="\"$col\""
        fi
        if [ -n "$headers" ]; then
            headers="$headers,$col"
        else
            headers="$col"
        fi
    done

    echo "  Columns: $headers"

    # Truncate table first
    echo "  Truncating table..."
    $PSQL "$CONN" -c "TRUNCATE TABLE $table RESTART IDENTITY;" 2>&1 | grep -v "^$"

    # Import with \copy (client-side, handles encoding properly)
    echo "  Importing data..."

    # Create temp SQL file for the copy command
    local temp_sql=$(mktemp)
    cat > "$temp_sql" << EOSQL
SET client_encoding TO 'UTF8';
\copy $table($headers) FROM '$CSV_DIR/$file' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
EOSQL

    # Execute
    $PSQL "$CONN" -f "$temp_sql" 2>&1
    local result=$?
    rm -f "$temp_sql"

    if [ $result -eq 0 ]; then
        # Verify row count
        local count=$($PSQL "$CONN" -t -c "SELECT COUNT(*) FROM $table;" | tr -d ' ')
        echo "  Done: $count rows imported (expected: $expected_rows)"

        # Check encoding with sample
        echo "  Verifying encoding..."
        $PSQL "$CONN" -c "SELECT * FROM $table LIMIT 1;" 2>&1 | head -5
    else
        echo "  ERROR: Import failed!"
        return 1
    fi

    echo ""
}

# Test connection first
echo "Testing connection..."
$PSQL "$CONN" -c "SELECT 'Connection OK' as status;" 2>&1 | grep -q "Connection OK"
if [ $? -ne 0 ]; then
    echo "ERROR: Could not connect to database. Check your password."
    exit 1
fi
echo "Connection successful!"
echo ""

# Import tables (smallest first)
import_csv "apparaat" "apparaat.csv" "21,315"
import_csv "provincie" "provincie.csv" "67,456"
import_csv "publiek" "publiek.csv" "115,020"
import_csv "gemeente" "gemeente.csv" "126,377"
import_csv "inkoop" "inkoop.csv" "635,866"
import_csv "instrumenten" "instrumenten.csv" "674,826"
import_csv "universal_search" "universal_search.csv" "1,456,095"

echo "========================================"
echo "Import complete!"
echo "========================================"

# Final verification
echo ""
echo "Final row counts:"
$PSQL "$CONN" -c "
SELECT 'apparaat' as table_name, COUNT(*) as rows FROM apparaat
UNION ALL SELECT 'provincie', COUNT(*) FROM provincie
UNION ALL SELECT 'publiek', COUNT(*) FROM publiek
UNION ALL SELECT 'gemeente', COUNT(*) FROM gemeente
UNION ALL SELECT 'inkoop', COUNT(*) FROM inkoop
UNION ALL SELECT 'instrumenten', COUNT(*) FROM instrumenten
UNION ALL SELECT 'universal_search', COUNT(*) FROM universal_search
ORDER BY rows;
"
```

### Prerequisites
```bash
# Install PostgreSQL client (macOS)
brew install libpq
```

### Usage
```bash
cd /Users/michielmaandag/SynologyDrive/code/watchtower/rijksuitgaven

# Set password (get from Supabase Dashboard > Project Settings > Database)
export SUPABASE_DB_PASSWORD="your-password-here"

# Run import
./scripts/data/import-to-supabase.sh
```

---

## Issues Encountered & Solutions

### Issue 1: Supabase Web Import - Wrong Encoding

**Problem:** Supabase Dashboard CSV import showed "CoV∂peratief" instead of "Coöperatief"

**Cause:** Supabase web importer doesn't properly detect UTF-8 encoding

**Solution:** Use psql with explicit UTF-8 encoding instead of web interface

```bash
SET client_encoding TO 'UTF8';
\copy table FROM 'file.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
```

---

### Issue 2: Connection Failed - IPv4/IPv6

**Problem:** `could not translate host name "db.xxx.supabase.co" to address`

**Cause:** Direct connection requires IPv6, but network only has IPv4

**Solution:** Use Session Pooler instead of Direct Connection

| Connection Type | Host | Works on IPv4 |
|-----------------|------|---------------|
| Direct | `db.xxx.supabase.co` | ❌ No |
| Session Pooler | `aws-1-eu-west-1.pooler.supabase.com` | ✅ Yes |

**Note:** Username changes for pooler: `postgres` → `postgres.kmdelrgtgglcrupprkqf`

---

### Issue 3: "Null" Error on Import

**Problem:** Import failed with "Null" error

**Cause:** CSV contained `id` column, but Supabase uses SERIAL auto-generate

**Solution:** Remove `id` column in transformation script

```python
if col_lower == 'id':
    continue  # Skip id column
```

---

### Issue 4: Invalid Integer Syntax for "NULL"

**Problem:** `ERROR: 22P02: invalid input syntax for type integer: "NULL"`

**Cause:** MySQL export contains literal string "NULL" in integer columns

**Solution:** Convert "NULL" strings to empty values

```python
value = row[old_col]
if value == 'NULL' or value == 'null':
    value = ''
```

---

### Issue 5: Invalid Integer Syntax for Empty String

**Problem:** `ERROR: invalid input syntax for type integer: ""`

**Cause:** csv.QUOTE_ALL quotes empty values as `""`, PostgreSQL can't parse as integer

**Solution:** Use csv.QUOTE_MINIMAL so empty values become `,,` (interpreted as NULL)

```python
# Before (QUOTE_ALL): field1,"",field3   ← PostgreSQL fails on ""
# After (QUOTE_MINIMAL): field1,,field3  ← PostgreSQL interprets as NULL

writer = csv.DictWriter(outfile, fieldnames=new_fieldnames, quoting=csv.QUOTE_MINIMAL)
```

---

### Issue 6: Invalid Geometry for Empty String

**Problem:** `ERROR: parse error - invalid geometry` in `publiek.locatie` column

**Cause:** Empty string in geometry column

**Solution:** Same as Issue 5 - QUOTE_MINIMAL makes empty values become NULL

---

### Issue 7: Syntax Error on Numeric Column Names

**Problem:** `ERROR: syntax error at or near "2016"`

**Cause:** Column names starting with numbers need quoting in PostgreSQL

**Solution:** Quote numeric column names in import script

```bash
# Quote column names that start with numbers
for col in "${COLS[@]}"; do
    if [[ $col =~ ^[0-9] ]]; then
        col="\"$col\""
    fi
done
```

---

### Issue 8: TRUNCATE Doesn't Delete Rows

**Problem:** `TRUNCATE TABLE table RESTART IDENTITY;` didn't delete rows

**Cause:** Row Level Security (RLS) or permissions

**Solution:** Use DELETE instead

```sql
DELETE FROM table_name;
ALTER SEQUENCE table_name_id_seq RESTART WITH 1;
```

---

## Column Mappings

### instrumenten.csv
| MySQL Header | Supabase Column | Notes |
|--------------|-----------------|-------|
| Id | _(removed)_ | Auto-generated |
| Begrotingsjaar | begrotingsjaar | Lowercase |
| Begrotingshoofdstuk | begrotingshoofdstuk | Lowercase |
| Begrotingsnaam | begrotingsnaam | Lowercase |
| Ris_ibos_nummer | ris_ibos_nummer | Lowercase |
| Artikel | artikel | Lowercase |
| Artikelonderdeel | artikelonderdeel | Lowercase |
| Instrument | instrument | Lowercase |
| Detail | detail | Lowercase |
| Regeling | regeling | Lowercase |
| Ontvanger | ontvanger | Lowercase |
| Bedrag | bedrag | Lowercase |
| Kvk_nummer | kvk_nummer | Lowercase |
| Rechtsvorm | rechtsvorm | Lowercase |
| Id_nummer | id_nummer | Lowercase |
| Register_id_nummer | register_id_nummer | Lowercase |
| Plaats | plaats | Lowercase |
| Bedrag_normalized | bedrag_normalized | Lowercase |
| Source | source | Lowercase |

### apparaat.csv
| MySQL Header | Supabase Column | Notes |
|--------------|-----------------|-------|
| Id | _(removed)_ | Auto-generated |
| Begrotingsjaar | begrotingsjaar | Lowercase |
| Begrotingshoofdstuk | begrotingshoofdstuk | Lowercase |
| Begrotingsnaam | begrotingsnaam | Lowercase |
| Ris_ibos_nummer | ris_ibos_nummer | Lowercase |
| Artikel | artikel | Lowercase |
| Artikelonderdeel | artikelonderdeel | Lowercase |
| Instrument | instrument | Lowercase |
| Detail | detail | Lowercase |
| Kostensoort | kostensoort | Lowercase |
| Bedrag | bedrag | Lowercase |
| Bedrag_normalized | bedrag_normalized | Lowercase |
| Source | source | Lowercase |

### inkoop.csv
| MySQL Header | Supabase Column | Notes |
|--------------|-----------------|-------|
| Id | _(removed)_ | Auto-generated |
| Jaar | jaar | Lowercase |
| Ministerie | ministerie | Lowercase |
| Leverancier | leverancier | Lowercase |
| Categorie | categorie | Lowercase |
| Staffel | staffel | Lowercase |
| Totaal_avg | totaal_avg | Lowercase |
| Source | source | Lowercase |

### provincie.csv
| MySQL Header | Supabase Column | Notes |
|--------------|-----------------|-------|
| Id | _(removed)_ | Auto-generated |
| Provincie | provincie | Lowercase |
| Nummer | nummer | Lowercase |
| Jaar | jaar | Lowercase |
| Ontvanger | ontvanger | Lowercase |
| Omschrijving | omschrijving | Lowercase |
| Bedrag | bedrag | Lowercase |
| Source | source | Lowercase |

### gemeente.csv
| MySQL Header | Supabase Column | Notes |
|--------------|-----------------|-------|
| Id | _(removed)_ | Auto-generated |
| Stad | gemeente | **Renamed** |
| Nummer | nummer | Lowercase |
| Jaar | jaar | Lowercase |
| Ontvanger | ontvanger | Lowercase |
| Omschrijving | omschrijving | Lowercase |
| Bedrag | bedrag | Lowercase |
| Beleidsterrein | beleidsterrein | Lowercase |
| Beleidsnota | beleidsnota | Lowercase |
| Regeling | regeling | Lowercase |
| Source | source | Lowercase |

### publiek.csv
| MySQL Header | Supabase Column | Notes |
|--------------|-----------------|-------|
| Id | _(removed)_ | Auto-generated |
| Projectnummer | projectnummer | Lowercase |
| Jaar | jaar | Lowercase |
| Omschrijving | omschrijving | Lowercase |
| Ontvanger | ontvanger | Lowercase |
| Kvk_nummer | kvk_nummer | Lowercase |
| Regeling | regeling | Lowercase |
| Bedrag | bedrag | Lowercase |
| Locatie | locatie | Lowercase (geometry) |
| Trefwoorden | trefwoorden | Lowercase |
| Sectoren | sectoren | Lowercase |
| Eu_besluit | eu_besluit | Lowercase |
| Source | source | Lowercase |
| Provincie | provincie | Lowercase |
| Staffel | staffel | Lowercase |
| Onderdeel | onderdeel | Lowercase |

### universal_search.csv
| MySQL Header | Supabase Column | Notes |
|--------------|-----------------|-------|
| Id | _(removed)_ | Auto-generated |
| Ontvanger | ontvanger | Lowercase |
| Sub_source | sub_sources | **Renamed** |
| 2016 | 2016 | Quoted in SQL |
| 2017 | 2017 | Quoted in SQL |
| 2018 | 2018 | Quoted in SQL |
| 2019 | 2019 | Quoted in SQL |
| 2020 | 2020 | Quoted in SQL |
| 2021 | 2021 | Quoted in SQL |
| 2022 | 2022 | Quoted in SQL |
| 2023 | 2023 | Quoted in SQL |
| 2024 | 2024 | Quoted in SQL |
| Totaal | totaal | Lowercase |
| Source | sources | **Renamed** |

---

## Post-Import: Source Column

### Automatic (Triggers)

Database triggers automatically set the `source` column on INSERT:

| Table | Source Value |
|-------|--------------|
| apparaat | Apparaatsuitgaven |
| gemeente | Gemeentelijke subsidieregisters |
| inkoop | Inkoopuitgaven |
| instrumenten | Financiële instrumenten |
| provincie | Provinciale subsidieregisters |
| publiek | _(varies per record - no trigger)_ |

**Trigger script:** `scripts/sql/003-source-column-triggers.sql`

### Manual (For existing data)

If triggers weren't active during import, run:
```bash
/usr/local/Cellar/libpq/18.1/bin/psql "$CONN" -f scripts/sql/002-normalize-source-column.sql
```

**Normalization script:** `scripts/sql/002-normalize-source-column.sql`

---

## Post-Data Update Checklist

After importing new data, run these steps:

### 1. Refresh Universal Search (Required)
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY universal_search;
```
This updates the cross-module search index with new data.

### 2. Source Column (Automatic)
Triggers auto-set source values on INSERT. No action needed.

### 3. Verify Row Counts
Run verification queries below to confirm data imported correctly.

---

## Verification Queries

### Check Row Counts
```sql
SELECT 'apparaat' as table_name, COUNT(*) as rows FROM apparaat
UNION ALL SELECT 'provincie', COUNT(*) FROM provincie
UNION ALL SELECT 'publiek', COUNT(*) FROM publiek
UNION ALL SELECT 'gemeente', COUNT(*) FROM gemeente
UNION ALL SELECT 'inkoop', COUNT(*) FROM inkoop
UNION ALL SELECT 'instrumenten', COUNT(*) FROM instrumenten
UNION ALL SELECT 'universal_search', COUNT(*) FROM universal_search
ORDER BY rows;
```

### Expected Results
| table_name | rows |
|------------|------|
| apparaat | 21,315 |
| provincie | 67,456 |
| publiek | 115,020 |
| gemeente | 126,377 |
| inkoop | 635,866 |
| instrumenten | 674,826 |
| universal_search | 1,456,095 |

### Check Encoding (Dutch Characters)
```sql
-- Should show "Coöperatief" correctly, not "CoV∂peratief"
SELECT ontvanger FROM provincie WHERE ontvanger LIKE '%peratief%' LIMIT 3;
```

### Sample Data Check
```sql
-- Check each table has data
SELECT 'instrumenten' as t, begrotingsjaar, ontvanger, bedrag FROM instrumenten LIMIT 1
UNION ALL SELECT 'apparaat', begrotingsjaar::text, begrotingsnaam, bedrag FROM apparaat LIMIT 1
UNION ALL SELECT 'inkoop', jaar::text, leverancier, totaal_avg::bigint FROM inkoop LIMIT 1;
```

---

## Final Results

**Migration completed:** 2026-01-23

| Table | Expected | Actual | Status |
|-------|----------|--------|--------|
| apparaat | 21,315 | 21,315 | ✅ |
| provincie | 67,456 | 67,456 | ✅ |
| publiek | 115,020 | 115,020 | ✅ |
| gemeente | 126,377 | 126,377 | ✅ |
| inkoop | 635,866 | 635,866 | ✅ |
| instrumenten | 674,826 | 674,826 | ✅ |
| universal_search | 1,456,095 | 1,456,095 (pre-ER) | ✅ |
| **Total** | **3,096,955** | **3,096,955** | ✅ |

**Encoding verified:** Dutch characters (ö, é, ë, etc.) display correctly.

---

## Files Created

| File | Purpose |
|------|---------|
| `scripts/data/transform-csv-headers.py` | Transform CSV headers and values |
| `scripts/data/import-to-supabase.sh` | Import via psql with UTF-8 |
| `scripts/data/DATA-MIGRATION-README.md` | This documentation |

---

## Lessons Learned

1. **Supabase web import has encoding issues** - Use psql for reliable UTF-8
2. **IPv4 networks need Session Pooler** - Direct connection requires IPv6
3. **PostgreSQL is strict about types** - Empty strings ≠ NULL for integers
4. **CSV quoting matters** - QUOTE_MINIMAL for proper NULL handling
5. **Numeric column names need quoting** - "2016" not 2016 in SQL
