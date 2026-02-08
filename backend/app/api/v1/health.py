"""
Health check endpoints.
"""
import logging
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.config import Settings, get_settings
from app.services.database import check_connection

logger = logging.getLogger(__name__)

router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    version: str
    database: str
    typesense: str


@router.get("/health", response_model=HealthResponse)
async def health_check(settings: Settings = Depends(get_settings)):
    """
    Health check endpoint.

    Returns status of API and connections to external services.
    """
    # Check actual database connection
    try:
        db_connected = await check_connection()
        db_status = "connected" if db_connected else "error"
    except Exception as e:
        logger.error(f"Health check DB error: {e}")
        db_status = "error"

    ts_status = "configured" if settings.typesense_host else "not_configured"

    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        version=settings.app_version,
        database=db_status,
        typesense=ts_status,
    )
