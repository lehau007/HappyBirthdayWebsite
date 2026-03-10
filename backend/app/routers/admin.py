from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_root_admin
from app.models.user import Admin, NormalUser, RootAdmin
from app.schemas.user import AdminCreate, AdminOut
from app.services.auth_service import hash_password
from sqlalchemy import select

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/create", response_model=AdminOut, status_code=status.HTTP_201_CREATED)
async def create_admin(
    body: AdminCreate,
    root: Annotated[RootAdmin, Depends(get_current_root_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    # Check username uniqueness across all role tables (MAJ-002)
    for model in [RootAdmin, Admin, NormalUser]:
        res = await db.execute(select(model).where(model.username == body.username))
        if res.scalar_one_or_none() is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

    new_admin = Admin(
        username=body.username,
        hashed_password=hash_password(body.password),
        created_by_root_id=root.id,
    )
    db.add(new_admin)
    await db.commit()
    await db.refresh(new_admin)
    return new_admin


@router.get("", response_model=list[AdminOut])
async def list_admins(
    root: Annotated[RootAdmin, Depends(get_current_root_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Admin))
    return result.scalars().all()


@router.delete("/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin(
    admin_id: int,
    root: Annotated[RootAdmin, Depends(get_current_root_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Admin).where(Admin.id == admin_id, Admin.created_by_root_id == root.id))
    admin = result.scalar_one_or_none()
    if admin is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admin not found")
    # Prevent deletion if the admin still owns users
    users_result = await db.execute(select(NormalUser).where(NormalUser.admin_id == admin_id))
    if users_result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete admin with active users. Remove their users first.",
        )
    await db.delete(admin)
    await db.commit()
