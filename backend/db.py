from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db: AsyncIOMotorDatabase = client[os.environ["DB_NAME"]]


async def get_db() -> AsyncIOMotorDatabase:
    return db


async def close_db_client() -> None:
    client.close()
