from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_admin
from app.models.user import Admin, NormalUser, RootAdmin
from app.models.poem import Poem
from app.models.feedback import Feedback
from app.schemas.user import UserCreate, UserOut
from app.schemas.feedback import FeedbackOut
from app.services.auth_service import hash_password
from app.services.poem_service import generate_birthday_poem

router = APIRouter(tags=["users"])


@router.post("/users/create", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    admin: Annotated[Admin, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    # Check username uniqueness across all role tables (MAJ-002)
    for model in [RootAdmin, Admin, NormalUser]:
        res = await db.execute(select(model).where(model.username == body.username))
        if res.scalar_one_or_none() is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

    new_user = NormalUser(
        username=body.username,
        hashed_password=hash_password(body.password),
        birthday_info=body.birthday_info,
        admin_id=admin.id,
    )
    db.add(new_user)
    await db.flush()  # get new_user.id before commit

    # Pre-generate poem — fall back to placeholder if NVIDIA API is unavailable
    try:
        poem_text = await generate_birthday_poem(body.username, body.birthday_info)
    except Exception as exc:
        # Log real error so it appears in backend logs, but don't block creation
        import logging
        logging.getLogger(__name__).error("Poem generation failed: %s", exc)
        poem_text = (
            f"Chúc mừng sinh nhật {body.username}!\n"
            "Chúc bạn luôn vui vẻ, hạnh phúc,\n"
            "Và mọi ước mơ sẽ thành hiện thực.\n"
            "❤️"
        )
    poem = Poem(user_id=new_user.id, poem_text=poem_text)
    db.add(poem)

    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.get("/users", response_model=list[UserOut])
async def list_users(
    admin: Annotated[Admin, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(NormalUser).where(NormalUser.admin_id == admin.id))
    return result.scalars().all()


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    admin: Annotated[Admin, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(NormalUser).where(NormalUser.id == user_id, NormalUser.admin_id == admin.id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    await db.delete(user)
    await db.commit()


@router.get("/inbox", response_model=list[FeedbackOut])
async def get_inbox(
    admin: Annotated[Admin, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Feedback, NormalUser.username)
        .join(NormalUser, Feedback.user_id == NormalUser.id)
        .where(Feedback.admin_id == admin.id)
        .order_by(Feedback.created_at.desc())
    )
    rows = result.all()
    out = []
    for feedback, username in rows:
        out.append(
            FeedbackOut(
                id=feedback.id,
                feedback_type=feedback.feedback_type.value,
                content=feedback.content,
                created_at=feedback.created_at,
                is_read=feedback.is_read,
                username=username,
            )
        )
    return out


@router.patch("/inbox/{feedback_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_feedback_read(
    feedback_id: int,
    admin: Annotated[Admin, Depends(get_current_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Feedback).where(Feedback.id == feedback_id, Feedback.admin_id == admin.id)
    )
    fb = result.scalar_one_or_none()
    if fb is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")
    fb.is_read = True
    await db.commit()
