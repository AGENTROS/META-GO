from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from ..interfaces import EventStoreRepository
from ..models.event import EventModel

class MongoEventStoreRepository(EventStoreRepository):
    def __init__(self, db: AsyncIOMotorDatabase):
        self._collection = db.get_collection("event_store")

    async def save_event(self, event: EventModel) -> None:
        event_dict = event.model_dump()
        await self._collection.insert_one(event_dict)

    async def get_events_by_correlation_id(self, correlation_id: str) -> List[EventModel]:
        cursor = self._collection.find({"correlation_id": correlation_id}).sort("timestamp", 1)
        events = await cursor.to_list(length=1000)
        return [EventModel(**e) for e in events]
