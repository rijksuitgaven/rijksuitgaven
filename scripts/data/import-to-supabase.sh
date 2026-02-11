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
CSV_DIR="/Users/michielmaandag/SynologyDrive/code/watchtower/rijksuitgavenSQL/transformed"

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
