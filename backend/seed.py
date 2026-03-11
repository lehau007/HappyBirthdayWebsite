"""
Run once to seed the database with the initial RootAdmin account.
Usage:
    cd project_src/backend
    python seed.py
"""
import asyncio
import os

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from dotenv import load_dotenv

load_dotenv()

from app.config import settings
from app.database import Base
from app.models.user import RootAdmin
from app.services.auth_service import hash_password


async def seed():
    engine = create_async_engine(settings.DATABASE_URL)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as session:
        from sqlalchemy import select
        result = await session.execute(select(RootAdmin))
        if result.scalar_one_or_none() is not None:
            print("RootAdmin already exists — skipping seed.")
            return

        root = RootAdmin(
            username="rootadmin",
            hashed_password=hash_password(ROOT_ADMIN_password=os.getenv("ROOT_ADMIN_password", "ChangeMe123!")),
        )
        session.add(root)
        await session.commit()
        print("Created RootAdmin: username=rootadmin  password=ChangeMe123!")
        print("IMPORTANT: Change the password immediately after first login.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
