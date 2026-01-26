"""
Module service - aggregation queries for all data modules.

Handles the business logic for fetching and aggregating data
from each module table with year columns.
"""
from typing import Optional
from app.services.database import fetch_all, fetch_val

# Available years in the data
YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]


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
        "filter_fields": ["regeling", "artikel", "begrotingsnaam"],
    },
    "apparaat": {
        "table": "apparaat",
        "aggregated_table": "apparaat_aggregated",
        "primary_field": "kostensoort",
        "year_field": "begrotingsjaar",
        "amount_field": "bedrag",
        "amount_multiplier": 1000,  # Source data in ×1000, normalize to absolute euros
        "search_fields": ["kostensoort", "begrotingsnaam"],
        "filter_fields": ["artikel", "begrotingsnaam"],
    },
    "inkoop": {
        "table": "inkoop",
        "aggregated_table": "inkoop_aggregated",
        "primary_field": "leverancier",
        "year_field": "jaar",
        "amount_field": "totaal_avg",
        "amount_multiplier": 1,  # Already in absolute euros
        "search_fields": ["leverancier", "ministerie", "categorie"],
        "filter_fields": ["ministerie", "categorie"],
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
) -> tuple[list[dict], int]:
    """
    Get aggregated data for a module.

    Uses pre-computed materialized view for fast queries when no year filter.
    Falls back to source table aggregation when year filter is applied.

    Returns:
        Tuple of (rows, total_count)
    """
    if module not in MODULE_CONFIG:
        raise ValueError(f"Unknown module: {module}")

    config = MODULE_CONFIG[module]
    primary = config["primary_field"]

    # Use materialized view when no year filter (fast path)
    # Year filter requires source table to filter before aggregation
    use_aggregated = jaar is None and config.get("aggregated_table")

    if use_aggregated:
        return await _get_from_aggregated_view(
            config=config,
            search=search,
            min_bedrag=min_bedrag,
            max_bedrag=max_bedrag,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            offset=offset,
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
        )


