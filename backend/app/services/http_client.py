"""
Shared HTTP client for external service calls (Typesense).

Centralizes httpx.AsyncClient lifecycle to avoid duplicate clients
in modules.py and search.py. Uses asyncio.Lock for safe lazy init
(matches database.py pool pattern).
"""
import asyncio
import httpx

_http_client: httpx.AsyncClient | None = None
_http_client_lock = asyncio.Lock()


async def get_http_client() -> httpx.AsyncClient:
    """Get or create shared httpx client (5s timeout)."""
    global _http_client
    if _http_client is None:
        async with _http_client_lock:
            if _http_client is None:
                _http_client = httpx.AsyncClient(timeout=5.0)
    return _http_client


async def close_http_client() -> None:
    """Close the shared httpx client. Call on application shutdown."""
    global _http_client
    async with _http_client_lock:
        if _http_client:
            await _http_client.aclose()
            _http_client = None
