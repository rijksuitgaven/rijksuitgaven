"""
Rijksuitgaven API - FastAPI Backend

Main application entry point.
"""
import logging
import time
from collections import defaultdict
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.api.v1 import router as api_v1_router
from app.services.database import close_pool, get_pool
from app.services.http_client import close_http_client

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
    # Security check: warn if BFF_SECRET is not configured
    if not settings.bff_secret:
        logger.warning("⚠️  BFF_SECRET is not set - backend accepts all traffic without authentication!")
        logger.warning("⚠️  This is acceptable for local development but UNSAFE for production.")
        logger.warning("⚠️  Set BFF_SECRET environment variable to enable request authentication.")

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
    logger.info("Application shutting down, closing connections")
    await close_http_client()
    await close_pool()
    logger.info("All connections closed")


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
# Localhost origins only included in development mode (debug=true or ENV=development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
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
            if request.url.path not in ("/", "/health", "/api/v1/health", "/api/v1/public/search"):
                provided = request.headers.get("X-BFF-Secret", "")
                if provided != settings.bff_secret:
                    return JSONResponse(
                        status_code=403,
                        content={"error": "Forbidden"},
                    )
        return await call_next(request)

app.add_middleware(BFFSecretMiddleware)


# Rate limiting middleware — token bucket per IP
# Public endpoints (no BFF secret): 10 req/min
# Authenticated endpoints (BFF secret): 120 req/min
# Health/root: exempt
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        # {ip: [tokens, last_refill_time]}
        self.buckets: dict[str, list] = defaultdict(lambda: [0.0, 0.0])
        self.last_cleanup = time.monotonic()

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP, respecting X-Forwarded-For from Railway proxy."""
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Exempt: health checks, root, OPTIONS (CORS preflight)
        if path in ("/", "/health", "/api/v1/health") or request.method == "OPTIONS":
            return await call_next(request)

        # Determine rate limit tier
        is_public = path.startswith("/api/v1/public/")
        max_tokens = 10.0 if is_public else 120.0  # bucket capacity
        refill_rate = 10.0 / 60.0 if is_public else 120.0 / 60.0  # tokens per second

        client_ip = self._get_client_ip(request)
        bucket_key = f"{'pub' if is_public else 'auth'}:{client_ip}"

        now = time.monotonic()
        bucket = self.buckets[bucket_key]

        # Initialize new bucket
        if bucket[1] == 0.0:
            bucket[0] = max_tokens
            bucket[1] = now

        # Refill tokens based on elapsed time
        elapsed = now - bucket[1]
        bucket[0] = min(max_tokens, bucket[0] + elapsed * refill_rate)
        bucket[1] = now

        # Check if request is allowed
        if bucket[0] < 1.0:
            logger.warning(f"Rate limit exceeded for {bucket_key}")
            return JSONResponse(
                status_code=429,
                content={"error": "Too many requests"},
                headers={"Retry-After": str(int(1.0 / refill_rate))},
            )

        # Consume a token
        bucket[0] -= 1.0

        # Periodic cleanup of stale buckets (every 5 minutes)
        if now - self.last_cleanup > 300:
            self.last_cleanup = now
            stale_keys = [k for k, v in self.buckets.items() if now - v[1] > 300]
            for k in stale_keys:
                del self.buckets[k]

        return await call_next(request)

app.add_middleware(RateLimitMiddleware)

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
