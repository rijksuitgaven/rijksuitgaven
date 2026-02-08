"""
Module endpoints - all 7 data modules.

Modules:
- instrumenten: Financiële Instrumenten (674K rows)
- apparaat: Apparaatsuitgaven (21K rows)
- inkoop: Inkoopuitgaven (636K rows)
- provincie: Provinciale subsidies (67K rows)
- gemeente: Gemeentelijke subsidies (126K rows)
- publiek: Publieke uitvoeringsorganisaties (115K rows)
- integraal: Cross-module search (universal_search)
"""
import logging
from typing import Optional
from enum import Enum
import time

from fastapi import APIRouter, Query, HTTPException, Path

logger = logging.getLogger(__name__)
from pydantic import BaseModel, Field

from app.services.modules import (
    get_module_data,
    get_row_details,
    get_integraal_data,
    get_integraal_details,
    get_filter_options,
    get_cascading_filter_options,
    get_module_autocomplete,
    get_integraal_autocomplete,
    get_module_stats,
    MODULE_CONFIG,
    YEARS,
)

router = APIRouter()


# =============================================================================
# Enums and Models
# =============================================================================

class ModuleName(str, Enum):
    """Available data modules."""
    instrumenten = "instrumenten"
    apparaat = "apparaat"
    inkoop = "inkoop"
    provincie = "provincie"
    gemeente = "gemeente"
    publiek = "publiek"
    integraal = "integraal"


class SortOrder(str, Enum):
    """Sort order options."""
    asc = "asc"
    desc = "desc"


class AggregatedRow(BaseModel):
    """Aggregated row with year columns."""
    primary_value: str
    years: dict[int, int] = Field(default_factory=dict)
    totaal: int = 0
    row_count: int = 1
    modules: Optional[list[str]] = None  # For integraal only
    extra_columns: Optional[dict[str, Optional[str]]] = None  # Dynamic columns (max 2, when NOT searching)
    extra_column_counts: Optional[dict[str, int]] = None  # Distinct value counts for "+X meer" indicator
    matched_field: Optional[str] = None  # Which field matched the search (when searching)
    matched_value: Optional[str] = None  # The value that matched (when searching)
    data_available_from: Optional[int] = None  # First year with data for this entity
    data_available_to: Optional[int] = None  # Last year with data for this entity


class ModuleResponse(BaseModel):
    """Standard response for module queries."""
    success: bool = True
    module: str
    primary_field: str
    data: list[AggregatedRow]
    meta: dict = Field(default_factory=dict)


class DetailRow(BaseModel):
    """Detail row for expanded view."""
    group_by: str
    group_value: Optional[str]
    years: dict[int, int]
    totaal: int
    row_count: int


class DetailResponse(BaseModel):
    """Response for row details."""
    success: bool = True
    module: str
    primary_value: str
    details: list[DetailRow]


# =============================================================================
# Endpoints
# =============================================================================

@router.get("", response_model=list[str])
async def list_modules():
    """List all available modules."""
    return [m.value for m in ModuleName]


# =============================================================================
# Module Stats Endpoint
# =============================================================================

class ModuleStatsResponse(BaseModel):
    """Module statistics for search placeholder."""
    success: bool = True
    module: str
    count: int
    total: int
    total_formatted: str


@router.get("/{module}/stats", response_model=ModuleStatsResponse)
async def module_stats(module: ModuleName):
    """
    Get statistics for a module: count and total amount.

    Used for dynamic search bar placeholder:
    "Doorzoek X ontvangers (€Y miljard) in [module]"
    """
    try:
        stats = await get_module_stats(module.value)
        return ModuleStatsResponse(
            success=True,
            module=module.value,
            count=stats["count"],
            total=stats["total"],
            total_formatted=stats["total_formatted"],
        )
    except Exception as e:
        logger.error(f"Failed to get stats for {module.value}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve module stats")


# =============================================================================
# Autocomplete Endpoint
# =============================================================================

class CurrentModuleResult(BaseModel):
    """Recipient result from current module."""
    name: str
    totaal: int
    modules: list[str] = []  # Used by integraal to show module badges
    match_type: str | None = None  # "exact" (word-boundary) or "prefix" (starts with)


class OtherModulesResult(BaseModel):
    """Recipient result from other modules."""
    name: str
    modules: list[str] = []


class FieldMatchResult(BaseModel):
    """Field match result (OOK GEVONDEN IN)."""
    value: str
    field: str


