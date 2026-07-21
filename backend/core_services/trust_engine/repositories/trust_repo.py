from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
from ..interfaces.trust_repo import TrustRepository
from ..models.trust_score import TrustScoreModel

class MongoTrustRepository(TrustRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db.get_collection("trust_scores")

    async def save(self, score: TrustScoreModel) -> None:
        doc = score.model_dump()
        doc["_id"] = doc.pop("did")
        await self._collection.insert_one(doc)

    async def get_by_did(self, did: str) -> Optional[TrustScoreModel]:
        doc = await self._collection.find_one({"_id": did})
        if doc:
            doc["did"] = doc.pop("_id")
            return TrustScoreModel(**doc)
        return None

    async def update(self, score: TrustScoreModel) -> None:
        doc = score.model_dump()
        did = doc.pop("did")
        await self._collection.update_one({"_id": did}, {"$set": doc})
