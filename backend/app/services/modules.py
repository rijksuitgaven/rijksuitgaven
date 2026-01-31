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
import re
from typing import Optional
import httpx
from app.services.database import fetch_all, fetch_val
from app.config import get_settings

logger = logging.getLogger(__name__)

# Available years in the data
YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]


# =============================================================================
# Typesense Client Helper (for fast autocomplete)
# =============================================================================

_settings = None

def _get_settings():
    """Lazy load settings."""
    global _settings
    if _settings is None:
        _settings = get_settings()
    return _settings


async def _typesense_search(collection: str, params: dict) -> dict:
    """
    Execute search against Typesense.

    Uses httpx for async HTTP requests. Returns empty result on error.
    Typesense delivers <50ms response times vs seconds for PostgreSQL regex.
    """
    settings = _get_settings()
    if not settings.typesense_host or not settings.typesense_api_key:
        logger.warning("Typesense not configured, falling back to empty results")
        return {"hits": [], "grouped_hits": []}

    url = f"{settings.typesense_protocol}://{settings.typesense_host}:{settings.typesense_port}/collections/{collection}/documents/search"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                params=params,
                headers={"X-TYPESENSE-API-KEY": settings.typesense_api_key},
                timeout=5.0,  # Fast timeout - autocomplete must be quick
            )

            if response.status_code != 200:
                logger.warning(f"Typesense search failed: {response.status_code}")
                return {"hits": [], "grouped_hits": []}

            return response.json()
    except Exception as e:
        logger.error(f"Typesense search error: {type(e).__name__}: {e}")
        return {"hits": [], "grouped_hits": []}


# =============================================================================
# Word-Boundary Search (V1.2)
# =============================================================================
# Problem: Substring matching returns false positives
#   "politie" matched "De Designpolitie" (a design company, not police)
#   "Ook in: Inkoop (28)" included unrelated compound words
#
# Solution: Word-boundary matching using PostgreSQL \y regex
#   "politie" matches: Politie, Nationale Politie, Politie B.V.
#   "politie" does NOT match: Designpolitie, Politieacademie
#
# UX rationale: Users searching "politie" expect police-related results.
# Compound words like "Designpolitie" break that expectation.
# =============================================================================

def build_search_condition(field: str, param_idx: int, search: str) -> tuple[str, str]:
    """
    Build a search condition with word-boundary matching.

    Uses PostgreSQL regex \\y for word boundaries.
    "politie" matches "Politie", "Nationale Politie"
    but NOT "Designpolitie", "Politieacademie"

    Args:
        field: The column name to search
        param_idx: The parameter index (e.g., 1 for $1)
        search: The search term from user

    Returns:
        Tuple of (sql_condition, search_pattern)
        - sql_condition: e.g., "field ~* $1"
        - search_pattern: e.g., "\\ypolitie\\y"
    """
    search_lower = search.lower().strip()

    # Escape regex special characters (e.g., ".", "+", "*")
    escaped = re.escape(search_lower)

    # Word boundary matching: \y = word boundary in PostgreSQL
    # Matches at: start/end of string, whitespace, punctuation
    # Does NOT match: within compound words
    return (
        f"{field} ~* ${param_idx}",
        f"\\y{escaped}\\y"
    )


