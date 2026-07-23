from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from ..interfaces.avatar_repo import AvatarRepository
from ..models.avatar import AvatarModel


class MongoAvatarRepository(AvatarRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db.get_collection("avatars")

    async def save(self, avatar: AvatarModel) -> None:
        doc = avatar.model_dump()
        doc["_id"] = doc.pop("avatar_id")
        await self._collection.insert_one(doc)

    async def get_by_id(self, avatar_id: str) -> Optional[AvatarModel]:
        doc = await self._collection.find_one({"_id": avatar_id})
        if doc:
            doc["avatar_id"] = doc.pop("_id")
            return AvatarModel(**doc)
        return None

    async def get_by_did(self, did: str) -> List[AvatarModel]:
        cursor = self._collection.find({"did": did})
        docs = await cursor.to_list(length=1000)
        for doc in docs:
            doc["avatar_id"] = doc.pop("_id")
        return [AvatarModel(**doc) for doc in docs]

    async def update(self, avatar: AvatarModel) -> None:
        doc = avatar.model_dump()
        av_id = doc.pop("avatar_id")
        await self._collection.update_one({"_id": av_id}, {"$set": doc})

    async def delete(self, avatar_id: str) -> None:
        await self._collection.delete_one({"_id": avatar_id})
