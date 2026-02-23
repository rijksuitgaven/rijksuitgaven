"""
Module service - aggregation queries for all data modules.

Handles the business logic for fetching and aggregating data
from each module table with year columns.

SECURITY NOTE: All SQL identifiers (table names, column names) are validated
against whitelists before being used in queries. User input is NEVER used
directly as identifiers - only as parameterized values.
"""
import asyncio
import logging
import random
import re
from dataclasses import dataclass, field
from typing import Optional
import httpx
from app.services.database import fetch_all, fetch_val, get_pool
from app.config import get_settings

logger = logging.getLogger(__name__)

# Available years in the data
YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]

# Data availability: module → entity_type for entity-level lookups
# Module-level modules (entity_type=NULL): instrumenten, inkoop, apparaat
# Entity-level modules: gemeente, provincie, publiek
AVAILABILITY_ENTITY_TYPE = {
    "gemeente": "gemeente",
    "provincie": "provincie",
    "publiek": "source",
}

# Cache for module-level availability (rarely changes, avoid repeated queries)
_availability_cache: dict[str, tuple[int, int]] = {}


async def _get_module_availability(module: str) -> tuple[int | None, int | None]:
    """Get module-level year range from data_availability table."""
    # Check cache first (no lock needed - cache is dict, worst case is duplicate query)
    if module in _availability_cache:
        return _availability_cache[module]

    # Query database (cache miss)
    row = await fetch_all(
        "SELECT year_from, year_to FROM data_availability WHERE module = $1 AND entity_type IS NULL",
        module,
    )
    if row:
        result = (row[0]["year_from"], row[0]["year_to"])
        # Store in cache (race condition possible but harmless - both queries return same data)
        _availability_cache[module] = result
        return result
    return (None, None)


async def _get_entity_availability(module: str) -> dict[str, tuple[int, int]]:
    """Get entity-level year ranges for a module. Returns {entity_name: (year_from, year_to)}."""
    entity_type = AVAILABILITY_ENTITY_TYPE.get(module)
    if not entity_type:
        return {}
    rows = await fetch_all(
        "SELECT entity_name, year_from, year_to FROM data_availability WHERE module = $1 AND entity_type = $2",
        module, entity_type,
    )
    return {r["entity_name"]: (r["year_from"], r["year_to"]) for r in rows}


async def _inject_availability(
    rows: list[dict], module: str, config: dict,
    filter_fields: dict[str, list[str]] | None = None,
) -> list[dict]:
    """Add data_available_from/to fields to each row based on module type."""
    entity_type = AVAILABILITY_ENTITY_TYPE.get(module)

    if entity_type:
        # Entity-level module (gemeente/provincie/publiek)
        # The entity column name matches entity_type (gemeente→gemeente, source→source)
        entity_filter = (filter_fields or {}).get(entity_type, [])

        if len(entity_filter) == 1:
            # Filtered to a single entity (e.g., ?gemeente=Amersfoort)
            # Use that entity's specific availability
            entity_avail = await _get_entity_availability(module)
            avail = entity_avail.get(entity_filter[0], (YEARS[0], YEARS[-1]))
            for row in rows:
                row["data_available_from"] = avail[0]
                row["data_available_to"] = avail[1]
        else:
            # Unfiltered or multi-entity: assume full range (design doc fallback)
            for row in rows:
                row["data_available_from"] = YEARS[0]
                row["data_available_to"] = YEARS[-1]
    else:
        # Module-level: same range for all rows
        year_from, year_to = await _get_module_availability(module)
        for row in rows:
            row["data_available_from"] = year_from
            row["data_available_to"] = year_to

    return rows


# =============================================================================
# Typesense Client Helper (for fast autocomplete)
# =============================================================================

from app.services.http_client import get_http_client as _get_http_client


async def _typesense_search(collection: str, params: dict) -> dict:
    """
    Execute search against Typesense.

    Uses httpx for async HTTP requests. Returns empty result on error.
    Typesense delivers <50ms response times vs seconds for PostgreSQL regex.
    """
    settings = get_settings()
    if not settings.typesense_host or not settings.typesense_api_key:
        logger.warning("Typesense not configured, falling back to empty results")
        return {"hits": [], "grouped_hits": []}

    url = f"{settings.typesense_protocol}://{settings.typesense_host}:{settings.typesense_port}/collections/{collection}/documents/search"

    try:
        client = await _get_http_client()
        response = await client.get(
            url,
            params=params,
            headers={"X-TYPESENSE-API-KEY": settings.typesense_api_key},
        )

        if response.status_code != 200:
            logger.warning(f"Typesense search failed: {response.status_code}")
            return {"hits": [], "grouped_hits": []}

        try:
            return response.json()
        except ValueError as json_err:
            logger.error(f"Typesense returned invalid JSON: {json_err}")
            return {"hits": [], "grouped_hits": []}
    except httpx.TimeoutException:
        logger.warning("Typesense search timeout")
        return {"hits": [], "grouped_hits": []}
    except httpx.RequestError as e:
        logger.error(f"Typesense request error: {type(e).__name__}: {e}")
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


# =============================================================================
# Query Parser — handles multi-word AND, exact phrase, wildcard stripping
# =============================================================================

@dataclass
class ParsedQuery:
    """Parsed user search input."""
    phrases: list[str] = field(default_factory=list)  # From "quoted segments"
    words: list[str] = field(default_factory=list)     # From unquoted segments
    raw: str = ""  # All terms joined, quotes/wildcards stripped (for Typesense)


def parse_search_query(search: str) -> ParsedQuery:
    """
    Parse raw user search input into structured query.

    - "rode kruis" → phrase "rode kruis"
    - rode kruis → words ["rode", "kruis"]
    - prorail* → word "prorail" (wildcard stripped)
    - "van oord" bouw → phrase "van oord" + word "bouw"
    - Unmatched quote → stripped, contents treated as words
    - Empty/whitespace-only quotes → ignored
    """
    if not search or not search.strip():
        return ParsedQuery()

    text = search.strip()
    phrases: list[str] = []
    remainder_parts: list[str] = []

    # Extract quoted phrases
    quote_pattern = re.compile(r'"([^"]*)"')
    last_end = 0
    for match in quote_pattern.finditer(text):
        # Collect text before this quote
        before = text[last_end:match.start()].strip()
        if before:
            remainder_parts.append(before)
        # Add quoted content if non-empty
        phrase = match.group(1).strip()
        if phrase:
            phrases.append(phrase)
        last_end = match.end()

    # Collect text after last quote
    after = text[last_end:].strip()
    if after:
        remainder_parts.append(after)

    # Join remainder, strip any leftover unmatched quotes
    remainder = " ".join(remainder_parts).replace('"', '')

    # Strip trailing wildcard
    remainder = remainder.rstrip("*").strip()

    # Split remainder into individual words
    words = [w for w in remainder.split() if w]

    # Build raw string for Typesense (all terms, no syntax)
    raw_parts = phrases + words
    raw = " ".join(raw_parts)

    return ParsedQuery(phrases=phrases, words=words, raw=raw)


def build_search_condition(field: str, param_idx: int, search: str) -> tuple[str, str]:
    """
    Build a search condition with word-boundary matching.

    Uses PostgreSQL regex \\y for word boundaries.
    "politie" matches "Politie", "Nationale Politie"
    but NOT "Designpolitie", "Politieacademie"

    Args:
        field: The column name to search
        param_idx: The parameter index (e.g., 1 for $1)
        search: The search term from user (raw input — quotes/wildcards stripped internally)

    Returns:
        Tuple of (sql_condition, search_pattern)
        - sql_condition: e.g., "field ~* $1"
        - search_pattern: e.g., "\\ypolitie\\y"
    """
    # Strip quotes and wildcards before building SQL pattern
    parsed = parse_search_query(search)
    search_lower = parsed.raw.lower().strip()

    # Escape regex special characters (e.g., ".", "+", "*")
    escaped = re.escape(search_lower)

    # Word boundary matching: \y = word boundary in PostgreSQL
    # Matches at: start/end of string, whitespace, punctuation
    # Does NOT match: within compound words
    # Only add \y where the search starts/ends with a word character,
    # because \y requires a transition between word and non-word chars.
    # "B.V." ends with "." (non-word), so trailing \y would fail to match.
    prefix = "\\y" if re.match(r'\w', search_lower) else ""
    suffix = "\\y" if re.search(r'\w$', search_lower) else ""
    return (
        f"{field} ~* ${param_idx}",
        f"{prefix}{escaped}{suffix}"
    )