async def _get_from_aggregated_view(
    config: dict,
    search: Optional[str] = None,
    min_bedrag: Optional[float] = None,
    max_bedrag: Optional[float] = None,
    sort_by: str = "totaal",
    sort_order: str = "desc",
    limit: int = 25,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """Fast path: query pre-computed materialized view."""
    agg_table = config["aggregated_table"]
    primary = config["primary_field"]

    # Build WHERE clause
    where_clauses = []
    params = []
    param_idx = 1

    # Search filter on primary field only (aggregated view only has primary)
    if search:
        where_clauses.append(f"{primary} ILIKE ${param_idx}")
        params.append(f"%{search}%")
        param_idx += 1

    # Amount filters
    if min_bedrag is not None:
        where_clauses.append(f"totaal >= ${param_idx}")
        params.append(min_bedrag)
        param_idx += 1

    if max_bedrag is not None:
        where_clauses.append(f"totaal <= ${param_idx}")
        params.append(max_bedrag)
        param_idx += 1

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    # Sort field mapping
    sort_field = "totaal"
    if sort_by == "primary":
        sort_field = primary
    elif sort_by.startswith("y") and sort_by[1:].isdigit():
        # Map y2024 to "2024" column name
        year = sort_by[1:]
        sort_field = f'"{year}"'

    sort_direction = "DESC" if sort_order == "desc" else "ASC"

    # Store params for count query
    count_params = params.copy()

    # Main query from aggregated view
    query = f"""
        SELECT
            {primary} AS primary_value,
            "2016" AS y2016, "2017" AS y2017, "2018" AS y2018,
            "2019" AS y2019, "2020" AS y2020, "2021" AS y2021,
            "2022" AS y2022, "2023" AS y2023, "2024" AS y2024,
            totaal,
            row_count
        FROM {agg_table}
        {where_sql}
        ORDER BY {sort_field} {sort_direction}
        LIMIT ${param_idx} OFFSET ${param_idx + 1}
    """
    params.extend([limit, offset])

    # Count query
    count_query = f"SELECT COUNT(*) FROM {agg_table} {where_sql}"

    # Execute queries
    rows = await fetch_all(query, *params)
    total = await fetch_val(count_query, *count_params) if count_params else await fetch_val(count_query)

    # Transform rows
    result = []
    for row in rows:
        years_dict = {year: float(row.get(f"y{year}", 0) or 0) for year in YEARS}
        result.append({
            "primary_value": row["primary_value"],
            "years": years_dict,
            "totaal": float(row["totaal"] or 0),
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
) -> tuple[list[dict], int]:
    """Slow path: aggregate from source table (needed for year filter)."""
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

    # Search filter (ILIKE on multiple fields)
    if search:
        search_conditions = " OR ".join([
            f"{field} ILIKE ${param_idx}" for field in search_fields
        ])
        where_clauses.append(f"({search_conditions})")
        params.append(f"%{search}%")
        param_idx += 1

    # Year filter
    if jaar:
        where_clauses.append(f"{year_field} = ${param_idx}")
        params.append(jaar)
        param_idx += 1

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

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
    having_sql = f"HAVING {' AND '.join(having_clauses)}" if having_clauses else ""

    # Sort field mapping
    sort_field = "totaal"
    if sort_by == "primary":
        sort_field = primary
    elif sort_by.startswith("y") and sort_by[1:].isdigit():
        sort_field = f"\"{sort_by}\""

    sort_direction = "DESC" if sort_order == "desc" else "ASC"

    # Store params for count query
    count_params = params.copy()

    # Main query with aggregation
    query = f"""
        SELECT
            {primary} AS primary_value,
            {year_columns},
            COALESCE(SUM({amount_field}), 0) * {multiplier} AS totaal,
            COUNT(*) AS row_count
        FROM {table}
        {where_sql}
        GROUP BY {primary}
        {having_sql}
        ORDER BY {sort_field} {sort_direction}
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
        years_dict = {year: float(row.get(f"y{year}", 0) or 0) for year in YEARS}
        result.append({
            "primary_value": row["primary_value"],
            "years": years_dict,
            "totaal": float(row["totaal"] or 0),
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
        years_dict = {year: float(row.get(f"y{year}", 0) or 0) for year in YEARS}
        result.append({
            "group_by": group_field,
            "group_value": row["group_value"],
            "years": years_dict,
            "totaal": float(row["totaal"] or 0),
            "row_count": row["row_count"],
        })

    return result


async def get_integraal_data(
    search: Optional[str] = None,
    limit: int = 25,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """
    Get cross-module data from universal_search table.

    This table is pre-aggregated with recipient totals across all modules.
    """
    # Build WHERE clause
    where_clauses = []
    params = []
    param_idx = 1

    if search:
        where_clauses.append(f"ontvanger ILIKE ${param_idx}")
        params.append(f"%{search}%")
        param_idx += 1

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    query = f"""
        SELECT
            ontvanger AS primary_value,
            sources,
            source_count,
            row_count,
            "2016" AS y2016,
            "2017" AS y2017,
            "2018" AS y2018,
            "2019" AS y2019,
            "2020" AS y2020,
            "2021" AS y2021,
            "2022" AS y2022,
            "2023" AS y2023,
            "2024" AS y2024,
            totaal
        FROM universal_search
        {where_sql}
        ORDER BY totaal DESC
        LIMIT ${param_idx} OFFSET ${param_idx + 1}
    """
    params.extend([limit, offset])

    count_query = f"SELECT COUNT(*) FROM universal_search {where_sql}"

    rows = await fetch_all(query, *params)
    count_params = params[:-2] if len(params) > 2 else []
    total = await fetch_val(count_query, *count_params) if count_params else await fetch_val(count_query)

    result = []
    for row in rows:
        years_dict = {
            year: float(row.get(f"y{year}", 0) or 0)
            for year in YEARS
        }
        result.append({
            "primary_value": row["primary_value"],
            "years": years_dict,
            "totaal": float(row["totaal"] or 0),
            "row_count": row["row_count"] or 1,
            "modules": row["sources"].split(",") if row["sources"] else [],
        })

    return result, total or 0