async def _lookup_matched_fields(
    table: str,
    primary_field: str,
    search_fields: list[str],
    primary_values: list[str],
    search: str,
) -> dict[str, tuple[str | None, str | None]]:
    """
    Hybrid lookup: find which field matched for each primary value.

    This is called AFTER the aggregated view query to enrich results with
    matchedField/matchedValue without the expensive GROUP BY on full table.

    OPTIMIZATION: Only looks up fields OTHER than primary (if primary matched,
    user already sees the match in the name - no need for "Gevonden in").

    Args:
        table: Source table name
        primary_field: Primary column (e.g., 'ontvanger')
        search_fields: List of searchable fields
        primary_values: List of primary values to lookup (from aggregated view results)
        search: Search term

    Returns:
        Dict mapping primary_value (normalized) to (matched_field, matched_value) tuple
    """
    if not primary_values or not search:
        return {}

    # Non-primary search fields only (we skip primary - already visible in results)
    other_fields = [f for f in search_fields if f != primary_field]
    if not other_fields:
        return {}  # No other fields to search

    # Build search pattern
    _, pattern = build_search_condition(other_fields[0], 1, search)

    # Build CASE expressions to find first matching field and its value
    # Priority order: same as search_fields order
    case_field = "CASE\n"
    case_value = "CASE\n"
    for field in other_fields:
        case_field += f"            WHEN {field} ~* $1 THEN '{field}'\n"
        case_value += f"            WHEN {field} ~* $1 THEN {field}\n"
    case_field += "            ELSE NULL\n        END"
    case_value += "            ELSE NULL\n        END"

    # Build OR conditions for non-primary fields
    or_conditions = " OR ".join([f"{f} ~* $1" for f in other_fields])

    # Query: find ONE matching row per primary value where a non-primary field matches
    # Uses LIMIT per primary_value via lateral join for efficiency
    # This is much faster than DISTINCT ON with large IN clause
    query = f"""
        WITH primary_list AS (
            SELECT unnest($2::text[]) AS pv
        )
        SELECT
            pl.pv AS key,
            {case_field} AS matched_field,
            {case_value} AS matched_value
        FROM primary_list pl
        CROSS JOIN LATERAL (
            SELECT *
            FROM {table}
            WHERE UPPER({primary_field}) = pl.pv
              AND ({or_conditions})
            LIMIT 1
        ) t
    """

    # Execute query - pass pattern and array of primary values
    rows = await fetch_all(query, pattern, primary_values)

    # Build result dict
    result = {}
    for row in rows:
        key = row["key"]
        result[key] = (row["matched_field"], row["matched_value"])

    return result


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
        for field in config.get("extra_columns", []):
            ALLOWED_COLUMNS.add(field)

    # Add standard columns
    ALLOWED_COLUMNS.update([
        "totaal", "row_count", "random_order", "modules", "source",
        "ontvanger", "primary_value", "module",
        "trefwoorden", "sectoren", "regio", "omschrijving", "organisatie",
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
        "search_fields": ["ontvanger", "regeling", "instrument", "begrotingsnaam", "artikel", "artikelonderdeel", "detail"],
        "filter_fields": ["begrotingsnaam", "artikel", "artikelonderdeel", "instrument", "regeling"],
        "extra_columns": ["regeling", "artikel", "artikelonderdeel", "instrument", "begrotingsnaam", "detail"],
        # Columns available in aggregated view (default columns for speed)
        "view_columns": ["artikel", "regeling", "instrument", "begrotingsnaam"],
    },
    "apparaat": {
        "table": "apparaat",
        "aggregated_table": "apparaat_aggregated",
        "primary_field": "kostensoort",
        "year_field": "begrotingsjaar",
        "amount_field": "bedrag",
        "amount_multiplier": 1000,  # Source data in ×1000, normalize to absolute euros
        "search_fields": ["kostensoort", "begrotingsnaam", "artikel", "detail"],
        "filter_fields": ["begrotingsnaam", "artikel", "detail"],
        "extra_columns": ["kostensoort", "artikel", "begrotingsnaam", "detail"],
        # Columns available in aggregated view (default columns for speed)
        "view_columns": ["artikel", "detail"],
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
        "extra_columns": ["ministerie", "categorie", "staffel"],
        # Columns available in aggregated view (default columns for speed)
        "view_columns": ["categorie", "staffel"],
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
        "extra_columns": ["provincie", "omschrijving"],
        # Columns available in aggregated view (default columns for speed)
        "view_columns": ["provincie", "omschrijving"],
    },
    "gemeente": {
        "table": "gemeente",
        "aggregated_table": "gemeente_aggregated",
        "primary_field": "ontvanger",
        "year_field": "jaar",
        "amount_field": "bedrag",
        "amount_multiplier": 1,  # Already in absolute euros
        "search_fields": ["ontvanger", "omschrijving", "regeling", "beleidsterrein"],
        "filter_fields": ["gemeente", "beleidsterrein"],
        "extra_columns": ["gemeente", "beleidsterrein", "regeling", "omschrijving"],
        # Columns available in aggregated view (default columns for speed)
        "view_columns": ["gemeente", "omschrijving"],
    },
    "publiek": {
        "table": "publiek",
        "aggregated_table": "publiek_aggregated",
        "primary_field": "ontvanger",
        "year_field": "jaar",
        "amount_field": "bedrag",
        "amount_multiplier": 1,  # Already in absolute euros
        "search_fields": ["ontvanger", "omschrijving", "regeling", "trefwoorden", "sectoren"],
        "filter_fields": ["source", "regeling"],
        "extra_columns": ["source", "regeling", "trefwoorden", "sectoren", "regio", "staffel", "onderdeel"],
        # Columns available in aggregated view (default columns for speed)
        "view_columns": ["source"],
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
    columns: Optional[list[str]] = None,  # Extra columns to return (max 2)
) -> tuple[list[dict], int]:
    """
    Get aggregated data for a module.

    Uses pre-computed materialized view for fast queries when no filters.
    Falls back to source table aggregation when filter_fields are applied
    (aggregated views don't have filter columns like provincie/gemeente).

    Args:
        columns: Optional list of extra column names to include (max 2).
                 Values are fetched from the source table for each aggregated row.

    Returns:
        Tuple of (rows, total_count)
    """
    if module not in MODULE_CONFIG:
        raise ValueError(f"Unknown module: {module}")

    config = MODULE_CONFIG[module]
    primary = config["primary_field"]

    # Validate requested columns against allowed extra_columns for this module
    valid_columns: list[str] = []
    if columns:
        allowed_extra = config.get("extra_columns", [])
        for col in columns[:2]:  # Max 2 columns
            if col in allowed_extra:
                valid_columns.append(col)
            else:
                logger.warning(f"Invalid extra column '{col}' requested for module '{module}'")

    # Check if requested columns are available in the aggregated view
    # View columns are pre-computed default columns (e.g., artikel, regeling for instrumenten)
    view_columns = set(config.get("view_columns", []))
    columns_in_view = all(col in view_columns for col in valid_columns) if valid_columns else True

    # Use aggregated view for fast queries when:
    # 1. Aggregated table exists
    # 2. No filter_fields (filter fields like provincie/gemeente aren't in views)
    # 3. Either no columns requested OR all columns are in the view
    # Note: Search CAN use aggregated view (searches primary field only, fast)
    # The "Gevonden in" feature won't work but performance is acceptable
    # TODO: Implement hybrid approach for full search with matchedField/matchedValue
    use_aggregated = (
        config.get("aggregated_table") is not None
        and not filter_fields  # Must use source table for filter fields
        and columns_in_view  # Can use view if columns are available or none requested
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
            columns=valid_columns if valid_columns else None,  # Pass columns to view query
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
            columns=valid_columns,
        )


# Fields with _lower variants in Typesense (for prefix matching)
# Only primary fields have _lower variants in collections.json
TYPESENSE_LOWER_FIELDS = {
    "instrumenten": ["ontvanger"],
    "apparaat": ["kostensoort", "begrotingsnaam"],
    "inkoop": ["leverancier"],
    "publiek": ["ontvanger"],
    "gemeente": ["ontvanger"],
    "provincie": ["ontvanger"],
}

# All searchable fields per Typesense collection
TYPESENSE_SEARCHABLE_FIELDS = {
    "instrumenten": ["ontvanger", "regeling", "begrotingsnaam", "artikel", "instrument"],
    "apparaat": ["kostensoort", "begrotingsnaam", "artikel", "detail"],
    "inkoop": ["leverancier", "ministerie", "categorie"],
    "publiek": ["ontvanger", "source", "regeling", "omschrijving"],
    "gemeente": ["ontvanger", "gemeente", "beleidsterrein", "regeling", "omschrijving"],
    "provincie": ["ontvanger", "provincie", "omschrijving"],
}


async def _typesense_get_primary_keys(
    collection: str,
    primary_field: str,
    search: str,
    limit: int = 1000,
) -> list[str]:
    """
    Get matching primary keys from Typesense for hybrid search.

    Uses Typesense to quickly identify which primary entities match the search
    across ALL searchable fields (not just primary), then we query PostgreSQL
    with a simple WHERE IN clause (uses index, fast).

    This is 10-100x faster than regex search directly in PostgreSQL.

    Args:
        collection: Typesense collection name
        primary_field: Primary field to extract and group by
        search: Search term
        limit: Max results to return
    """
    # Get searchable fields for this collection
    search_fields = TYPESENSE_SEARCHABLE_FIELDS.get(collection, [primary_field])
    lower_fields = TYPESENSE_LOWER_FIELDS.get(collection, [])

    # Build query_by from fields that actually exist in Typesense
    query_by_parts = []
    for field in search_fields:
        query_by_parts.append(field)
        # Only add _lower variant if it exists
        if field in lower_fields:
            query_by_parts.append(f"{field}_lower")

    query_by = ",".join(query_by_parts)

    params = {
        "q": search,
        "query_by": query_by,
        "prefix": "true",
        "per_page": str(limit),
        "group_by": primary_field,
        "group_limit": "1",
    }

    data = await _typesense_search(collection, params)

    # Log Typesense response for debugging
    found_count = data.get("found", 0)
    grouped_count = len(data.get("grouped_hits", []))
    logger.info(f"Typesense search '{search}' in {collection}: found={found_count}, groups={grouped_count}, query_by={query_by}")

    # Extract primary values from grouped hits
    primary_keys = []
    for group in data.get("grouped_hits", []):
        hits = group.get("hits", [])
        if hits:
            doc = hits[0].get("document", {})
            value = doc.get(primary_field)
            if value:
                primary_keys.append(value)

    return primary_keys


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
    columns: Optional[list[str]] = None,  # Extra columns available in view
) -> tuple[list[dict], int]:
    """Fast path: query pre-computed materialized view."""
    agg_table = config["aggregated_table"]
    primary = config["primary_field"]

    # Build extra columns selection if columns are requested and available in view
    extra_columns_select = ""
    if columns and not search:
        # Only include static columns when NOT searching (search uses matched_field instead)
        extra_columns_select = ", " + ", ".join([f"{col} AS extra_{col}" for col in columns])

    # Build WHERE clause
    where_clauses = []
    params = []
    param_idx = 1

    # ==========================================================================
    # HYBRID SEARCH: Typesense → PostgreSQL
    # ==========================================================================
    # Problem: Regex search on 5 columns is slow (5+ seconds on 200K rows)
    # Solution: Use Typesense to find matching primary keys (<50ms),
    #           then query PostgreSQL with WHERE IN (uses index, fast)
    # ==========================================================================
    typesense_primary_keys: list[str] = []
    if search:
        # Get Typesense collection for this module
        collection = TYPESENSE_COLLECTIONS.get(config["table"])
        if collection:
            # Get matching primary keys from Typesense (fast)
            # Searchable fields are defined in TYPESENSE_SEARCHABLE_FIELDS
            typesense_primary_keys = await _typesense_get_primary_keys(
                collection=collection,
                primary_field=primary,
                search=search,
                limit=1000,  # Get more than needed for accurate count
            )

            if typesense_primary_keys:
                # Use IN clause with array (much faster than regex)
                where_clauses.append(f"{primary} = ANY(${param_idx})")
                params.append(typesense_primary_keys)
                param_idx += 1
            else:
                # Typesense returned empty - fall back to regex search
                # This happens when Typesense not configured or no matches found
                logger.info(f"Typesense returned 0 results for '{search}', falling back to regex")
                view_cols = config.get("view_columns", [])
                searchable_fields = [primary] + [col for col in view_cols if col != primary]

                or_conditions = []
                _, pattern = build_search_condition(primary, param_idx, search)
                for field in searchable_fields:
                    or_conditions.append(f"{field} ~* ${param_idx}")

                where_clauses.append(f"({' OR '.join(or_conditions)})")
                params.append(pattern)
                param_idx += 1
        else:
            # Fallback: regex search if Typesense collection not mapped
            view_cols = config.get("view_columns", [])
            searchable_fields = [primary] + [col for col in view_cols if col != primary]

            or_conditions = []
            _, pattern = build_search_condition(primary, param_idx, search)
            for field in searchable_fields:
                or_conditions.append(f"{field} ~* ${param_idx}")

            where_clauses.append(f"({' OR '.join(or_conditions)})")
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
    # Uses pre-computed years_with_data column for fast filtering
    if min_years is not None and min_years > 0:
        where_clauses.append(f"years_with_data >= {min_years}")

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
        # When searching: exact match first, then everything else by totaal
        # Option C: Users want exact match on top, then biggest money flows
        relevance_select = f""",
            CASE
                WHEN UPPER({primary}) = UPPER(${param_idx}) THEN 1
                ELSE 2
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
            row_count{extra_columns_select}{relevance_select}
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

    # Hybrid lookup: if searching, find which field matched for each result
    # This enriches aggregated view results with matchedField/matchedValue
    # OPTIMIZATION: Only lookup for non-primary field matches
    matched_fields_map: dict[str, tuple[str | None, str | None]] = {}
    if search and rows:
        table = config["table"]
        search_fields = config.get("search_fields", [primary])
        # Pass uppercase primary values (matches UPPER() in lookup query)
        primary_values = [row["primary_value"].upper() for row in rows]
        matched_fields_map = await _lookup_matched_fields(
            table=table,
            primary_field=primary,
            search_fields=search_fields,
            primary_values=primary_values,
            search=search,
        )

    # Transform rows
    result = []
    for row in rows:
        years_dict = {year: int(row.get(f"y{year}", 0) or 0) for year in YEARS}
        row_data = {
            "primary_value": row["primary_value"],
            "years": years_dict,
            "totaal": int(row["totaal"] or 0),
            "row_count": row["row_count"],
        }
        # Add extra columns if requested (from view columns)
        if columns and not search:
            extra_cols = {}
            for col in columns:
                val = row.get(f"extra_{col}")
                # Cast to string (staffel is INTEGER, API expects strings)
                extra_cols[col] = str(val) if val is not None else None
            row_data["extra_columns"] = extra_cols

        # Add matched field info from hybrid lookup
        if search:
            # Use uppercase key to match the lookup (matches UPPER() in query)
            key = row["primary_value"].upper()
            matched = matched_fields_map.get(key, (None, None))
            row_data["matched_field"] = matched[0]
            row_data["matched_value"] = matched[1]

        result.append(row_data)

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
    columns: Optional[list[str]] = None,  # Extra columns to return
) -> tuple[list[dict], int]:
    """Slow path: aggregate from source table (needed for filter fields and extra columns)."""
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

    # Build extra columns selection (MODE() returns most frequent value per group)
    extra_columns_select = ""
    if columns and not search:
        # Only use static extra columns when NOT searching
        # When searching, we use matched_field/matched_value instead
        for col in columns:
            validate_identifier(col, ALLOWED_COLUMNS, "column")
        extra_columns_select = ", " + ", ".join([
            f"MODE() WITHIN GROUP (ORDER BY {col}) AS extra_{col}"
            for col in columns
        ])

    # For matched_field detection when searching, we'll build SQL to find which field matched
    # This is built later after we know the search pattern
    matched_field_sql = ""

    # Build WHERE clause
    where_clauses = []
    params = []
    param_idx = 1

    # Track search info for matched_field/matched_value detection
    search_pattern = None
    search_operator = None

    # Search filter on multiple fields
    # Uses Dutch language rules to avoid false cognates (e.g., politie/politiek)
    if search:
        condition, pattern = build_search_condition(search_fields[0], param_idx, search)
        search_pattern = pattern
        # Apply same condition type to all search fields
        if "~*" in condition:
            search_operator = "~*"
            search_conditions = " OR ".join([
                f"{field} ~* ${param_idx}" for field in search_fields
            ])
        else:
            search_operator = "ILIKE"
            search_conditions = " OR ".join([
                f"{field} ILIKE ${param_idx}" for field in search_fields
            ])
        where_clauses.append(f"({search_conditions})")
        params.append(pattern)
        param_idx += 1

        # Build matched field detection SQL for search results
        # This finds which field matched and what value it had
        # We check each search field and get the first matching value
        matched_field_cases = []
        for field in search_fields:
            if field != primary:  # Skip primary field - we already show that
                matched_field_cases.append(
                    f"MAX(CASE WHEN {field} {search_operator} $1 THEN {field} END) AS matched_{field}"
                )
        if matched_field_cases:
            matched_field_sql = ", " + ", ".join(matched_field_cases)

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
        # When searching: exact match first, then everything else by totaal
        # Option C: Users want exact match on top, then biggest money flows
        relevance_select = f""",
            CASE
                WHEN UPPER({primary}) = UPPER(${param_idx}) THEN 1
                ELSE 2
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
            COUNT(*) AS row_count{extra_columns_select}{matched_field_sql}{relevance_select}
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
        row_data = {
            "primary_value": row["primary_value"],
            "years": years_dict,
            "totaal": int(row["totaal"] or 0),
            "row_count": row["row_count"],
        }

        # Add matched field/value when searching (shows which field matched the search)
        if search:
            # Find first non-null matched field (in order of search_fields priority)
            for field in search_fields:
                if field != primary:  # Skip primary - we already show that
                    matched_value = row.get(f"matched_{field}")
                    if matched_value:
                        row_data["matched_field"] = field
                        row_data["matched_value"] = matched_value
                        break
        # Add extra columns if requested (only when NOT searching)
        elif columns:
            extra_cols = {}
            for col in columns:
                val = row.get(f"extra_{col}")
                # Cast to string (staffel is INTEGER, API expects strings)
                extra_cols[col] = str(val) if val is not None else None
            row_data["extra_columns"] = extra_cols

        result.append(row_data)

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
        # When searching: exact match first, then everything else by totaal
        # Option C: Users want exact match on top, then biggest money flows
        relevance_select = f""",
            CASE
                WHEN UPPER(ontvanger) = UPPER(${param_idx}) THEN 1
                ELSE 2
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
            "modules": [s.strip() for s in row["sources"].split(",")] if row["sources"] else [],
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
# Module Autocomplete (Typesense-powered for <50ms response)
# =============================================================================

# Typesense collection names per module
TYPESENSE_COLLECTIONS = {
    "instrumenten": "instrumenten",
    "apparaat": "apparaat",
    "inkoop": "inkoop",
    "provincie": "provincie",
    "gemeente": "gemeente",
    "publiek": "publiek",
}

# Primary field names in Typesense (differs from PostgreSQL for some modules)
TYPESENSE_PRIMARY_FIELDS = {
    "instrumenten": "ontvanger",
    "apparaat": "kostensoort",
    "inkoop": "leverancier",
    "provincie": "ontvanger",
    "gemeente": "ontvanger",
    "publiek": "ontvanger",
}

# Searchable fields for field_matches section per module
TYPESENSE_SEARCH_FIELDS = {
    "instrumenten": ["regeling", "begrotingsnaam", "artikel", "instrument"],
    "apparaat": ["begrotingsnaam", "artikel", "detail"],
    "inkoop": ["ministerie", "categorie"],
    "provincie": ["provincie", "omschrijving"],
    "gemeente": ["gemeente", "beleidsterrein", "regeling", "omschrijving"],
    "publiek": ["regeling", "omschrijving"],
}

# Module display names for "other modules" section
MODULE_DISPLAY_NAMES = {
    "instrumenten": "Instrumenten",
    "apparaat": "Apparaat",
    "inkoop": "Inkoop",
    "provincie": "Provincie",
    "gemeente": "Gemeente",
    "publiek": "Publiek",
}


async def get_module_autocomplete(
    module: str,
    search: str,
    limit: int = 5,
) -> dict:
    """
    Get autocomplete suggestions for a module using Typesense (<50ms).

    Returns three sections:
    1. current_module: Recipients matching search IN the current module (with amounts)
    2. field_matches: Matches in other fields like regeling, instrument (OOK GEVONDEN IN)
    3. other_modules: Recipients matching search in OTHER modules (with module badges)

    This uses Typesense for all searches - 10-100x faster than PostgreSQL regex.
    """
    if module not in MODULE_CONFIG:
        raise ValueError(f"Unknown module: {module}")

    collection = TYPESENSE_COLLECTIONS.get(module)
    primary_field = TYPESENSE_PRIMARY_FIELDS.get(module, "ontvanger")
    search_fields = TYPESENSE_SEARCH_FIELDS.get(module, [])

    current_module_results = []
    field_matches = []
    other_modules_results = []

    # 1. Search current module for recipients/primary entities
    if collection:
        # Build query_by field (primary + lowercase variant for better matching)
        query_by = f"{primary_field},{primary_field}_lower" if primary_field != "kostensoort" else "kostensoort,kostensoort_lower"

        # Determine sort field (totaal for aggregated views, bedrag for raw data)
        sort_field = "totaal" if module == "apparaat" else "bedrag"

        params = {
            "q": search,
            "query_by": query_by,
            "prefix": "true",
            "per_page": str(limit),
            "sort_by": f"{sort_field}:desc",
            "group_by": primary_field,
            "group_limit": "1",
        }

        data = await _typesense_search(collection, params)

        # Process grouped hits
        for group in data.get("grouped_hits", []):
            hits = group.get("hits", [])
            if not hits:
                continue

            doc = hits[0].get("document", {})
            name = doc.get(primary_field, "")
            # Sum up amounts from all hits in group (or use first)
            amount = doc.get("bedrag", 0) or doc.get("totaal", 0)

            if name:
                current_module_results.append({
                    "name": name,
                    "totaal": int(amount),
                })

    # 2. Search for field matches (OOK GEVONDEN IN section)
    # Search non-primary fields for matching keyword values
    if collection and search_fields:
        seen_values: set[str] = set()

        for field in search_fields[:3]:  # Limit to first 3 fields for speed
            params = {
                "q": search,
                "query_by": field,
                "prefix": "true",
                "per_page": "3",
                "group_by": field,
                "group_limit": "1",
            }

            data = await _typesense_search(collection, params)

            for group in data.get("grouped_hits", []):
                hits = group.get("hits", [])
                if not hits:
                    continue

                doc = hits[0].get("document", {})
                value = doc.get(field)

                if value and len(str(value)) >= 3 and value.upper() not in seen_values:
                    seen_values.add(value.upper())
                    field_matches.append({
                        "value": value,
                        "field": field,
                    })

                    if len(field_matches) >= limit:
                        break

            if len(field_matches) >= limit:
                break

    # 3. Search recipients collection for matches in OTHER modules
    current_names = {r["name"].upper() for r in current_module_results}

    params = {
        "q": search,
        "query_by": "name,name_lower",
        "prefix": "true",
        "per_page": str(limit * 2),  # Get extra to filter
        "sort_by": "totaal:desc",
    }

    data = await _typesense_search("recipients", params)

    for hit in data.get("hits", []):
        doc = hit.get("document", {})
        name = doc.get("name", "")
        sources = doc.get("sources", [])

        if not name or name.upper() in current_names:
            continue

        # Filter out current module from sources
        current_module_lower = module.lower()
        other_sources = [
            MODULE_DISPLAY_NAMES.get(s.lower(), s)
            for s in sources
            if s.lower() != current_module_lower
        ]

        if other_sources:
            other_modules_results.append({
                "name": name,
                "modules": other_sources,
            })

            if len(other_modules_results) >= limit:
                break

    return {
        "current_module": current_module_results,
        "field_matches": field_matches,
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
                ELSE 2
            END AS relevance_score
        FROM universal_search
        WHERE {condition}
        ORDER BY relevance_score ASC, totaal DESC
        LIMIT $3
    """

    rows = await fetch_all(query, search, pattern, limit)

    results = []
    for row in rows:
        sources = [s.strip() for s in row["sources"].split(",")] if row["sources"] else []
        results.append({
            "name": row["name"],
            "totaal": int(row["totaal"] or 0),
            "modules": sources,
        })

    return {
        "current_module": results,  # For integraal, all results go in one section
        "other_modules": [],
    }


