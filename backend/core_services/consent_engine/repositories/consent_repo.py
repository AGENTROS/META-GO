from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from ..interfaces.consent_repo import ConsentRepository
from ..models.consent import ConsentModel


class MongoConsentRepository(ConsentRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db.get_collection("consents")

    async def save(self, consent: ConsentModel) -> None:
        doc = consent.model_dump()
        doc["_id"] = doc.pop("consent_id")
        await self._collection.insert_one(doc)

    async def get_by_did(self, did: str) -> List[ConsentModel]:
        cursor = self._collection.find({"did": did})
        docs = await cursor.to_list(length=1000)
        for doc in docs:
            doc["consent_id"] = doc.pop("_id")
        return [ConsentModel(**doc) for doc in docs]

    async def get_by_id(self, consent_id: str) -> ConsentModel:
        doc = await self._collection.find_one({"_id": consent_id})
        if doc:
            doc["consent_id"] = doc.pop("_id")
            return ConsentModel(**doc)
        return None

    async def update(self, consent: ConsentModel) -> None:
        doc = consent.model_dump()
        c_id = doc.pop("consent_id")
        await self._collection.update_one({"_id": c_id}, {"$set": doc})
