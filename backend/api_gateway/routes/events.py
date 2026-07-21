from fastapi import APIRouter, Depends
from core_services.event_store.repositories.mongo import MongoEventStoreRepository
from api_gateway.database import get_database
from pydantic import BaseModel
from typing import List, Any

router = APIRouter(prefix="/api/v1/events", tags=["Events"])

class StandardResponse(BaseModel):
    success: bool
    data: Any

@router.get("/timeline/{did}", response_model=StandardResponse)
async def get_timeline(did: str, db=Depends(get_database)):
    collection = db.get_collection("event_store")
    # Query events where payload contains the did, or just fetch recent events
    cursor = collection.find({"payload.did": did}).sort("timestamp", -1).limit(20)
    events = await cursor.to_list(length=20)
    
    # Format events for the frontend
    formatted_events = []
    for event in events:
        formatted_events.append({
            "id": str(event.get("_id", event.get("event_id"))),
            "type": event.get("event_type"),
            "message": f"{event.get('event_type')} processed",
            "timestamp": event.get("timestamp"),
            "read": False
        })
        
    return StandardResponse(success=True, data=formatted_events)
