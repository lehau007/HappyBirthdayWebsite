from datetime import timedelta, timezone, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.config import settings
from app.database import get_db
from app.deps import _get_token_payload, get_any_current_user
from app.models.user import RootAdmin, Admin, NormalUser, TokenBlacklist
from app.schemas.auth import LoginRequest, TokenResponse, UserMe, RefreshRequest, LogoutRequest
from app.services.auth_service import (
    verify_password,
    create_access_token,
    create_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer()


async def _authenticate(username: str, password: str, db: AsyncSession):
    """Try all user tables and return (user, role) or raise 401."""
    for model, role in [
        (RootAdmin, "root_admin"),
        (Admin, "admin"),
        (NormalUser, "normal_user"),
    ]:
        result = await db.execute(select(model).where(model.username == username))
        user = result.scalar_one_or_none()
        if user and verify_password(password, user.hashed_password):
            return user, role
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    user, role = await _authenticate(body.username, body.password, db)
    access_token, _ = create_access_token(user.id, role)
    refresh_token, _ = create_refresh_token(user.id, role)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, role=role)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    body: LogoutRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Blacklist both the access token and the refresh token in one transaction (CRIT-001)."""
    for token in [credentials.credentials, body.refresh_token]:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        except JWTError:
            continue  # ignore tokens that cannot be decoded
        jti: str | None = payload.get("jti")
        exp: int | None = payload.get("exp")
        if jti and exp:
            db.add(TokenBlacklist(jti=jti, expires_at=datetime.fromtimestamp(exp, tz=timezone.utc)))
    await db.commit()


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: Annotated[AsyncSession, Depends(get_db)]):
    """Exchange a valid refresh token for a new access token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
    )
    try:
        payload = jwt.decode(body.refresh_token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise credentials_exception

    if payload.get("type") != "refresh":
        raise credentials_exception

    jti: str | None = payload.get("jti")
    if jti is None:
        raise credentials_exception

    result = await db.execute(select(TokenBlacklist).where(TokenBlacklist.jti == jti))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked")

    sub: str | None = payload.get("sub")
    role: str | None = payload.get("role")
    if sub is None or role is None:
        raise credentials_exception

    # Rotate: blacklist the consumed refresh JTI and issue a new refresh token (CRIT-003)
    exp: int | None = payload.get("exp")
    if exp:
        db.add(TokenBlacklist(jti=jti, expires_at=datetime.fromtimestamp(exp, tz=timezone.utc)))
    access_token, _ = create_access_token(int(sub), role)
    new_refresh_token, _ = create_refresh_token(int(sub), role)
    await db.commit()
    return TokenResponse(access_token=access_token, refresh_token=new_refresh_token, role=role)


@router.get("/me", response_model=UserMe)
async def me(
    user_and_role: Annotated[tuple, Depends(get_any_current_user)],
):
    user, role = user_and_role
    return UserMe(id=user.id, username=user.username, role=role)
