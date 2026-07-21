from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
import uuid

class AvatarModel(BaseModel):
    avatar_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    did: str
    provider: str
    asset_url: str
    thumbnail: Optional[str] = None
    preview_url: Optional[str] = None
    skeleton_type: str = "humanoid"
    animation_profile: str = "default"  # Points to a separate animation config (Idle, Walk, etc.)
    metadata: dict = Field(default_factory=dict)
    version: str = "v1"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
