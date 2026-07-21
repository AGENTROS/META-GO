from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class PassportModel(BaseModel):
    did: str
    user_id: str
    verification_status: str = "unverified"
    verification_timestamp: Optional[datetime] = None
    wallet_links: List[str] = Field(default_factory=list)
    avatar_reference: Optional[str] = None
    active_avatar_id: Optional[str] = None
    avatar_version: Optional[str] = None
    humanity_status: str = "pending"
    biometric_version: Optional[str] = None
    consent_status: str = "none"
    
    # Placeholders for future engines
    trust_score: Optional[float] = None
    presence_timeline: List[dict] = Field(default_factory=list)
    guardian_state: dict = Field(default_factory=dict)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
