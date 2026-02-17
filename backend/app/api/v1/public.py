"""
Public API — unauthenticated endpoints for the homepage.

GET /api/v1/public/search — Search recipients for the "Probeer het zelf" widget.
Returns only ontvanger, y2024, totaal (minimal exposure).
No BFF secret required — this is a public endpoint.
"""
import logging
import re

from fastapi import APIRouter, Query, HTTPException

from app.config import get_settings
from app.services.modules import _typesense_search, is_word_boundary_match
from app.services.database import get_pool

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter()


@router.get("/search")
async def public_search(
    q: str = Query(..., min_length=2, max_length=200, description="Search query"),
    limit: int = Query(10, ge=1, le=10, description="Max results"),
):
    """
    Search recipients for the homepage widget.

    Uses Typesense for fast prefix search, then fetches y2024 + totaal
    from universal_search materialized view. Returns minimal data only.
    """
    search = q.strip()
    if len(search) < 2:
        return []

    # 1. Search Typesense for matching recipient keys
    params = {
        "q": search,
        "query_by": "name,name_lower",
        "prefix": "true",
        "per_page": str(min(limit * 5, 50)),
        "sort_by": "totaal:desc",
    }

    data = await _typesense_search("recipients", params)

    keys = []
    for hit in data.get("hits", []):
        doc = hit.get("document", {})
        name = doc.get("name")
        doc_id = doc.get("id")
        if not name or not doc_id:
            continue
        if not is_word_boundary_match(search, name):
            continue
        keys.append(doc_id)
        if len(keys) >= limit:
            break

    if not keys:
        return []

    # 2. Fetch y2024 + totaal from universal_search
    pool = await get_pool()
    async with pool.acquire(timeout=10) as conn:
        rows = await conn.fetch(
            """
            SELECT ontvanger, "2024" AS y2024, totaal
            FROM universal_search
            WHERE ontvanger_key = ANY($1::text[])
            ORDER BY totaal DESC
            LIMIT $2
            """,
            keys,
            limit,
        )

    return [
        {
            "ontvanger": row["ontvanger"],
            "y2024": row["y2024"] or 0,
            "totaal": row["totaal"] or 0,
        }
        for row in rows
    ]
