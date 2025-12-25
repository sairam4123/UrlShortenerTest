from typing import AsyncGenerator
import dotenv
from sqlalchemy.orm import declarative_base

import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

dotenv.load_dotenv()

db_url = os.getenv("DATABASE_URL")
if db_url is None:
    raise EnvironmentError("DATABASE_URL not set in environment variables")

Base = declarative_base()
async_engine = create_async_engine(db_url, echo=True, future=True)


async def get_async_session() -> AsyncGenerator[AsyncSession]:
    async with async_sessionmaker(
        bind=async_engine,
        expire_on_commit=False,
    )() as session:
        yield session
