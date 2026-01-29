"""
Module service - aggregation queries for all data modules.

Handles the business logic for fetching and aggregating data
from each module table with year columns.

SECURITY NOTE: All SQL identifiers (table names, column names) are validated
against whitelists before being used in queries. User input is NEVER used
directly as identifiers - only as parameterized values.
"""
import logging
import random
from typing import Optional
from app.services.database import fetch_all, fetch_val

logger = logging.getLogger(__name__)

# Available years in the data
YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]


# =============================================================================
# Dutch Language Search Rules (V1.1)
# =============================================================================
# Problem: "politie" (police) matches "politieke" (political) with ILIKE
# Solution: For Dutch words ending in "-ie", exclude "-iek" false cognates
#
# Examples:
#   "politie"    -> Matches: Politie, Politieacademie, Nationale Politie
#                -> Excludes: Politieke beweging DENK
#   "academie"   -> Matches: Academie, Politieacademie
#                -> Excludes: Academiekring (if it were "-iek")
#
# Pattern: search_term followed by NOT 'k', or end of word, or whitespace
# =============================================================================

def build_search_condition(field: str, param_idx: int, search: str) -> tuple[str, str]:
    """
    Build a search condition with Dutch language awareness.

    For searches ending in "-ie", uses regex to exclude "-iek" false cognates.
    Otherwise uses standard ILIKE for substring matching.

    Args:
        field: The column name to search
        param_idx: The parameter index (e.g., 1 for $1)
        search: The search term from user

    Returns:
        Tuple of (sql_condition, search_pattern)
        - sql_condition: e.g., "field ~* $1" or "field ILIKE $1"
        - search_pattern: e.g., "politie([^k]|$|\\s)" or "%politie%"
    """
    search_lower = search.lower().strip()

    # Dutch "-ie" suffix rule: exclude "-iek" false cognates
    # Common Dutch pairs: politie/politiek, academie/academisch, democratie/democratisch
    if search_lower.endswith("ie") and len(search_lower) >= 3:
        # Regex: search term followed by (not 'k') OR (end of string) OR (whitespace)
        # This matches: Politie, Politieacademie, Nationale Politie
        # But excludes: Politieke, Politiekunde
        return (
            f"{field} ~* ${param_idx}",
            f"{search_lower}([^k]|$|\\s)"
        )

    # Standard ILIKE for other searches
    return (
        f"{field} ILIKE ${param_idx}",
        f"%{search}%"
    )

# =============================================================================
# Security: Identifier Validation
# =============================================================================

# Allowed SQL identifiers (tables and columns) - populated from MODULE_CONFIG
ALLOWED_TABLES: set[str] = set()
ALLOWED_COLUMNS: set[str] = set()


def _init_allowed_identifiers():
    """Initialize allowed identifier sets from MODULE_CONFIG. Called at module load."""
    global ALLOWED_TABLES, ALLOWED_COLUMNS

    # Add tables
    for config in MODULE_CONFIG.values():
        ALLOWED_TABLES.add(config["table"])
        if config.get("aggregated_table"):
            ALLOWED_TABLES.add(config["aggregated_table"])

    # Add universal_search table
    ALLOWED_TABLES.add("universal_search")

    # Add columns
    for config in MODULE_CONFIG.values():
        ALLOWED_COLUMNS.add(config["primary_field"])
        ALLOWED_COLUMNS.add(config["year_field"])
        ALLOWED_COLUMNS.add(config["amount_field"])
        for field in config.get("search_fields", []):
            ALLOWED_COLUMNS.add(field)
        for field in config.get("filter_fields", []):
            ALLOWED_COLUMNS.add(field)

    # Add standard columns
    ALLOWED_COLUMNS.update([
        "totaal", "row_count", "random_order", "modules", "source",
        "ontvanger", "primary_value", "module",
    ])

    # Add year columns
    for year in YEARS:
        ALLOWED_COLUMNS.add(str(year))
        ALLOWED_COLUMNS.add(f"y{year}")


def validate_identifier(identifier: str, allowed: set[str], identifier_type: str = "identifier") -> str:
    """
    Validate that an identifier is in the allowed set.

    SECURITY: This prevents SQL injection via identifier manipulation.
    All table/column names must be validated before use in queries.

    Raises ValueError if identifier is not allowed.
    """
    if identifier not in allowed:
        logger.warning(f"Invalid {identifier_type} attempted: {identifier}")
        raise ValueError(f"Invalid {identifier_type}: {identifier}")
    return identifier


# =============================================================================
# Module Configuration
# =============================================================================