def is_word_boundary_match(search: str, text: str) -> bool:
    """
    Check if ALL search terms appear as whole words in text.

    Parses the search input to support:
    - Multi-word AND: "rode kruis" → both \\brode\\b AND \\bkruis\\b must match
    - Exact phrase: '"rode kruis"' → \\brode kruis\\b must match (adjacent, in order)
    - Wildcard stripping: "prorail*" → \\bprorail\\b
    - Single keyword: "COA" → \\bCOA\\b (unchanged from before)

    Uses Python regex \\b for word boundaries.

    Args:
        search: The search term (raw user input)
        text: The text to search in

    Returns:
        True if ALL parsed terms appear as whole words in text
    """
    if not search or not text:
        return False

    parsed = parse_search_query(search)
    if not parsed.phrases and not parsed.words:
        return False

    # ALL terms must match (AND logic)
    for term in parsed.phrases + parsed.words:
        escaped = re.escape(term)
        if not re.search(rf'\b{escaped}\b', text, re.IGNORECASE):
            return False
    return True


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
    user already sees the match in the name - "Ook in" shows secondary context).

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
        "filter_fields": ["begrotingsnaam", "artikel", "detail", "kostensoort"],
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
        "filter_fields": ["provincie", "omschrijving"],
        "extra_columns": ["provincie", "omschrijving"],
        # Columns available in aggregated view (default columns for speed)
        "view_columns": ["provincie", "omschrijving"],
        # Entity field: the defining dimension for this module (028 migration)
        # Views are grouped by (recipient, entity) for accurate entity filtering
        "entity_field": "provincie",
    },
    "gemeente": {
        "table": "gemeente",
        "aggregated_table": "gemeente_aggregated",
        "primary_field": "ontvanger",
        "year_field": "jaar",
        "amount_field": "bedrag",
        "amount_multiplier": 1,  # Already in absolute euros
        "search_fields": ["ontvanger", "omschrijving", "regeling", "beleidsterrein"],
        "filter_fields": ["gemeente", "beleidsterrein", "regeling", "omschrijving"],
        "extra_columns": ["gemeente", "beleidsterrein", "regeling", "omschrijving"],
        # Columns available in aggregated view (default columns for speed)
        "view_columns": ["gemeente", "omschrijving"],
        "entity_field": "gemeente",
    },
    "publiek": {
        "table": "publiek",
        "aggregated_table": "publiek_aggregated",
        "primary_field": "ontvanger",
        "year_field": "jaar",
        "amount_field": "bedrag",
        "amount_multiplier": 1,  # Already in absolute euros
        "search_fields": ["ontvanger", "omschrijving", "regeling", "trefwoorden", "sectoren"],
        "filter_fields": ["source", "regeling", "trefwoorden", "sectoren", "provincie", "onderdeel", "staffel"],
        "extra_columns": ["source", "regeling", "trefwoorden", "sectoren", "regio", "staffel", "onderdeel"],
        # Columns available in aggregated view (default columns for speed)
        "view_columns": ["source"],
        "entity_field": "source",
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
) -> tuple[list[dict], int, dict | None]:
    """
    Get aggregated data for a module.

    Uses pre-computed materialized view for fast queries when no filters.
    Falls back to source table aggregation when filter_fields are applied
    (aggregated views don't have filter columns like provincie/gemeente).

    Args:
        columns: Optional list of extra column names to include (max 2).
                 Values are fetched from the source table for each aggregated row.

    Returns:
        Tuple of (rows, total_count, totals_dict) where totals_dict contains year sums
        and grand total (only when searching/filtering, None otherwise).
    """
    if module not in MODULE_CONFIG:
        raise ValueError(f"Unknown module: {module}")

    # SECURITY: Validate pagination bounds (defense-in-depth)
    if limit < 1 or limit > 500:
        raise ValueError(f"Invalid limit: {limit} (must be 1-500)")
    if offset < 0 or offset > 10000:
        raise ValueError(f"Invalid offset: {offset} (must be 0-10000)")

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

    # Split entity filters from non-entity filters (028 migration)
    # Entity-level modules (provincie, gemeente, publiek) have per-entity aggregated views
    # that support filtering by entity directly (no source table fallback needed)
    entity_field = config.get("entity_field")
    entity_filter_values: list[str] | None = None
    non_entity_filters: dict[str, list[str]] | None = filter_fields

    if filter_fields and entity_field and entity_field in filter_fields:
        entity_filter_values = filter_fields[entity_field]
        non_entity_filters = {k: v for k, v in filter_fields.items() if k != entity_field}
        if not non_entity_filters:
            non_entity_filters = None

    # Use aggregated view for fast queries when:
    # 1. Aggregated table exists
    # 2. No non-entity filter_fields (entity filters are supported on the view)
    # 3. Either no columns requested OR all columns are in the view
    use_aggregated = (
        config.get("aggregated_table") is not None
        and not non_entity_filters  # Only non-entity filters force source table
        and columns_in_view  # Can use view if columns are available or none requested
    )

    if use_aggregated:
        rows, total, totals = await _get_from_aggregated_view(
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
            columns=valid_columns if valid_columns else None,
            entity_filter=entity_filter_values,  # Pass entity filter for direct view query
        )
    else:
        rows, total, totals = await _get_from_source_table(
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

    # Inject data availability info (year range per entity/module)
    await _inject_availability(rows, module, config, filter_fields=filter_fields)

    return rows, total, totals


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
    "instrumenten": ["ontvanger", "regeling", "begrotingsnaam", "artikel", "instrument", "artikelonderdeel", "detail"],
    "apparaat": ["kostensoort", "begrotingsnaam", "artikel", "detail"],
    "inkoop": ["leverancier", "ministerie", "categorie"],
    "publiek": ["ontvanger", "source", "regeling", "omschrijving", "trefwoorden", "sectoren"],
    "gemeente": ["ontvanger", "gemeente", "beleidsterrein", "regeling", "omschrijving"],
    "provincie": ["ontvanger", "provincie", "omschrijving"],
}


async def _typesense_get_primary_keys_with_highlights(
    collection: str,
    primary_field: str,
    search: str,
    limit: int = 1000,
) -> tuple[list[str], dict[str, tuple[str | None, str | None]]]:
    """
    Get matching primary keys AND highlight info from Typesense for hybrid search.

    Uses Typesense to quickly identify which primary entities match the search
    across searchable fields, then we query PostgreSQL with a simple WHERE IN
    clause (uses index, fast).

    This is 10-100x faster than regex search directly in PostgreSQL.

    Strategy: Search each field individually (like autocomplete does) and
    combine unique primary values. Multi-field query_by can miss results.

    Returns:
        Tuple of:
        - list[str]: Primary keys that matched
        - dict[str, tuple]: Map of primary_key -> (matched_field, matched_value)
          Initially only includes non-primary field matches from Typesense.
          Later enriched by _enrich_matched_info() for primary-only matches.

    Args:
        collection: Typesense collection name
        primary_field: Primary field to extract and group by
        search: Search term
        limit: Max results to return
    """
    search_fields = TYPESENSE_SEARCHABLE_FIELDS.get(collection, [primary_field])
    lower_fields = TYPESENSE_LOWER_FIELDS.get(collection, [])

    # Parse search input: strip quotes/wildcards for Typesense
    parsed = parse_search_query(search)

    # Collect unique primary values across all field searches
    seen = set()
    primary_keys = []
    # Track which field matched for each primary value (only for non-primary fields)
    matched_info: dict[str, tuple[str | None, str | None]] = {}

    # Search each field individually (more reliable than multi-field query_by)
    for field in search_fields:
        if len(primary_keys) >= limit:
            break

        # Build query_by for this field
        query_by = field
        if field in lower_fields:
            query_by = f"{field},{field}_lower"

        params = {
            "q": parsed.raw,
            "query_by": query_by,
            "prefix": "true",
            "per_page": str(min(limit * 5, 250)),  # Get enough per field
            "highlight_full_fields": field,  # Get full field value in highlight
        }

        data = await _typesense_search(collection, params)

        # Extract primary values from hits, filtering by word boundary match
        for hit in data.get("hits", []):
            doc = hit.get("document", {})
            value = doc.get(primary_field)
            if value and value not in seen:
                # Get the field value that was searched
                field_value = doc.get(field)

                # Only include if this field has a word boundary match
                # (Typesense uses prefix matching, so "COA" matches "Coaching")
                if not field_value or not is_word_boundary_match(search, str(field_value)):
                    continue

                seen.add(value)
                primary_keys.append(value)

                # If this match is from a NON-primary field, record which field matched
                # We DON'T record primary field matches - user already sees the name
                if field != primary_field:
                    matched_info[value] = (field, str(field_value))

                if len(primary_keys) >= limit:
                    break

    logger.info(
        f"Typesense search '{search}' in {collection}: found {len(primary_keys)} unique {primary_field}s "
        f"(word boundary filtered), {len(matched_info)} with non-primary field matches"
    )

    return primary_keys, matched_info


