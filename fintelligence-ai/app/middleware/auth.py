from fastapi import HTTPException, Header
from jose import jwt, JWTError
from app.config import settings
from typing import Optional


async def verify_clerk_token(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization[7:]

    # ── Self-driven JWT (HS256) ────────────────────────────────────────────
    # Used when CLERK_PEM_PUBLIC_KEY is not set (local dev and self-auth prod).
    # To switch back to Clerk: set CLERK_PEM_PUBLIC_KEY in env.
    if not settings.CLERK_PEM_PUBLIC_KEY:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
            user_id: str = payload.get("userId") or payload.get("sub", "")
            if not user_id:
                raise HTTPException(status_code=401, detail="Token missing userId")
            return user_id
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

    # ── Clerk RS256 (preserved for future switch-back) ─────────────────────
    try:
        payload = jwt.decode(
            token,
            settings.CLERK_PEM_PUBLIC_KEY,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing sub claim")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