MODULE_CONFIG = {
    "instrumenten": {
        "table": "instrumenten",
        "aggregated_table": "instrumenten_aggregated",  # Pre-computed view
        "primary_field": "ontvanger",
        "year_field": "begrotingsjaar",
        "amount_field": "bedrag",
        "amount_multiplier": 1000,  # Source data in ×1000, normalize to absolute euros
        "search_fields": ["ontvanger", "regeling", "instrument"],
        "filter_fields": ["begrotingsnaam", "artikel", "artikelonderdeel", "instrument", "regeling"],
    },
    "apparaat": {
        "table": "apparaat",
        "aggregated_table": "apparaat_aggregated",
        "primary_field": "kostensoort",
        "year_field": "begrotingsjaar",
        "amount_field": "bedrag",
        "amount_multiplier": 1000,  # Source data in ×1000, normalize to absolute euros
        "search_fields": ["kostensoort", "begrotingsnaam"],
        "filter_fields": ["begrotingsnaam", "artikel", "detail"],
    },
    "inkoop": {
        "table": "inkoop",
        "aggregated_table": "inkoop_aggregated",
        "primary_field": "leverancier",
        "year_field": "jaar",
        "amount_field": "totaal_avg",
        "amount_multiplier": 1,  # Already in absolute euros
        "search_fields": ["leverancier", "ministerie", "categorie"],
        "filter_fields": ["ministerie", "categorie", "staffel"],
    },
    "provincie": {
        "table": "provincie",
        "aggregated_table": "provincie_aggregated",
        "primary_field": "ontvanger",
        "year_field": "jaar",
        "amount_field": "bedrag",
        "amount_multiplier": 1,  # Already in absolute euros
        "search_fields": ["ontvanger", "omschrijving"],
        "filter_fields": ["provincie"],
    },
    "gemeente": {
        "table": "gemeente",
        "aggregated_table": "gemeente_aggregated",
        "primary_field": "ontvanger",
        "year_field": "jaar",
        "amount_field": "bedrag",
        "amount_multiplier": 1,  # Already in absolute euros
        "search_fields": ["ontvanger", "omschrijving", "regeling"],
        "filter_fields": ["gemeente", "beleidsterrein"],
    },
    "publiek": {
        "table": "publiek",
        "aggregated_table": "publiek_aggregated",
        "primary_field": "ontvanger",
        "year_field": "jaar",
        "amount_field": "bedrag",
        "amount_multiplier": 1,  # Already in absolute euros
        "search_fields": ["ontvanger", "omschrijving", "regeling"],
        "filter_fields": ["source", "regeling"],
    },
}

# Initialize allowed identifiers from config
_init_allowed_identifiers()


# =============================================================================
# Aggregation Queries
# =============================================================================

async def get_module_data(
    module: str,
    search: Optional[str] = None,
    jaar: Optional[int] = None,
    min_bedrag: Optional[float] = None,
    max_bedrag: Optional[float] = None,
    sort_by: str = "totaal",
    sort_order: str = "desc",
    limit: int = 25,
    offset: int = 0,
    min_years: Optional[int] = None,  # Filter for recipients with data in X+ years
    filter_fields: Optional[dict[str, list[str]]] = None,  # Multi-select filters
) -> tuple[list[dict], int]:
    """
    Get aggregated data for a module.

    Uses pre-computed materialized view for fast queries when no filters.
    Falls back to source table aggregation when filter_fields are applied
    (aggregated views don't have filter columns like provincie/gemeente).

    Returns:
        Tuple of (rows, total_count)
    """
    if module not in MODULE_CONFIG:
        raise ValueError(f"Unknown module: {module}")

    config = MODULE_CONFIG[module]
    primary = config["primary_field"]

    # Use aggregated view for fast queries UNLESS filter_fields are provided
    # (filter_fields like provincie/gemeente aren't in aggregated views)
    use_aggregated = (
        config.get("aggregated_table") is not None
        and not filter_fields  # Must use source table for filter fields
    )

    if use_aggregated:
        return await _get_from_aggregated_view(
            config=config,
            search=search,
            jaar=jaar,
            min_bedrag=min_bedrag,
            max_bedrag=max_bedrag,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            offset=offset,
            min_years=min_years,
        )
    else:
        return await _get_from_source_table(
            config=config,
            search=search,
            jaar=jaar,
            min_bedrag=min_bedrag,
            max_bedrag=max_bedrag,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            offset=offset,
            min_years=min_years,
            filter_fields=filter_fields,
        )


