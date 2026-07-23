from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
import uuid


class ConsentModel(BaseModel):
    consent_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    did: str
    purpose: str
    platform: str
    data_requested: List[str]
    duration_seconds: int
    is_revoked: bool = False
    granted_at: datetime = Field(default_factory=datetime.utcnow)
    revoked_at: Optional[datetime] = None
    audit_trail: List[dict] = Field(default_factory=list)

    def revoke(self):
        self.is_revoked = True
        self.revoked_at = datetime.utcnow()
        self.audit_trail.append(
            {"action": "REVOKED", "timestamp": self.revoked_at.isoformat()}
        )
