"""
Search API - Typesense proxy endpoints.

This file provides a secure backend proxy for Typesense searches,
keeping the API key server-side only.
"""
from typing import Optional
import logging
import httpx

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter()
settings = get_settings()


# =============================================================================
# Models
# =============================================================================

class RecipientResult(BaseModel):
    """Recipient search result."""
    type: str = "recipient"
    name: str
    sources: list[str] = []
    source_count: int = 0
    totaal: int = 0


class KeywordResult(BaseModel):
    """Keyword search result."""
    type: str = "keyword"
    keyword: str
    field: str
    fieldLabel: str
    module: str
    moduleLabel: str


class SearchResponse(BaseModel):
    """Combined search response."""
    success: bool = True
    recipients: list[RecipientResult] = []
    keywords: list[KeywordResult] = []


# =============================================================================
# Field/Module Labels
# =============================================================================

FIELD_LABELS = {
    "regeling": "Regeling",
    "omschrijving": "Omschrijving",
    "beleidsterrein": "Beleidsterrein",
    "begrotingsnaam": "Begrotingsnaam",
    "categorie": "Categorie",
    "trefwoorden": "Trefwoorden",
}

MODULE_LABELS = {
    "instrumenten": "Instrumenten",
    "inkoop": "Inkoop",
    "publiek": "Publiek",
    "gemeente": "Gemeente",
    "provincie": "Provincie",
    "apparaat": "Apparaat",
}


# =============================================================================
# Typesense Client Helper
# =============================================================================

def get_typesense_url(path: str) -> str:
    """Build Typesense URL."""
    return f"{settings.typesense_protocol}://{settings.typesense_host}:{settings.typesense_port}{path}"


async def typesense_search(collection: str, params: dict) -> dict:
    """Execute search against Typesense."""
    url = get_typesense_url(f"/collections/{collection}/documents/search")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            url,
            params=params,
            headers={"X-TYPESENSE-API-KEY": settings.typesense_api_key},
            timeout=10.0,
        )

        if response.status_code != 200:
            return {"hits": [], "grouped_hits": []}

        return response.json()


# =============================================================================
# Endpoints
# =============================================================================

@router.get("/autocomplete", response_model=SearchResponse)
async def autocomplete(
    q: str = Query(..., min_length=2, max_length=200, description="Search query"),
    fuzzy: bool = Query(False, description="Enable fuzzy/typo-tolerant search"),
):
    """
    Autocomplete search for recipients and keywords.

    Returns:
    - Recipients: matching recipient names with total amounts
    - Keywords: matching terms from regeling, omschrijving, beleidsterrein

    Used by the global search bar for instant suggestions.
    """
    try:
        # Parallel search for recipients and keywords
        recipients = await search_recipients(q, fuzzy=fuzzy)
        keywords = await search_keywords(q)

        return SearchResponse(
            success=True,
            recipients=recipients,
            keywords=keywords,
        )
    except Exception as e:
        logger.error(f"Search failed: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Er ging iets mis bij het zoeken")


@router.get("/recipients", response_model=list[RecipientResult])
async def search_recipients_endpoint(
    q: str = Query(..., min_length=2, max_length=200),
    limit: int = Query(5, ge=1, le=20),
    fuzzy: bool = Query(False),
):
    """Search recipients collection."""
    return await search_recipients(q, limit=limit, fuzzy=fuzzy)


# =============================================================================
# Search Functions
# =============================================================================

async def search_recipients(
    q: str,
    limit: int = 5,
    fuzzy: bool = False,
) -> list[RecipientResult]:
    """Search recipients collection in Typesense."""
    params = {
        "q": q,
        "query_by": "name,name_lower",
        "prefix": "true",
        "per_page": str(limit),
        "sort_by": "totaal:desc",
    }

    if fuzzy:
        params["num_typos"] = "2"
        params["typo_tokens_threshold"] = "1"

    data = await typesense_search("recipients", params)

    results = []
    for hit in data.get("hits", []):
        doc = hit.get("document", {})
        results.append(RecipientResult(
            type="recipient",
            name=doc.get("name", ""),
            sources=doc.get("sources", []),
            source_count=doc.get("source_count", 0),
            totaal=doc.get("totaal", 0),
        ))

    return results


async def search_keywords(q: str) -> list[KeywordResult]:
    """Search keyword fields across module collections."""
    keyword_searches = [
        {"collection": "instrumenten", "field": "regeling", "module": "instrumenten"},
        {"collection": "publiek", "field": "regeling", "module": "publiek"},
        {"collection": "publiek", "field": "omschrijving", "module": "publiek"},
        {"collection": "gemeente", "field": "regeling", "module": "gemeente"},
        {"collection": "gemeente", "field": "beleidsterrein", "module": "gemeente"},
        {"collection": "gemeente", "field": "omschrijving", "module": "gemeente"},
        {"collection": "provincie", "field": "omschrijving", "module": "provincie"},
    ]

    results: list[KeywordResult] = []
    seen_keywords: set[str] = set()

    # Search first 4 collections
    for search_config in keyword_searches[:4]:
        collection = search_config["collection"]
        field = search_config["field"]
        module = search_config["module"]

        params = {
            "q": q,
            "query_by": field,
            "prefix": "true",
            "per_page": "3",
            "group_by": field,
            "group_limit": "1",
        }

        data = await typesense_search(collection, params)

        for group in data.get("grouped_hits", []):
            hits = group.get("hits", [])
            if not hits:
                continue

            doc = hits[0].get("document", {})
            keyword = doc.get(field)

            if not keyword or len(keyword) < 3:
                continue

            keyword_lower = keyword.lower()
            if keyword_lower in seen_keywords:
                continue

            seen_keywords.add(keyword_lower)
            results.append(KeywordResult(
                type="keyword",
                keyword=keyword,
                field=field,
                fieldLabel=FIELD_LABELS.get(field, field),
                module=module,
                moduleLabel=MODULE_LABELS.get(module, module),
            ))

    return results[:4]