async def _get_from_aggregated_view(
    config: dict,
    search: Optional[str] = None,
    jaar: Optional[int] = None,
    min_bedrag: Optional[float] = None,
    max_bedrag: Optional[float] = None,
    sort_by: str = "totaal",
    sort_order: str = "desc",
    limit: int = 25,
    offset: int = 0,
    min_years: Optional[int] = None,
) -> tuple[list[dict], int]:
    """Fast path: query pre-computed materialized view."""
    agg_table = config["aggregated_table"]
    primary = config["primary_field"]

    # Build WHERE clause
    where_clauses = []
    params = []
    param_idx = 1

    # Search filter on primary field only (aggregated view only has primary)
    # Uses Dutch language rules to avoid false cognates (e.g., politie/politiek)
    if search:
        condition, pattern = build_search_condition(primary, param_idx, search)
        where_clauses.append(condition)
        params.append(pattern)
        param_idx += 1

    # Year filter: show recipients who have data in that year
    # (still shows all years in response, but filters to active recipients)
    if jaar:
        where_clauses.append(f'"{jaar}" > 0')

    # Amount filters
    if min_bedrag is not None:
        where_clauses.append(f"totaal >= ${param_idx}")
        params.append(min_bedrag)
        param_idx += 1

    if max_bedrag is not None:
        where_clauses.append(f"totaal <= ${param_idx}")
        params.append(max_bedrag)
        param_idx += 1

    # Filter for recipients with data in min_years+ years (UX-002)
    if min_years is not None and min_years > 0:
        year_count_expr = " + ".join([
            f'CASE WHEN "{y}" > 0 THEN 1 ELSE 0 END' for y in YEARS
        ])
        where_clauses.append(f"({year_count_expr}) >= {min_years}")

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    # Store count params BEFORE adding non-WHERE params (relevance, random threshold)
    # Count query only needs WHERE clause parameters
    count_params_snapshot = params.copy()

    # Sort field mapping - support "random" for default view (UX-002)
    # Uses pre-computed random_order column for fast random sorting (~50ms vs 3s)
    # IMPORTANT: When searching, ALWAYS use relevance ranking (ignore random sort)
    use_random_threshold = False
    relevance_select = ""
    if search:
        # When searching: rank by relevance (exact > starts with > word boundary > contains)
        # Then by amount within each relevance tier
        relevance_select = f""",
            CASE
                WHEN UPPER({primary}) = UPPER(${param_idx}) THEN 1
                WHEN UPPER({primary}) LIKE UPPER(${param_idx}) || '%' THEN 2
                WHEN UPPER({primary}) LIKE '% ' || UPPER(${param_idx}) || '%' THEN 3
                ELSE 4
            END AS relevance_score"""
        params.append(search)
        param_idx += 1
        sort_clause = "ORDER BY relevance_score ASC, totaal DESC"
    elif sort_by == "random":
        sort_clause = "ORDER BY random_order"
        # For random sort on first page: use WHERE random_order > threshold
        # This is faster than OFFSET because it uses the index directly
        if offset == 0:
            use_random_threshold = True
            random_threshold = random.random() * 0.9  # 0-0.9 to ensure enough rows after
            where_clauses.append(f"random_order > ${param_idx}")
            params.append(random_threshold)
            param_idx += 1
    else:
        sort_field = "totaal"
        if sort_by == "primary":
            sort_field = primary
        elif sort_by.startswith("y") and sort_by[1:].isdigit():
            # Map y2024 to "2024" column name
            year = sort_by[1:]
            sort_field = f'"{year}"'
        sort_direction = "DESC" if sort_order == "desc" else "ASC"
        sort_clause = f"ORDER BY {sort_field} {sort_direction}"

    # Rebuild where_sql after potential random_order addition
    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    # Count query uses only WHERE clause params (snapshot taken before relevance/random params added)
    count_where = [c for c in where_clauses if "random_order" not in c]
    count_where_sql = f"WHERE {' AND '.join(count_where)}" if count_where else ""
    count_params = count_params_snapshot

    # Main query from aggregated view
    query = f"""
        SELECT
            {primary} AS primary_value,
            "2016" AS y2016, "2017" AS y2017, "2018" AS y2018,
            "2019" AS y2019, "2020" AS y2020, "2021" AS y2021,
            "2022" AS y2022, "2023" AS y2023, "2024" AS y2024,
            totaal,
            row_count{relevance_select}
        FROM {agg_table}
        {where_sql}
        {sort_clause}
        LIMIT ${param_idx} OFFSET ${param_idx + 1}
    """
    params.extend([limit, offset])

    # Count query (without random threshold for accurate total)
    count_query = f"SELECT COUNT(*) FROM {agg_table} {count_where_sql}"

    # Execute queries
    rows = await fetch_all(query, *params)
    total = await fetch_val(count_query, *count_params) if count_params else await fetch_val(count_query)

    # Transform rows
    result = []
    for row in rows:
        years_dict = {year: int(row.get(f"y{year}", 0) or 0) for year in YEARS}
        result.append({
            "primary_value": row["primary_value"],
            "years": years_dict,
            "totaal": int(row["totaal"] or 0),
            "row_count": row["row_count"],
        })

    return result, total or 0