class AutocompleteResponse(BaseModel):
    """Autocomplete response with three sections."""
    success: bool = True
    current_module: list[CurrentModuleResult] = []
    field_matches: list[FieldMatchResult] = []
    other_modules: list[OtherModulesResult] = []


@router.get("/{module}/autocomplete", response_model=AutocompleteResponse)
async def module_autocomplete(
    module: ModuleName,
    q: str = Query(..., min_length=2, max_length=200, description="Search query"),
    limit: int = Query(5, ge=1, le=10, description="Max results per section"),
):
    """
    Get autocomplete suggestions for a specific module.

    Returns two sections:
    1. current_module: Recipients matching search IN this module (with amounts)
    2. other_modules: Recipients matching search in OTHER modules (with module badges)

    This ensures "what you see is what you get" - selecting a current_module
    result will show that recipient in the table.
    """
    try:
        if module.value == "integraal":
            data = await get_integraal_autocomplete(q, limit)
        else:
            data = await get_module_autocomplete(module.value, q, limit)

        return AutocompleteResponse(
            success=True,
            current_module=[
                CurrentModuleResult(
                    name=r["name"],
                    totaal=r.get("totaal", 0),
                    modules=r.get("modules", []),  # Pass modules for integraal badges
                    match_type=r.get("match_type"),  # "exact" or "prefix"
                )
                for r in data.get("current_module", [])
            ],
            field_matches=[
                FieldMatchResult(
                    value=r["value"],
                    field=r["field"],
                )
                for r in data.get("field_matches", [])
            ],
            other_modules=[
                OtherModulesResult(
                    name=r["name"],
                    modules=r.get("modules", []),
                )
                for r in data.get("other_modules", [])
            ],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Autocomplete failed: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail="Er ging iets mis bij het zoeken")


# =============================================================================
# Module Data Endpoint
# =============================================================================