async def _enrich_matched_info(
    table: str,
    primary_field: str,
    search_fields: list[str],
    primary_keys: list[str],
    matched_info: dict[str, tuple[str | None, str | None]],
    search: str,
) -> dict[str, tuple[str | None, str | None]]:
    """
    Enrich matched_info for rows that matched on primary field but may ALSO
    match on secondary fields. Shows "Ook in" context for these rows.

    After Typesense search, some rows only have a primary field match (their
    ontvanger name contains the search term). But their secondary fields
    (regeling, omschrijving, etc.) may ALSO contain the search term.
    This SQL query finds those secondary matches.

    Only enriches rows that don't already have matched_info (i.e., rows
    where Typesense recorded a primary-only match).
    """
    if not primary_keys or not search:
        return matched_info

    # Find primary keys WITHOUT matched_info (primary-only matches)
    unenriched = [k for k in primary_keys if k not in matched_info]
    if not unenriched:
        return matched_info  # All rows already have secondary match info

    # Secondary fields only (exclude primary)
    other_fields = [f for f in search_fields if f != primary_field]
    if not other_fields:
        return matched_info  # No secondary fields to check

    # Build CASE expressions: find first matching secondary field
    _, pattern = build_search_condition(other_fields[0], 1, search)

    case_field = "CASE\n"
    case_value = "CASE\n"
    for field in other_fields:
        case_field += f"            WHEN {field} ~* $1 THEN '{field}'\n"
        case_value += f"            WHEN {field} ~* $1 THEN {field}\n"
    case_field += "            ELSE NULL\n        END"
    case_value += "            ELSE NULL\n        END"

    or_conditions = " OR ".join([f"{f} ~* $1" for f in other_fields])

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
            WHERE {primary_field} = pl.pv
              AND ({or_conditions})
            LIMIT 1
        ) t
    """

    try:
        rows = await fetch_all(query, pattern, unenriched)
        enriched_count = 0
        for row in rows:
            key = row["key"]
            if row["matched_field"] and key not in matched_info:
                matched_info[key] = (row["matched_field"], row["matched_value"])
                enriched_count += 1
        if enriched_count:
            logger.info(f"Enriched {enriched_count} primary-only matches with secondary field context")
    except Exception as e:
        # Non-critical: if enrichment fails, rows just show empty "Ook in"
        logger.warning(f"matched_info enrichment failed: {e}")

    return matched_info


async def _typesense_search_recipient_keys(
    search: str,
    limit: int = 1000,
) -> list[str]:
    """
    Search recipients collection in Typesense, return matching ontvanger_key IDs.

    Used by get_integraal_data() for fast hybrid search:
    Typesense finds matching recipients (~25ms) → PostgreSQL WHERE IN (~50ms)
    instead of regex search (~200ms).

    Returns list of ontvanger_key strings (Typesense document IDs).
    Empty list means Typesense returned nothing (caller should fall back to regex).
    """
    # Parse search input: strip quotes/wildcards for Typesense
    parsed = parse_search_query(search)

    params = {
        "q": parsed.raw,
        "query_by": "name,name_lower",
        "prefix": "true",
        "per_page": str(min(limit * 5, 250)),
    }

    data = await _typesense_search("recipients", params)

    keys = []
    for hit in data.get("hits", []):
        doc = hit.get("document", {})
        name = doc.get("name")
        doc_id = doc.get("id")
        if not name or not doc_id:
            continue
        # Word boundary filter to avoid prefix false positives
        if not is_word_boundary_match(search, name):
            continue
        keys.append(doc_id)
        if len(keys) >= limit:
            break

    logger.info(f"Typesense recipients search '{search}': {len(keys)} matches (word boundary filtered)")
    return keys


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
    entity_filter: Optional[list[str]] = None,  # Entity filter values (028)
) -> tuple[list[dict], int, dict | None]:
    """Fast path: query pre-computed materialized view. Returns (rows, total_count, totals_dict)."""
    agg_table = config["aggregated_table"]
    primary = config["primary_field"]
    entity_field = config.get("entity_field")
    has_entity_filter = bool(entity_filter and entity_field)

    # Entity-level modules (028): views are grouped by (recipient, entity).
    # Default view (no entity filter): wrap with GROUP BY to aggregate per-recipient.
    # Filtered view (entity filter active): query view directly with WHERE.
    needs_entity_groupby = bool(entity_field and not has_entity_filter)

    # Build the FROM clause: subquery for entity default view, direct table otherwise
    if needs_entity_groupby:
        # Default view: aggregate per-entity rows back to per-recipient
        year_sum_cols = ", ".join([f'SUM("{y}") AS "{y}"' for y in YEARS])
        years_with_data_expr = " + ".join([
            f'CASE WHEN SUM("{y}") > 0 THEN 1 ELSE 0 END' for y in YEARS
        ])

        # Build extra column aggregations for the subquery
        view_cols = config.get("view_columns", [])
        extra_agg_parts = []
        for vc in view_cols:
            if vc == entity_field:
                extra_agg_parts.append(f"MODE() WITHIN GROUP (ORDER BY {vc}) AS {vc}")
                extra_agg_parts.append(f"COUNT(DISTINCT {vc}) AS {vc}_count")
            else:
                extra_agg_parts.append(f"MODE() WITHIN GROUP (ORDER BY {vc}) AS {vc}")
                extra_agg_parts.append(f"MAX({vc}_count) AS {vc}_count")
        extra_agg_sql = ", " + ", ".join(extra_agg_parts) if extra_agg_parts else ""

        from_clause = f"""(
            SELECT ontvanger_key, MIN({primary}) AS {primary},
                {year_sum_cols},
                SUM(totaal) AS totaal,
                SUM(row_count) AS row_count{extra_agg_sql},
                ({years_with_data_expr}) AS years_with_data,
                MIN(random_order) AS random_order
            FROM {agg_table}
            GROUP BY ontvanger_key
        ) AS {agg_table}"""
    else:
        from_clause = agg_table

    # Build extra columns selection if columns are requested and available in view
    # Also select count columns for "+X meer" indicator (column_count columns in view)
    extra_columns_select = ""
    if columns and not search:
        # Only include static columns when NOT searching (search uses matched_field instead)
        value_parts = []
        count_parts = []
        for col in columns:
            value_parts.append(f"{col} AS extra_{col}")
            if has_entity_filter and col == entity_field:
                # Entity field with active filter: each row IS one entity, count = 1
                count_parts.append(f"1 AS extra_{col}_count")
            else:
                count_parts.append(f"COALESCE({col}_count, 1) AS extra_{col}_count")
        extra_columns_select = ", " + ", ".join(value_parts) + ", " + ", ".join(count_parts)

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
    # Also extracts "which field matched" info for "Ook in" column
    # ==========================================================================
    typesense_primary_keys: list[str] = []
    typesense_matched_info: dict[str, tuple[str | None, str | None]] = {}
    if search:
        # Get Typesense collection for this module
        collection = TYPESENSE_COLLECTIONS.get(config["table"])
        if collection:
            # Get matching primary keys AND highlight info from Typesense (fast)
            # Searchable fields are defined in TYPESENSE_SEARCHABLE_FIELDS
            typesense_primary_keys, typesense_matched_info = await _typesense_get_primary_keys_with_highlights(
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
                # Typesense returned empty - fall back to regex search on primary field only
                # This happens when Typesense not configured or no word-boundary matches found
                # Note: Only search primary field to avoid issues with secondary columns
                logger.info(f"Typesense returned 0 results for '{search}', falling back to regex on {primary}")
                _, pattern = build_search_condition(primary, param_idx, search)
                where_clauses.append(f"{primary} ~* ${param_idx}")
                params.append(pattern)
                param_idx += 1
        else:
            # Fallback: regex search if Typesense collection not mapped
            # Only search primary field for simplicity and reliability
            _, pattern = build_search_condition(primary, param_idx, search)
            where_clauses.append(f"{primary} ~* ${param_idx}")
            params.append(pattern)
            param_idx += 1

    # Year filter: show recipients who have data in that year
    # (still shows all years in response, but filters to active recipients)
    if jaar:
        if jaar not in YEARS:
            raise ValueError("Invalid year")
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

    # Entity filter: filter by entity on the per-entity aggregated view (028)
    # For entity-level modules, the entity field is a real column (not MODE)
    if has_entity_filter:
        placeholders = ", ".join([f"${param_idx + i}" for i in range(len(entity_filter))])
        where_clauses.append(f"{entity_field} IN ({placeholders})")
        params.extend(entity_filter)
        param_idx += len(entity_filter)

    # Filter for recipients with data in min_years+ years (UX-002)
    # Uses pre-computed years_with_data column for fast filtering
    if min_years is not None and min_years > 0:
        where_clauses.append(f"years_with_data >= ${param_idx}")
        params.append(min_years)
        param_idx += 1

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
        # When searching: 3-tier relevance ranking
        # 1. Exact match on name → score 1
        # 2. Name contains search term (word boundary) → score 2
        # 3. Match only in other fields (Regeling, etc.) → score 3
        # Parse search to strip quotes/wildcards for clean SQL patterns
        parsed_rel = parse_search_query(search)
        clean_search = parsed_rel.raw
        search_pattern = rf"\y{re.escape(clean_search.lower())}\y"
        relevance_select = f""",
            CASE
                WHEN UPPER({primary}) = UPPER(${param_idx}) THEN 1
                WHEN {primary} ~* ${param_idx + 1} THEN 2
                ELSE 3
            END AS relevance_score"""
        params.append(clean_search)
        params.append(search_pattern)
        param_idx += 2
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
        # SECURITY: Validate sort_by against allowed values before SQL construction
        sort_field = "totaal"
        if sort_by == "primary":
            sort_field = primary
        elif sort_by.startswith("y") and sort_by[1:].isdigit():
            year_num = int(sort_by[1:])
            if year_num not in YEARS:
                raise ValueError("Invalid sort year")
            sort_field = f'"{year_num}"'
        elif sort_by not in ["totaal", "primary", "random"]:
            # Reject any other sort_by values (could be SQL injection attempt)
            raise ValueError(f"Invalid sort_by value: {sort_by}")
        sort_direction = "DESC" if sort_order == "desc" else "ASC"
        sort_clause = f"ORDER BY {sort_field} {sort_direction}"

    # Rebuild where_sql after potential random_order addition
    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    # Count query uses only WHERE clause params (snapshot taken before relevance/random params added)
    count_where = [c for c in where_clauses if "random_order" not in c]
    count_where_sql = f"WHERE {' AND '.join(count_where)}" if count_where else ""
    count_params = count_params_snapshot

    # Main query from aggregated view (or subquery for entity default view)
    query = f"""
        SELECT
            {primary} AS primary_value,
            "2016" AS y2016, "2017" AS y2017, "2018" AS y2018,
            "2019" AS y2019, "2020" AS y2020, "2021" AS y2021,
            "2022" AS y2022, "2023" AS y2023, "2024" AS y2024,
            totaal,
            row_count{extra_columns_select}{relevance_select}
        FROM {from_clause}
        {where_sql}
        {sort_clause}
        LIMIT ${param_idx} OFFSET ${param_idx + 1}
    """
    params.extend([limit, offset])

    # Count query (without random threshold for accurate total)
    count_query = f"SELECT COUNT(*) FROM {from_clause} {count_where_sql}"

    # Totals query - sums per year and grand total (only when searching/filtering)
    totals_query = f"""
        SELECT
            SUM("2016") AS sum_2016, SUM("2017") AS sum_2017, SUM("2018") AS sum_2018,
            SUM("2019") AS sum_2019, SUM("2020") AS sum_2020, SUM("2021") AS sum_2021,
            SUM("2022") AS sum_2022, SUM("2023") AS sum_2023, SUM("2024") AS sum_2024,
            SUM(totaal) AS sum_totaal
        FROM {from_clause}
        {count_where_sql}
    """

    # Execute queries in PARALLEL for performance (750ms → ~250ms)
    # Previously sequential: rows, then count, then totals = 3x latency
    try:
        # Build list of coroutines to run
        coros = [
            fetch_all(query, *params),
            fetch_val(count_query, *count_params) if count_params else fetch_val(count_query),
        ]

        # Add totals query only when user actively searches/filters (not min_years alone)
        run_totals = bool(search or jaar or min_bedrag is not None or max_bedrag is not None or has_entity_filter)
        if run_totals:
            coros.append(
                fetch_all(totals_query, *count_params) if count_params else fetch_all(totals_query)
            )

        # Run all queries in parallel
        results = await asyncio.gather(*coros)

        rows = results[0]
        total = results[1]

        # Extract totals if we ran that query
        totals = None
        if run_totals and len(results) > 2:
            totals_row = results[2]
            if totals_row:
                r = totals_row[0]
                totals = {
                    "years": {year: int(r.get(f"sum_{year}", 0) or 0) for year in YEARS},
                    "totaal": int(r.get("sum_totaal", 0) or 0),
                }
    except Exception as e:
        # Log error without exposing SQL query or params (security)
        logger.error(f"Query failed for {module}: {type(e).__name__}: {e}", exc_info=True)
        raise

    # Enrich "Ook in" column: for rows that matched on primary field (name),
    # check if secondary fields also contain the search term (SQL enrichment).
    # This fills in context for rows that Typesense only found via primary match.
    if search and typesense_primary_keys and typesense_matched_info is not None:
        typesense_matched_info = await _enrich_matched_info(
            table=config["table"],
            primary_field=primary,
            search_fields=config.get("search_fields", [primary]),
            primary_keys=typesense_primary_keys,
            matched_info=typesense_matched_info,
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
            extra_counts = {}
            for col in columns:
                val = row.get(f"extra_{col}")
                # Cast to string (staffel is INTEGER, API expects strings)
                extra_cols[col] = str(val) if val is not None else None
                # Read count from view (column_count columns added in 019a-f migrations)
                count = row.get(f"extra_{col}_count", 1)
                extra_counts[col] = int(count) if count is not None else 1
            row_data["extra_columns"] = extra_cols
            row_data["extra_column_counts"] = extra_counts

        # Add matched field info for "Ook in" column
        # Populated when match found in a secondary field (via Typesense + SQL enrichment)
        if search:
            # Look up by exact primary_value (case-sensitive match from Typesense)
            matched = typesense_matched_info.get(row["primary_value"], (None, None))
            row_data["matched_field"] = matched[0]
            row_data["matched_value"] = matched[1]

        result.append(row_data)

    return result, total or 0, totals


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
) -> tuple[list[dict], int, dict | None]:
    """Slow path: aggregate from source table (needed for filter fields and extra columns). Returns (rows, total_count, totals_dict)."""
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
    # Also return COUNT(DISTINCT) for "+X meer" indicator in UI
    extra_columns_select = ""
    if columns and not search:
        # Only use static extra columns when NOT searching
        # When searching, we use matched_field/matched_value instead
        for col in columns:
            validate_identifier(col, ALLOWED_COLUMNS, "column")
        # Return both the most frequent value AND the count of distinct values
        # Quote column names for defense-in-depth (even though validated)
        mode_cols = ", ".join([
            f'MODE() WITHIN GROUP (ORDER BY "{col}") AS extra_{col}'
            for col in columns
        ])
        count_cols = ", ".join([
            f'COUNT(DISTINCT "{col}") AS extra_{col}_count'
            for col in columns
        ])
        extra_columns_select = ", " + mode_cols + ", " + count_cols

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
                # Cast to text to handle INTEGER columns (e.g., inkoop.staffel)
                placeholders = ", ".join([f"${param_idx + i}" for i in range(len(values))])
                where_clauses.append(f"{field}::text IN ({placeholders})")
                params.extend(values)
                param_idx += len(values)

    # Amount filters (on total - applied in HAVING)
    having_clauses = []
    if min_bedrag is not None:
        having_clauses.append(f"SUM(CASE WHEN {year_field} BETWEEN {YEARS[0]} AND {YEARS[-1]} THEN {amount_field} END) * ${param_idx} >= ${param_idx + 1}")
        params.append(multiplier)
        params.append(min_bedrag)
        param_idx += 2

    if max_bedrag is not None:
        having_clauses.append(f"SUM(CASE WHEN {year_field} BETWEEN {YEARS[0]} AND {YEARS[-1]} THEN {amount_field} END) * ${param_idx} <= ${param_idx + 1}")
        params.append(multiplier)
        params.append(max_bedrag)
        param_idx += 2

    # Filter for recipients with data in min_years+ years (UX-002)
    if min_years is not None and min_years > 0:
        having_clauses.append(f"COUNT(DISTINCT {year_field}) >= ${param_idx}")
        params.append(min_years)
        param_idx += 1

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
        # When searching: 3-tier relevance ranking
        # 1. Exact match on name → score 1
        # 2. Name contains search term (word boundary) → score 2
        # 3. Match only in other fields (Regeling, etc.) → score 3
        # Parse search to strip quotes/wildcards for clean SQL patterns
        parsed_rel = parse_search_query(search)
        clean_search = parsed_rel.raw
        search_pattern = rf"\y{re.escape(clean_search.lower())}\y"
        relevance_select = f""",
            CASE
                WHEN UPPER({primary}) = UPPER(${param_idx}) THEN 1
                WHEN {primary} ~* ${param_idx + 1} THEN 2
                ELSE 3
            END AS relevance_score"""
        params.append(clean_search)
        params.append(search_pattern)
        param_idx += 2
        sort_clause = "ORDER BY relevance_score ASC, totaal DESC"
    elif sort_by == "random":
        sort_clause = "ORDER BY RANDOM()"
    else:
        # SECURITY: Validate sort_by against allowed values before SQL construction
        sort_field = "totaal"
        if sort_by == "primary":
            sort_field = primary
        elif sort_by.startswith("y") and sort_by[1:].isdigit():
            year_num = int(sort_by[1:])
            if year_num not in YEARS:
                raise ValueError("Invalid sort year")
            sort_field = f"\"{sort_by}\""
        elif sort_by not in ["totaal", "primary", "random"]:
            # Reject any other sort_by values (could be SQL injection attempt)
            raise ValueError(f"Invalid sort_by value: {sort_by}")
        sort_direction = "DESC" if sort_order == "desc" else "ASC"
        sort_clause = f"ORDER BY {sort_field} {sort_direction}"

    # Main query with aggregation
    query = f"""
        SELECT
            {primary} AS primary_value,
            {year_columns},
            COALESCE(SUM(CASE WHEN {year_field} BETWEEN {YEARS[0]} AND {YEARS[-1]} THEN {amount_field} END), 0) * {multiplier} AS totaal,
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

    # Totals query - year columns for source table aggregation
    totals_year_sums = ", ".join([
        f"COALESCE(SUM(CASE WHEN {year_field} = {year} THEN {amount_field} END), 0) * {multiplier} AS sum_{year}"
        for year in YEARS
    ])
    totals_query = f"""
        SELECT
            {totals_year_sums},
            COALESCE(SUM(CASE WHEN {year_field} BETWEEN {YEARS[0]} AND {YEARS[-1]} THEN {amount_field} END), 0) * {multiplier} AS sum_totaal
        FROM {table}
        {where_sql}
    """

    # Execute queries in PARALLEL for performance (750ms → ~250ms)
    try:
        coros = [
            fetch_all(query, *params),
            fetch_val(count_query, *count_params) if count_params else fetch_val(count_query),
        ]

        # Include totals query only when there's a search or filter (not on default view)
        run_totals = bool(search or filter_fields or min_bedrag is not None or max_bedrag is not None)
        if run_totals:
            coros.append(
                fetch_all(totals_query, *count_params) if count_params else fetch_all(totals_query)
            )

        results = await asyncio.gather(*coros)
        rows = results[0]
        total = results[1]

        totals = None
        if run_totals and len(results) > 2:
            totals_row = results[2]
            if totals_row:
                r = totals_row[0]
                totals = {
                    "years": {year: int(r.get(f"sum_{year}", 0) or 0) for year in YEARS},
                    "totaal": int(r.get("sum_totaal", 0) or 0),
                }
    except Exception as e:
        logger.error(f"Query failed in _get_from_source_table for {config.get('table', 'unknown')}: {e}", exc_info=True)
        raise

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
            extra_counts = {}
            for col in columns:
                val = row.get(f"extra_{col}")
                count = row.get(f"extra_{col}_count", 1)
                # Cast to string (staffel is INTEGER, API expects strings)
                extra_cols[col] = str(val) if val is not None else None
                extra_counts[col] = int(count) if count is not None else 1
            row_data["extra_columns"] = extra_cols
            row_data["extra_column_counts"] = extra_counts

        result.append(row_data)

    return result, total or 0, totals


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

    # Validate group_field against allowed fields for this module (C-1: SQL injection prevention)
    valid_group_fields = list(config.get("filter_fields", [])) + list(config.get("extra_columns", [])) + [primary]
    if group_field not in valid_group_fields:
        raise ValueError(f"Invalid group_by field")
    validate_identifier(group_field, ALLOWED_COLUMNS, "column")

    # Validate jaar against YEARS list (H-5)
    if jaar and jaar not in YEARS:
        raise ValueError("Invalid year")

    # Build year columns with multiplier for normalization
    year_columns = ", ".join([
        f"COALESCE(SUM(CASE WHEN {year_field} = {year} THEN {amount_field} END), 0) * {multiplier} AS \"y{year}\""
        for year in YEARS
    ])

    # Build WHERE clause
    # Use normalize_recipient() to match all case/formatting variations (SVB, Svb, etc.)
    # This uses functional indexes created in 020-normalize-recipient-indexes.sql
    # IMPORTANT: The index on normalize_recipient(primary_field) makes this fast
    where_clauses = [f"normalize_recipient({primary}) = normalize_recipient($1)"]
    params = [primary_value]

    if jaar:
        where_clauses.append(f"{year_field} = $2")
        params.append(jaar)

    where_sql = f"WHERE {' AND '.join(where_clauses)}"

    query = f"""
        SELECT
            {group_field}::text AS group_value,
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
        raw_gv = row["group_value"]
        result.append({
            "group_by": group_field,
            "group_value": str(raw_gv) if raw_gv is not None else None,
            "years": years_dict,
            "totaal": int(row["totaal"] or 0),
            "row_count": row["row_count"],
        })

    return result


# Groupable fields per module (mirrors frontend GROUPABLE_FIELDS)
GROUPABLE_FIELDS: dict[str, list[str]] = {
    "instrumenten": ["regeling", "artikel", "instrument", "begrotingsnaam", "artikelonderdeel", "detail"],
    "apparaat": ["kostensoort", "artikel", "detail", "begrotingsnaam"],
    "inkoop": ["ministerie", "categorie", "staffel"],
    "provincie": ["provincie", "omschrijving"],
    "gemeente": ["gemeente", "beleidsterrein", "regeling", "omschrijving"],
    "publiek": ["source", "regeling", "sectoren", "trefwoorden"],
}


async def get_grouping_counts(
    module: str,
    primary_value: str,
) -> dict[str, int]:
    """
    Get count of distinct values per groupable field for a recipient.

    Returns e.g. {"regeling": 12, "artikel": 8, "instrument": 3, ...}
    Used by the expanded row dropdown to show how many items each grouping produces.
    """
    if module not in MODULE_CONFIG:
        raise ValueError(f"Unknown module: {module}")

    config = MODULE_CONFIG[module]
    table = config["table"]
    primary = config["primary_field"]

    fields = GROUPABLE_FIELDS.get(module, [])
    if not fields:
        return {}

    # Validate all fields against allowed columns
    for f in fields:
        validate_identifier(f, ALLOWED_COLUMNS, "column")

    # Single query: COUNT(DISTINCT field) for each groupable field
    count_cols = ", ".join([
        f'COUNT(DISTINCT "{f}") AS "{f}_count"' for f in fields
    ])

    query = f"""
        SELECT {count_cols}
        FROM {table}
        WHERE normalize_recipient({primary}) = normalize_recipient($1)
    """

    rows = await fetch_all(query, primary_value)
    if not rows:
        return {f: 0 for f in fields}

    row = rows[0]
    return {f: int(row[f"{f}_count"] or 0) for f in fields}


BETALINGEN_BRACKETS = {
    "1": "record_count = 1",
    "2-10": "record_count BETWEEN 2 AND 10",
    "11-50": "record_count BETWEEN 11 AND 50",
    "50+": "record_count >= 50",
}


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
    betalingen: Optional[str] = None,
    columns: Optional[list[str]] = None,
) -> tuple[list[dict], int, dict | None]:
    """
    Get cross-module data from universal_search table.

    This table is pre-aggregated with recipient totals across all modules.
    Returns (rows, total_count, totals_dict_or_none).
    """
    # SECURITY: Validate pagination bounds (defense-in-depth)
    if limit < 1 or limit > 500:
        raise ValueError(f"Invalid limit: {limit} (must be 1-500)")
    if offset < 0 or offset > 10000:
        raise ValueError(f"Invalid offset: {offset} (must be 0-10000)")
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

    # Hybrid search: Typesense → PostgreSQL WHERE IN (fast)
    # Falls back to regex if Typesense returns nothing
    if search:
        ts_keys = await _typesense_search_recipient_keys(search, limit=1000)
        if ts_keys:
            where_clauses.append(f"ontvanger_key = ANY(${param_idx})")
            params.append(ts_keys)
            param_idx += 1
        else:
            # Fallback: regex search (Typesense not configured or no word-boundary matches)
            logger.info(f"Integraal: Typesense returned 0 for '{search}', falling back to regex")
            condition, pattern = build_search_condition("ontvanger", param_idx, search)
            where_clauses.append(condition)
            params.append(pattern)
            param_idx += 1

    # Year filter: show recipients who have data in that year
    if jaar:
        if jaar not in YEARS:
            raise ValueError("Invalid year")
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
    # Uses pre-computed years_with_data column (indexed) for fast filtering
    if min_years is not None and min_years > 0:
        where_clauses.append(f"years_with_data >= ${param_idx}")
        params.append(min_years)
        param_idx += 1

    # Filter by modules: recipient must appear in ALL selected modules
    if filter_modules:
        for mod_display in filter_modules:
            mod_db = module_name_map.get(mod_display, mod_display.lower())
            escaped = mod_db.replace('%', '\\%').replace('_', '\\_')
            where_clauses.append(f"sources ILIKE ${param_idx}")
            params.append(f"%{escaped}%")
            param_idx += 1

    # Filter by betalingen bracket (record_count) — UX-022
    if betalingen and betalingen in BETALINGEN_BRACKETS:
        where_clauses.append(BETALINGEN_BRACKETS[betalingen])

    # Store count params BEFORE adding non-WHERE params (relevance, random threshold)
    # Count query only needs WHERE clause parameters
    count_params_snapshot = params.copy()

    # Sort field mapping - support "random" for default view (UX-002)
    # Uses pre-computed random_order column for fast random sorting (~50ms vs 3s)
    # IMPORTANT: When searching, ALWAYS use relevance ranking (ignore random sort)
    use_random_threshold = False
    relevance_select = ""
    if search:
        # When searching: 3-tier relevance ranking
        # 1. Exact match on name → score 1
        # 2. Name contains search term (word boundary) → score 2
        # 3. Match only in other fields → score 3
        # Parse search to strip quotes/wildcards for clean SQL patterns
        parsed_rel = parse_search_query(search)
        clean_search = parsed_rel.raw
        search_pattern = rf"\y{re.escape(clean_search.lower())}\y"
        relevance_select = f""",
            CASE
                WHEN UPPER(ontvanger) = UPPER(${param_idx}) THEN 1
                WHEN ontvanger ~* ${param_idx + 1} THEN 2
                ELSE 3
            END AS relevance_score"""
        params.append(clean_search)
        params.append(search_pattern)
        param_idx += 2
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
        # SECURITY: Validate sort_by against allowed values before SQL construction
        # Whitelist: totaal, primary (ontvanger), extra-betalingen, year columns
        sort_field = "totaal"
        if sort_by == "primary":
            sort_field = "ontvanger"
        elif sort_by == "extra-betalingen":
            sort_field = "record_count"
        elif sort_by.startswith("y") and sort_by[1:].isdigit():
            year_num = int(sort_by[1:])
            if year_num not in YEARS:
                raise ValueError("Invalid sort year")
            sort_field = f'"{year_num}"'
        elif sort_by not in ["totaal", "primary", "extra-betalingen", "random"]:
            # Reject any other sort_by values (could be SQL injection attempt)
            raise ValueError(f"Invalid sort_by value: {sort_by}")
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
            record_count,
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

    # Totals query - sums per year and grand total (only when searching/filtering)
    totals_query = f"""
        SELECT
            SUM("2016") AS sum_2016, SUM("2017") AS sum_2017, SUM("2018") AS sum_2018,
            SUM("2019") AS sum_2019, SUM("2020") AS sum_2020, SUM("2021") AS sum_2021,
            SUM("2022") AS sum_2022, SUM("2023") AS sum_2023, SUM("2024") AS sum_2024,
            SUM(totaal) AS sum_totaal
        FROM universal_search
        {count_where_sql}
    """

    # Execute queries in PARALLEL for performance
    # Only compute totals when user actively searches/filters (not min_years alone)
    run_totals = bool(search or jaar or min_bedrag is not None or max_bedrag is not None or filter_modules or betalingen)
    coros = [
        fetch_all(query, *params),
        fetch_val(count_query, *count_params) if count_params else fetch_val(count_query),
        fetch_all("SELECT module, year_from, year_to FROM data_availability WHERE entity_type IS NULL"),
    ]
    if run_totals:
        coros.append(
            fetch_all(totals_query, *count_params) if count_params else fetch_all(totals_query)
        )

    results = await asyncio.gather(*coros)
    rows = results[0]
    total = results[1]
    all_avail = results[2]

    # Extract totals if we ran that query
    totals = None
    if run_totals and len(results) > 3:
        totals_row = results[3]
        if totals_row:
            r = totals_row[0]
            totals = {
                "years": {year: int(r.get(f"sum_{year}", 0) or 0) for year in YEARS},
                "totaal": int(r.get("sum_totaal", 0) or 0),
            }
    module_avail = {r["module"]: (r["year_from"], r["year_to"]) for r in all_avail}
    for mod in AVAILABILITY_ENTITY_TYPE:
        if mod not in module_avail:
            module_avail[mod] = (YEARS[0], YEARS[-1])

    result = []
    for row in rows:
        years_dict = {
            year: int(row.get(f"y{year}", 0) or 0)
            for year in YEARS
        }
        row_modules = [s.strip() for s in row["sources"].split(",")] if row["sources"] else []

        # Compute combined availability range from all modules this entity appears in
        year_from = None
        year_to = None
        for mod in row_modules:
            avail = module_avail.get(mod)
            if avail:
                if year_from is None or avail[0] < year_from:
                    year_from = avail[0]
                if year_to is None or avail[1] > year_to:
                    year_to = avail[1]

        extra = {}
        if columns and "betalingen" in columns:
            extra["betalingen"] = str(row["record_count"])

        result.append({
            "primary_value": row["primary_value"],
            "years": years_dict,
            "totaal": int(row["totaal"] or 0),
            "row_count": row["source_count"] or 1,  # Use source_count as row_count
            "modules": row_modules,
            "data_available_from": year_from,
            "data_available_to": year_to,
            "extra_columns": extra if extra else None,
        })

    return result, total or 0, totals


async def get_integraal_details(
    primary_value: str,
    jaar: Optional[int] = None,
) -> list[dict]:
    """
    Get module breakdown for a specific recipient in integraal view.

    Shows how much the recipient received from each module by querying
    each module's aggregated view.
    """
    # Validate jaar (H-5)
    if jaar and jaar not in YEARS:
        raise ValueError("Invalid year")

    # Modules with their aggregated table and primary field
    # (not apparaat - it uses kostensoort, not recipients)
    modules_to_query = [
        ("instrumenten", "instrumenten_aggregated", "ontvanger"),
        ("inkoop", "inkoop_aggregated", "leverancier"),
        ("provincie", "provincie_aggregated", "ontvanger"),
        ("gemeente", "gemeente_aggregated", "ontvanger"),
        ("publiek", "publiek_aggregated", "ontvanger"),
    ]

    # Build all 5 queries and run in PARALLEL
    # Uses SUM to handle per-entity views (028): entity-level modules may have
    # multiple rows per recipient (one per entity), so we sum across entities
    coros = []
    for module_name, agg_table, primary_field in modules_to_query:
        year_filter = f'AND "{jaar}" > 0' if jaar else ""
        key_field = f"{primary_field}_key"

        query = f"""
            SELECT
                COALESCE(SUM("2016"), 0) AS y2016, COALESCE(SUM("2017"), 0) AS y2017,
                COALESCE(SUM("2018"), 0) AS y2018, COALESCE(SUM("2019"), 0) AS y2019,
                COALESCE(SUM("2020"), 0) AS y2020, COALESCE(SUM("2021"), 0) AS y2021,
                COALESCE(SUM("2022"), 0) AS y2022, COALESCE(SUM("2023"), 0) AS y2023,
                COALESCE(SUM("2024"), 0) AS y2024,
                COALESCE(SUM(totaal), 0) AS totaal,
                COALESCE(SUM(row_count), 0) AS row_count
            FROM {agg_table}
            WHERE {key_field} = normalize_recipient($1) {year_filter}
        """
        coros.append(fetch_all(query, primary_value))

    all_results = await asyncio.gather(*coros)

    result = []
    for (module_name, _, _), rows in zip(modules_to_query, all_results):
        if rows:
            row = rows[0]
            totaal = int(row.get("totaal", 0) or 0)
            if totaal == 0:
                continue  # SUM returns 0 when no matching rows, skip empty modules
            years_dict = {year: int(row.get(f"y{year}", 0) or 0) for year in YEARS}
            result.append({
                "group_by": "module",
                "group_value": module_name,
                "years": years_dict,
                "totaal": totaal,
                "row_count": int(row.get("row_count", 0) or 0),
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

    Limited to MAX_FILTER_OPTIONS to prevent memory issues and DoS.
    """
    # Maximum options to return (prevents memory issues, DoS attacks)
    MAX_FILTER_OPTIONS = 5000

    if module not in MODULE_CONFIG:
        raise ValueError(f"Unknown module: {module}")

    config = MODULE_CONFIG[module]
    table = config["table"]

    # Validate field is a valid filter field for this module
    valid_fields = config.get("filter_fields", [])
    if field not in valid_fields:
        raise ValueError(f"Invalid filter field '{field}' for module '{module}'")

    # Validate identifier for defense-in-depth (already checked against filter_fields)
    validate_identifier(field, ALLOWED_COLUMNS, "column")

    # Query distinct values (excluding NULL and empty strings)
    # Cast to text to handle both string and numeric columns uniformly
    # Limited to prevent DoS/memory issues
    query = f"""
        SELECT DISTINCT "{field}"::text AS value
        FROM {table}
        WHERE "{field}" IS NOT NULL
          AND "{field}"::text != ''
        ORDER BY "{field}"::text
        LIMIT {MAX_FILTER_OPTIONS}
    """

    rows = await fetch_all(query)
    return [row["value"] for row in rows]