async def _get_from_source_table(
    config: dict,
    search: Optional[str] = None,
    jaar: Optional[int] = None,
    min_bedrag: Optional[float] = None,
    max_bedrag: Optional[float] = None,
    sort_by: str = "totaal",
    sort_order: str = "desc",
    limit: int = 25,
    offset: int = 0,
    min_years: Optional[int] = None,
    filter_fields: Optional[dict[str, list[str]]] = None,  # Multi-select filters
) -> tuple[list[dict], int]:
    """Slow path: aggregate from source table (needed for filter fields)."""
    table = config["table"]
    primary = config["primary_field"]
    year_field = config["year_field"]
    amount_field = config["amount_field"]
    multiplier = config.get("amount_multiplier", 1)
    search_fields = config["search_fields"]

    # Build year columns with COALESCE for null handling
    year_columns = ", ".join([
        f"COALESCE(SUM(CASE WHEN {year_field} = {year} THEN {amount_field} END), 0) * {multiplier} AS \"y{year}\""
        for year in YEARS
    ])

    # Build WHERE clause
    where_clauses = []
    params = []
    param_idx = 1

    # Search filter on multiple fields
    # Uses Dutch language rules to avoid false cognates (e.g., politie/politiek)
    if search:
        condition, pattern = build_search_condition(search_fields[0], param_idx, search)
        # Apply same condition type to all search fields
        if "~*" in condition:
            search_conditions = " OR ".join([
                f"{field} ~* ${param_idx}" for field in search_fields
            ])
        else:
            search_conditions = " OR ".join([
                f"{field} ILIKE ${param_idx}" for field in search_fields
            ])
        where_clauses.append(f"({search_conditions})")
        params.append(pattern)
        param_idx += 1

    # Year filter
    if jaar:
        where_clauses.append(f"{year_field} = ${param_idx}")
        params.append(jaar)
        param_idx += 1

    # Multi-select filter fields (e.g., provincie, gemeente)
    if filter_fields:
        valid_filter_fields = config.get("filter_fields", [])
        for field, values in filter_fields.items():
            if field in valid_filter_fields and values:
                # Build IN clause with parameterized values
                placeholders = ", ".join([f"${param_idx + i}" for i in range(len(values))])
                where_clauses.append(f"{field} IN ({placeholders})")
                params.extend(values)
                param_idx += len(values)

    # Amount filters (on total - applied in HAVING)
    having_clauses = []
    if min_bedrag is not None:
        having_clauses.append(f"SUM({amount_field}) * {multiplier} >= ${param_idx}")
        params.append(min_bedrag)
        param_idx += 1

    if max_bedrag is not None:
        having_clauses.append(f"SUM({amount_field}) * {multiplier} <= ${param_idx}")
        params.append(max_bedrag)
        param_idx += 1

    # Filter for recipients with data in min_years+ years (UX-002)
    if min_years is not None and min_years > 0:
        having_clauses.append(f"COUNT(DISTINCT {year_field}) >= {min_years}")

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
    having_sql = f"HAVING {' AND '.join(having_clauses)}" if having_clauses else ""

    # Store count params BEFORE adding relevance param
    # Count query only needs WHERE and HAVING clause parameters
    count_params = params.copy()

    # Sort field mapping - support "random" for default view (UX-002)
    # NOTE: Source table fallback uses ORDER BY RANDOM() (slow) because it doesn't
    # have pre-computed random_order column. This path is rarely used - aggregated
    # views are preferred and have fast random sorting via random_order column.
    # IMPORTANT: When searching, ALWAYS use relevance ranking (ignore random sort)
    relevance_select = ""
    if search:
        # When searching: rank by relevance (exact > starts with > word boundary > contains)
        # Then by amount within each relevance tier
        relevance_select = f""",
            CASE
                WHEN UPPER({primary}) = UPPER(${param_idx}) THEN 1
                WHEN UPPER({primary}) LIKE UPPER(${param_idx}) || '%' THEN 2
                WHEN UPPER({primary}) LIKE '% ' || UPPER(${param_idx}) || '%' THEN 3
                ELSE 4
            END AS relevance_score"""
        params.append(search)
        param_idx += 1
        sort_clause = "ORDER BY relevance_score ASC, totaal DESC"
    elif sort_by == "random":
        sort_clause = "ORDER BY RANDOM()"
    else:
        sort_field = "totaal"
        if sort_by == "primary":
            sort_field = primary
        elif sort_by.startswith("y") and sort_by[1:].isdigit():
            sort_field = f"\"{sort_by}\""
        sort_direction = "DESC" if sort_order == "desc" else "ASC"
        sort_clause = f"ORDER BY {sort_field} {sort_direction}"

    # Main query with aggregation
    query = f"""
        SELECT
            {primary} AS primary_value,
            {year_columns},
            COALESCE(SUM({amount_field}), 0) * {multiplier} AS totaal,
            COUNT(*) AS row_count{relevance_select}
        FROM {table}
        {where_sql}
        GROUP BY {primary}
        {having_sql}
        {sort_clause}
        LIMIT ${param_idx} OFFSET ${param_idx + 1}
    """
    params.extend([limit, offset])

    # Count query
    count_query = f"""
        SELECT COUNT(*) FROM (
            SELECT {primary}
            FROM {table}
            {where_sql}
            GROUP BY {primary}
            {having_sql}
        ) AS subquery
    """

    # Execute queries
    rows = await fetch_all(query, *params)
    total = await fetch_val(count_query, *count_params) if count_params else await fetch_val(count_query)

    # Transform rows
    result = []
    for row in rows:
        years_dict = {year: int(row.get(f"y{year}", 0) or 0) for year in YEARS}
        result.append({
            "primary_value": row["primary_value"],
            "years": years_dict,
            "totaal": int(row["totaal"] or 0),
            "row_count": row["row_count"],
        })

    return result, total or 0


