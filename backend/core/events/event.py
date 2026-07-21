import time
from typing import Any, Dict
from pydantic import BaseModel, Field

class MetaGoEvent(BaseModel):
    """
    Standardized Event Envelope for the MetaGo Universal Protocol.
    Replaces JSON-RPC with a lightweight, easily serialized format across Unity, Unreal, etc.
    """
    event: str = Field(..., description="Topic identifier, e.g., 'Presence.Active'")
    version: str = Field(default="1.0")
    timestamp: float = Field(default_factory=time.time)
    payload: Dict[str, Any] = Field(default_factory=dict)