async def get_cascading_filter_options(
    module: str,
    active_filters: dict[str, list[str]],
) -> dict[str, list[dict]]:
    """
    Get filter options with counts, constrained by other active filters (bidirectional).

    For each filter field, computes available values + row counts by applying
    WHERE clauses from ALL OTHER active filters (not the field itself).
    This enables bidirectional cascading: selecting Instrument constrains Regeling
    options and vice versa.

    Returns: {"field_name": [{"value": "...", "count": 123}, ...], ...}
    """
    MAX_FILTER_OPTIONS = 5000

    if module not in MODULE_CONFIG:
        raise ValueError(f"Unknown module: {module}")

    config = MODULE_CONFIG[module]
    table = config["table"]
    filter_fields = config.get("filter_fields", [])

    if not filter_fields:
        return {}

    # Validate all active filter keys are valid filter fields
    for key in active_filters:
        if key not in filter_fields:
            raise ValueError(f"Invalid filter field '{key}' for module '{module}'")

    primary_field = config["primary_field"]
    validate_identifier(primary_field, ALLOWED_COLUMNS, "column")

    async def _query_field(field: str) -> tuple[str, list[dict]]:
        """Query distinct values + counts for one field, applying cross-filters."""
        validate_identifier(field, ALLOWED_COLUMNS, "column")

        where_clauses = [f'"{field}" IS NOT NULL', f'"{field}"::text != \'\'']
        params: list = []
        param_idx = 1

        # Apply filters from ALL OTHER fields (not this one) — bidirectional
        MAX_VALUES_PER_FILTER = 100
        for other_field, values in active_filters.items():
            if other_field == field or not values:
                continue
            validate_identifier(other_field, ALLOWED_COLUMNS, "column")
            # Limit values per key to prevent expensive IN clauses
            safe_values = values[:MAX_VALUES_PER_FILTER]
            placeholders = ", ".join([f"${param_idx + i}" for i in range(len(safe_values))])
            where_clauses.append(f'"{other_field}"::text IN ({placeholders})')
            params.extend(safe_values)
            param_idx += len(safe_values)

        where_sql = " AND ".join(where_clauses)
        # Count distinct primary values (ontvangers) — matches the aggregated table row count
        query = f"""
            SELECT "{field}"::text AS value, COUNT(DISTINCT "{primary_field}") AS count
            FROM {table}
            WHERE {where_sql}
            GROUP BY "{field}"::text
            ORDER BY count DESC, "{field}"::text
            LIMIT {MAX_FILTER_OPTIONS}
        """

        rows = await fetch_all(query, *params)
        return (field, [{"value": row["value"], "count": row["count"]} for row in rows])

    # Run all field queries in parallel
    results = await asyncio.gather(*[_query_field(f) for f in filter_fields])
    return dict(results)


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
    "instrumenten": ["regeling", "begrotingsnaam", "artikel", "instrument", "artikelonderdeel", "detail"],
    "apparaat": ["begrotingsnaam", "artikel", "detail"],
    "inkoop": ["ministerie", "categorie"],
    "provincie": ["provincie", "omschrijving"],
    "gemeente": ["gemeente", "beleidsterrein", "regeling", "omschrijving"],
    "publiek": ["regeling", "omschrijving", "trefwoorden", "sectoren"],
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

