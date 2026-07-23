from motor.motor_asyncio import AsyncIOMotorClient
from core_services.config import get_settings


class Database:
    client: AsyncIOMotorClient = None


db = Database()


async def connect_to_mongo():
    settings = get_settings()
    db.client = AsyncIOMotorClient(settings.MONGO_URI)


async def close_mongo_connection():
    if db.client:
        db.client.close()


def get_database():
    settings = get_settings()
    return db.client[settings.MONGO_DB_NAME]
