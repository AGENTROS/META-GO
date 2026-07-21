from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from datetime import datetime
import uuid

from credential_engine.validators.file_validator import validate_image_file
from credential_engine.services.ocr_pipeline import run_ocr_pipeline
from credential_engine.services.zk_engine import generate_zk_commitment
from credential_engine.models.credential import CredentialIssuanceRequest, IssuedCredential
from credential_engine.repository.db import save_issued_credential, get_credentials_by_owner
from credential_engine.events.publisher import EventPublisher

router = APIRouter(tags=["Credentials"])

@router.post("/api/v1/credentials/upload")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form("Aadhaar")
):
    """
    1. Validates the raw image file in memory.
    2. Runs OpenCV enhancement and EasyOCR extraction.
    3. Deletes raw memory buffer and returns extracted fields.
    """
    EventPublisher.publish("Credential.Uploaded", {"filename": file.filename, "type": document_type})
    
    file_bytes = await file.read()
    validate_image_file(file_bytes, file.content_type)
    
    try:
        ocr_result = run_ocr_pipeline(file_bytes, document_type)
        EventPublisher.publish("Credential.Processed", {"type": document_type, "confidence": ocr_result.overall_confidence})
        return ocr_result.dict()
    except ValueError as e:
        EventPublisher.publish("Credential.Rejected", {"reason": str(e)})
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        EventPublisher.publish("Credential.Rejected", {"reason": "OCR Engine Failure"})
        raise HTTPException(status_code=500, detail=f"Internal Processing Error: {str(e)}")

@router.post("/api/v1/credentials/verify")
async def issue_credential(request: CredentialIssuanceRequest):
    """
    Receives user-confirmed OCR fields, generates ZK Proof, and saves to MongoDB.
    """
    # 1. Generate ZK Commitment
    zk_commitment = generate_zk_commitment(request.address, request.extracted_data)
    
    # 2. Build Credential Object
    credential = IssuedCredential(
        id=str(uuid.uuid4()),
        owner_wallet=request.address.lower(),
        document_type=request.document_type,
        zk_commitment=zk_commitment,
        issued_at=datetime.utcnow().isoformat()
    )
    
    # 3. Store in Repository
    await save_issued_credential(credential.dict())
    
    # 4. Fire Events
    EventPublisher.publish("Credential.Verified", {"id": credential.id, "owner": credential.owner_wallet})
    EventPublisher.publish("Credential.Issued", {"id": credential.id, "type": credential.document_type})
    
    return {"success": True, "credential": credential.dict()}

@router.get("/api/v1/credentials/{address}")
async def get_credentials(address: str):
    """
    Fetches all verified credentials for a specific wallet address.
    """
    creds = await get_credentials_by_owner(address)
    return {"success": True, "credentials": creds}
