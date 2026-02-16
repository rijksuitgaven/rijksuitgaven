"""
Database service for Supabase/PostgreSQL connection.

Uses asyncpg for async database operations.
"""
import asyncio
import asyncpg
from typing import Any, Optional
from contextlib import asynccontextmanager

from app.config import get_settings

settings = get_settings()

# Connection pool (initialized on first use)
_pool: Optional[asyncpg.Pool] = None
_pool_lock = asyncio.Lock()


async def get_pool() -> asyncpg.Pool:
    """
    Get or create the connection pool.

    Pool settings tuned for production with pgbouncer:
    - min_size: Keep 2 connections warm
    - max_size: Allow up to 10 concurrent connections
    - max_inactive_connection_lifetime: Close idle connections after 5 min
    - command_timeout: 60s for complex aggregation queries
    - statement_cache_size: MUST be 0 for pgbouncer transaction mode

    Supabase pooler (port 6543) uses transaction mode which doesn't
    support prepared statements - each query can go to different backend.
    """
    global _pool
    if _pool is None:
        async with _pool_lock:
            if _pool is None:
                _pool = await asyncpg.create_pool(
                    settings.database_url,
                    min_size=2,
                    max_size=10,
                    max_inactive_connection_lifetime=300,  # 5 minutes
                    command_timeout=60,
                    statement_cache_size=0,  # Required for pgbouncer transaction mode
                )
    return _pool


async def close_pool():
    """Close the connection pool."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def get_connection():
    """Get a database connection from the pool."""
    pool = await get_pool()
    async with pool.acquire(timeout=10) as connection:
        yield connection


async def fetch_all(query: str, *args) -> list[dict]:
    """Execute query and return all rows as dicts."""
    async with get_connection() as conn:
        rows = await conn.fetch(query, *args)
        return [dict(row) for row in rows]


async def fetch_val(query: str, *args) -> Any:
    """Execute query and return single value."""
    async with get_connection() as conn:
        return await conn.fetchval(query, *args)


async def check_connection() -> bool:
    """Check if database connection works."""
    try:
        result = await fetch_val("SELECT 1")
        return result == 1
    except Exception:
        return False


import re

def normalize_recipient_python(name: str | None) -> str:
    """
    Python equivalent of PostgreSQL normalize_recipient() function.

    Normalizes recipient names for matching:
    - Uppercase
    - Remove B.V./BV, N.V./NV suffixes/prefixes
    - Collapse multiple spaces
    - Trim

    This must match the SQL function exactly for hybrid lookups to work.
    """
    if not name:
        return ""

    # Uppercase and trim
    result = name.upper().strip()

    # Multiple spaces → single space
    result = re.sub(r'\s+', ' ', result)

    # Trailing dots
    result = re.sub(r'\.+$', '', result)

    # " B.V." or " B.V" at end
    result = re.sub(r' B\.V\.?$', '', result)

    # " BV" at end
    result = re.sub(r' BV\.?$', '', result)

    # " N.V." at end
    result = re.sub(r' N\.V\.?$', '', result)

    # " NV" at end
    result = re.sub(r' NV\.?$', '', result)

    # "N.V. " at start
    result = re.sub(r'^N\.V\.? ', '', result)

    return result.strip()
