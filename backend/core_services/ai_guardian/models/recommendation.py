from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
import uuid


class GuardianRecommendationModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    did: str
    action_suggested: str
    explanation: str
    confidence_score: float
    context_used: dict
    created_at: datetime = Field(default_factory=datetime.utcnow)