# Reverse mapping: source names (from recipients collection) → module names
# Sources use full display names, we need to map back to short module names
SOURCE_TO_MODULE = {
    "financiële instrumenten": "instrumenten",
    "instrumenten": "instrumenten",
    "apparaatsuitgaven": "apparaat",
    "apparaat": "apparaat",
    "inkoopuitgaven": "inkoop",
    "inkoop": "inkoop",
    "provinciale subsidieregisters": "provincie",
    "provincie": "provincie",
    "gemeentelijke subsidieregisters": "gemeente",
    "gemeente": "gemeente",
    "publiek": "publiek",
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

    current_module_results: list[dict] = []
    field_matches: list[dict] = []
    other_modules_results: list[dict] = []

    # Parse search input: strip quotes/wildcards for Typesense
    parsed = parse_search_query(search)

    # ── Fire ALL Typesense searches in parallel ──────────────────────────
    # Previously sequential (~220ms), now parallel (~50ms)

    tasks: list[asyncio.Task] = []
    task_labels: list[str] = []

    # Task: primary field search
    if collection:
        query_by = f"{primary_field},{primary_field}_lower" if primary_field != "kostensoort" else "kostensoort,kostensoort_lower"
        sort_field = "totaal" if module == "apparaat" else "bedrag"
        primary_params = {
            "q": parsed.raw,
            "query_by": query_by,
            "prefix": "true",
            "per_page": str(limit * 20),
            "sort_by": f"{sort_field}:desc",
            "group_by": primary_field,
            "group_limit": "1",
        }
        tasks.append(asyncio.create_task(_typesense_search(collection, primary_params)))
        task_labels.append("primary")

    # Tasks: field match searches (up to 3 fields)
    if collection and search_fields:
        for field in search_fields[:3]:
            field_params = {
                "q": parsed.raw,
                "query_by": field,
                "prefix": "true",
                "per_page": "10",
                "group_by": field,
                "group_limit": "1",
            }
            tasks.append(asyncio.create_task(_typesense_search(collection, field_params)))
            task_labels.append(f"field:{field}")

    # Task: recipients collection search
    recipients_params = {
        "q": parsed.raw,
        "query_by": "name,name_lower",
        "prefix": "true",
        "per_page": str(limit * 20),
        "sort_by": "totaal:desc",
    }
    tasks.append(asyncio.create_task(_typesense_search("recipients", recipients_params)))
    task_labels.append("recipients")

    # Await all Typesense calls at once
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Build label→result map (skip exceptions)
    result_map: dict[str, dict] = {}
    for label, result in zip(task_labels, results):
        if isinstance(result, Exception):
            logger.warning(f"Autocomplete Typesense call '{label}' failed: {result}")
            result_map[label] = {}
        else:
            result_map[label] = result

    # ── Process results sequentially ─────────────────────────────────────

    # 1. Primary field results
    if "primary" in result_map:
        grouped_hits = result_map["primary"].get("grouped_hits", [])
        exact_matches = []
        prefix_matches = []

        for group in grouped_hits:
            hits = group.get("hits", [])
            if not hits:
                continue
            doc = hits[0].get("document", {})
            name = doc.get(primary_field, "")
            amount = doc.get("bedrag", 0) or doc.get("totaal", 0)
            if not name:
                continue
            if is_word_boundary_match(search, name):
                exact_matches.append({"name": name, "totaal": int(amount), "match_type": "exact"})
            else:
                prefix_matches.append({"name": name, "totaal": int(amount), "match_type": "prefix"})

        current_module_results = exact_matches[:limit]
        remaining_slots = limit - len(current_module_results)
        if remaining_slots > 0:
            current_module_results.extend(prefix_matches[:remaining_slots])

    # FALLBACK: If Typesense returned nothing, try PostgreSQL directly
    if not current_module_results and module in MODULE_CONFIG:
        config = MODULE_CONFIG[module]
        view = config.get("aggregated_table") or config.get("table")
        primary = config.get("primary_field", "ontvanger")
        _, pattern = build_search_condition(primary, 1, search)
        query = f"""
            SELECT {primary} as name, totaal
            FROM {view}
            WHERE {primary} ~* $1
            ORDER BY totaal DESC
            LIMIT {limit}
        """
        try:
            pool = await get_pool()
            async with pool.acquire() as conn:
                rows = await conn.fetch(query, pattern)
                for row in rows:
                    name = row["name"]
                    current_module_results.append({
                        "name": name,
                        "totaal": int(row["totaal"] or 0),
                        "match_type": "exact" if is_word_boundary_match(search, name) else "prefix",
                    })
            logger.info(f"Autocomplete '{search}' on {module}: PostgreSQL fallback found {len(current_module_results)} results")
        except Exception as e:
            logger.warning(f"Autocomplete PostgreSQL fallback failed: {e}")

    # 2. Field match results (OOK GEVONDEN IN section)
    if collection and search_fields:
        seen_values: set[str] = set()
        for field in search_fields[:3]:
            label = f"field:{field}"
            data = result_map.get(label, {})
            for group in data.get("grouped_hits", []):
                hits = group.get("hits", [])
                if not hits:
                    continue
                doc = hits[0].get("document", {})
                value = doc.get(field)
                if value and len(str(value)) >= 3 and value.upper() not in seen_values:
                    if is_word_boundary_match(search, str(value)):
                        seen_values.add(value.upper())
                        field_matches.append({"value": value, "field": field})
                        if len(field_matches) >= limit:
                            break
            if len(field_matches) >= limit:
                break

    # 3. Recipients collection results
    current_names = {r["name"].upper() for r in current_module_results}
    recipients_data = result_map.get("recipients", {})
    recipients_exact = []
    recipients_prefix = []

    for hit in recipients_data.get("hits", []):
        doc = hit.get("document", {})
        name = doc.get("name", "")
        sources = doc.get("sources", [])
        totaal = doc.get("totaal", 0)

        if not name or name.upper() in current_names:
            continue

        is_exact = is_word_boundary_match(search, name)
        current_module_lower = module.lower()
        is_in_current_module = any(
            SOURCE_TO_MODULE.get(s.lower(), s.lower()) == current_module_lower
            for s in sources
        )

        if is_in_current_module:
            entry = {"name": name, "totaal": int(totaal), "match_type": "exact" if is_exact else "prefix"}
            if is_exact:
                recipients_exact.append(entry)
            else:
                recipients_prefix.append(entry)
        else:
            if is_exact:
                other_sources = list(dict.fromkeys(
                    SOURCE_TO_MODULE.get(s.lower(), s.lower()) for s in sources
                ))
                other_sources = [m for m in other_sources if m != module.lower()]
                if other_sources and len(other_modules_results) < limit:
                    other_modules_results.append({"name": name, "modules": other_sources})

    for entry in recipients_exact:
        if len(current_module_results) < limit:
            current_module_results.append(entry)
            current_names.add(entry["name"].upper())

    for entry in recipients_prefix:
        if len(current_module_results) < limit:
            current_module_results.append(entry)
            current_names.add(entry["name"].upper())

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

    Uses Typesense for fast search (<100ms vs 800ms with PostgreSQL).
    """
    # Parse search input: strip quotes/wildcards for Typesense
    parsed = parse_search_query(search)

    # Search the recipients collection (already has all recipients with sources)
    params = {
        "q": parsed.raw,
        "query_by": "name,name_lower",
        "prefix": "true",
        "per_page": str(limit * 20),  # Get many more since word-boundary filter discards ~80%
        "sort_by": "totaal:desc",
        # Note: Typesense returns all fields by default, no need for include_fields
    }

    data = await _typesense_search("recipients", params)

    results = []
    for hit in data.get("hits", []):
        doc = hit.get("document", {})
        name = doc.get("name", "")
        # Handle both None and missing sources field
        sources = doc.get("sources") or []
        totaal = doc.get("totaal", 0)

        # Filter: only include word-boundary matches
        # "COA" matches "COA", "Bureau COA" but NOT "Coaching"
        if name and is_word_boundary_match(search, name):
            results.append({
                "name": name,
                "totaal": int(totaal),
                "modules": sources if isinstance(sources, list) else [],
            })
            if len(results) >= limit:
                break

    return {
        "current_module": results,  # For integraal, all results go in one section
        "field_matches": [],
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

        # Entity-level modules (028): views have multiple rows per recipient,
        # so use COUNT(DISTINCT ontvanger_key) for unique recipient count
        if config.get("entity_field"):
            query = f"""
                SELECT
                    COUNT(DISTINCT ontvanger_key) AS count,
                    SUM(totaal) AS total
                FROM {table}
            """
        else:
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
