from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
from ..interfaces.identity_repo import IdentityRepository
from ..models.passport import PassportModel


class MongoIdentityRepository(IdentityRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db.get_collection("identities")

    async def save(self, passport: PassportModel) -> None:
        doc = passport.model_dump()
        doc["_id"] = doc.pop("did")
        await self._collection.insert_one(doc)

    async def get_by_did(self, did: str) -> Optional[PassportModel]:
        doc = await self._collection.find_one({"_id": did})
        if doc:
            doc["did"] = doc.pop("_id")
            return PassportModel(**doc)
        return None

    async def update(self, passport: PassportModel) -> None:
        doc = passport.model_dump()
        did = doc.pop("did")
        await self._collection.update_one({"_id": did}, {"$set": doc})