@router.get("/{module}", response_model=ModuleResponse)
async def get_module(
    module: ModuleName,
    # Search
    q: Optional[str] = Query(None, min_length=1, max_length=200, description="Search query"),
    # Pagination
    limit: int = Query(25, ge=1, le=500, description="Results per page (max 500)"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    # Filtering
    jaar: Optional[int] = Query(None, ge=2016, le=2025, description="Filter by year"),
    min_bedrag: Optional[float] = Query(None, ge=0, description="Minimum amount"),
    max_bedrag: Optional[float] = Query(None, ge=0, description="Maximum amount"),
    # Sorting
    sort_by: str = Query("totaal", description="Sort field: totaal, primary, random, or year (e.g., y2024)"),
    sort_order: SortOrder = Query(SortOrder.desc, description="Sort direction"),
    # Default view filter (UX-002)
    min_years: Optional[int] = Query(None, ge=1, le=9, description="Minimum years with data (for default view)"),
    # Module-specific multi-select filters
    provincie: Optional[list[str]] = Query(None, description="Filter by provincie(s) - multi-select"),
    gemeente: Optional[list[str]] = Query(None, description="Filter by gemeente(s) - multi-select"),
    source: Optional[list[str]] = Query(None, description="Filter by source/organisatie(s) - multi-select (publiek module)"),
    # Instrumenten filters
    begrotingsnaam: Optional[list[str]] = Query(None, description="Filter by begrotingsnaam(s) - multi-select"),
    artikel: Optional[list[str]] = Query(None, description="Filter by artikel(s) - multi-select"),
    artikelonderdeel: Optional[list[str]] = Query(None, description="Filter by artikelonderdeel(s) - multi-select"),
    instrument: Optional[list[str]] = Query(None, description="Filter by instrument(s) - multi-select"),
    regeling: Optional[list[str]] = Query(None, description="Filter by regeling(s) - multi-select"),
    # Apparaat/other filters
    detail: Optional[list[str]] = Query(None, description="Filter by detail(s) - multi-select"),
    # Inkoop filters
    ministerie: Optional[list[str]] = Query(None, description="Filter by ministerie(s) - multi-select"),
    categorie: Optional[list[str]] = Query(None, description="Filter by categorie(s) - multi-select"),
    staffel: Optional[list[str]] = Query(None, description="Filter by staffel(s) - multi-select"),
    # Gemeente filters
    beleidsterrein: Optional[list[str]] = Query(None, description="Filter by beleidsterrein(s) - multi-select"),
    omschrijving: Optional[list[str]] = Query(None, description="Filter by omschrijving(s) - multi-select"),
    # Apparaat filters
    kostensoort: Optional[list[str]] = Query(None, description="Filter by kostensoort(s) - multi-select"),
    # Publiek filters
    trefwoorden: Optional[list[str]] = Query(None, description="Filter by trefwoorden - multi-select"),
    sectoren: Optional[list[str]] = Query(None, description="Filter by sectoren - multi-select"),
    onderdeel: Optional[list[str]] = Query(None, description="Filter by onderdeel - multi-select"),
    # Integraal-specific filters
    modules: Optional[list[str]] = Query(None, description="Filter by modules recipient appears in (integraal only)"),
    min_instanties: Optional[int] = Query(None, ge=1, description="Minimum number of distinct sources (integraal only)"),
    # Dynamic columns (UX-005)
    columns: Optional[list[str]] = Query(None, description="Extra columns to display (max 2)"),
):
    """
    Get aggregated data for a module.

    Returns rows aggregated by recipient (or kostensoort for apparaat),
    with year columns showing amounts per year.

    ## Query Parameters

    - **q**: Search query (searches recipient/kostensoort and related fields)
    - **limit/offset**: Pagination (max 100 per page)
    - **jaar**: Filter to specific year
    - **min_bedrag/max_bedrag**: Filter by amount range
    - **sort_by**: Field to sort by: totaal, primary, random, or year (default: totaal)
    - **sort_order**: asc or desc (default: desc)
    - **min_years**: Filter recipients with data in X+ years (for default view)
    - **columns**: Extra columns to include in response (max 2)

    ## Response

    Returns aggregated rows with:
    - Primary field (ontvanger or kostensoort)
    - Year columns (2016-2024)
    - Total amount
    - Row count (for expansion indicator)
    - Extra columns (if requested)
    """
    start_time = time.time()

    # Build filter fields dict (only include non-None values)
    filter_fields: dict[str, list[str]] = {}
    if provincie:
        filter_fields["provincie"] = provincie
    if gemeente:
        filter_fields["gemeente"] = gemeente
    if source:
        filter_fields["source"] = source
    if begrotingsnaam:
        filter_fields["begrotingsnaam"] = begrotingsnaam
    if artikel:
        filter_fields["artikel"] = artikel
    if artikelonderdeel:
        filter_fields["artikelonderdeel"] = artikelonderdeel
    if instrument:
        filter_fields["instrument"] = instrument
    if regeling:
        filter_fields["regeling"] = regeling
    if detail:
        filter_fields["detail"] = detail
    if ministerie:
        filter_fields["ministerie"] = ministerie
    if categorie:
        filter_fields["categorie"] = categorie
    if staffel:
        filter_fields["staffel"] = [str(s) for s in staffel]  # Convert to strings
    if beleidsterrein:
        filter_fields["beleidsterrein"] = beleidsterrein
    if omschrijving:
        filter_fields["omschrijving"] = omschrijving
    if kostensoort:
        filter_fields["kostensoort"] = kostensoort
    if trefwoorden:
        filter_fields["trefwoorden"] = trefwoorden
    if sectoren:
        filter_fields["sectoren"] = sectoren
    if onderdeel:
        filter_fields["onderdeel"] = onderdeel

    try:
        # Handle integraal separately (uses universal_search table)
        totals = None
        if module == ModuleName.integraal:
            data, total, totals = await get_integraal_data(
                search=q,
                jaar=jaar,
                min_bedrag=min_bedrag,
                max_bedrag=max_bedrag,
                sort_by=sort_by,
                sort_order=sort_order.value,
                limit=limit,
                offset=offset,
                min_years=min_years,
                filter_modules=modules,
                min_instanties=min_instanties,
            )
            primary_field = "ontvanger"
        else:
            data, total, totals = await get_module_data(
                module=module.value,
                search=q,
                jaar=jaar,
                min_bedrag=min_bedrag,
                max_bedrag=max_bedrag,
                sort_by=sort_by,
                sort_order=sort_order.value,
                limit=limit,
                offset=offset,
                min_years=min_years,
                filter_fields=filter_fields,
                columns=columns,
            )
            primary_field = MODULE_CONFIG[module.value]["primary_field"]

        elapsed_ms = (time.time() - start_time) * 1000

        meta = {
            "total": total,
            "limit": limit,
            "offset": offset,
            "query": q,
            "elapsed_ms": round(elapsed_ms, 2),
            "years": YEARS,
        }
        # Include totals (year sums and grand total) when searching/filtering
        if totals:
            meta["totals"] = totals

        return ModuleResponse(
            success=True,
            module=module.value,
            primary_field=primary_field,
            data=[AggregatedRow(**row) for row in data],
            meta=meta,
        )

    except ValueError as e:
        # Validation errors (e.g., invalid filter field) - safe to show
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Log full error details server-side, return generic message to client
        logger.error(f"Module query failed for {module}: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Er ging iets mis bij het ophalen van de gegevens")


@router.get("/{module}/{primary_value}/details", response_model=DetailResponse)
async def get_details(
    module: ModuleName,
    primary_value: str,
    group_by: Optional[str] = Query(None, description="Group by field (e.g., regeling, artikel)"),
    jaar: Optional[int] = Query(None, ge=2016, le=2025, description="Filter by year"),
):
    """
    Get expanded details for a specific row.

    Returns the individual line items that make up an aggregated row,
    optionally grouped by a field (e.g., regeling, artikel).

    Used when user clicks to expand a row in the table.

    For integraal: shows breakdown by module (which modules, amounts per module).
    """
    try:
        if module == ModuleName.integraal:
            # Integraal shows module breakdown
            details = await get_integraal_details(
                primary_value=primary_value,
                jaar=jaar,
            )
        else:
            details = await get_row_details(
                module=module.value,
                primary_value=primary_value,
                group_by=group_by,
                jaar=jaar,
            )

        return DetailResponse(
            success=True,
            module=module.value,
            primary_value=primary_value,
            details=[DetailRow(**row) for row in details],
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Details query failed for {module}/{primary_value}: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Er ging iets mis bij het ophalen van de details")


@router.get("/{module}/filters/{field}", response_model=list[str])
async def get_filter_values(
    module: ModuleName,
    field: str,
):
    """
    Get distinct values for a filter field.

    Used for auto-populating multi-select dropdowns.
    Returns sorted list of unique values.

    ## Examples

    - `GET /api/v1/modules/provincie/filters/provincie` → ["Drenthe", "Friesland", ...]
    - `GET /api/v1/modules/gemeente/filters/gemeente` → ["Amsterdam", "Rotterdam", ...]
    """
    # Special case: integraal "modules" filter returns module names
    if module == ModuleName.integraal:
        if field == "modules":
            # Return all modules that appear in universal_search (exclude integraal itself)
            return ["Instrumenten", "Apparaat", "Inkoop", "Provincie", "Gemeente", "Publiek"]
        raise HTTPException(status_code=400, detail=f"Unknown filter field: {field}")

    try:
        values = await get_filter_options(module.value, field)
        return values
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Filter options query failed for {module}/{field}: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Er ging iets mis bij het ophalen van de filteropties")


# =============================================================================
# Cascading Filter Options Endpoint (UX-021)
# =============================================================================

class CascadingFilterRequest(BaseModel):
    """Request body for cascading filter options."""
    active_filters: dict[str, list[str]] = Field(default_factory=dict)


class FilterOptionItem(BaseModel):
    """Single filter option with count."""
    value: str
    count: int


class CascadingFilterResponse(BaseModel):
    """Response with filter options per field, each with counts."""
    success: bool = True
    options: dict[str, list[FilterOptionItem]]


@router.post("/{module}/filter-options", response_model=CascadingFilterResponse)
async def get_cascading_filters(
    module: ModuleName,
    body: CascadingFilterRequest,
):
    """
    Get filter options with counts, constrained by active filters (bidirectional).

    When a user selects Instrument = "Subsidie", the returned options for
    Regeling, Artikel, etc. will only include values that co-occur with "Subsidie",
    each with a count of matching rows.

    Currently supported for instrumenten module only.
    """
    if module == ModuleName.integraal:
        raise HTTPException(status_code=400, detail="Cascading filters not supported for integraal module")

    try:
        options = await get_cascading_filter_options(module.value, body.active_filters)
        return CascadingFilterResponse(
            success=True,
            options={
                field: [FilterOptionItem(value=item["value"], count=item["count"]) for item in items]
                for field, items in options.items()
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Cascading filter options failed for {module}: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Er ging iets mis bij het ophalen van de filteropties")
