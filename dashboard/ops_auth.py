"""Shared secret gate for ops / mutating dashboard routes (security audit C1)."""
from __future__ import annotations

import hmac
import os

from fastapi import HTTPException, Request

# Header preferred for XHR; query allowed so /command?ops_token=… bookmarks work.
OPS_TOKEN_HEADER = "x-ops-token"
OPS_TOKEN_QUERY = "ops_token"
OPS_TOKEN_ENV = "OPS_API_TOKEN"


def configured_ops_token() -> str:
    """Return the configured ops token, or empty if unset."""
    return os.environ.get(OPS_TOKEN_ENV, "").strip()


def extract_ops_token(request: Request) -> str:
    """Pull a presented token from header, Bearer auth, or query string."""
    header = (request.headers.get(OPS_TOKEN_HEADER) or "").strip()
    if header:
        return header

    auth = (request.headers.get("authorization") or "").strip()
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()

    return (request.query_params.get(OPS_TOKEN_QUERY) or "").strip()


def ops_token_accepted(request: Request) -> bool:
    """True when a configured token is present and matches (timing-safe)."""
    expected = configured_ops_token()
    if not expected:
        return False
    provided = extract_ops_token(request)
    if not provided or len(provided) != len(expected):
        return False
    return hmac.compare_digest(provided, expected)


def require_ops_token(request: Request) -> None:
    """
    FastAPI dependency: require ``OPS_API_TOKEN``.

    - 503 when the server has no token configured (fail closed).
    - 401 when the client omits or mismatches the token.
    """
    expected = configured_ops_token()
    if not expected:
        raise HTTPException(
            status_code=503,
            detail=(
                f"{OPS_TOKEN_ENV} is not configured. "
                "Set a long random secret before using ops/mutating routes."
            ),
        )
    if not ops_token_accepted(request):
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid or missing ops token. "
                f"Send {OPS_TOKEN_HEADER} header, Authorization: Bearer, "
                f"or ?{OPS_TOKEN_QUERY}=…"
            ),
            headers={"WWW-Authenticate": "Bearer"},
        )
