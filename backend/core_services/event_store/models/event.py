from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import uuid4

class EventModel(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    event_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    correlation_id: str
    causation_id: Optional[str] = None
    source_engine: str
    event_version: str
    payload: Dict[str, Any]
