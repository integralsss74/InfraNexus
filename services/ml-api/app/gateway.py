"""Signed Node-to-FastAPI gateway assertions for the optional production stack.

The browser never creates these assertions. The managed Node/tRPC boundary signs a
short-lived claim after it has validated the OAuth session; FastAPI verifies it
before accepting import, workflow, or coordinate mutations.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from dataclasses import dataclass

from fastapi import Header, HTTPException


MAX_ASSERTION_LIFETIME_SECONDS = 300


@dataclass(frozen=True)
class GatewayPrincipal:
    user_id: int
    open_id: str
    role: str
    issued_at: int
    expires_at: int


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def create_assertion(*, user_id: int, open_id: str, role: str, secret: str, now: int | None = None, ttl_seconds: int = 120) -> str:
    """Create an assertion for tests or the Node gateway implementation."""
    if len(secret) < 32:
        raise ValueError("PAIMANA_PRODUCTION_GATEWAY_SECRET must contain at least 32 characters")
    issued_at = int(now or time.time())
    if ttl_seconds <= 0 or ttl_seconds > MAX_ASSERTION_LIFETIME_SECONDS:
        raise ValueError("Gateway assertion lifetime must be between 1 and 300 seconds")
    payload = {"uid": user_id, "sub": open_id, "role": role, "iat": issued_at, "exp": issued_at + ttl_seconds}
    encoded = _b64encode(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    signature = hmac.new(secret.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).digest()
    return f"{encoded}.{_b64encode(signature)}"


def verify_assertion(assertion: str, secret: str, now: int | None = None) -> GatewayPrincipal:
    if len(secret) < 32:
        raise ValueError("PAIMANA_PRODUCTION_GATEWAY_SECRET must contain at least 32 characters")
    try:
        encoded, supplied_signature = assertion.split(".", 1)
        expected_signature = _b64encode(hmac.new(secret.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256).digest())
        if not hmac.compare_digest(supplied_signature, expected_signature):
            raise ValueError("signature mismatch")
        payload = json.loads(_b64decode(encoded))
        principal = GatewayPrincipal(
            user_id=int(payload["uid"]),
            open_id=str(payload["sub"]),
            role=str(payload["role"]),
            issued_at=int(payload["iat"]),
            expires_at=int(payload["exp"]),
        )
    except (KeyError, TypeError, ValueError, json.JSONDecodeError, UnicodeDecodeError) as error:
        raise ValueError("Invalid PAIMANA gateway assertion") from error
    current_time = int(now or time.time())
    if principal.role not in {"user", "admin"}:
        raise ValueError("Invalid account role in gateway assertion")
    if principal.expires_at <= current_time or principal.expires_at - principal.issued_at > MAX_ASSERTION_LIFETIME_SECONDS:
        raise ValueError("Expired or overlong gateway assertion")
    if principal.issued_at > current_time + 30:
        raise ValueError("Gateway assertion issued in the future")
    return principal


def require_gateway_principal(x_paimana_assertion: str | None = Header(default=None)) -> GatewayPrincipal:
    secret = os.getenv("PAIMANA_PRODUCTION_GATEWAY_SECRET")
    if not secret:
        raise HTTPException(status_code=503, detail="Production gateway assertions are not configured")
    if not x_paimana_assertion:
        raise HTTPException(status_code=401, detail="Missing PAIMANA gateway assertion")
    try:
        return verify_assertion(x_paimana_assertion, secret)
    except ValueError as error:
        raise HTTPException(status_code=401, detail=str(error)) from error


def require_admin(principal: GatewayPrincipal) -> GatewayPrincipal:
    if principal.role != "admin":
        raise HTTPException(status_code=403, detail="Administrator role required for this operation")
    return principal
