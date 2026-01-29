"""
Database service for Supabase/PostgreSQL connection.

Uses asyncpg for async database operations.
"""
import asyncpg
from typing import Optional
from contextlib import asynccontextmanager

from app.config import get_settings

settings = get_settings()

# Connection pool (initialized on first use)
_pool: Optional[asyncpg.Pool] = None


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
    async with pool.acquire() as connection:
        yield connection


async def fetch_all(query: str, *args) -> list[dict]:
    """Execute query and return all rows as dicts."""
    async with get_connection() as conn:
        rows = await conn.fetch(query, *args)
        return [dict(row) for row in rows]


async def fetch_one(query: str, *args) -> Optional[dict]:
    """Execute query and return first row as dict."""
    async with get_connection() as conn:
        row = await conn.fetchrow(query, *args)
        return dict(row) if row else None


async def fetch_val(query: str, *args):
    """Execute query and return single value."""
    async with get_connection() as conn:
        return await conn.fetchval(query, *args)


async def execute(query: str, *args) -> str:
    """Execute query without returning results."""
    async with get_connection() as conn:
        return await conn.execute(query, *args)


async def check_connection() -> bool:
    """Check if database connection works."""
    try:
        result = await fetch_val("SELECT 1")
        return result == 1
    except Exception:
        return False
