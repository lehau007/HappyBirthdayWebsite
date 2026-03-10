from datetime import datetime, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.user import RootAdmin, Admin, NormalUser, TokenBlacklist

bearer_scheme = HTTPBearer()


async def _get_token_payload(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise credentials_exception

    jti: str | None = payload.get("jti")
    if jti is None:
        raise credentials_exception

    # Reject refresh tokens used as access tokens (CRIT-002)
    if payload.get("type") != "access":
        raise credentials_exception

    # Check token blacklist
    result = await db.execute(select(TokenBlacklist).where(TokenBlacklist.jti == jti))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked")

    return payload


async def get_current_root_admin(
    payload: Annotated[dict, Depends(_get_token_payload)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RootAdmin:
    if payload.get("role") != "root_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Root admin access required")
    user_id: int | None = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    result = await db.execute(select(RootAdmin).where(RootAdmin.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_current_admin(
    payload: Annotated[dict, Depends(_get_token_payload)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Admin:
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    user_id: int | None = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    result = await db.execute(select(Admin).where(Admin.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_current_normal_user(
    payload: Annotated[dict, Depends(_get_token_payload)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> NormalUser:
    if payload.get("role") != "normal_user":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Normal user access required")
    user_id: int | None = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    result = await db.execute(select(NormalUser).where(NormalUser.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_any_current_user(
    payload: Annotated[dict, Depends(_get_token_payload)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> tuple:
    """Returns (user_object, role_string) for any valid authenticated user."""
    role = payload.get("role")
    user_id = payload.get("sub")
    if role is None or user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = int(user_id)

    if role == "root_admin":
        result = await db.execute(select(RootAdmin).where(RootAdmin.id == user_id))
        user = result.scalar_one_or_none()
    elif role == "admin":
        result = await db.execute(select(Admin).where(Admin.id == user_id))
        user = result.scalar_one_or_none()
    else:
        result = await db.execute(select(NormalUser).where(NormalUser.id == user_id))
        user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user, role
