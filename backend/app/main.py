import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import delete as sa_delete

from app.config import settings
from app.database import AsyncSessionLocal
from app.models.user import TokenBlacklist
from app.routers import auth, admin, users, card


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Hourly background task that prunes expired token-blacklist rows (MAJ-005)."""
    async def _prune():
        while True:
            await asyncio.sleep(3600)
            async with AsyncSessionLocal() as db:
                await db.execute(
                    sa_delete(TokenBlacklist).where(
                        TokenBlacklist.expires_at < datetime.now(timezone.utc)
                    )
                )
                await db.commit()

    task = asyncio.create_task(_prune())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="Happy Birthday API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(users.router)
app.include_router(card.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