async def get_row_details(
    module: str,
    primary_value: str,
    group_by: Optional[str] = None,
    jaar: Optional[int] = None,
) -> list[dict]:
    """
    Get detail rows for a specific recipient/primary value.

    Used when expanding a row to see the underlying line items.
    """
    if module not in MODULE_CONFIG:
        raise ValueError(f"Unknown module: {module}")

    config = MODULE_CONFIG[module]
    table = config["table"]
    primary = config["primary_field"]
    year_field = config["year_field"]
    amount_field = config["amount_field"]
    multiplier = config.get("amount_multiplier", 1)

    # Default grouping fields per module
    default_group_by = {
        "instrumenten": "regeling",
        "apparaat": "begrotingsnaam",
        "inkoop": "ministerie",
        "provincie": "provincie",
        "gemeente": "gemeente",
        "publiek": "source",
    }

    group_field = group_by or default_group_by.get(module, primary)

    # Build year columns with multiplier for normalization
    year_columns = ", ".join([
        f"COALESCE(SUM(CASE WHEN {year_field} = {year} THEN {amount_field} END), 0) * {multiplier} AS \"y{year}\""
        for year in YEARS
    ])

    # Build WHERE clause
    where_clauses = [f"{primary} = $1"]
    params = [primary_value]

    if jaar:
        where_clauses.append(f"{year_field} = $2")
        params.append(jaar)

    where_sql = f"WHERE {' AND '.join(where_clauses)}"

    query = f"""
        SELECT
            {group_field} AS group_value,
            {year_columns},
            COALESCE(SUM({amount_field}), 0) * {multiplier} AS totaal,
            COUNT(*) AS row_count
        FROM {table}
        {where_sql}
        GROUP BY {group_field}
        ORDER BY totaal DESC
        LIMIT 100
    """

    rows = await fetch_all(query, *params)

    result = []
    for row in rows:
        years_dict = {year: int(row.get(f"y{year}", 0) or 0) for year in YEARS}
        result.append({
            "group_by": group_field,
            "group_value": row["group_value"],
            "years": years_dict,
            "totaal": int(row["totaal"] or 0),
            "row_count": row["row_count"],
        })

    return result


