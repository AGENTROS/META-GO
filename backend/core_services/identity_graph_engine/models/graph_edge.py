from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class GraphEdgeModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    did: str
    edge_type: str  # e.g., "wallet", "platform", "credential", "connector"
    target_id: str  # e.g., "0xAbC...", "roblox_user_123"
    metadata: Optional[dict] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
