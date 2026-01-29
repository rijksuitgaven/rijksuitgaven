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


@router.get("/{module}", response_model=ModuleResponse)
async def get_module(
    module: ModuleName,
    # Search
    q: Optional[str] = Query(None, min_length=1, max_length=200, description="Search query"),
    # Pagination
    limit: int = Query(25, ge=1, le=100, description="Results per page"),
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

    ## Response

    Returns aggregated rows with:
    - Primary field (ontvanger or kostensoort)
    - Year columns (2016-2024)
    - Total amount
    - Row count (for expansion indicator)
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

    try:
        # Handle integraal separately (uses universal_search table)
        if module == ModuleName.integraal:
            data, total = await get_integraal_data(
                search=q,
                jaar=jaar,
                min_bedrag=min_bedrag,
                max_bedrag=max_bedrag,
                sort_by=sort_by,
                sort_order=sort_order.value,
                limit=limit,
                offset=offset,
                min_years=min_years,
            )
            primary_field = "ontvanger"
        else:
            data, total = await get_module_data(
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
            )
            primary_field = MODULE_CONFIG[module.value]["primary_field"]

        elapsed_ms = (time.time() - start_time) * 1000

        return ModuleResponse(
            success=True,
            module=module.value,
            primary_field=primary_field,
            data=[AggregatedRow(**row) for row in data],
            meta={
                "total": total,
                "limit": limit,
                "offset": offset,
                "query": q,
                "elapsed_ms": round(elapsed_ms, 2),
                "years": YEARS,
            },
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
    if module == ModuleName.integraal:
        raise HTTPException(status_code=400, detail="Integraal module has no filter fields")

    try:
        values = await get_filter_options(module.value, field)
        return values
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Filter options query failed for {module}/{field}: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Er ging iets mis bij het ophalen van de filteropties")
