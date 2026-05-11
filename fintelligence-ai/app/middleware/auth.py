from fastapi import HTTPException, Header
from jose import jwt, JWTError
from app.config import settings
from typing import Optional


async def verify_clerk_token(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization[7:]

    if not settings.CLERK_PEM_PUBLIC_KEY:
        # Dev mode: extract sub without verification (sandbox only)
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload.get("sub", "dev-user")
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

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