async def get_integraal_data(
    search: Optional[str] = None,
    jaar: Optional[int] = None,
    min_bedrag: Optional[float] = None,
    max_bedrag: Optional[float] = None,
    sort_by: str = "totaal",
    sort_order: str = "desc",
    limit: int = 25,
    offset: int = 0,
    min_years: Optional[int] = None,
    filter_modules: Optional[list[str]] = None,
    min_instanties: Optional[int] = None,
) -> tuple[list[dict], int]:
    """
    Get cross-module data from universal_search table.

    This table is pre-aggregated with recipient totals across all modules.
    """
    # Map display names to source values in database
    module_name_map = {
        "Instrumenten": "instrumenten",
        "Apparaat": "apparaat",
        "Inkoop": "inkoop",
        "Provincie": "provincie",
        "Gemeente": "gemeente",
        "Publiek": "publiek",
    }

    # Build WHERE clause
    where_clauses = []
    params = []
    param_idx = 1

    # Search with Dutch language rules to avoid false cognates
    if search:
        condition, pattern = build_search_condition("ontvanger", param_idx, search)
        where_clauses.append(condition)
        params.append(pattern)
        param_idx += 1

    # Year filter: show recipients who have data in that year
    if jaar:
        where_clauses.append(f'"{jaar}" > 0')

    # Amount filters
    if min_bedrag is not None:
        where_clauses.append(f"totaal >= ${param_idx}")
        params.append(min_bedrag)
        param_idx += 1

    if max_bedrag is not None:
        where_clauses.append(f"totaal <= ${param_idx}")
        params.append(max_bedrag)
        param_idx += 1

    # Filter for recipients with data in min_years+ years (UX-002)
    if min_years is not None and min_years > 0:
        year_count_expr = " + ".join([
            f'CASE WHEN "{y}" > 0 THEN 1 ELSE 0 END' for y in YEARS
        ])
        where_clauses.append(f"({year_count_expr}) >= {min_years}")

    # Filter by modules: recipient must appear in ALL selected modules
    if filter_modules:
        for mod_display in filter_modules:
            mod_db = module_name_map.get(mod_display, mod_display.lower())
            where_clauses.append(f"sources ILIKE ${param_idx}")
            params.append(f"%{mod_db}%")
            param_idx += 1

    # Filter by minimum number of instanties (source_count)
    if min_instanties is not None and min_instanties > 1:
        where_clauses.append(f"source_count >= ${param_idx}")
        params.append(min_instanties)
        param_idx += 1

    # Store count params BEFORE adding non-WHERE params (relevance, random threshold)
    # Count query only needs WHERE clause parameters
    count_params_snapshot = params.copy()

    # Sort field mapping - support "random" for default view (UX-002)
    # Uses pre-computed random_order column for fast random sorting (~50ms vs 3s)
    # IMPORTANT: When searching, ALWAYS use relevance ranking (ignore random sort)
    use_random_threshold = False
    relevance_select = ""
    if search:
        # When searching: rank by relevance (exact > starts with > word boundary > contains)
        # Then by amount within each relevance tier
        relevance_select = f""",
            CASE
                WHEN UPPER(ontvanger) = UPPER(${param_idx}) THEN 1
                WHEN UPPER(ontvanger) LIKE UPPER(${param_idx}) || '%' THEN 2
                WHEN UPPER(ontvanger) LIKE '% ' || UPPER(${param_idx}) || '%' THEN 3
                ELSE 4
            END AS relevance_score"""
        params.append(search)
        param_idx += 1
        sort_clause = "ORDER BY relevance_score ASC, totaal DESC"
    elif sort_by == "random":
        sort_clause = "ORDER BY random_order"
        # For random sort on first page: use WHERE random_order > threshold
        # This is faster than OFFSET because it uses the index directly
        if offset == 0:
            use_random_threshold = True
            random_threshold = random.random() * 0.9  # 0-0.9 to ensure enough rows after
            where_clauses.append(f"random_order > ${param_idx}")
            params.append(random_threshold)
            param_idx += 1
    else:
        sort_field = "totaal"
        if sort_by == "primary":
            sort_field = "ontvanger"
        elif sort_by.startswith("y") and sort_by[1:].isdigit():
            year = sort_by[1:]
            sort_field = f'"{year}"'
        sort_direction = "DESC" if sort_order == "desc" else "ASC"
        sort_clause = f"ORDER BY {sort_field} {sort_direction}"

    # Rebuild where_sql after potential random_order addition
    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    # Count query uses only WHERE clause params (snapshot taken before relevance/random params added)
    count_where = [c for c in where_clauses if "random_order" not in c]
    count_where_sql = f"WHERE {' AND '.join(count_where)}" if count_where else ""
    count_params = count_params_snapshot

    query = f"""
        SELECT
            ontvanger AS primary_value,
            sources,
            source_count,
            "2016" AS y2016,
            "2017" AS y2017,
            "2018" AS y2018,
            "2019" AS y2019,
            "2020" AS y2020,
            "2021" AS y2021,
            "2022" AS y2022,
            "2023" AS y2023,
            "2024" AS y2024,
            totaal{relevance_select}
        FROM universal_search
        {where_sql}
        {sort_clause}
        LIMIT ${param_idx} OFFSET ${param_idx + 1}
    """
    params.extend([limit, offset])

    # Count query (without random threshold for accurate total)
    count_query = f"SELECT COUNT(*) FROM universal_search {count_where_sql}"

    # Execute queries
    rows = await fetch_all(query, *params)
    total = await fetch_val(count_query, *count_params) if count_params else await fetch_val(count_query)

    result = []
    for row in rows:
        years_dict = {
            year: int(row.get(f"y{year}", 0) or 0)
            for year in YEARS
        }
        result.append({
            "primary_value": row["primary_value"],
            "years": years_dict,
            "totaal": int(row["totaal"] or 0),
            "row_count": row["source_count"] or 1,  # Use source_count as row_count
            "modules": row["sources"].split(",") if row["sources"] else [],
        })

    return result, total or 0


