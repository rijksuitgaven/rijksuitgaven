"""
Rijksuitgaven API - FastAPI Backend

Main application entry point.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.api.v1 import router as api_v1_router
from app.services.database import close_pool, get_pool

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.

    Handles startup and shutdown events:
    - Startup: Nothing needed (pool created lazily on first request)
    - Shutdown: Close database connection pool to prevent resource leaks
    """
    # Startup: pre-warm database pool so first request doesn't pay connection cost
    logger.info("Application starting up, pre-warming database pool")
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.fetchval("SELECT 1")
        # Warm PostgreSQL buffer cache for universal_search (integraal module)
        await conn.fetchval("SELECT COUNT(*) FROM universal_search")
    logger.info("Database pool ready")
    yield
    # Shutdown
    logger.info("Application shutting down, closing database pool")
    await close_pool()
    logger.info("Database pool closed")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API for Rijksuitgaven.nl - Dutch Government Spending Data",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# CORS middleware
# Restrict headers to only what's needed (not "*" which is too permissive)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "X-BFF-Secret"],
)

# BFF shared secret middleware — rejects requests without valid X-BFF-Secret
# when bff_secret is configured. Health/root endpoints are always allowed.
class BFFSecretMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if settings.bff_secret:
            # Allow health checks and root without secret
            if request.url.path not in ("/", "/health", "/api/v1/health"):
                provided = request.headers.get("X-BFF-Secret", "")
                if provided != settings.bff_secret:
                    return JSONResponse(
                        status_code=403,
                        content={"error": "Forbidden"},
                    )
        return await call_next(request)

app.add_middleware(BFFSecretMiddleware)

# Include API routes
app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "status": "ok",
        "health": "/api/v1/health",
    }


@app.get("/health")
async def health():
    """Health check endpoint for Railway."""
    return {"status": "healthy"}
