import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI)
db = client["metago_os"]


async def save_issued_credential(credential_data: dict) -> str:
    """
    Saves the ZK commitment and metadata to MongoDB.
    Does NOT save the raw image data.
    """
    result = await db.issued_credentials.insert_one(credential_data)
    return str(result.inserted_id)


async def get_credentials_by_owner(owner_wallet: str) -> list:
    cursor = db.issued_credentials.find({"owner_wallet": owner_wallet.lower()})
    docs = await cursor.to_list(length=100)
    for doc in docs:
        doc["_id"] = str(doc["_id"])
    return docs