# =============================================================================
# Module Stats (for dynamic search placeholder)
# =============================================================================

async def get_module_stats(module: str) -> dict:
    """
    Get statistics for a module: count of unique entities and total amount.

    Used for dynamic search bar placeholder:
    "Doorzoek X ontvangers (€Y miljard) in [module]"

    Returns:
        {
            "count": int,  # Number of unique entities
            "total": int,  # Sum of all amounts in euros
            "total_formatted": str,  # "1.474 miljard" or "156 miljoen"
        }
    """
    if module == "integraal":
        # Universal search: unique recipients across all modules
        query = """
            SELECT
                COUNT(*) AS count,
                SUM(totaal) AS total
            FROM universal_search
        """
        row = await fetch_all(query)
        row = row[0] if row else {"count": 0, "total": 0}
    elif module in MODULE_CONFIG:
        config = MODULE_CONFIG[module]
        table = config.get("aggregated_table") or config["table"]

        query = f"""
            SELECT
                COUNT(*) AS count,
                SUM(totaal) AS total
            FROM {table}
        """
        row = await fetch_all(query)
        row = row[0] if row else {"count": 0, "total": 0}
    else:
        return {"count": 0, "total": 0, "total_formatted": "0"}

    count = int(row["count"] or 0)
    total = int(row["total"] or 0)

    # Format total in Dutch style: "X miljard" or "X miljoen"
    if total >= 1_000_000_000_000:
        # Trillion
        formatted = f"{total / 1_000_000_000_000:.2f} biljoen".replace(".", ",")
    elif total >= 1_000_000_000:
        # Billion
        formatted = f"{total / 1_000_000_000:.0f} miljard"
    elif total >= 1_000_000:
        # Million
        formatted = f"{total / 1_000_000:.0f} miljoen"
    else:
        formatted = f"{total:,.0f}".replace(",", ".")

    return {
        "count": count,
        "total": total,
        "total_formatted": formatted,
    }
