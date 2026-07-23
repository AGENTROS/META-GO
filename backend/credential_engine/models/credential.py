from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class ExtractedField(BaseModel):
    value: str
    confidence: float


class OCRResult(BaseModel):
    document_type: str = Field(description="Aadhaar, Passport, PAN, DL")
    fields: Dict[str, ExtractedField]
    overall_confidence: float


class CredentialIssuanceRequest(BaseModel):
    address: str
    document_type: str
    extracted_data: Dict[str, str]


class IssuedCredential(BaseModel):
    id: str
    owner_wallet: str
    document_type: str
    zk_commitment: str
    issued_at: str
    status: str = "VALID"
