from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BiometricTemplateModel(BaseModel):
    did: str
    biometric_type: str  # "face", "voice", etc.
    encrypted_template: bytes
    commitment: str  # ZK Commitment string
    metadata: dict
    version: str = "v1"
    created_at: datetime = datetime.utcnow()
