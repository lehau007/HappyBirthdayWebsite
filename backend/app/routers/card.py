from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_normal_user
from app.models.user import NormalUser
from app.models.poem import Poem
from app.models.feedback import Feedback, FeedbackType
from app.schemas.poem import PoemOut
from app.schemas.feedback import FeedbackCreate

router = APIRouter(prefix="/card", tags=["card"])


@router.get("/poem", response_model=PoemOut)
async def get_poem(
    user: Annotated[NormalUser, Depends(get_current_normal_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Poem).where(Poem.user_id == user.id))
    poem = result.scalar_one_or_none()
    if poem is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Poem not found")
    return poem


@router.post("/feedback", status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    body: FeedbackCreate,
    user: Annotated[NormalUser, Depends(get_current_normal_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    feedback = Feedback(
        user_id=user.id,
        admin_id=user.admin_id,
        feedback_type=FeedbackType(body.type),
        content=body.content,
    )
    db.add(feedback)
    await db.commit()
    return {"detail": "Feedback submitted"}