async def get_integraal_details(
    primary_value: str,
    jaar: Optional[int] = None,
) -> list[dict]:
    """
    Get module breakdown for a specific recipient in integraal view.

    Shows how much the recipient received from each module by querying
    each module's aggregated view.
    """
    # Modules with their aggregated table and primary field
    # (not apparaat - it uses kostensoort, not recipients)
    modules_to_query = [
        ("instrumenten", "instrumenten_aggregated", "ontvanger"),
        ("inkoop", "inkoop_aggregated", "leverancier"),
        ("provincie", "provincie_aggregated", "ontvanger"),
        ("gemeente", "gemeente_aggregated", "ontvanger"),
        ("publiek", "publiek_aggregated", "ontvanger"),
    ]

    result = []

    for module_name, agg_table, primary_field in modules_to_query:
        # Year filter clause
        year_filter = f'AND "{jaar}" > 0' if jaar else ""

        query = f"""
            SELECT
                "2016" AS y2016, "2017" AS y2017, "2018" AS y2018,
                "2019" AS y2019, "2020" AS y2020, "2021" AS y2021,
                "2022" AS y2022, "2023" AS y2023, "2024" AS y2024,
                totaal,
                row_count
            FROM {agg_table}
            WHERE {primary_field} = $1 {year_filter}
        """

        rows = await fetch_all(query, primary_value)

        if rows:
            row = rows[0]
            years_dict = {year: int(row.get(f"y{year}", 0) or 0) for year in YEARS}
            result.append({
                "group_by": "module",
                "group_value": module_name,
                "years": years_dict,
                "totaal": int(row["totaal"] or 0),
                "row_count": row["row_count"],
            })

    # Sort by totaal descending
    result.sort(key=lambda x: x["totaal"], reverse=True)

    return result


# =============================================================================
# Filter Options
# =============================================================================

async def get_filter_options(module: str, field: str) -> list[str]:
    """
    Get distinct values for a filter field.

    Used for auto-populating multi-select dropdowns.
    Returns sorted list of unique values.
    """
    if module not in MODULE_CONFIG:
        raise ValueError(f"Unknown module: {module}")

    config = MODULE_CONFIG[module]
    table = config["table"]

    # Validate field is a valid filter field for this module
    valid_fields = config.get("filter_fields", [])
    if field not in valid_fields:
        raise ValueError(f"Invalid filter field '{field}' for module '{module}'")

    # Query distinct values (excluding NULL and empty strings)
    # Cast to text to handle both string and numeric columns uniformly
    query = f"""
        SELECT DISTINCT {field}::text AS value
        FROM {table}
        WHERE {field} IS NOT NULL
          AND {field}::text != ''
        ORDER BY {field}::text
    """

    rows = await fetch_all(query)
    return [row["value"] for row in rows]


# =============================================================================
# Module Autocomplete
# =============================================================================

