"""
API v1 router - combines all module endpoints.
"""
from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.modules import router as modules_router
from app.api.v1.search import router as search_router
from app.api.v1.public import router as public_router

router = APIRouter()

# Health check
router.include_router(health_router, tags=["Health"])

# Module endpoints
router.include_router(modules_router, prefix="/modules", tags=["Modules"])

# Search endpoints (Typesense proxy - keeps API key server-side)
router.include_router(search_router, prefix="/search", tags=["Search"])

# Public endpoints (no auth/BFF secret required — homepage widget)
router.include_router(public_router, prefix="/public", tags=["Public"])