async def get_module_autocomplete(
    module: str,
    search: str,
    limit: int = 5,
) -> dict:
    """
    Get autocomplete suggestions for a module.

    Returns two sections:
    1. current_module: Recipients matching search IN the current module (with amounts)
    2. other_modules: Recipients matching search in OTHER modules (with module badges)

    This ensures "what you see is what you get" - current module results
    match what users will see when they press Enter.
    """
    if module not in MODULE_CONFIG:
        raise ValueError(f"Unknown module: {module}")

    config = MODULE_CONFIG[module]
    primary = config["primary_field"]
    agg_table = config.get("aggregated_table")

    current_module_results = []
    other_modules_results = []

    # 1. Search current module's aggregated view with relevance ranking
    # Uses Dutch language rules to avoid false cognates
    if agg_table:
        condition, pattern = build_search_condition(primary, 2, search)
        query = f"""
            SELECT
                {primary} AS name,
                totaal,
                CASE
                    WHEN UPPER({primary}) = UPPER($1) THEN 1
                    WHEN UPPER({primary}) LIKE UPPER($1) || '%' THEN 2
                    WHEN UPPER({primary}) LIKE '% ' || UPPER($1) || '%' THEN 3
                    ELSE 4
                END AS relevance_score
            FROM {agg_table}
            WHERE {condition}
            ORDER BY relevance_score ASC, totaal DESC
            LIMIT $3
        """
        rows = await fetch_all(query, search, pattern, limit)

        for row in rows:
            current_module_results.append({
                "name": row["name"],
                "totaal": int(row["totaal"] or 0),
            })

    # 2. Search universal_search for recipients in OTHER modules
    # Exclude recipients already shown in current module
    current_names = {r["name"].upper() for r in current_module_results}

    # Module name variants to filter out (sources may contain different formats)
    module_variants = {
        module.lower(),
        module,
    }
    # Add display name variants
    module_display_names = {
        "instrumenten": ["instrumenten", "financiële instrumenten", "financiele instrumenten"],
        "apparaat": ["apparaat", "apparaatsuitgaven"],
        "inkoop": ["inkoop", "inkoopuitgaven"],
        "provincie": ["provincie", "provinciale subsidieregisters"],
        "gemeente": ["gemeente", "gemeentelijke subsidieregisters"],
        "publiek": ["publiek", "publieke uitvoeringsorganisaties"],
    }
    if module.lower() in module_display_names:
        module_variants.update(v.lower() for v in module_display_names[module.lower()])

    # Query universal_search for matching recipients with relevance ranking
    # Uses Dutch language rules to avoid false cognates
    universal_condition, universal_pattern = build_search_condition("ontvanger", 2, search)
    universal_query = f"""
        SELECT
            ontvanger AS name,
            sources,
            CASE
                WHEN UPPER(ontvanger) = UPPER($1) THEN 1
                WHEN UPPER(ontvanger) LIKE UPPER($1) || '%' THEN 2
                WHEN UPPER(ontvanger) LIKE '% ' || UPPER($1) || '%' THEN 3
                ELSE 4
            END AS relevance_score
        FROM universal_search
        WHERE {universal_condition}
        ORDER BY relevance_score ASC, totaal DESC
        LIMIT $3
    """
    universal_rows = await fetch_all(universal_query, search, universal_pattern, limit * 2)

    for row in universal_rows:
        name = row["name"]
        sources = row["sources"].split(",") if row["sources"] else []

        # Filter out the current module from sources (check all variants)
        other_sources = [s for s in sources if s.lower().strip() not in module_variants]

        # Only include if:
        # - Has sources in other modules (not just the current one)
        # - Not already shown in current module results
        if other_sources and name.upper() not in current_names:
            other_modules_results.append({
                "name": name,
                "modules": other_sources,
            })

            if len(other_modules_results) >= limit:
                break

    return {
        "current_module": current_module_results,
        "other_modules": other_modules_results,
    }


async def get_integraal_autocomplete(
    search: str,
    limit: int = 8,
) -> dict:
    """
    Get autocomplete suggestions from integraal (cross-module) view.

    For integraal, we show all recipients with their module badges.
    No "current module" vs "other modules" split since integraal IS cross-module.
    """
    # Uses Dutch language rules to avoid false cognates
    condition, pattern = build_search_condition("ontvanger", 2, search)
    query = f"""
        SELECT
            ontvanger AS name,
            totaal,
            sources,
            CASE
                WHEN UPPER(ontvanger) = UPPER($1) THEN 1
                WHEN UPPER(ontvanger) LIKE UPPER($1) || '%' THEN 2
                WHEN UPPER(ontvanger) LIKE '% ' || UPPER($1) || '%' THEN 3
                ELSE 4
            END AS relevance_score
        FROM universal_search
        WHERE {condition}
        ORDER BY relevance_score ASC, totaal DESC
        LIMIT $3
    """

    rows = await fetch_all(query, search, pattern, limit)

    results = []
    for row in rows:
        sources = row["sources"].split(",") if row["sources"] else []
        results.append({
            "name": row["name"],
            "totaal": int(row["totaal"] or 0),
            "modules": sources,
        })

    return {
        "current_module": results,  # For integraal, all results go in one section
        "other_modules": [],
    }
